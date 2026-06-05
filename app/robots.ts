import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/unsubscribe', '/_next/', '/static/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/unsubscribe'],
      },
      {
        userAgent: 'Yandexbot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/unsubscribe'],
      },
    ],
    sitemap: 'https://netnext.site/sitemap.xml',
    host: 'https://netnext.site',
  }
}
