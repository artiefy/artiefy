# Performance Optimization for SEO

Core Web Vitals directly impact SEO rankings. Google uses these metrics:
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms  
- **CLS (Cumulative Layout Shift)**: < 0.1

## Image Optimization

### Use Next.js Image Component

**Before (Poor SEO):**
```jsx
<img src="/hero.jpg" alt="Hero image" />
```

**After (Optimized):**
```jsx
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={630}
  priority // For above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Image Best Practices

```typescript
// For static imports (automatic blur)
import heroImage from '@/public/hero.jpg'

<Image
  src={heroImage}
  alt="Hero"
  priority
  placeholder="blur" // Auto-generated
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// For dynamic/CMS images
<Image
  src={post.coverImage}
  alt={post.title}
  width={800}
  height={600}
  loading="lazy"
  quality={85} // Balance quality vs file size
  sizes="(max-width: 768px) 100vw, 800px"
/>
```

### Configure Image Domains

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['cdn.example.com', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}
```

## Code Splitting & Dynamic Imports

### Component-Level Code Splitting

```typescript
// Heavy component that's not always needed
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false, // Disable SSR for client-only components
})

const Modal = dynamic(() => import('@/components/Modal'))

export default function Dashboard() {
  const [showChart, setShowChart] = useState(false)
  
  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      {showChart && <HeavyChart data={data} />}
    </div>
  )
}
```

### Named Exports

```typescript
const AdminPanel = dynamic(() => 
  import('@/components/AdminPanel').then(mod => mod.AdminPanel)
)
```

## Font Optimization

### Use next/font

**Before:**
```jsx
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
```

**After:**
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

### Custom Fonts

```typescript
import localFont from 'next/font/local'

const customFont = localFont({
  src: './fonts/CustomFont.woff2',
  display: 'swap',
  variable: '--font-custom',
})
```

## Bundle Size Optimization

### Package Imports

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: [
      'lodash',
      'lucide-react',
      '@mui/material',
      '@mui/icons-material',
    ],
  },
}
```

### Tree Shaking

**Before:**
```typescript
import _ from 'lodash' // Imports entire library
```

**After:**
```typescript
import debounce from 'lodash/debounce' // Only imports what's needed
```

### Analyze Bundle

```bash
npm install @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // your config
})

# Run analysis
ANALYZE=true npm run build
```

## Server vs Client Components

### Maximize Server Components

**Server Component (Default - Better for SEO):**
```typescript
// app/blog/[slug]/page.tsx
async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug)
  
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  )
}
```

**Client Component (Only When Needed):**
```typescript
'use client'

import { useState } from 'react'

export function InteractiveComponent() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### Composition Pattern

```typescript
// app/page.tsx (Server Component)
import { InteractiveButton } from './InteractiveButton'

export default function Page() {
  const data = await fetchData() // Server-side fetch
  
  return (
    <div>
      <StaticContent data={data} />
      <InteractiveButton /> {/* Client component */}
    </div>
  )
}
```

## Caching Strategies

### Route Segment Config

```typescript
// app/blog/[slug]/page.tsx
export const revalidate = 3600 // Revalidate every hour

// Or use ISR
export const revalidate = 60 // Revalidate every minute
```

### Data Fetching Cache

```typescript
// Cached by default
const data = await fetch('https://api.example.com/data')

// No cache
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store'
})

// Revalidate after 60 seconds
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 }
})
```

## Lazy Loading Strategies

### Images Below the Fold

```typescript
<Image
  src={image}
  alt="Description"
  loading="lazy" // Default for non-priority images
  width={800}
  height={600}
/>
```

### Intersection Observer for Components

```typescript
'use client'

import { useEffect, useState, useRef } from 'react'

export function LazyComponent({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref}>
      {isVisible ? children : <div style={{ minHeight: '200px' }} />}
    </div>
  )
}
```

## Reduce Layout Shift (CLS)

### Reserve Space for Images

```typescript
// Always specify width and height
<Image
  src={image}
  alt="Description"
  width={800}
  height={600}
  style={{ maxWidth: '100%', height: 'auto' }}
/>
```

### Font Display Swap

```typescript
// Already handled by next/font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Prevents layout shift
})
```

### Skeleton Screens

```typescript
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
    </div>
  )
}
```

## Third-Party Scripts

### Use next/script

```typescript
import Script from 'next/script'

export default function Page() {
  return (
    <>
      {/* Load after page is interactive */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=GA_ID"
        strategy="afterInteractive"
      />
      
      {/* Load when browser is idle */}
      <Script
        src="https://example.com/analytics.js"
        strategy="lazyOnload"
      />
      
      {/* Load immediately (blocking) */}
      <Script
        src="https://example.com/critical.js"
        strategy="beforeInteractive"
      />
    </>
  )
}
```

## Middleware for Redirects

Instead of runtime redirects:

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/old-path') {
    return NextResponse.redirect(new URL('/new-path', request.url))
  }
}
```

## Database Query Optimization

### Use Parallel Fetching

**Before:**
```typescript
const user = await fetchUser(id)
const posts = await fetchPosts(id)
const comments = await fetchComments(id)
```

**After:**
```typescript
const [user, posts, comments] = await Promise.all([
  fetchUser(id),
  fetchPosts(id),
  fetchComments(id),
])
```

### Cache Database Queries

```typescript
import { unstable_cache } from 'next/cache'

const getCachedUser = unstable_cache(
  async (id: string) => fetchUser(id),
  ['user'],
  { revalidate: 3600, tags: ['user'] }
)
```

## Compression

### Enable in next.config.js

```javascript
module.exports = {
  compress: true, // Enable gzip compression (default)
}
```

## Production Optimization Checklist

- [ ] All images use Next.js Image component
- [ ] Priority set on above-the-fold images
- [ ] Fonts loaded with next/font
- [ ] Heavy components use dynamic imports
- [ ] Client components minimized
- [ ] Bundle analyzed and optimized
- [ ] Third-party scripts use next/script
- [ ] Database queries parallelized
- [ ] Proper caching strategies implemented
- [ ] No layout shift (CLS < 0.1)
- [ ] LCP < 2.5s on 3G connection
- [ ] JavaScript bundles < 170KB gzipped

## Measurement

### Run Lighthouse

```bash
npm run build
npm start

# In another terminal
npx lighthouse http://localhost:3000 --view
```

### Monitor in Production

```typescript
// app/layout.tsx
export const metadata = {
  // ... other metadata
  other: {
    'google-site-verification': 'your-verification-code',
  },
}
```

Then monitor in:
- Google Search Console → Core Web Vitals
- Vercel Analytics (if using Vercel)
- Web Vitals library for custom tracking

## Quick Wins Priority

1. **Image optimization** (use Image component) - Biggest impact
2. **Font optimization** (use next/font) - Eliminate font loading delay
3. **Code splitting** (dynamic imports) - Reduce initial bundle
4. **Caching** (revalidate config) - Improve repeat visits
5. **Server components** (minimize client JS) - Faster initial load

Focus on these five first for maximum SEO impact.
