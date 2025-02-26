'use client';

import { AppProgressProvider as ProgressProvider } from '@bprogress/next';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProgressProvider
      height="3px"
      color="#2563eb"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  );
};

export default Providers;

