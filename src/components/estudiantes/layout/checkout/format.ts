/** Colombian peso formatting shared by every checkout step. */
const COP_FORMATTER = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});

export function formatCop(amount: number): string {
  return COP_FORMATTER.format(Math.round(amount));
}
