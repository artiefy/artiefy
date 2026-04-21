# Complete Next.js SEO Implementation Example

This example shows a complete e-commerce site with full SEO optimization.

## File Structure

```
my-nextjs-app/
├── app/
│   ├── layout.tsx                 # Root layout with global metadata
│   ├── page.tsx                   # Homepage with structured data
│   ├── sitemap.ts                 # Dynamic sitemap generation
│   ├── robots.ts                  # Robots.txt configuration
│   ├── products/
│   │   ├── [slug]/
│   │   │   └── page.tsx          # Product page with dynamic metadata
│   │   └── page.tsx              # Products listing
│   └── blog/
│       ├── [slug]/
│       │   └── page.tsx          # Blog post with article schema
│       └── page.tsx              # Blog listing
├── components/
│   └── StructuredData.tsx        # Reusable structured data component
└── next.config.js                # Next.js configuration
```

## Root Layout (app/layout.tsx)

```typescript
import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://mystore.com'),
  title: {
    default: 'MyStore - Premium Products Online',
    template: '%s | MyStore',
  },
  description: 'Shop premium products online with fast shipping and great prices. Free returns on all orders.',
  keywords: ['online store', 'premium products', 'shopping', 'e-commerce'],
  authors: [{ name: 'MyStore Team' }],
  creator: 'MyStore',
  publisher: 'MyStore Inc.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mystore.com',
    siteName: 'MyStore',
    title: 'MyStore - Premium Products Online',
    description: 'Shop premium products online',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'MyStore',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mystore',
    creator: '@mystore',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

## Homepage with Organization Schema (app/page.tsx)

```typescript
import Image from 'next/image'

export default function HomePage() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MyStore',
    url: 'https://mystore.com',
    logo: 'https://mystore.com/logo.png',
    description: 'Premium online store with quality products',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Commerce St',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94102',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-MYSTORE',
      contactType: 'Customer Service',
      availableLanguage: ['English'],
    },
    sameAs: [
      'https://facebook.com/mystore',
      'https://twitter.com/mystore',
      'https://instagram.com/mystore',
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <main>
        <h1>Welcome to MyStore</h1>
        <Image
          src="/hero.jpg"
          alt="Featured products"
          width={1200}
          height={600}
          priority
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,..."
        />
        {/* Rest of homepage content */}
      </main>
    </>
  )
}
```

## Product Page with Dynamic Metadata (app/products/[slug]/page.tsx)

```typescript
import { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: number
  images: string[]
  sku: string
  brand: string
  inStock: boolean
  rating: number
  reviewCount: number
  category: string
}

async function getProduct(slug: string): Promise<Product | null> {
  const res = await fetch(`https://api.mystore.com/products/${slug}`, {
    next: { revalidate: 3600 }, // Revalidate every hour
  })

  if (!res.ok) return null
  return res.json()
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const product = await getProduct(params.slug)

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  return {
    title: product.name,
    description: product.description,
    keywords: [product.name, product.brand, product.category, 'buy online'],
    openGraph: {
      title: product.name,
      description: product.description,
      type: 'product',
      images: [
        {
          url: product.images[0],
          width: 1200,
          height: 1200,
          alt: product.name,
        },
      ],
      url: `https://mystore.com/products/${product.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [product.images[0]],
    },
    alternates: {
      canonical: `https://mystore.com/products/${product.slug}`,
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string }
}) {
  const product = await getProduct(params.slug)

  if (!product) {
    notFound()
  }

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.description,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    offers: {
      '@type': 'Offer',
      url: `https://mystore.com/products/${product.slug}`,
      priceCurrency: 'USD',
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'MyStore',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://mystore.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: 'https://mystore.com/products',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `https://mystore.com/products/${product.slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main>
        <h1>{product.name}</h1>
        <Image
          src={product.images[0]}
          alt={product.name}
          width={800}
          height={800}
          priority
        />
        <p>{product.description}</p>
        <p className="text-2xl font-bold">${product.price}</p>
        {/* Add to cart, reviews, etc. */}
      </main>
    </>
  )
}
```

## Dynamic Sitemap (app/sitemap.ts)

```typescript
import { MetadataRoute } from 'next';

async function getAllProducts() {
  const res = await fetch('https://api.mystore.com/products');
  return res.json();
}

async function getAllBlogPosts() {
  const res = await fetch('https://api.mystore.com/blog');
  return res.json();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();
  const posts = await getAllBlogPosts();

  const productUrls = products.map((product: any) => ({
    url: `https://mystore.com/products/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  const blogUrls = posts.map((post: any) => ({
    url: `https://mystore.com/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: 'https://mystore.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://mystore.com/products',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: 'https://mystore.com/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: 'https://mystore.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://mystore.com/contact',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    ...productUrls,
    ...blogUrls,
  ];
}
```

## Robots Configuration (app/robots.ts)

```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://mystore.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/cart/', '/checkout/', '/account/'],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
```

## Next.js Configuration (next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['api.mystore.com', 'cdn.mystore.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },

  compress: true,

  async redirects() {
    return [
      {
        source: '/old-product/:slug',
        destination: '/products/:slug',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
```

## Testing Checklist

After implementing, verify:

```bash
# 1. Build the project
npm run build

# 2. Start production server
npm start

# 3. Test sitemap
curl http://localhost:3000/sitemap.xml

# 4. Test robots.txt
curl http://localhost:3000/robots.txt

# 5. Run Lighthouse audit
npx lighthouse http://localhost:3000 --view

# 6. Validate structured data
# Go to: https://search.google.com/test/rich-results
# Enter: http://localhost:3000/products/example-product

# 7. Run SEO validation script
node scripts/validate-seo.js
```

## Production Deployment

1. Set environment variables:

   ```bash
   NEXT_PUBLIC_BASE_URL=https://mystore.com
   SITE_URL=https://mystore.com
   ```

2. Deploy to Vercel/Netlify/etc.

3. Verify in production:

   ```bash
   curl https://mystore.com/sitemap.xml
   curl https://mystore.com/robots.txt
   ```

4. Submit to Google Search Console:
   - Go to Google Search Console
   - Add property: mystore.com
   - Verify ownership
   - Submit sitemap: https://mystore.com/sitemap.xml

5. Monitor Core Web Vitals:
   - Check Google Search Console → Core Web Vitals
   - Use PageSpeed Insights
   - Monitor Vercel Analytics

This complete example demonstrates production-ready SEO implementation for a Next.js e-commerce site.
