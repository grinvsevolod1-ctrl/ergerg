import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  
  // Clear auth cookies
  cookieStore.delete('nexik_token')
  cookieStore.delete('nexik_org_id')

  return NextResponse.json({ success: true })
}

export async function GET() {
  return POST()
}
