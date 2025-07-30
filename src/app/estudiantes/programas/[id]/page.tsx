import { Suspense } from 'react';

import { type Metadata, type ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';

import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { ProgramDetailsSkeleton } from '~/components/estudiantes/layout/programdetail/ProgramDetailsSkeleton';
import { getProgramById } from '~/server/actions/estudiantes/programs/getProgramById';

import ProgramDetails from './ProgramDetails';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Cambia la firma para recibir params como objeto plano
export async function generateMetadata(
  { params }: { params: { id: string } },
  _parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const { id } = params;
    const program = await getProgramById(id);

    if (!program) {
      return {
        title: 'Programa no encontrado',
        description: 'El programa solicitado no pudo ser encontrado.',
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artiefy.com';
    const metadataBase = new URL(baseUrl);

    // Obtener la portada usando el endpoint, igual que en cursos
    let coverImageUrl =
      'https://placehold.co/1200x630/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';
    try {
      const res = await fetch(
        `${baseUrl}/api/estudiantes/programas/${id}/cover`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const data: { coverImageUrl?: unknown } = await res.json();
        if (typeof data.coverImageUrl === 'string') {
          coverImageUrl = data.coverImageUrl;
        }
      }
    } catch {
      // fallback al placeholder
    }

    return {
      metadataBase,
      title: `${program.title} | Artiefy`,
      description: program.description ?? 'No hay descripción disponible.',
      openGraph: {
        type: 'website',
        locale: 'es_ES',
        url: new URL(`/estudiantes/programas/${id}`, baseUrl).toString(),
        siteName: 'Artiefy',
        title: `${program.title} | Artiefy`,
        description: program.description ?? 'No hay descripción disponible.',
        images: [
          {
            url: coverImageUrl,
            width: 1200,
            height: 630,
            alt: `Portada del programa: ${program.title}`,
            type: coverImageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${program.title} | Artiefy`,
        description: program.description ?? 'No hay descripción disponible.',
        images: [coverImageUrl],
        creator: '@artiefy',
        site: '@artiefy',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error',
      description: 'Error al cargar el programa',
    };
  }
}

export default function Page({ params }: PageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Suspense fallback={<ProgramDetailsSkeleton />}>
        <ProgramContent params={params} />
      </Suspense>
      <Footer />
    </div>
  );
}

async function ProgramContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const program = await getProgramById(id);

  if (!program) {
    notFound();
  }

  return <ProgramDetails program={program} />;
}
