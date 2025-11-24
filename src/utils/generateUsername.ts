// Helper para generar un username aleatorio y legible
export function generateUsername() {
  // Preferir UUID cuando esté disponible
  try {
    const maybeCrypto = (
      globalThis as unknown as { crypto?: { randomUUID?: () => string } }
    ).crypto;
    if (maybeCrypto && typeof maybeCrypto.randomUUID === 'function') {
      const uuid = maybeCrypto.randomUUID();
      return String(uuid).split('-')[0];
    }
  } catch {
    // fallthrough
  }

  // Fallback: usar timestamp + random base36
  const timePart = Date.now().toString(36);
  const randPart = Math.random().toString(36).substring(2, 9);
  return `${timePart}${randPart}`;
}

export default generateUsername;
