import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { academiaDeLaPagina } from '~/app/academia/_cache/academia';
import { InicioSesion } from '~/components/auth/InicioSesion';
import { urlLogo } from '~/lib/academy/marca';

// El mismo inicio de sesión de Artiefy, con el logo de la academia; los
// colores salen de las variables del tema que pone el layout de la academia.
// Sin registro: las cuentas las crea la academia (o Artiefy).

type Props = { params: Promise<{ slug: string }> };

export default function SignInAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <Formulario params={params} />
    </Suspense>
  );
}

async function Formulario({ params }: Props) {
  const academia = await academiaDeLaPagina((await params).slug);
  if (!academia) notFound();
  const logo = urlLogo(academia.logoKey);

  return (
    <InicioSesion
      fondoSrc={null}
      conRegistro={false}
      destinoPorDefecto="/dashboard"
      logo={
        logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt={academia.nombre}
            className="absolute inset-0 size-full object-contain"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-6xl font-black tracking-wide text-primary sm:text-8xl">
            {academia.acronimo ?? academia.nombre}
          </span>
        )
      }
    />
  );
}
