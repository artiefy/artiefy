'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const ANCHO = 224;
const MARGEN = 8;

/**
 * Calendario flotante (reemplaza el selector nativo, que no se puede
 * estilizar). Se abre junto a `ancla` y devuelve la fecha como "YYYY-MM-DD".
 * Se cierra con Escape o al hacer clic fuera.
 */
export function CalendarioPopover({
  ancla,
  valor,
  onElegir,
  onCerrar,
}: {
  ancla: HTMLElement;
  valor: string | null;
  onElegir: (fecha: string) => void;
  onCerrar: () => void;
}) {
  const seleccionada = valor ? parseISO(valor) : null;
  const [mes, setMes] = useState(() =>
    startOfMonth(seleccionada ?? new Date())
  );
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Ubica el panel debajo del ancla (o encima si no cabe), dentro de pantalla.
  useLayoutEffect(() => {
    const r = ancla.getBoundingClientRect();
    const alto = panelRef.current?.offsetHeight ?? 260;
    const abajo = r.bottom + MARGEN;
    const top =
      abajo + alto > window.innerHeight - MARGEN
        ? Math.max(MARGEN, r.top - alto - MARGEN)
        : abajo;
    const left = Math.min(
      Math.max(MARGEN, r.left + r.width / 2 - ANCHO / 2),
      window.innerWidth - ANCHO - MARGEN
    );
    setPos({ top, left });
  }, [ancla]);

  // Cierra con Escape o clic fuera (listeners del documento).
  useEffect(() => {
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    const alClic = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !ancla.contains(t)) onCerrar();
    };
    document.addEventListener('keydown', alTeclado);
    document.addEventListener('mousedown', alClic);
    return () => {
      document.removeEventListener('keydown', alTeclado);
      document.removeEventListener('mousedown', alClic);
    };
  }, [ancla, onCerrar]);

  const dias = eachDayOfInterval({
    start: startOfWeek(startOfMonth(mes), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(mes), { weekStartsOn: 1 }),
  });

  const elegir = (d: Date) => onElegir(format(d, 'yyyy-MM-dd'));

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Elegir fecha"
      style={{
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        width: ANCHO,
      }}
      className="fixed z-[120] rounded-xl border border-white/10 bg-[#0b1a2f]/95 p-2 text-white shadow-2xl ring-1 shadow-black/50 ring-[#22C4D3]/20 backdrop-blur-xl duration-150 animate-in fade-in zoom-in-95"
    >
      <div className="mb-1 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMes((m) => addMonths(m, -1))}
          className="flex size-6 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <span className="text-xs font-semibold capitalize">
          {format(mes, 'MMMM yyyy', { locale: es })}
        </span>
        <button
          type="button"
          onClick={() => setMes((m) => addMonths(m, 1))}
          className="flex size-6 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DIAS.map((d) => (
          <span
            key={d}
            className="py-0.5 text-[10px] font-semibold text-white/35"
          >
            {d}
          </span>
        ))}
        {dias.map((d) => {
          const elegido = seleccionada ? isSameDay(d, seleccionada) : false;
          const delMes = isSameMonth(d, mes);
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => elegir(d)}
              className={`flex aspect-square items-center justify-center rounded-full text-[11px] transition ${
                elegido
                  ? 'bg-[#22C4D3] font-semibold text-[#04101f] shadow-md shadow-[#22C4D3]/30'
                  : isToday(d)
                    ? 'font-semibold text-[#22C4D3] ring-1 ring-[#22C4D3]/50 hover:bg-[#22C4D3]/15'
                    : delMes
                      ? 'text-white/85 hover:bg-white/10'
                      : 'text-white/25 hover:bg-white/5'
              }`}
            >
              {format(d, 'd')}
            </button>
          );
        })}
      </div>

      <div className="mt-1.5 flex items-center justify-between border-t border-white/10 pt-1.5">
        <button
          type="button"
          onClick={() => elegir(new Date())}
          className="rounded-full px-2.5 py-0.5 text-[11px] font-medium text-[#22C4D3] transition hover:bg-[#22C4D3]/10"
        >
          Hoy
        </button>
        <button
          type="button"
          onClick={onCerrar}
          className="rounded-full px-2.5 py-0.5 text-[11px] text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          Cancelar
        </button>
      </div>
    </div>,
    document.body
  );
}
