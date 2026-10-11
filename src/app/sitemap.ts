import { type MetadataRoute } from 'next';

// Only canonical, indexable public routes. `lastModified` is omitted: a value
// that changes on every request is ignored by Google. Course and program pages
// are `noindex` for now.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artiefy.com';

  return [
    { url: baseUrl },
    { url: `${baseUrl}/estudiantes` },
    { url: `${baseUrl}/planes` },
    { url: `${baseUrl}/sign-in` },
  ];
}
