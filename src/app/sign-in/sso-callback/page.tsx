// src/app/sign-in/sso-callback/page.tsx
'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallback() {
  return (
    <AuthenticateWithRedirectCallback
      signUpUrl="/sign-up"
      continueSignUpUrl="/sign-up/continue"
      signInUrl="/sign-in"
    />
  );
}
