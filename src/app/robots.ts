import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/reservation/confirmation'],
    },
    sitemap: 'https://locationporthyeres.fr/sitemap.xml',
  }
}
