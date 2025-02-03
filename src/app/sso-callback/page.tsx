"use client"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthenticateWithRedirectCallback, useAuth } from '@clerk/nextjs';

export default function SSOCallbackPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/');
    } else if (isLoaded && !isSignedIn) {
      router.replace('/sign-up');
    }
  }, [isLoaded, isSignedIn, router]);

  return <AuthenticateWithRedirectCallback />;
}
