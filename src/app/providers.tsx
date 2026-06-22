'use client';

import { ProgressProvider } from '@bprogress/next/app';

import { ExtrasProvider } from '~/app/estudiantes/StudentContext';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProgressProvider
      height="3px"
      color="#2563eb"
      options={{ showSpinner: true }}
      shallowRouting
    >
      <ExtrasProvider>{children}</ExtrasProvider>
    </ProgressProvider>
  );
};

export default Providers;
