import { ImageResponse } from "next/og";

// Puedes ajustar el tamaño si lo deseas
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export const alt = "Portada del curso en Artiefy";

// Obtén la portada del curso desde la API interna
async function getCourseCoverImage(id: string) {
  // Ajusta la URL según tu backend/API real
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/estudiantes/cursos/${id}/cover`,
    {
      // Forzar caché para imágenes OG
      next: { revalidate: 3600 },
    },
  );
  if (!res.ok) return null;
  const data: { coverImageUrl?: unknown } = await res.json();
  return typeof data.coverImageUrl === "string" ? data.coverImageUrl : null;
}

export default async function Image({ params }: { params: { id: string } }) {
  const { id } = params;
  let coverImageUrl =
    "https://placehold.co/1200x630/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT";

  // Intenta obtener la portada real del curso
  const fetchedCover = await getCourseCoverImage(id);
  if (fetchedCover) {
    coverImageUrl = fetchedCover;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#01142B",
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImageUrl}
          width={1200}
          height={630}
          style={{
            objectFit: "cover",
            width: "100%",
            height: "100%",
          }}
          alt="Portada del curso"
        />
        {/* Puedes agregar overlays, logo, título, etc. aquí si lo deseas */}
      </div>
    ),
    {
      ...size,
    },
  );
}
