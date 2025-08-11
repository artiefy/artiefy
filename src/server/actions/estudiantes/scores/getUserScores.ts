"use server";

import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { scores } from "~/server/db/schema";

import type { Score } from "~/types";

// Obtener puntajes del usuario
export async function getUserScores(userId: string): Promise<Score[]> {
  return db.query.scores.findMany({
    where: eq(scores.userId, userId),
    with: {
      category: true,
    },
  });
}
