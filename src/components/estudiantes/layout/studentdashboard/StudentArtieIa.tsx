'use client';

import TrueFocus from '~/components/reactbits/TrueFocus';

export const StudentArtieIa = () => {
  return (
    <div className="flex items-center justify-center py-4">
      <TrueFocus
        sentence="Artie IA"
        blurAmount={5}
        borderColor="cyan"
        glowColor="rgba(34, 211, 238, 0.6)"
        animationDuration={0.5}
        pauseBetweenAnimations={1}
      />
    </div>
  );
};
