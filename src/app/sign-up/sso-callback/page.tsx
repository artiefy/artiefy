'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallback() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#01152d] px-6 text-center text-white">
      <div className="w-full max-w-sm space-y-4">
        <div className="mx-auto size-10 animate-spin rounded-full border-2 border-[#22C4D3]/30 border-t-[#22C4D3]" />
        <div>
          <h1 className="text-lg font-semibold">Completando registro</h1>
          <p className="mt-2 text-sm text-slate-300">
            Estamos preparando el campo de usuario para finalizar tu cuenta.
          </p>
        </div>
      </div>

      <AuthenticateWithRedirectCallback
        signUpUrl="/sign-up"
        continueSignUpUrl="/sign-up/continue"
        verifyEmailAddressUrl="/sign-up/verify-email-address"
        signInUrl="/sign-in"
        signInFallbackRedirectUrl="/estudiantes"
        signUpFallbackRedirectUrl="/estudiantes"
      />
      <div id="clerk-captcha" />
    </div>
  );
}
