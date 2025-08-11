import { ImageResponse } from 'next/og';

// Tamaño estándar OG
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export const alt = 'Portada del programa en Artiefy';

// Obtiene la portada del programa desde la API interna
async function getProgramCoverImage(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/estudiantes/programas/${id}/cover`,
    {
      next: { revalidate: 3600 },
    }
  );
  if (!res.ok) return null;
  const data: { coverImageUrl?: unknown } = await res.json();
  return typeof data.coverImageUrl === 'string' ? data.coverImageUrl : null;
}

export default async function Image({ params }: { params: { id: string } }) {
  const { id } = params;
  let coverImageUrl =
    'https://placehold.co/1200x630/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';

  const fetchedCover = await getProgramCoverImage(id);
  if (fetchedCover) {
    coverImageUrl = fetchedCover;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#01142B',
          position: 'relative',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImageUrl}
          width={1200}
          height={630}
          style={{
            objectFit: 'cover',
            width: '100%',
            height: '100%',
          }}
          alt="Portada del programa"
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
