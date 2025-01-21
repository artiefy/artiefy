'use client';

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

const AppProgressBar = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <ProgressBar height="4px" color="#ffff" options={{ showSpinner: false }} shallowRouting={false} />
    </>
  );
};

export default AppProgressBar;
