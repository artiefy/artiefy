declare module 'html2canvas' {
  import type { Options } from 'html2canvas/dist/types/index';
  function html2canvas(
    element: HTMLElement,
    options?: Partial<Options>
  ): Promise<HTMLCanvasElement>;
  export default html2canvas;
}
