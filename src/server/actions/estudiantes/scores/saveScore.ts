"use server";

import { db } from "~/server/db";
import { scores } from "~/server/db/schema";

// Guardar puntaje del usuario
export async function saveScore(
  userId: string,
  categoryId: number,
  score: number,
): Promise<void> {
  await db.insert(scores).values({
    userId,
    categoryid: categoryId,
    score,
  });
}
