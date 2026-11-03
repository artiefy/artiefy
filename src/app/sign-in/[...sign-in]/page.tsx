'use client';

import { InicioSesion } from '~/components/auth/InicioSesion';

// El formulario vive en ~/components/auth/InicioSesion para que las academias
// lo reutilicen con su marca. Sin props es el inicio de sesión de Artiefy.
export default function SignInPage() {
  return <InicioSesion />;
}
