'use client';

import { Fragment, useSyncExternalStore } from 'react';

/**
 * Ideas a learner could build with Artie; two are shown per page load. Kept
 * to two short words so a picked example is a short prompt.
 */
const IDEA_EXAMPLES = [
  'Tienda online',
  'Tutorías virtuales',
  'Podcast financiero',
  'Menú digital',
  'Ropa reciclada',
  'Chatbot IA',
  'Cocina saludable',
  'Paseo perros',
  'Clases fotografía',
  'Talleres comunitarios',
  'Reservas barbería',
  'Plantillas Instagram',
  'Ventas WhatsApp',
  'Comida saludable',
  'Sitio web',
] as const;

const VISIBLE_EXAMPLES = 2;

let pickedExamples: readonly string[] | null = null;

/**
 * Shuffles once per page load, so a refresh shows a new set while
 * re-renders keep the same one (useSyncExternalStore needs a stable value).
 */
function getExamples() {
  if (!pickedExamples) {
    const pool: string[] = [...IDEA_EXAMPLES];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j]!, pool[i]!];
    }
    pickedExamples = pool.slice(0, VISIBLE_EXAMPLES);
  }
  return pickedExamples;
}

// The set never changes after it is picked, so there is nothing to subscribe to.
const subscribe = () => () => undefined;
// The server renders nothing, so the random pick never causes a hydration
// mismatch; the client fills it in right after hydrating.
const getServerExamples = () => null;

interface IdeaSuggestionsProps {
  label: string;
  /** Receives the example the learner picked, to put in the composer. */
  onPick: (idea: string) => void;
  className?: string;
}

/**
 * Two example ideas under the Artie composer, in the brand blue. Picking
 * one drops it into the composer.
 */
export function IdeaSuggestions({
  label,
  onPick,
  className = '',
}: IdeaSuggestionsProps) {
  const examples = useSyncExternalStore(
    subscribe,
    getExamples,
    getServerExamples
  );

  return (
    // The minimum height keeps the layout still while the examples load.
    <div
      className={`
        flex min-h-11 flex-wrap items-center justify-center gap-x-3 gap-y-1
        text-sm
        ${className}
      `}
    >
      {examples ? (
        <>
          <span className="idea-suggestion-in text-slate-400">{label}</span>
          {examples.map((example, index) => (
            <Fragment key={example}>
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="text-slate-600 max-sm:hidden"
                >
                  •
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => onPick(example)}
                style={{ animationDelay: `${(index + 1) * 0.12}s` }}
                className="
                  idea-suggestion-in min-h-10 rounded-md px-1 text-primary
                  transition-colors
                  hover:text-cyan-200
                  focus-visible:ring-2 focus-visible:ring-primary/60
                  focus-visible:outline-none
                  sm:min-h-0
                "
              >
                &quot;{example}&quot;
              </button>
            </Fragment>
          ))}
        </>
      ) : null}
    </div>
  );
}
