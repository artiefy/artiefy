/**
 * Utilidades para procesamiento de embeddings
 * Incluye chunking, normalización de texto y cálculo de costos
 */

/**
 * Interfaz para chunks procesados
 */
export interface DocumentChunk {
  content: string;
  chunkIndex: number;
  metadata: {
    source: string;
    totalChunks: number;
    chunkSize: number;
    overlap: number;
  };
}

/**
 * Calcula el número de tokens aproximadamente
 * Regla simple: ~4 caracteres = 1 token en inglés
 * Para español, es un poco menos (3-3.5 caracteres por token)
 */
export function estimateTokens(text: string): number {
  // Para texto en español, usamos aproximadamente 3.5 caracteres por token
  return Math.ceil(text.length / 3.5);
}

/**
 * Calcula el costo estimado de generar embeddings
 * text-embedding-3-small: $0.020 por 1M tokens
 */
export function calculateEmbeddingsCost(totalTokens: number): number {
  const costPerMillionTokens = 0.02; // en dólares
  return (totalTokens / 1_000_000) * costPerMillionTokens;
}

/**
 * Normaliza y limpia texto
 * - Elimina espacios extra
 * - Elimina caracteres de control
 * - Convierte a minúsculas para búsqueda
 */
export function normalizeText(text: string): string {
  return (
    text
      // Eliminar caracteres de control y espacios extra
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      // Normalizar espacios en blanco
      .replace(/\s+/g, ' ')
      // Trimear
      .trim()
  );
}

/**
 * Divide un texto en chunks con overlap
 *
 * @param text - Texto a dividir
 * @param chunkSize - Tamaño máximo de cada chunk en tokens (default: 1000)
 * @param overlap - Tokens de overlap entre chunks (default: 200)
 * @param source - Fuente del documento para metadata
 * @returns Array de chunks procesados
 */
export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200,
  source: string = 'unknown'
): DocumentChunk[] {
  // Normalizar texto
  const normalizedText = normalizeText(text);

  // Dividir por oraciones (aproximadamente)
  const sentences = normalizedText.split(/[.!?]+/).filter((s) => s.trim());

  const chunks: DocumentChunk[] = [];
  let currentChunk = '';
  let currentTokens = 0;
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    // Si agregar esta oración excedería el límite
    if (currentTokens + sentenceTokens > chunkSize && currentChunk) {
      // Guardar chunk actual
      chunks.push({
        content: currentChunk.trim(),
        chunkIndex: chunkIndex++,
        metadata: {
          source,
          totalChunks: 0, // Se actualiza después
          chunkSize,
          overlap,
        },
      });

      // Iniciar nuevo chunk con overlap
      // Mantener las últimas oraciones para crear overlap
      const overlapSentences = currentChunk
        .split(/[.!?]+/)
        .slice(-2) // Últimas 2 oraciones para overlap
        .join('. ')
        .trim();

      currentChunk = overlapSentences + '. ' + sentence;
      currentTokens =
        estimateTokens(overlapSentences) + sentenceTokens + overlap;
    } else {
      // Agregar oración al chunk actual
      currentChunk += (currentChunk ? '. ' : '') + sentence;
      currentTokens += sentenceTokens;
    }
  }

  // Agregar último chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      chunkIndex: chunkIndex,
      metadata: {
        source,
        totalChunks: chunks.length + 1,
        chunkSize,
        overlap,
      },
    });
  }

  // Actualizar total de chunks en todos los chunks
  chunks.forEach((chunk) => {
    chunk.metadata.totalChunks = chunks.length;
  });

  return chunks;
}

/**
 * Extrae texto de un archivo PDF (requiere pdfjs)
 * Nota: Esta es una versión simplificada
 * Para producción, usa: npm install pdfjs-dist
 */
export async function extractPdfText(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  try {
    // Intenta usar pdfjs si está disponible
    const pdfjs = await import('pdfjs-dist').catch(() => null);

    if (!pdfjs) {
      console.warn(
        'pdfjs-dist no está instalado. Instala con: npm install pdfjs-dist'
      );
      return '';
    }

    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = (textContent.items as unknown[])
        .map((item: unknown) =>
          typeof item === 'object' && item !== null && 'str' in item
            ? String((item as Record<string, unknown>).str)
            : ''
        )
        .join(' ');
      text += pageText + '\n';
    }

    return text;
  } catch (error) {
    console.error('Error extrayendo PDF:', error);
    return '';
  }
}

/**
 * Extrae texto de un archivo DOCX (requiere docx-parser)
 * Nota: Esta es una versión simplificada
 * Para producción, usa: npm install docx-parser
 */
export async function extractDocxText(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  try {
    // Intenta usar JSZip para leer el DOCX
    const jszip = await import('jszip').catch(() => null);

    if (!jszip) {
      console.warn('jszip no está instalado. Instala con: npm install jszip');
      return '';
    }

    const zip = new jszip.default();
    const zipFile = await zip.loadAsync(arrayBuffer);

    // DOCX es un ZIP, el texto está en document.xml
    const documentXml = await zipFile.file('word/document.xml')?.async('text');

    if (!documentXml) {
      return '';
    }

    // Extraer texto del XML
    const textMatch = documentXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    if (!textMatch) return '';

    return textMatch.map((match) => match.replace(/<[^>]*>/g, '')).join(' ');
  } catch (error) {
    console.error('Error extrayendo DOCX:', error);
    return '';
  }
}

