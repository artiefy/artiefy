'use client';

import Link from 'next/link';

import { toast } from 'sonner';

interface CreationAccessResponse {
  allowed?: boolean;
  message?: string;
}

/**
 * Asks the server whether the learner may create a project and, when not,
 * explains why with a way to the plans page. Callers run it before opening
 * the creation modal so nobody fills in a form (or spends AI calls) only to
 * be refused on save. The server re-checks on every create regardless.
 */
export async function ensureCanCreateProject(): Promise<boolean> {
  try {
    const response = await fetch('/api/projects/creation-access');
    const data = (await response.json()) as CreationAccessResponse;
    if (data.allowed) return true;

    toast.error(data.message ?? 'No puedes crear proyectos en este momento.', {
      // A Link rather than an onClick: it navigates client-side without this
      // helper needing a router, since it also runs outside components.
      action: (
        <Link
          href="/planes"
          className="
            ml-auto shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs
            font-semibold text-slate-950 transition-colors
            hover:bg-primary/90
          "
        >
          Ver planes
        </Link>
      ),
    });
    return false;
  } catch {
    // Network hiccup: let the flow continue; the server still enforces it.
    return true;
  }
}
