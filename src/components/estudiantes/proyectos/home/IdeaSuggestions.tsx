'use client';

import { Fragment, useSyncExternalStore } from 'react';

/** Ideas a learner could build with Artie; three are shown per page load. */
const IDEA_EXAMPLES = [
  'Vender productos hechos en casa por redes sociales',
  'Crear sitios web con IA para emprendedores',
  'Dar tutorías virtuales',
  'Abrir una tienda online de ropa de segunda mano',
  'Lanzar un podcast sobre finanzas personales',
  'Crear una app para reservar turnos en barberías',
  'Ofrecer clases de cocina saludable por video',
  'Hacer un menú digital para restaurantes',
  'Vender plantillas de diseño para Instagram',
  'Montar un servicio de paseo de perros en mi barrio',
  'Enseñar fotografía con el celular',
  'Organizar talleres para mi comunidad',
  'Atender clientes de un negocio con un chatbot de IA',
  'Emprender con comida saludable para llevar',
  'Ayudar a pequeños negocios a vender por WhatsApp',
] as const;

const VISIBLE_EXAMPLES = 3;

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
 * Three example ideas under the Artie composer, in flickering neon text.
 * Picking one drops it into the composer.
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
                  idea-suggestion-in min-h-10 rounded-md px-1
                  focus-visible:ring-2 focus-visible:ring-primary/60
                  focus-visible:outline-none
                  sm:min-h-0
                "
              >
                {/* Each one flickers on its own beat. */}
                <span
                  className="neon-flicker"
                  style={{ animationDelay: `${index * -2.3}s` }}
                >
                  &quot;{example}&quot;
                </span>
              </button>
            </Fragment>
          ))}
        </>
      ) : null}
    </div>
  );
}
