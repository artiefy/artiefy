import { formatScoreNumber } from '~/utils/formatScore';

import type { Question, SavedAnswer } from '~/types';

/**
 * Server-side quiz grading.
 *
 * Security best practice: the browser never decides whether an answer is
 * correct. It only sends the option id / typed text the student chose, and the
 * score is computed here against the answer key stored in Redis. Any
 * `isCorrect` or `pesoPregunta` sent by the client is ignored.
 *
 * This module is pure (no Redis, no DB) so it can be reused by every caller
 * and checked in isolation.
 */

/** Minimum score (0-5 scale) that passes an activity. */
export const PASSING_SCORE = 3;

// Typed answers are stored in Redis with the attempt; cap them so a single
// request cannot store an arbitrarily large payload.
const MAX_ANSWER_LENGTH = 1000;

// Every question counts the same. This is what students were graded with
// before grading moved to the server: the client never sent `pesoPregunta`, so
// the old `answer.pesoPregunta ?? 1` always resolved to 1. Using the stored
// educator weights here would silently change existing grades (and pass/fail
// outcomes), which is a product decision, not part of this fix.
const QUESTION_WEIGHT = 1;

export interface GradedSubmission {
  /** Graded answers keyed by question id (only questions the student answered). */
  answers: Record<string, SavedAnswer>;
  /** Score on the 0-5 scale, rounded with `formatScoreNumber`. */
  score: number;
  passed: boolean;
  /** Number of distinct questions in the bank that were graded. */
  totalQuestions: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Reads the student's raw choice for one question. Only `answer` is read from
 * the client payload.
 */
function readSubmittedAnswer(value: unknown): string | null {
  if (!isRecord(value) || typeof value.answer !== 'string') return null;
  return value.answer.slice(0, MAX_ANSWER_LENGTH);
}

/**
 * Same rule the lesson modal used client-side: exact option id for VOF/OM,
 * case-insensitive trimmed text for COMPLETAR.
 */
export function isAnswerCorrect(question: Question, answer: string): boolean {
  switch (question.type) {
    case 'VOF':
    case 'OM':
      return answer === question.correctOptionId;
    case 'COMPLETAR':
      return (
        answer.toLowerCase().trim() ===
        question.correctAnswer?.toLowerCase().trim()
      );
    default:
      return false;
  }
}

/** Raw answer key of a question (option id, or the expected text). */
function getAnswerKey(question: Question): string | undefined {
  return question.type === 'COMPLETAR'
    ? question.correctAnswer
    : question.correctOptionId;
}

/**
 * Grades a submission against the stored question bank.
 *
 * - Every distinct question of the bank counts; an unanswered question is
 *   wrong (the client cannot raise its score by omitting questions).
 * - Answers for question ids that are not in the bank are dropped.
 * - The answer key of a wrong answer is attached (`correctAnswer`) only when
 *   the attempt passes, which is the only case where the modal shows
 *   "Respuesta correcta".
 */
export function gradeSubmission(
  questions: readonly Question[],
  submitted: unknown
): GradedSubmission {
  const submittedById = isRecord(submitted) ? submitted : {};
  const answers: Record<string, SavedAnswer> = {};
  const keysById = new Map<string, string | undefined>();
  let totalWeight = 0;
  let weightedSum = 0;

  for (const question of questions) {
    if (!question?.id || keysById.has(question.id)) continue;
    keysById.set(question.id, getAnswerKey(question));

    totalWeight += QUESTION_WEIGHT;

    const answer = readSubmittedAnswer(submittedById[question.id]);
    if (answer === null) continue;

    const isCorrect = isAnswerCorrect(question, answer);
    if (isCorrect) weightedSum += QUESTION_WEIGHT;

    answers[question.id] = {
      questionId: question.id,
      answer,
      isCorrect,
      pesoPregunta: QUESTION_WEIGHT,
    };
  }

  const score =
    totalWeight > 0 ? formatScoreNumber((weightedSum / totalWeight) * 5) : 0;
  const passed = score >= PASSING_SCORE;

  if (passed) {
    for (const graded of Object.values(answers)) {
      const key = keysById.get(graded.questionId);
      if (!graded.isCorrect && key !== undefined) {
        graded.correctAnswer = key;
      }
    }
  }

  return { answers, score, passed, totalQuestions: totalWeight };
}

/**
 * Copy of a question that is safe to send to the browser before the student
 * submits: answer keys (`correctOptionId`, `correctAnswer`, VOF `correct`,
 * stored `answer`) are dropped by whitelisting the fields the modal renders.
 */
export function toPublicQuestion(question: Question): Question {
  const publicQuestion: Question = {
    id: question.id,
    text: question.text,
    type: question.type,
    pesoPregunta: question.pesoPregunta,
  };

  if (Array.isArray(question.options)) {
    publicQuestion.options = question.options.map((option) => ({
      id: option.id,
      text: option.text,
    }));
  }

  return publicQuestion;
}
