import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/';

  return (
    <AuthenticateWithRedirectCallback
      signInFallbackRedirectUrl={redirectTo}
      signUpFallbackRedirectUrl={redirectTo}
    />
  );
}