'use client';

import { useState } from 'react';

import { ExternalLink, MessagesSquare, Paperclip } from 'lucide-react';

import { fmtFechaHora, useDatosAcademia } from './seccion/comun';
import {
  type ActividadCurso,
  ActividadesCursoAcademia,
} from './ActividadesCursoAcademia';
import { ClasesCursoAcademia } from './ClasesCursoAcademia';
import { ClasesEnVivoAcademia } from './ClasesEnVivoAcademia';
import { EstudiantesCursoAcademia } from './EstudiantesCursoAcademia';

// Pestañas del detalle de un curso de la academia, las mismas del detalle de
// super-admin de Artiefy: Lista de Clases, Clases en Vivo, Estudiantes,
// Actividades, Recursos, Foros y Proyectos (con sus contadores).

type Pestana =
  | 'lecciones'
  | 'en-vivo'
  | 'estudiantes'
  | 'actividades'
  | 'recursos'
  | 'foros'
  | 'proyectos';

interface Proyecto {
  id: number;
  titulo: string;
  descripcion: string | null;
  enlace: string | null;
  estado: string;
  courseId: number;
  estudiante: string | null;
  email: string | null;
  updatedAt: string;
}

const pildora = (activa: boolean) =>
  `rounded-full px-4 py-2 font-semibold whitespace-nowrap transition-all duration-300 ${
    activa
      ? 'bg-[var(--ac-primario)]/15 text-[var(--ac-primario)] shadow-[0_0_12px_rgba(34,211,238,0.25)] ring-1 ring-[var(--ac-primario)]/40'
      : 'text-white/80 hover:bg-white/5 hover:text-white'
  }`;

const contador = (n: number) => (
  <span className="ml-2 inline-block rounded-full bg-[var(--ac-primario)] px-2 py-0.5 text-xs font-bold text-[var(--ac-primario-texto)]">
    {n}
  </span>
);

export function PestanasCursoAcademia({
  slug,
  courseId,
  tema,
}: {
  slug: string;
  courseId: number;
  tema: string;
}) {
  const [pestana, setPestana] = useState<Pestana>('lecciones');
  const {
    data: estudiantes,
    isLoading: cargandoActividades,
    mutate: recargarActividades,
  } = useDatosAcademia<{
    actividades: ActividadCurso[];
  }>(`/api/academia/${slug}/cursos/${courseId}/estudiantes`);
  const { data: proyectosData } = useDatosAcademia<{ proyectos: Proyecto[] }>(
    `/api/academia/${slug}/proyectos`
  );
  const actividades = estudiantes?.actividades ?? [];
  const proyectos = (proyectosData?.proyectos ?? []).filter(
    (p) => p.courseId === courseId
  );

  return (
    <div className="space-y-6">
      <div className="flex scrollbar-none gap-2 overflow-x-auto scroll-smooth p-2 md:gap-3 lg:gap-4">
        <button
          type="button"
          onClick={() => setPestana('lecciones')}
          className={pildora(pestana === 'lecciones')}
        >
          Lista de Clases
        </button>
        <button
          type="button"
          onClick={() => setPestana('en-vivo')}
          className={pildora(pestana === 'en-vivo')}
        >
          Clases en Vivo
        </button>
        <button
          type="button"
          onClick={() => setPestana('estudiantes')}
          className={pildora(pestana === 'estudiantes')}
        >
          Estudiantes
        </button>
        <button
          type="button"
          onClick={() => setPestana('actividades')}
          className={pildora(pestana === 'actividades')}
        >
          Actividades {contador(actividades.length)}
        </button>
        <button
          type="button"
          onClick={() => setPestana('recursos')}
          className={pildora(pestana === 'recursos')}
        >
          Recursos {contador(0)}
        </button>
        <button
          type="button"
          onClick={() => setPestana('foros')}
          className={pildora(pestana === 'foros')}
        >
          Foros {contador(0)}
        </button>
        <button
          type="button"
          onClick={() => setPestana('proyectos')}
          className={pildora(pestana === 'proyectos')}
        >
          Proyectos {contador(proyectos.length)}
        </button>
      </div>

      <div className="duration-500 animate-in fade-in">
        {pestana === 'lecciones' && (
          <ClasesCursoAcademia slug={slug} courseId={courseId} tema={tema} />
        )}
        {pestana === 'en-vivo' && (
          <ClasesEnVivoAcademia slug={slug} courseId={courseId} />
        )}
        {pestana === 'estudiantes' && (
          <EstudiantesCursoAcademia slug={slug} courseId={courseId} />
        )}
        {pestana === 'actividades' && (
          <ActividadesCursoAcademia
            slug={slug}
            courseId={courseId}
            actividades={actividades}
            cargando={cargandoActividades}
            onCambio={() => recargarActividades()}
          />
        )}
        {pestana === 'recursos' && (
          <Vacio
            icono={<Paperclip className="size-8" />}
            texto="Los recursos del curso (archivos y enlaces) llegan pronto a las academias."
          />
        )}
        {pestana === 'foros' && (
          <Vacio
            icono={<MessagesSquare className="size-8" />}
            texto="Los foros del curso llegan pronto a las academias."
          />
        )}
        {pestana === 'proyectos' && <ListaProyectos proyectos={proyectos} />}
      </div>
    </div>
  );
}

