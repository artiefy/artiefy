export const dynamic = 'force-static';

const SmoothGradient = () => {
  return (
    <div className="absolute inset-0 size-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              100% 100% at 85% 0%,
              #3AF4EF66 0%,
              transparent 70%
            ),
            radial-gradient(
              100% 100% at 15% 100%,
              #00BDD866 0%,
              transparent 70%
            ),
            radial-gradient(
              100% 100% at 0% 100%,
              #2ecc71 0%,
              transparent 70%
            ),
            #01142B
          `,
          backgroundBlendMode: 'screen, screen, normal',
        }}
      />
    </div>
  );
};

export default SmoothGradient;
