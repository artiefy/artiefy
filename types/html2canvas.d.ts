// Type definitions for html2canvas
// Project: https://github.com/niklasvh/html2canvas
// Definitions by: Artiefy Team
// Definitions: custom

import type { Options } from 'html2canvas/dist/types/index';

declare function html2canvas(
  element: HTMLElement,
  options?: Partial<Options>
): Promise<HTMLCanvasElement>;

export default html2canvas;
