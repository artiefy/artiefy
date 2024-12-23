import { eq } from "drizzle-orm";
import { db } from "~/server/db/index";
import { users, courses } from "~/server/db/schema";
import { currentUser } from "@clerk/nextjs/server"; // Importa Clerk para acceder al usuario actual

export interface User {
  id: string;
  role: string;
  name: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getAllUsers(): Promise<User[]> {
  return db.select().from(users);
}

// Crear un nuevo usuario, llenando automáticamente nombre y correo desde Clerk
export async function createUser(id: string, role: string): Promise<void> {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("No se pudo obtener información del usuario desde Clerk.");
  }

  const name = clerkUser.fullName ?? clerkUser.firstName ?? "Usuario sin nombre";
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";

  await db.insert(users).values({
    id,
    role,
    name,
    email,
  });
}

export async function deleteUserById(id: string): Promise<void> {
  await db.transaction(async (trx) => {
    await trx.delete(courses).where(eq(courses.creatorId, id));
    await trx.delete(users).where(eq(users.id, id));
  });
}
