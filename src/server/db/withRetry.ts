/**
 * Retry helper for transient Neon `neon-http` failures.
 *
 * The serverless HTTP driver fires one independent `fetch` per query. When the
 * Neon compute is autosuspended (scale-to-zero), the cold-start wake-up can make
 * the first concurrent queries fail with a generic "Failed query" before the
 * compute is ready. These reads are idempotent, so retrying with a short
 * exponential backoff masks the cold-start without changing behavior.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  {
    retries = 2,
    baseDelayMs = 250,
  }: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      const delay = baseDelayMs * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
