'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

// Vuelta del inicio de sesión con Google/GitHub/Facebook en una academia (el
// formulario compartido usa /sign-in/sso-callback). Sin registro: si la cuenta
// no es de la academia, /dashboard le muestra que no tiene acceso.
export default function SSOCallbackAcademia() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 text-center text-white">
      <div className="mx-auto size-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      <AuthenticateWithRedirectCallback
        signInUrl="/sign-in"
        signUpUrl="/sign-in"
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
      />
      <div id="clerk-captcha" />
    </div>
  );
}
