import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Image metadata
export const alt = 'My Open Graph Image';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Image generation
export default async function Image() {
  // Load Montserrat font
  const montserrat = fetch(
    'https://fonts.gstatic.com/s/montserrat/v15/JTURjIg1_i6t8kCHKm45_dJE3gnD-w.ttf'
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          fontFamily: 'Montserrat',
          backgroundImage: 'url(http://artiefy.com/og-fondo.png)',
          backgroundSize: 'cover',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '20px',
          color: 'white',
        }}
      >
        <div
          style={{
            textAlign: 'justify',
            textAlignLast: 'right',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            maxWidth: '40%',
            wordWrap: 'break-word',
          }}
        >
          <div style={{ fontSize: 40, marginTop: 10 }}>
            Unete a nosotros y transforma tus ideas en realidades con el poder
            del conocimineto. ¡Empieza hoy! 🎓 📚
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      emoji: 'fluent',
      fonts: [
        {
          name: 'Montserrat',
          data: await montserrat,
          style: 'italic',
          weight: 400,
        },
      ],
    }
  );
}
