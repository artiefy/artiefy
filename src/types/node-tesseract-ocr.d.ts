declare module 'node-tesseract-ocr' {
  export interface TesseractOptions {
    lang?: string;
    [key: string]: unknown;
  }

  export function recognize(
    imagePath: string,
    options?: TesseractOptions
  ): Promise<unknown>;

  const tesseract: {
    recognize: typeof recognize;
  };

  export default tesseract;
}
