'use client';

import BlurText from '~/components/reactbits/BlurText';

export const StudentArtieIa = () => {
  return (
    <div
      className="
        relative isolate flex w-full items-center justify-center overflow-visible
        pt-8 pb-4 text-center
        md:pt-10
      "
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute top-[-6.5rem] left-1/2 -z-10 h-56
          w-[26rem] -translate-x-1/2 rounded-full
          bg-[radial-gradient(circle_at_50%_100%,rgba(58,244,239,0.34),rgba(0,189,216,0.16)_42%,transparent_74%)]
          blur-3xl
        "
      />
      <BlurText
        text="Artie IA"
        delay={120}
        animateBy="letters"
        direction="top"
        stepDuration={0.4}
        className="
          font-display justify-center text-center text-5xl font-black
          text-primary drop-shadow-[0_0_18px_rgba(34,211,238,0.45)]
          sm:text-6xl
        "
      />
    </div>
  );
};
