import type { MetadataRoute } from 'next'

// Private / utility routes that must never be indexed. The public Nexik landing
// (/nexik) and demo (/nexik/demo) stay crawlable; auth and dashboard pages do not.
const privatePaths = [
  '/api/',
  '/admin/',
  '/unsubscribe',
  '/nexik/dashboard',
  '/nexik/login',
  '/nexik/register',
  '/nexik/forgot-password',
  '/nexik/reset-password',
  '/nexik/connect',
  '/nexik/app',
  '/nexik/start',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...privatePaths, '/_next/', '/static/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: privatePaths,
      },
      {
        userAgent: 'Yandexbot',
        allow: '/',
        disallow: privatePaths,
      },
    ],
    sitemap: 'https://netnext.site/sitemap.xml',
    host: 'https://netnext.site',
  }
}
