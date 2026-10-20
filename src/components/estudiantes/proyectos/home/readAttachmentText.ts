'use client';

import { extractTextFromFile } from '~/lib/embeddings/utils';

/** File types the composer can read; the file picker only offers these. */
export const ATTACHMENT_ACCEPT = '.pdf,.docx,.txt,.md,.csv,.json,.xlsx,.xls';

const PLAIN_TEXT_EXTENSIONS = new Set(['txt', 'md', 'csv', 'json']);
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 5;
const MAX_CHARS_PER_FILE = 2000;
const MAX_TOTAL_CHARS = 4000;

let pdfWorkerReady = false;

/**
 * pdf.js needs its worker URL before it can parse in the browser.
 * `extractTextFromFile` imports the same module, so setting it once here
 * covers that call too.
 */
async function ensurePdfWorker() {
  if (pdfWorkerReady) return;
  const pdfjs = (await import('pdfjs-dist')) as {
    GlobalWorkerOptions: { workerSrc: string };
  };
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
  pdfWorkerReady = true;
}

async function readAttachmentText(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  try {
    if (PLAIN_TEXT_EXTENSIONS.has(extension)) return await file.text();
    if (extension === 'pdf') await ensurePdfWorker();
    return await extractTextFromFile(await file.arrayBuffer(), file.name);
  } catch (error) {
    console.error(`[idea attachments] could not read ${file.name}:`, error);
    return '';
  }
}

/**
 * Turns the attached files into the "details" Artie receives with the idea:
 * each file's text, trimmed so a long document cannot crowd out the idea in
 * every generation prompt. Files with no readable text are reported back.
 */
export async function buildAttachmentDetails(files: File[]): Promise<{
  details: string;
  unreadable: string[];
}> {
  const sections: string[] = [];
  const unreadable: string[] = [];
  let remaining = MAX_TOTAL_CHARS;

  for (const file of files) {
    const text = (await readAttachmentText(file)).replace(/\s+/g, ' ').trim();
    if (!text) {
      unreadable.push(file.name);
      continue;
    }
    if (remaining <= 0) continue;
    const excerpt = text.slice(0, Math.min(MAX_CHARS_PER_FILE, remaining));
    remaining -= excerpt.length;
    sections.push(`Archivo "${file.name}": ${excerpt}`);
  }

  return { details: sections.join('\n'), unreadable };
}
