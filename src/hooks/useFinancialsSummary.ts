import { useEffect, useState } from 'react';

interface FinancialSummary {
  totalRecaudado: number;
  totalTransacciones: number;
  loading: boolean;
  error: string | null;
}

interface TransactionItem {
  valor: number;
}

export function useFinancialsSummary(): FinancialSummary {
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRecaudado: 0,
    totalTransacciones: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(
          '/api/transaction-history?page=1&pageSize=1000&verified=true'
        );

        if (!response.ok) {
          throw new Error('Error al cargar resumen de finanzas');
        }

        const data = await response.json();

        if (data.ok && data.data?.items) {
          const totalRecaudado = data.data.items.reduce(
            (sum: number, item: TransactionItem) => sum + (item.valor || 0),
            0
          );

          setSummary({
            totalRecaudado,
            totalTransacciones: data.data.items.length,
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
  }, []);

  return summary;
}
