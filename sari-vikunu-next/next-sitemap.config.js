/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://sarivikunu.lk',
  generateRobotsTxt: true,
  exclude: ['/admin/*', '/api/*', '/login', '/register'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_APP_URL}/server-sitemap.xml`, // Dynamic products
    ],
  },
  // Static pages priority
  transform: async (config, path) => {
    // Homepage highest priority
    if (path === '/') {
      return { loc: path, priority: 1.0, changefreq: 'daily' }
    }
    // Shop page
    if (path === '/shop') {
      return { loc: path, priority: 0.9, changefreq: 'daily' }
    }
    // Product pages
    if (path.startsWith('/product/')) {
      return { loc: path, priority: 0.8, changefreq: 'weekly' }
    }
    return { loc: path, priority: 0.5, changefreq: 'monthly' }
  },
}
