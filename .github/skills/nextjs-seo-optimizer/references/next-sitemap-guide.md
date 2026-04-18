# next-sitemap Setup Guide

For large sites with many dynamic pages, use `next-sitemap` to automate sitemap and robots.txt generation.

## Installation

```bash
npm install next-sitemap
# or
yarn add next-sitemap
# or
pnpm add next-sitemap
```

## Basic Configuration

Create `next-sitemap.config.js` in the root of your project:

```javascript
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://yourdomain.com',
  generateRobotsTxt: true,
  generateIndexSitemap: true, // For sites with 50,000+ URLs
  exclude: [
    '/admin/*',
    '/api/*',
    '/private/*',
    '/server-sitemap.xml', // Exclude server sitemap from static
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/private'],
      },
      {
        userAgent: 'GPTBot', // Block AI scrapers
        disallow: '/',
      },
    ],
    additionalSitemaps: [
      'https://yourdomain.com/server-sitemap.xml', // Add server-side sitemap
    ],
  },
}
```

## Advanced Configuration with Transform

Customize sitemap entries:

```javascript
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://yourdomain.com',
  generateRobotsTxt: true,
  
  transform: async (config, path) => {
    // Custom priority and changefreq based on path
    let priority = 0.7
    let changefreq = 'weekly'
    
    if (path === '/') {
      priority = 1.0
      changefreq = 'daily'
    } else if (path.startsWith('/blog/')) {
      priority = 0.8
      changefreq = 'daily'
    } else if (path.startsWith('/products/')) {
      priority = 0.9
      changefreq = 'daily'
    }
    
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    }
  },
}
```

## Setup in package.json

Add postbuild script:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "postbuild": "next-sitemap",
    "start": "next start"
  }
}
```

Now `npm run build` will automatically generate sitemap and robots.txt in `/public`.

## Server-Side Dynamic Sitemap

For frequently changing content (e.g., new blog posts added daily):

Create `app/server-sitemap.xml/route.ts`:

```typescript
import { getServerSideSitemap } from 'next-sitemap'
 
export async function GET(request: Request) {
  // Fetch dynamic data
  const posts = await fetch('https://api.example.com/posts').then(res => res.json())
  
  const fields = posts.map((post: any) => ({
    loc: `https://yourdomain.com/blog/${post.slug}`,
    lastmod: new Date(post.updatedAt).toISOString(),
    changefreq: 'daily',
    priority: 0.7,
  }))
 
  return getServerSideSitemap(fields)
}
```

## Multi-Sitemap Index (Large Sites)

For sites with 50,000+ URLs:

```javascript
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://yourdomain.com',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  sitemapSize: 5000, // URLs per sitemap file
}
```

This generates:
- `sitemap.xml` (index)
- `sitemap-0.xml`
- `sitemap-1.xml`
- etc.

## Exclude Patterns

```javascript
module.exports = {
  exclude: [
    '/admin/*',        // All admin pages
    '/api/*',          // All API routes
    '/server-sitemap.xml',
    '*/private/*',     // Any private subdirectory
    '/search*',        // Search results pages
    '/tags/*',         // Tag pages (if you want)
  ],
}
```

## Environment-Specific Configuration

```javascript
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://yourdomain.com',
  generateRobotsTxt: process.env.NODE_ENV === 'production',
  robotsTxtOptions: {
    policies: process.env.NODE_ENV === 'production'
      ? [{ userAgent: '*', allow: '/' }]
      : [{ userAgent: '*', disallow: '/' }],
  },
}
```

## Multiple Sitemaps for Different Sections

```javascript
module.exports = {
  siteUrl: 'https://yourdomain.com',
  generateRobotsTxt: true,
  additionalPaths: async (config) => {
    const result = []
    
    // Add additional static paths
    result.push({ loc: '/special-page', priority: 0.9 })
    
    return result
  },
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://yourdomain.com/blog-sitemap.xml',
      'https://yourdomain.com/products-sitemap.xml',
    ],
  },
}
```

## Validation

After build, verify:

```bash
# Check generated files
ls public/*.xml
ls public/robots.txt

# Test sitemap
curl http://localhost:3000/sitemap.xml

# Validate XML
xmllint --noout public/sitemap.xml
```

## Common Issues

**Issue: Sitemap not updating**
- Ensure `postbuild` script is in package.json
- Check that `npm run build` is being run
- Verify output in `/public` directory

**Issue: Dynamic routes missing**
- Use `additionalPaths` to add them manually
- Or implement server-side sitemap for dynamic content

**Issue: Wrong base URL**
- Set `SITE_URL` environment variable
- Or configure `siteUrl` in config file

## Best Practices

1. **Always set metadataBase** in root layout (takes precedence)
2. **Use environment variables** for different deployments
3. **Split large sitemaps** (> 50,000 URLs)
4. **Combine static + server sitemaps** for best performance
5. **Test after every deployment** to ensure URLs are correct
6. **Monitor in Google Search Console** for crawl errors

## Integration with Google Search Console

After deployment:
1. Go to Google Search Console
2. Property Settings > Sitemaps
3. Submit: `https://yourdomain.com/sitemap.xml`
4. Monitor for errors and coverage

## Performance Considerations

- Static sitemaps are cached by CDN (faster)
- Server sitemaps query on-demand (always fresh)
- Use static for stable content, server for dynamic
- Index sitemaps required for 50,000+ URLs (Google limit)
