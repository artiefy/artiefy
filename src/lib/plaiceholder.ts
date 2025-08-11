import { getPlaiceholder } from 'plaiceholder';

const supportedFormats = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

export async function getImagePlaceholder(src: string) {
  try {
    const response = await fetch(src);
    const contentType = response.headers.get('content-type');

    if (!supportedFormats.includes(contentType ?? '')) {
      console.warn(`Unsupported image format: ${contentType}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const { base64 } = await getPlaiceholder(Buffer.from(buffer), { size: 10 });
    return base64;
  } catch (error) {
    console.error('Error generating placeholder:', error);
    return null;
  }
}
