import { Suspense } from 'react';

import { notFound } from 'next/navigation';
import { connection } from 'next/server';

import { Loader2 } from 'lucide-react';

import { academiaDeLaPagina } from '~/app/academia/_cache/academia';
import { MarcaProvider } from '~/components/marca/MarcaProvider';
import { cssDeMarca, urlLogo } from '~/lib/academy/marca';
import { obtenerAjustes } from '~/server/academy/ajustes';

import type { Metadata } from 'next';

// Raíz de cada academia (<slug>.artiefy.com, reescrito aquí por src/proxy.ts).
// Aplica la marca: colores como variables CSS (--ac-*) y logo.

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: Omit<Props, 'children'>): Promise<Metadata> {
  const academia = await academiaDeLaPagina((await params).slug);
  // absolute: sin el " | Artiefy" que agrega el layout raíz.
  if (!academia) return { title: { absolute: 'Academia no encontrada' } };
  // Favicon: el de Configuraciones o, si no hay, el logo.
  const { faviconKey } = await obtenerAjustes(academia.id);
  const icono = urlLogo(faviconKey) ?? urlLogo(academia.logoKey);
  return {
    title: { absolute: academia.nombre, template: `%s · ${academia.nombre}` },
    description: academia.nombre,
    robots: { index: false },
    ...(icono ? { icons: { icon: icono, apple: icono } } : {}),
  };
}

export default function AcademiaLayout({ children, params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#01142B]">
          <Loader2 className="size-6 animate-spin text-white/40" />
        </div>
      }
    >
      <Marco params={params}>{children}</Marco>
    </Suspense>
  );
}

async function Marco({ children, params }: Props) {
  // Las páginas de una academia siempre dependen de la petición (host,
  // sesión): marcarlo evita que Next intente prerenderizar su metadata.
  await connection();
  const academia = await academiaDeLaPagina((await params).slug);
  if (!academia) notFound();
  // Sin logo principal se usa el primero de "Organiza" o el favicon
  // (Estudiantes › Formulario), para que el sidebar y el header lo muestren.
  const ajustes = academia.logoKey ? null : await obtenerAjustes(academia.id);
  const logoUrl =
    urlLogo(academia.logoKey) ??
    urlLogo(ajustes?.formularioLogos[0] ?? null) ??
    urlLogo(ajustes?.faviconKey ?? null);
  return (
    <MarcaProvider
      marca={{
        nombre: academia.nombre,
        logoUrl,
        esAcademia: true,
        colorPrimario: academia.colorPrimario,
      }}
    >
      {/* En :root, para que también los tomen los portales (modales,
          popovers) que se montan en <body>, fuera de este contenedor. */}
      <style
        dangerouslySetInnerHTML={{
          __html: cssDeMarca(academia.colorPrimario, academia.colorFondo),
        }}
      />
      <div className="min-h-dvh bg-background font-sans text-white">
        {children}
      </div>
    </MarcaProvider>
  );
}
