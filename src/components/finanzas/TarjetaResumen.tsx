import type { LucideIcon } from 'lucide-react';

// Tarjeta compacta del resumen de Finanzas (Artiefy y academias):
// título y total en una línea; debajo, dos cifras en otra.

interface Cifra {
  label: string;
  valor: React.ReactNode;
  className: string;
}

export function TarjetaResumen({
  titulo,
  icono: Icono,
  acento,
  borde,
  total,
  izquierda,
  derecha,
}: {
  titulo: string;
  icono: LucideIcon;
  /** Clase de color de texto del título e icono. */
  acento: string;
  /** Clase de color del borde. */
  borde: string;
  total: React.ReactNode;
  izquierda: Cifra;
  derecha: Cifra;
}) {
  return (
    <div className={`rounded-xl border bg-white/[0.03] px-4 py-3 ${borde}`}>
      <div className="flex items-center justify-between gap-3">
        <span
          className={`flex min-w-0 items-center gap-2 text-xs font-semibold uppercase ${acento}`}
        >
          <Icono className="size-4 shrink-0" />
          <span className="truncate">{titulo}</span>
        </span>
        <span className="shrink-0 text-lg font-bold text-white">{total}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 border-t border-white/10 pt-2 text-xs">
        {[izquierda, derecha].map((c) => (
          <p
            key={c.label}
            className="flex min-w-0 flex-wrap items-baseline gap-x-1.5"
          >
            <span className="text-white/50">{c.label}</span>
            <span className={`font-semibold ${c.className}`}>{c.valor}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