function Vacio({ icono, texto }: { icono: React.ReactNode; texto: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] px-6 py-14 text-center text-white/50">
      <span className="text-[var(--ac-primario)]">{icono}</span>
      <p className="max-w-md text-sm">{texto}</p>
    </div>
  );
}

function ListaProyectos({ proyectos }: { proyectos: Proyecto[] }) {
  // Como en Artiefy: "Ver más" muestra el detalle en el lugar de la grilla.
  const [elegido, setElegido] = useState<Proyecto | null>(null);
  return (
    <div className="duration-500 animate-in fade-in">
      <h2 className="mb-6 text-2xl font-bold text-white">
        Proyectos de Estudiantes
      </h2>
      {elegido ? (
        <div className="space-y-4 rounded-2xl border border-[var(--ac-primario)]/30 bg-[var(--ac-superficie)] p-6 shadow-xl">
          <button
            type="button"
            onClick={() => setElegido(null)}
            className="text-sm font-semibold text-[var(--ac-primario)] hover:underline"
          >
            ← Volver a los proyectos
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-bold text-[var(--ac-primario)]">
              {elegido.titulo}
            </h3>
            <span className="inline-block rounded bg-[var(--ac-primario)]/20 px-2 py-0.5 text-xs font-semibold text-[var(--ac-primario)] capitalize">
              {elegido.estado}
            </span>
          </div>
          <p className="text-sm text-white/70">
            {elegido.estudiante ?? elegido.email}
            {elegido.email && elegido.estudiante ? ` · ${elegido.email}` : ''} ·
            Actualizado {fmtFechaHora(elegido.updatedAt)}
          </p>
          <p className="whitespace-pre-line text-white/80">
            {elegido.descripcion ?? 'Sin descripción.'}
          </p>
          {elegido.enlace && (
            <a
              href={elegido.enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded bg-[var(--ac-primario)]/20 px-4 py-2 font-semibold text-[var(--ac-primario)] hover:bg-[var(--ac-primario)]/40"
            >
              <ExternalLink className="size-4" /> Abrir proyecto
            </a>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {proyectos.length > 0 ? (
            proyectos.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setElegido(p)}
                className="group cursor-pointer rounded-2xl border border-[var(--ac-primario)]/30 bg-gradient-to-br from-[var(--ac-superficie)] via-[var(--ac-fondo)]/30 to-[var(--ac-fondo)]/30 p-6 text-left shadow-xl transition-all duration-300 hover:scale-[1.03] hover:border-[var(--ac-primario)] hover:shadow-2xl"
              >
                <div className="mb-4">
                  <h3 className="mb-1 text-xl font-bold text-[var(--ac-primario)]">
                    {p.titulo}
                  </h3>
                  <span className="inline-block rounded bg-[var(--ac-primario)]/20 px-2 py-0.5 text-xs font-semibold text-[var(--ac-primario)] capitalize">
                    {p.estado}
                  </span>
                </div>
                <div className="mb-2 flex flex-col gap-1">
                  <span className="text-xs text-[var(--ac-primario)]">
                    Estudiante:
                  </span>
                  <span className="text-xs font-semibold text-white/80">
                    {p.estudiante ?? p.email}
                  </span>
                  {p.email && (
                    <span className="text-xs text-[var(--ac-primario)]">
                      {p.email}
                    </span>
                  )}
                </div>
                <span className="mt-4 block w-full rounded bg-[var(--ac-primario)]/20 px-4 py-2 text-center font-semibold text-[var(--ac-primario)] transition group-hover:bg-[var(--ac-primario)]/40 group-hover:text-white">
                  Ver más
                </span>
              </button>
            ))
          ) : (
            <div className="col-span-full text-white/60">
              No hay proyectos de estudiantes para este curso.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
