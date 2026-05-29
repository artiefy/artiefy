'use client';

import BlurText from '~/components/reactbits/BlurText';

export const StudentArtieIa = () => {
  return (
    <div className="flex w-full items-center justify-center py-4 text-center">
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
