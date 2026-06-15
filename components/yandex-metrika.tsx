'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { METRIKA_ID } from '@/lib/analytics'
import { captureAttribution } from '@/lib/attribution'

declare global {
  interface Window {
    ym: ((id: number, action: string, ...args: unknown[]) => void) & {
      a?: unknown[][]
    }
  }
}

function YandexMetrikaInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://mc.yandex.ru/metrika/tag.js'
    script.async = true
    document.head.appendChild(script)

    window.ym = window.ym || function(...args: any[]) {
      ;(window.ym as any).a = (window.ym as any).a || []
      ;(window.ym as any).a.push(args)
    }
    
    window.ym(METRIKA_ID, 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
    })

    // Capture UTM tags + ad click ids (yclid/gclid) from the landing URL so
    // every later lead can be attributed to the exact ad campaign.
    captureAttribution()

    return () => {
      const existingScript = document.querySelector(`script[src="${script.src}"]`)
      if (existingScript) existingScript.remove()
    }
  }, [])

  useEffect(() => {
    if (window.ym) {
      const url = `${pathname}${searchParams ? `?${searchParams}` : ''}`
      window.ym(METRIKA_ID, 'hit', url)
    }
  }, [pathname, searchParams])

  return null
}

export function YandexMetrika() {
  return (
    <Suspense fallback={null}>
      <YandexMetrikaInner />
    </Suspense>
  )
}
