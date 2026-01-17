'use client';

import { useEffect } from 'react';

import { useClerk } from '@clerk/nextjs';

export default function PopupCallback() {
  const { handleRedirectCallback } = useClerk();

  useEffect(() => {
    const finalize = async () => {
      try {
        await handleRedirectCallback({});
      } finally {
        if (window.opener) {
          window.opener.postMessage(
            { type: 'clerk:oauth:complete' },
            window.location.origin
          );
          window.close();
        }
      }
    };

    void finalize();
  }, [handleRedirectCallback]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
        <p className="text-sm text-muted-foreground">
          Completando autenticación...
        </p>
      </div>
    </div>
  );
}
