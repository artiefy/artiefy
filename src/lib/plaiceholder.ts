import { getPlaiceholder } from 'plaiceholder';

export async function getImagePlaceholder(src: string) {
  try {
    const buffer = await fetch(src).then(async (res) =>
      Buffer.from(await res.arrayBuffer())
    );

    const { base64 } = await getPlaiceholder(buffer, { size: 10 });
    return base64;
  } catch (error) {
    console.error('Error generating placeholder:', error);
    return null;
  }
}

