/**
 * Marketing attribution capture for paid traffic (Yandex Direct, Google Ads, etc.).
 *
 * Captures UTM tags + ad click ids (yclid / gclid) from the landing URL and
 * persists them for the whole visit window, so that every lead submitted later
 * (contact form, floating CTA, chat) can be tied back to the exact campaign.
 *
 * yclid is the critical piece: it lets us upload offline conversions (closed
 * deals) back into Yandex Direct so the auto-strategies learn what actually
 * converts — not just who filled a form.
 *
 * Strategy: "last paid click wins". The first visit stores attribution; a later
 * visit that arrives with a NEW utm_source or yclid overwrites it (that's the
 * source that should get credit). Organic visits never clobber a stored paid
 * source within the window.
 */

const STORAGE_KEY = 'nn_attribution'
// How long a stored attribution stays valid (Direct default lookback ~21 days).
const WINDOW_MS = 21 * 24 * 60 * 60 * 1000

export interface Attribution {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  yclid?: string
  gclid?: string
  referrer?: string
  landingPage?: string
  /** epoch ms of first capture for this stored record */
  capturedAt?: number
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function readStored(): Attribution | null {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Attribution
    if (parsed.capturedAt && Date.now() - parsed.capturedAt > WINDOW_MS) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeStored(value: Attribution): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Storage may be unavailable (private mode, quota) — fail silently.
  }
}

/**
 * Parse the current URL and persist attribution. Call once on page load.
 * Returns the effective stored attribution after the capture.
 */
export function captureAttribution(): Attribution {
  if (!isBrowser()) return {}

  const params = new URLSearchParams(window.location.search)
  const get = (k: string) => params.get(k)?.trim() || undefined

  const fromUrl: Attribution = {
    utmSource: get('utm_source'),
    utmMedium: get('utm_medium'),
    utmCampaign: get('utm_campaign'),
    utmTerm: get('utm_term'),
    utmContent: get('utm_content'),
    yclid: get('yclid'),
    gclid: get('gclid'),
  }

  const hasNewClick = Boolean(fromUrl.utmSource || fromUrl.yclid || fromUrl.gclid)
  const stored = readStored()

  // No new ad params and we already have a record → keep what we have.
  if (!hasNewClick && stored) return stored

  // No new ad params and nothing stored → record organic/first-touch context.
  if (!hasNewClick && !stored) {
    const organic: Attribution = {
      referrer: document.referrer || undefined,
      landingPage: window.location.pathname + window.location.search,
      capturedAt: Date.now(),
    }
    writeStored(organic)
    return organic
  }

  // New paid click → this source wins. Capture everything fresh.
  const fresh: Attribution = {
    ...fromUrl,
    referrer: document.referrer || undefined,
    landingPage: window.location.pathname + window.location.search,
    capturedAt: Date.now(),
  }
  writeStored(fresh)
  return fresh
}

/** Read stored attribution without mutating it. Safe everywhere. */
export function getAttribution(): Attribution {
  return readStored() || {}
}
