'use client';

import { useSyncExternalStore } from 'react';

import { Download } from 'lucide-react';

import { useMarca } from '~/components/marca/MarcaProvider';

import '~/styles/confetti.css';

// Constancia de un curso terminado en una academia: la misma de Artiefy
// (CertificationStudent: confeti, marco dorado, logo arriba a la izquierda,
// nombre, curso, fecha, código y verificación) con el logo y el nombre de la
// academia. Firma el educador del curso. "Descargar PDF" usa la impresión
// del navegador (Guardar como PDF), solo con la constancia.

const sinSuscripcion = () => () => undefined;

export function CertificadoAula({
  nombre,
  curso,
  educador,
  fecha,
}: {
  nombre: string;
  curso: { id: number; title: string };
  educador: string | null;
  fecha: string;
}) {
  const marca = useMarca();
  const url = useSyncExternalStore(
    sinSuscripcion,
    () => window.location.href,
    () => ''
  );
  const finalizado = new Date(fecha).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <style>{`@media print {
        body * { visibility: hidden !important; }
        .constancia-academia, .constancia-academia * { visibility: visible !important; }
        .constancia-academia { position: absolute; inset: 0; margin: 0; }
        @page { size: landscape; margin: 10mm; }
      }`}</style>
      <div className="relative">
        <div className="confetti print:hidden">
          {Array.from({ length: 13 }, (_, i) => (
            <div key={i} className="confetti-piece" />
          ))}
        </div>
        <div className="mb-8 text-center print:hidden">
          <h1 className="mb-2 text-4xl font-bold text-primary">
            Constancia de Participación
          </h1>
          <p className="text-lg text-muted-foreground">
            Por su dedicación y compromiso en el aprendizaje
          </p>
        </div>

        <div className="constancia-academia relative mb-8 overflow-hidden rounded-lg border-8 border-amber-200 bg-[#FFFFFF] p-8 shadow-2xl">
          <div className="relative z-10">
            <div className="absolute left-8 -mt-3">
              {marca.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={marca.logoUrl}
                  alt={marca.nombre}
                  className="h-14 max-w-[160px] object-contain"
                />
              ) : (
                <span className="text-lg font-black text-[var(--ac-primario)]">
                  {marca.nombre}
                </span>
              )}
            </div>

            <div className="mt-16 text-center sm:mt-4">
              <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-4">
                  <p className="text-xl text-gray-600">
                    Por medio de la presente se hace constar que
                  </p>
                  <p className="text-3xl font-bold text-[#0B1726]">{nombre}</p>
                  <p className="text-xl text-gray-600">
                    ha participado y completado exitosamente el curso
                  </p>
                  <p className="text-3xl font-bold text-[#0B1726]">
                    {curso.title}
                  </p>
                  <p className="mt-4 text-lg text-gray-600">
                    desarrollando habilidades y conocimientos en el área,
                    demostrando compromiso y excelencia académica durante todo
                    el proceso de aprendizaje.
                  </p>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-14 w-44 border-b border-gray-400" />
                    <p className="text-base font-semibold text-[#0B1726]">
                      {educador ?? 'Educador del curso'}
                    </p>
                    <p className="text-sm text-gray-600">Educador</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg text-[#0B1726]">
                      realizado a través de {marca.nombre}
                    </p>
                    <p className="text-lg text-[#0B1726]">
                      Finalizado el {finalizado}
                    </p>
                    <p className="text-sm text-gray-600">
                      CC. {curso.id.toString().padStart(6, '0')}
                    </p>
                    {url && (
                      <div className="mt-4 pt-2">
                        <p className="text-sm text-gray-600">Verificado en:</p>
                        <span className="inline-block max-w-full truncate text-sm text-blue-500">
                          {url}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-14 w-44 border-b border-gray-400" />
                    <p className="text-base font-semibold text-[#0B1726]">
                      {marca.nombre}
                    </p>
                    <p className="text-sm text-gray-600">Dirección académica</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--ac-primario)] via-amber-500 to-[var(--ac-primario)]" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-center print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 font-semibold text-[var(--ac-primario-texto)] hover:opacity-90"
          >
            <Download className="size-4" /> Descargar PDF
          </button>
          <p className="text-xs text-muted-foreground">
            En la ventana de impresión elige “Guardar como PDF”.
          </p>
        </div>
      </div>
    </div>
  );
}
