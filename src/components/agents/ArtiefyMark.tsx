import type { CSSProperties } from 'react';

interface ArtiefyMarkProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The standalone Artiefy "A", lifted from the three polygons that draw it in
 * `public/artiefy-logo.svg` (the rest of that file is the wordmark).
 *
 * Inline rather than an `<img>` so it fills with `currentColor` and takes the
 * answering agent's colour, exactly like the Lucide icons it sits next to.
 */
export function ArtiefyMark({ className, style }: ArtiefyMarkProps) {
  return (
    <svg
      viewBox="0 0 368.19 343.13"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      <polygon points="200.47 0 0 343.13 4.28 343.1 195.13 35.63 194.83 117.23 195.02 116.84 241.6 219.25 194.56 201.83 194.48 225.93 278.95 343.13 368.19 343.13 200.47 0" />
      <polygon points="144.99 218.15 192.75 201.16 194.56 201.83 194.83 117.23 144.99 218.15" />
      <polygon points="107.13 343.13 194.11 343.13 194.48 225.93 194.12 225.42 107.13 343.13" />
    </svg>
  );
}

export default ArtiefyMark;
