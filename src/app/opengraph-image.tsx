/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function handler() {
  const logoUrl = 'https://localhost:3000/artiefy-icon.png'; // Update to a valid public URL
  const logoResponse = await fetch(logoUrl);

  if (!logoResponse.ok) {
    throw new Error(`Failed to fetch image: ${logoResponse.statusText}`);
  }

  const logoArrayBuffer = await logoResponse.arrayBuffer();
  const logoBase64 = Buffer.from(logoArrayBuffer).toString('base64');

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
        <img src={`data:image/png;base64,${logoBase64}`} height="100" alt="Artiefy Logo" />
        <span>Artiefy - An Educational Tool for Online Courses</span>
      </div>
    ),
    {
      ...size,
    }
  );
}