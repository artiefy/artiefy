import { eq } from "drizzle-orm";
import { db } from "~/server/db/index";
import { users, courses } from "~/server/db/schema";
import { type User } from "~/types";

export async function getUserById(id: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getAllUsers(): Promise<User[]> {
  return db.select().from(users);
}

export async function createUser(
  user: Omit<User, "createdAt" | "updatedAt">,
): Promise<void> {
  await db.insert(users).values(user);
}

export async function deleteUserById(id: string): Promise<void> {
  await db.transaction(async (trx) => {
    await trx.delete(courses).where(eq(courses.creatorId, id));
    await trx.delete(users).where(eq(users.id, id));
  });
}
