'use client';

import { AppProgressBar as Provider } from 'next-nprogress-bar';

const AppProgressBar = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <Provider height="4px" color="#FFFF00" options={{ showSpinner: false }} shallowRouting={false} />
    </>
  );
};

export default AppProgressBar;
