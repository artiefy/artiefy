import type { ProjectAiMode } from '~/components/projects/Modals/ProjectModeChooser';

/**
 * Text helpers shared by every flow that asks the n8n project generator for
 * content: the step-by-step wizard (`ModalResumen`) and the one-shot
 * background generation started from `ProjectModeChooser`.
 */

export const AI_MODE_DESCRIPTION_GUIDE: Record<ProjectAiMode, string> = {
  guided:
    'El estudiante quiere aprender haciendo: explica qué va a construir y para qué, pero deja abiertas las decisiones de cómo hacerlo.',
  copilot:
    'El estudiante trabajará junto a la IA: equilibra la visión general con algunas funcionalidades concretas.',
  autonomous:
    'La IA hará la mayor parte del trabajo: sé concreto, con alcance claro y funcionalidades clave definidas.',
};

export const cleanGeneratedTitle = (value: string) =>
  value
    .split('\n')[0]!
    .replace(/^(t[ií]tulo\s*:\s*)/iu, '')
    .replace(/^["'“”«»*]+|["'“”«»*.]+$/gu, '')
    .trim();

export const normalizeRequirementLine = (line: string) => {
  let cleaned = line.trim();
  if (!cleaned) return '';
  // Remove common bullet characters
  cleaned = cleaned.replace(/^[-*•]+\s*/u, '');
  // Remove numeric list markers like "1.", "2)", "3 -"
  cleaned = cleaned.replace(/^\d+\s*[.)-]\s*/u, '');
  // Remove letter list markers only when followed by punctuation like "a." or "b)"
  cleaned = cleaned.replace(/^[a-zA-Z]\s*[.)-]\s*/u, '');
  cleaned = cleaned.trim();
  if (!cleaned) return '';
  const lower = cleaned.toLowerCase();
  if (lower === 'requisitos' || lower === 'requisito') return '';
  if (cleaned.endsWith(':')) return '';
  // Capitalize first letter
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return cleaned;
};

export const dedupeRequirements = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
