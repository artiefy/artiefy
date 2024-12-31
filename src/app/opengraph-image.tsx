/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Artiefy - Aprende y Crea';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  const logoSrc = await fetch(new URL('/artiefy-icon.png', import.meta.url)).then(
    (res) => res.arrayBuffer()
  );

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#f0f0f0',
          fontSize: 48,
          fontWeight: 'bold',
          color: '#333',
        }}
      >
        <img src={`data:image/png;base64,${Buffer.from(logoSrc).toString('base64')}`} height="100" alt="Artiefy Logo" />
        <span>Artiefy - An Educational Tool for Online Courses</span>
      </div>
    ),
    {
      ...size,
    }
  );
}