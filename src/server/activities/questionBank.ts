import { Redis } from '@upstash/redis';

import { env } from '~/env';

import type { Question } from '~/types';

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// Redis keys written by the educator question editors, in the order the
// lesson modal has always listed them.
const QUESTION_BANKS = [
  { suffix: 'questionsVOF', type: 'VOF' },
  { suffix: 'questionsOM', type: 'OM' },
  { suffix: 'questionsACompletar', type: 'COMPLETAR' },
  { suffix: 'questionsACompletar2', type: 'COMPLETAR' },
] as const satisfies readonly { suffix: string; type: Question['type'] }[];

const hasStringId = (value: unknown): value is { id: string } =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { id?: unknown }).id === 'string';

function parseBank(content: unknown): unknown[] {
  if (typeof content === 'string') {
    try {
      const parsed: unknown = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(content) ? content : [];
}

/**
 * Loads the full question bank of an activity, answer keys included. This is
 * server-only data: grade with it, and send the browser
 * `toPublicQuestion(...)` copies only.
 *
 * A malformed bank is treated as empty; a Redis failure is thrown so the
 * caller never grades against a partial bank.
 */
export async function loadActivityQuestionBank(
  activityId: number
): Promise<Question[]> {
  const banks = await Promise.all(
    QUESTION_BANKS.map(async ({ suffix, type }) => {
      const content = await redis.get(`activity:${activityId}:${suffix}`);
      return parseBank(content)
        .filter(hasStringId)
        .map((question) => ({ ...question, type }) as Question);
    })
  );

  return banks.flat();
}