/**
 * Extrae texto de un archivo XLSX/XLS (Excel)
 * Requiere: npm install xlsx
 */
export async function extractXlsxText(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  try {
    const xlsx = await import('xlsx').catch(() => null);

    if (!xlsx) {
      console.warn('xlsx no está instalado. Instala con: npm install xlsx');
      return '';
    }

    const workbook = xlsx.read(new Uint8Array(arrayBuffer));
    const textParts: string[] = [];

    // Iterar sobre todas las hojas
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) continue;

      // Convertir hoja a CSV
      const csv = xlsx.utils.sheet_to_csv(worksheet);
      textParts.push(`--- Hoja: ${sheetName} ---`);
      textParts.push(csv);
    }

    return textParts.join('\n');
  } catch (error) {
    console.error('Error extrayendo XLSX:', error);
    return '';
  }
}

/**
 * Extrae texto de un archivo CSV
 */
export async function extractCsvText(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  try {
    const text = new TextDecoder().decode(arrayBuffer);
    return text;
  } catch (error) {
    console.error('Error extrayendo CSV:', error);
    return '';
  }
}

/**
 * Extrae texto de una imagen usando OCR (node-tesseract-ocr)
 * Opcional: Requiere Tesseract-OCR instalado en el sistema
 * Soporta: JPG, PNG, BMP, TIF
 * Si OCR no está disponible, retorna cadena vacía gracefully
 */
export async function extractImageText(
  arrayBuffer: ArrayBuffer,
  fileName: string
): Promise<string> {
  try {
    // Intentar cargar node-tesseract-ocr de forma dinámica
    const Tesseract = await import('node-tesseract-ocr').catch(() => null);

    if (!Tesseract) {
      console.warn(
        `⚠️ OCR no disponible para ${fileName}. Para habilitar: npm install node-tesseract-ocr y instalar Tesseract-OCR en el sistema.`
      );
      return '';
    }

    console.log(`🔍 Procesando imagen con OCR: ${fileName}`);

    // Usar dynamic imports para fs, path, os
    const fs = await import('fs').then((m) => m.promises);
    const path = await import('path');
    const os = await import('os');

    // Crear archivo temporal en carpeta temp del sistema
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `ocr-${Date.now()}-${fileName}`);

    try {
      // Guardar ArrayBuffer a archivo temporal
      await fs.writeFile(tempPath, Buffer.from(arrayBuffer));

      // Realizar OCR - pasar opciones como objeto
      const result = await Tesseract.recognize(tempPath, { lang: 'spa+eng' });
      const extractedText =
        (result as any)?.data?.text || (result as any)?.text || '';

      // Limpiar archivo temporal
      await fs.unlink(tempPath).catch(() => {});

      if (!extractedText || extractedText.trim().length === 0) {
        console.warn(`⚠️ No se detectó texto en la imagen: ${fileName}`);
        return '';
      }

      console.log(
        `✅ Texto extraído de imagen: ${fileName} (${extractedText.length} caracteres)`
      );

      return extractedText;
    } catch (ocrError) {
      // Si falla OCR, limpiar archivo temporal y continuar gracefully
      await fs.unlink(tempPath).catch(() => {});
      console.warn(
        `⚠️ OCR falló para ${fileName}: ${ocrError instanceof Error ? ocrError.message : String(ocrError)}`
      );
      console.log(
        `📸 Imagen "${fileName}" omitida (OCR requiere Tesseract-OCR en el sistema)`
      );
      return '';
    }
  } catch (error) {
    console.warn(
      `⚠️ No se pudo procesar imagen ${fileName} con OCR:`,
      error instanceof Error ? error.message : String(error)
    );
    return '';
  }
}

/**
 * Extrae texto según el tipo de archivo
 */
export async function extractTextFromFile(
  arrayBuffer: ArrayBuffer,
  fileName: string
): Promise<string> {
  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return extractPdfText(arrayBuffer);
    case 'docx':
    case 'doc':
      return extractDocxText(arrayBuffer);
    case 'xlsx':
    case 'xls':
      return extractXlsxText(arrayBuffer);
    case 'csv':
      return extractCsvText(arrayBuffer);
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'bmp':
    case 'tif':
    case 'tiff':
      return extractImageText(arrayBuffer, fileName);
    case 'txt':
      // Para TXT, convertir ArrayBuffer a string
      return new TextDecoder().decode(arrayBuffer);
    default:
      console.warn(`Tipo de archivo no soportado: ${extension}`);
      return '';
  }
}

/**
 * Valida que un archivo sea válido para procesamiento
 */
export function validateFile(file: File | { name: string; size: number }): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `El archivo es muy grande. Máximo 10MB (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
    };
  }

  const supportedTypes = [
    '.pdf',
    '.docx',
    '.doc',
    '.txt',
    '.xlsx',
    '.xls',
    '.csv',
    '.jpg',
    '.jpeg',
    '.png',
    '.bmp',
    '.tif',
    '.tiff',
  ];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

  if (!supportedTypes.includes(fileExtension)) {
    return {
      valid: false,
      error: `Tipo de archivo no soportado. Soportados: ${supportedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}
