/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const logoSrc = await fetch(new URL('/artiefy-icon.png', baseUrl)).then(
    (res) => res.arrayBuffer()
  );
  const iconSrc = await fetch(new URL('/icon.png', baseUrl)).then(
    (res) => res.arrayBuffer()
  );

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: 36,
          fontWeight: 700,
          textAlign: 'center',
          padding: 70,
          color: 'white',
          backgroundImage: 'linear-gradient(to right, #3AF4EF, #01142B)',
          height: '100%',
          width: '100%'
        }}
      >
        <img src={`data:image/png;base64,${Buffer.from(logoSrc).toString('base64')}`} height="150" alt="Artiefy Logo" />
        <div
          style={{
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'white',
            fontWeight: 'bold',
            marginTop: 20,
            fontSize: 48,
          }}
        >
          Artiefy - App Web Educativa de Cursos Online 🎓
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 28,
            fontWeight: 'normal',
          }}
        >
          Bienvenido a Artiefy, donde el aprendizaje nunca se detiene. ¡Inspírate y crece con nosotros!
        </div>
        <img src={`data:image/png;base64,${Buffer.from(iconSrc).toString('base64')}`} height="70" alt="Icon" />
      </div>
    ),
    {
      width: size.width,
      height: size.height,
      emoji: 'twemoji'
    }
  );
}