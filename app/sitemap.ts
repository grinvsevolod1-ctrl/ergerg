import type { MetadataRoute } from 'next'

const baseUrl = 'https://netnext.site'

/**
 * Only real, indexable URLs belong in the sitemap.
 * Hash anchors (e.g. /#services) are not separate documents and are ignored by
 * crawlers, and /projects is a redirect to /#portfolio — both are excluded.
 * /unsubscribe is intentionally omitted (noindex utility page).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
