'use server';

import { revalidatePath } from 'next/cache';

import { auth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';

export interface MyProfile {
  id: string;
  name: string | null;
  email: string | null;
  imageUrl: string | null;
  username: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  createdAt: Date | null;
}

/** Reads the current user's profile, merging Clerk identity with DB fields. */
export async function getMyProfile(): Promise<MyProfile | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  const rows = await db
    .select({
      name: users.name,
      email: users.email,
      username: users.username,
      bio: users.bio,
      website: users.website,
      location: users.location,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const row = rows[0];

  return {
    id: userId,
    name: row?.name ?? clerkUser?.fullName ?? null,
    email: row?.email ?? clerkUser?.primaryEmailAddress?.emailAddress ?? null,
    imageUrl: clerkUser?.imageUrl ?? null,
    username: row?.username ?? null,
    bio: row?.bio ?? null,
    website: row?.website ?? null,
    location: row?.location ?? null,
    createdAt: row?.createdAt ?? null,
  };
}

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const profileSchema = z.object({
  username: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .min(3, 'Mínimo 3 caracteres')
      .max(30, 'Máximo 30 caracteres')
      .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guion bajo')
      .optional()
  ),
  bio: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(280, 'Máximo 280 caracteres').optional()
  ),
  website: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(200, 'Máximo 200 caracteres').optional()
  ),
  location: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(80, 'Máximo 80 caracteres').optional()
  ),
});

export type UpdateProfileInput = z.infer<typeof profileSchema>;

export interface UpdateProfileResult {
  success: boolean;
  error?: string;
}

/** Updates the editable profile fields for the current user. */
export async function updateMyProfile(
  input: UpdateProfileInput
): Promise<UpdateProfileResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: 'No autenticado' };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Datos inválidos';
    return { success: false, error: first };
  }

  const { username, bio, website, location } = parsed.data;
  const toNull = (value?: string) => value ?? null;

  try {
    await db
      .update(users)
      .set({
        username: toNull(username),
        bio: toNull(bio),
        website: toNull(website),
        location: toNull(location),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/unique|users_username_unique/i.test(message)) {
      return {
        success: false,
        error: 'Ese nombre de usuario ya está en uso.',
      };
    }
    console.error('Error actualizando perfil:', error);
    return { success: false, error: 'No se pudo guardar el perfil.' };
  }

  revalidatePath('/estudiantes/perfil');
  return { success: true };
}
