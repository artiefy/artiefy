import { useEffect, useState } from 'react';

interface FinancialSummary {
  totalRecaudado: number;
  totalTransacciones: number;
  loading: boolean;
  error: string | null;
}

interface SummaryResponse {
  ok: boolean;
  message?: string;
  data?: {
    totalRecaudado?: number;
    totalTransacciones?: number;
  };
}

// habilitado = false: no consulta nada (p. ej. el menú de una academia, que
// no debe pedir las finanzas de Artiefy).
export function useFinancialsSummary(habilitado = true): FinancialSummary {
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRecaudado: 0,
    totalTransacciones: 0,
    loading: habilitado,
    error: null,
  });

  useEffect(() => {
    if (!habilitado) return;
    const fetchSummary = async () => {
      try {
        // Modo agregado: el servidor devuelve SUM/COUNT en una sola fila,
        // sin traer cientos de transacciones para sumarlas en el cliente.
        const response = await fetch(
          '/api/transaction-history?summary=true&verified=true&page=1&pageSize=1'
        );

        if (!response.ok) {
          throw new Error('Error al cargar resumen de finanzas');
        }

        const data = (await response.json()) as SummaryResponse;

        if (data.ok && data.data) {
          setSummary({
            totalRecaudado: data.data.totalRecaudado ?? 0,
            totalTransacciones: data.data.totalTransacciones ?? 0,
            loading: false,
            error: null,
          });
        } else {
          setSummary((prev) => ({
            ...prev,
            loading: false,
            error: data.message || 'Error desconocido',
          }));
        }
      } catch (err) {
        setSummary((prev) => ({
          ...prev,
          loading: false,
          error:
            err instanceof Error ? err.message : 'Error al cargar finanzas',
        }));
      }
    };

    fetchSummary();
  }, [habilitado]);

  return summary;
}
