# SEO in Next.js Pages Router (Legacy)

For Next.js 12 and earlier projects using Pages Router. Consider migrating to App Router for better SEO capabilities.

## Head Component (Basic SEO)

```typescript
// pages/index.tsx
import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>Page Title | Site Name</title>
        <meta name="description" content="Page description for SEO" />
        <meta name="keywords" content="keyword1, keyword2, keyword3" />
        <meta name="author" content="Author Name" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://yourdomain.com/" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com/" />
        <meta property="og:title" content="Page Title" />
        <meta property="og:description" content="Page description" />
        <meta property="og:image" content="https://yourdomain.com/og-image.jpg" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@yourtwitterhandle" />
        <meta name="twitter:title" content="Page Title" />
        <meta name="twitter:description" content="Page description" />
        <meta name="twitter:image" content="https://yourdomain.com/twitter-image.jpg" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Your Site Name',
              url: 'https://yourdomain.com',
            }),
          }}
        />
      </Head>
      
      {/* Page content */}
      <main>
        <h1>Welcome</h1>
      </main>
    </>
  )
}
```

## Dynamic Head with getServerSideProps

```typescript
// pages/blog/[slug].tsx
import Head from 'next/head'
import { GetServerSideProps } from 'next'

interface Post {
  title: string
  excerpt: string
  coverImage: string
  slug: string
}

interface Props {
  post: Post
}

export default function BlogPost({ post }: Props) {
  return (
    <>
      <Head>
        <title>{post.title} | Your Blog</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={`https://yourdomain.com/blog/${post.slug}`} />
        
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.coverImage} />
        <meta property="og:url" content={`https://yourdomain.com/blog/${post.slug}`} />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: post.title,
              image: post.coverImage,
              url: `https://yourdomain.com/blog/${post.slug}`,
            }),
          }}
        />
      </Head>
      
      <article>
        <h1>{post.title}</h1>
        {/* Content */}
      </article>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const post = await fetchPost(params?.slug as string)
  
  return {
    props: { post },
  }
}
```

## Global SEO with _document.tsx

```typescript
// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Global meta tags */}
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
```

## next-seo Library (Recommended)

Install:
```bash
npm install next-seo
```

### Default SEO Config

```typescript
// next-seo.config.ts
import { DefaultSeoProps } from 'next-seo'

const config: DefaultSeoProps = {
  titleTemplate: '%s | Your Site Name',
  defaultTitle: 'Your Site Name',
  description: 'Default site description',
  canonical: 'https://yourdomain.com',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://yourdomain.com',
    site_name: 'Your Site Name',
    images: [
      {
        url: 'https://yourdomain.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Site image',
      },
    ],
  },
  twitter: {
    handle: '@yourtwitterhandle',
    site: '@yourtwitterhandle',
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    {
      name: 'keywords',
      content: 'keyword1, keyword2, keyword3',
    },
  ],
}

export default config
```

### Apply Default SEO

```typescript
// pages/_app.tsx
import { DefaultSeo } from 'next-seo'
import SEO from '../next-seo.config'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <DefaultSeo {...SEO} />
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
```

### Page-Specific SEO

```typescript
// pages/about.tsx
import { NextSeo } from 'next-seo'

export default function About() {
  return (
    <>
      <NextSeo
        title="About Us"
        description="Learn more about our company"
        canonical="https://yourdomain.com/about"
        openGraph={{
          url: 'https://yourdomain.com/about',
          title: 'About Us',
          description: 'Learn more about our company',
        }}
      />
      
      <h1>About Us</h1>
    </>
  )
}
```

### Article SEO

```typescript
import { ArticleJsonLd } from 'next-seo'

export default function BlogPost({ post }) {
  return (
    <>
      <ArticleJsonLd
        url={`https://yourdomain.com/blog/${post.slug}`}
        title={post.title}
        images={[post.coverImage]}
        datePublished={post.publishedAt}
        dateModified={post.updatedAt}
        authorName={post.author.name}
        description={post.excerpt}
      />
      
      {/* Page content */}
    </>
  )
}
```

## Sitemap Generation (Pages Router)

### Using next-sitemap

```javascript
// next-sitemap.config.js
module.exports = {
  siteUrl: 'https://yourdomain.com',
  generateRobotsTxt: true,
  exclude: ['/admin', '/api/*'],
}
```

```json
// package.json
{
  "scripts": {
    "postbuild": "next-sitemap"
  }
}
```

### Manual Sitemap API Route

```typescript
// pages/api/sitemap.xml.ts
import { GetServerSideProps } from 'next'

function generateSiteMap(posts: any[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>https://yourdomain.com</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <priority>1.0</priority>
      </url>
      ${posts
        .map((post) => {
          return `
            <url>
              <loc>${`https://yourdomain.com/blog/${post.slug}`}</loc>
              <lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>
              <priority>0.8</priority>
            </url>
          `
        })
        .join('')}
    </urlset>
  `
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const posts = await fetchAllPosts()
  const sitemap = generateSiteMap(posts)

  res.setHeader('Content-Type', 'text/xml')
  res.write(sitemap)
  res.end()

  return {
    props: {},
  }
}

export default function SiteMap() {}
```

## robots.txt (Pages Router)

### Static robots.txt

Create `public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: https://yourdomain.com/sitemap.xml
```

### Dynamic robots.txt

```typescript
// pages/api/robots.txt.ts
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: https://yourdomain.com/sitemap.xml`

  res.setHeader('Content-Type', 'text/plain')
  res.write(robots)
  res.end()

  return {
    props: {},
  }
}

export default function Robots() {}
```

## Image Optimization (Pages Router)

```typescript
import Image from 'next/image'

export default function Page() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero image"
      width={1200}
      height={630}
      priority
      quality={85}
    />
  )
}
```

## Migration to App Router

Consider migrating for better SEO:

### Benefits of App Router for SEO:
1. **Better Metadata API** - Type-safe, hierarchical
2. **Streaming SSR** - Faster Core Web Vitals
3. **Server Components** - Reduced JavaScript, faster LCP
4. **Built-in sitemap/robots** - No external libraries needed
5. **Better Performance** - Automatic optimization

### Migration Resources:
- [Official Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- Create `app` directory alongside `pages`
- Migrate incrementally, route by route
- Both routers can coexist during migration

## Common Issues

**Issue: Duplicate meta tags**
- Solution: Ensure only one Head component per page
- Solution: Use next-seo to prevent conflicts

**Issue: SEO not working with CSR**
- Solution: Use getServerSideProps or getStaticProps
- Solution: Ensure metadata is rendered server-side

**Issue: Slow page load affecting SEO**
- Solution: Use next/image for optimization
- Solution: Implement code splitting
- Solution: Enable SWC compiler in next.config.js

## When to Upgrade

Upgrade to App Router if:
- Starting new project
- SEO is critical
- Want better performance
- Need streaming SSR
- Want built-in optimizations

Stay on Pages Router if:
- Tight deadline, no time for migration
- Complex app with many dependencies
- Team not familiar with App Router yet
- Waiting for ecosystem to mature

For new projects, always choose App Router for superior SEO capabilities.
