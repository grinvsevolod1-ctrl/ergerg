import * as cheerio from 'cheerio'
import type { UserData } from './types'

// Phone number patterns (various formats)
const PHONE_PATTERNS = [
  /(\+?\d{1,3}[\s\-]?)?\(?\d{2,4}\)?[\s\-]?\d{2,4}[\s\-]?\d{2,4}[\s\-]?\d{0,4}/g,
  /(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g, // Russian
  /(\+375)[\s\-]?\(?\d{2}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g, // Belarus
  /\d{3}[\s\-]\d{2}[\s\-]\d{2}/g, // Short format
]

// Email pattern
const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

// Common company name selectors
const COMPANY_SELECTORS = [
  'h1',
  '.logo',
  '[class*="logo"]',
  '[class*="brand"]',
  '[class*="company"]',
  'header h1',
  'header h2',
  '.header__logo',
  '.site-title',
  'a.logo',
  '.navbar-brand',
]

// Hero section selectors for description
const HERO_SELECTORS = [
  '.hero p',
  '.hero__text',
  '.hero__description',
  '.banner p',
  '.banner__text',
  '.intro p',
  '.main-banner p',
  '[class*="hero"] p',
  '[class*="banner"] p',
  'section:first-of-type p:first-of-type',
]

interface ReplaceResult {
  html: string
  replacements: {
    phones: number
    emails: number
    companyNames: number
    descriptions: number
  }
}

export function replaceContent(html: string, userData: UserData): ReplaceResult {
  const $ = cheerio.load(html)
  
  const replacements = {
    phones: 0,
    emails: 0,
    companyNames: 0,
    descriptions: 0,
  }
  
  // Helper to replace text in element while preserving HTML
  function replaceTextInElement(element: ReturnType<typeof $>, pattern: RegExp, replacement: string): number {
    let count = 0
    
    element.contents().each((_, node) => {
      if (node.type === 'text') {
        const text = $(node).text()
        const newText = text.replace(pattern, () => {
          count++
          return replacement
        })
        if (text !== newText) {
          $(node).replaceWith(newText)
        }
      }
    })
    
    return count
  }
  
  // 1. Replace phone numbers
  if (userData.phone) {
    const phoneReplacement = userData.phone
    
    // Replace in href="tel:..."
    $('a[href^="tel:"]').each((_, el) => {
      $(el).attr('href', `tel:${phoneReplacement.replace(/\D/g, '')}`)
      const text = $(el).text()
      if (/[\d\s\-\(\)\+]{7,}/.test(text)) {
        $(el).text(phoneReplacement)
        replacements.phones++
      }
    })
    
    // Replace phone numbers in text content
    $('body *').each((_, el) => {
      const $el = $(el)
      if ($el.children().length === 0) {
        // Text-only elements
        const text = $el.text()
        for (const pattern of PHONE_PATTERNS) {
          if (pattern.test(text)) {
            const newText = text.replace(pattern, phoneReplacement)
            if (newText !== text) {
              $el.text(newText)
              replacements.phones++
            }
            break
          }
        }
      }
    })
  }
  
  // 2. Replace email addresses
  if (userData.email) {
    const emailReplacement = userData.email
    
    // Replace in href="mailto:..."
    $('a[href^="mailto:"]').each((_, el) => {
      $(el).attr('href', `mailto:${emailReplacement}`)
      const text = $(el).text()
      if (EMAIL_PATTERN.test(text)) {
        $(el).text(emailReplacement)
        replacements.emails++
      }
    })
    
    // Replace emails in text content
    $('body *').each((_, el) => {
      const $el = $(el)
      if ($el.children().length === 0) {
        const text = $el.text()
        if (EMAIL_PATTERN.test(text)) {
          const newText = text.replace(EMAIL_PATTERN, emailReplacement)
          if (newText !== text) {
            $el.text(newText)
            replacements.emails++
          }
        }
      }
    })
  }
  
  // 3. Replace company name
  if (userData.companyName) {
    // Find and replace in common locations
    for (const selector of COMPANY_SELECTORS) {
      const elements = $(selector)
      if (elements.length > 0) {
        const $first = elements.first()
        const originalText = $first.text().trim()
        
        // Only replace if it looks like a company name (not too long)
        if (originalText && originalText.length < 100 && originalText.length > 1) {
          $first.text(userData.companyName)
          replacements.companyNames++
          break
        }
      }
    }
    
    // Also update title
    const $title = $('title')
    if ($title.length > 0) {
      const titleText = $title.text()
      // Replace first part of title (usually company name)
      const parts = titleText.split(/\s*[\|—\-:]\s*/)
      if (parts.length > 0) {
        parts[0] = userData.companyName
        $title.text(parts.join(' | '))
      }
    }
    
    // Update meta og:title and og:site_name
    $('meta[property="og:title"]').attr('content', userData.companyName)
    $('meta[property="og:site_name"]').attr('content', userData.companyName)
    
    // Update logo alt text
    $('img[class*="logo"], img[alt*="лого"], img[alt*="logo"]').attr('alt', userData.companyName)
  }
  
  // 4. Replace/add description in hero section
  if (userData.description) {
    let descriptionReplaced = false
    
    for (const selector of HERO_SELECTORS) {
      const elements = $(selector)
      if (elements.length > 0) {
        elements.first().text(userData.description)
        replacements.descriptions++
        descriptionReplaced = true
        break
      }
    }
    
    // Update meta description
    const $metaDesc = $('meta[name="description"]')
    if ($metaDesc.length === 0) {
      $('head').append(`<meta name="description" content="${userData.description}">`)
    } else {
      $metaDesc.attr('content', userData.description)
    }
    
    // Update og:description
    $('meta[property="og:description"]').attr('content', userData.description)
  }
  
  // 5. Remove original contact form submission
  $('form').each((_, el) => {
    $(el).attr('action', '#')
    $(el).attr('onsubmit', 'alert("Это превью. Для заказа сайта свяжитесь с NetNext!"); return false;')
  })
  
  return {
    html: $.html(),
    replacements,
  }
}

// Quick validation that replacement was successful
export function validateReplacement(html: string, userData: UserData): boolean {
  const $ = cheerio.load(html)
  const text = $('body').text()
  
  let score = 0
  
  // Check if phone is present
  if (userData.phone && text.includes(userData.phone.slice(-4))) {
    score++
  }
  
  // Check if email is present
  if (userData.email && text.toLowerCase().includes(userData.email.toLowerCase())) {
    score++
  }
  
  // Check if company name is present
  if (userData.companyName && text.includes(userData.companyName)) {
    score++
  }
  
  // At least one replacement should be present
  return score >= 1
}
