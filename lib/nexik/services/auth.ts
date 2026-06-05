/**
 * Nexik Authentication Service
 * Handles user registration, login, and session management
 */

import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import {
  createOrganization,
  getOrganization,
  getOrgMember,
  getOrgMemberById,
  createOrgMember,
  updateMemberLastLogin,
  type Organization,
  type OrgMember
} from '../db/organizations'
import { createWidget } from '../db/widgets'
import { getJwtSecret, SESSION_CONFIG } from '../config/jwt'

const BCRYPT_ROUNDS = 12 // Secure default for production

// Password hashing using bcrypt (industry standard)
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, stored)
  } catch {
    return false
  }
}

// JWT token management
export interface SessionPayload {
  memberId: string
  orgId: string
  email: string
  role: string
  [key: string]: string // Index signature for JWTPayload compatibility
}

async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as Record<string, string>)
    .setProtectedHeader({ alg: SESSION_CONFIG.algorithm })
    .setIssuedAt()
    .setExpirationTime(SESSION_CONFIG.expirationTime)
    .sign(getJwtSecret())
}

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

// Registration
export interface RegisterInput {
  org_name: string
  email: string
  password: string
  name?: string
}

export async function register(input: RegisterInput): Promise<{
  success: boolean
  error?: string
  org?: Organization
  member?: OrgMember
  apiKey?: string
}> {
  try {
    // Validate input
    if (!input.email || !input.password || !input.org_name) {
      return { success: false, error: 'Все поля обязательны' }
    }

    if (input.password.length < 8) {
      return { success: false, error: 'Пароль должен быть минимум 8 символов' }
    }

    // Hash password
    const passwordHash = await hashPassword(input.password)

    // Create organization with owner
    const { org, member, apiKey } = await createOrganization({
      name: input.org_name,
      owner_email: input.email,
      owner_name: input.name,
      owner_password_hash: passwordHash
    })

    // Create default widget
    await createWidget({
      org_id: org.id,
      name: 'Основной виджет',
      greeting_message: `Привет! Добро пожаловать в ${org.name}. Чем могу помочь?`
    })

    // Create session
    const token = await createSessionToken({
      memberId: member.id,
      orgId: org.id,
      email: member.email,
      role: member.role
    })

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_CONFIG.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_CONFIG.maxAge,
      path: '/'
    })

    return { success: true, org, member, apiKey }
  } catch (error) {
    console.error('[Nexik Auth] Registration failed:', error)
    
    if (error instanceof Error && error.message.includes('already exists')) {
      return { success: false, error: 'Организация с таким URL уже существует' }
    }
    
    return { success: false, error: 'Ошибка регистрации. Попробуйте позже.' }
  }
}

// Login
export interface LoginInput {
  email: string
  password: string
  org_slug?: string
}

export async function login(input: LoginInput): Promise<{
  success: boolean
  error?: string
  org?: Organization
  member?: OrgMember
}> {
  try {
    // Find member by email across all orgs (simplified - in production you'd want org selection)
    const { query } = await import('@/lib/db')
    
    const members = await query<OrgMember & { org_slug: string; password_hash: string }>(
      `SELECT m.*, o.slug as org_slug 
       FROM nexik_org_members m
       JOIN nexik_organizations o ON m.org_id = o.id
       WHERE m.email = $1 AND o.deleted_at IS NULL
       ${input.org_slug ? 'AND o.slug = $2' : ''}
       LIMIT 1`,
      input.org_slug ? [input.email, input.org_slug] : [input.email]
    )

    const member = members[0]
    if (!member || !member.password_hash) {
      return { success: false, error: 'Неверный email или пароль' }
    }

    // Verify password
    if (!await verifyPassword(input.password, member.password_hash)) {
      return { success: false, error: 'Неверный email или пароль' }
    }

    // Get organization
    const org = await getOrganization(member.org_id)
    if (!org) {
      return { success: false, error: 'Организация не найдена' }
    }

    // Update last login
    await updateMemberLastLogin(member.id)

    // Create session
    const token = await createSessionToken({
      memberId: member.id,
      orgId: org.id,
      email: member.email,
      role: member.role
    })

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_CONFIG.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_CONFIG.maxAge,
      path: '/'
    })

    return { success: true, org, member }
  } catch (error) {
    console.error('[Nexik Auth] Login failed:', error)
    return { success: false, error: 'Ошибка входа. Попробуйте позже.' }
  }
}

// Logout
export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_CONFIG.cookieName)
}

// Get current session
export async function getSession(): Promise<{
  member: OrgMember
  org: Organization
} | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_CONFIG.cookieName)?.value
    
    if (!token) return null

    const payload = await verifySessionToken(token)
    if (!payload) return null

    const member = await getOrgMemberById(payload.memberId)
    if (!member) return null

    const org = await getOrganization(payload.orgId)
    if (!org) return null

    return { member, org }
  } catch {
    return null
  }
}

// Require session (throws if not authenticated)
export async function requireSession(): Promise<{
  member: OrgMember
  org: Organization
}> {
  const session = await getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }
  return session
}

// Invite member to organization
export async function inviteMember(
  orgId: string,
  email: string,
  name: string | undefined,
  role: 'admin' | 'operator' | 'member',
  tempPassword: string
): Promise<OrgMember> {
  const passwordHash = await hashPassword(tempPassword)
  return createOrgMember({
    org_id: orgId,
    email,
    password_hash: passwordHash,
    name,
    role
  })
}

// Change password
export async function changePassword(
  memberId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { query, execute } = await import('@/lib/db')
    
    const members = await query<{ password_hash: string }>(
      'SELECT password_hash FROM nexik_org_members WHERE id = $1',
      [memberId]
    )

    const member = members[0]
    if (!member || !await verifyPassword(currentPassword, member.password_hash)) {
      return { success: false, error: 'Неверный текущий пароль' }
    }

    if (newPassword.length < 8) {
      return { success: false, error: 'Новый пароль должен быть минимум 8 символов' }
    }

    const newHash = await hashPassword(newPassword)
    await execute(
      'UPDATE nexik_org_members SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, memberId]
    )

    return { success: true }
  } catch (error) {
    console.error('[Nexik Auth] Password change failed:', error)
    return { success: false, error: 'Ошибка смены пароля' }
  }
}
