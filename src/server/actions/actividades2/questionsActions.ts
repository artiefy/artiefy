'use server';

import { Redis } from '@upstash/redis';

import type { Question, VerdaderoOFlaso } from '~/types/typesActi';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function saveQuestionToUpstash(
  activityId: string,
  question: Question
) {
  try {
    const key = `activity:${activityId}:questions`;
    const existingQuestions = (await redis.get<Question[]>(key)) ?? [];
    const updatedQuestions = [...existingQuestions, question];
    await redis.set(key, updatedQuestions);
    return { success: true, message: 'Pregunta guardada correctamente' };
  } catch (error) {
    console.error('Error al guardar la pregunta:', error);
    return { success: false, message: 'Error al guardar la pregunta' };
  }
}

export async function getQuestionsFromUpstash(activityId: string) {
  try {
    const key = `activity:${activityId}:questions`;
    const questions = (await redis.get<Question[]>(key)) ?? [];
    return { success: true, questions };
  } catch (error) {
    console.error('Error al obtener las preguntas:', error);
    return { success: false, message: 'Error al obtener las preguntas' };
  }
}

export async function deleteQuestionFromUpstash(
  activityId: string,
  questionId: string
) {
  try {
    const key = `activity:${activityId}:questions`;
    const existingQuestions = (await redis.get<Question[]>(key)) ?? [];
    const updatedQuestions = existingQuestions.filter(
      (q) => q.id !== questionId
    );
    await redis.set(key, updatedQuestions);
    return { success: true, message: 'Pregunta eliminada correctamente' };
  } catch (error) {
    console.error('Error al eliminar la pregunta:', error);
    return { success: false, message: 'Error al eliminar la pregunta' };
  }
}

export async function saveQuestionToUpstashVOF(
  activityId: string,
  pregunta: VerdaderoOFlaso
) {
  try {
    const key = `activity:${activityId}:questionsVOF`;
    const existingQuestions = (await redis.get<VerdaderoOFlaso[]>(key)) ?? [];
    const updatedQuestions = [...existingQuestions, pregunta];
    await redis.set(key, updatedQuestions);
    return {
      success: true,
      message: 'Pregunta de verdadero o falso guardada correctamente',
    };
  } catch (error) {
    console.error('Error al guardar la pregunta:', error);
    return { success: false, message: 'Error al guardar la pregunta' };
  }
}

export async function getQuestionsFromUpstashVOF(activityId: string) {
  try {
    const key = `activity:${activityId}:questionsVOF`;
    const questions = (await redis.get<VerdaderoOFlaso[]>(key)) ?? [];
    return { success: true, questions };
  } catch (error) {
    console.error(
      'Error al obtener las preguntas de verdadero o falso:',
      error
    );
    return {
      success: false,
      message: 'Error al obtener las preguntas de verdadero o falso',
    };
  }
}

export async function deleteQuestionFromUpstashVOF(
  activityId: string,
  questionVOFId: string
) {
  try {
    const key = `activity:${activityId}:questionsVOF`;
    const existingQuestions = (await redis.get<VerdaderoOFlaso[]>(key)) ?? [];
    const updatedQuestions = existingQuestions.filter(
      (q) => q.id !== questionVOFId
    );
    await redis.set(key, updatedQuestions);
    return {
      success: true,
      message: 'Pregunta eliminada correctamente de verdadero o falso',
    };
  } catch (error) {
    console.error('Error al eliminar la pregunta:', error);
    return { success: false, message: 'Error al eliminar la pregunta' };
  }
}
