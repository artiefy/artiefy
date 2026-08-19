import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses, guidedProjects } from '~/server/db/schema';

/** Both catalogs share the Top/Featured screen, so responses carry the kind. */
type ItemKind = 'course' | 'guidedProject';

interface TopFeatureItem {
  id: number;
  title: string;
  type: ItemKind;
  is_top: boolean;
  is_featured: boolean;
}

async function requireSuperAdmin() {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata.role;

  if (!userId || (role !== 'admin' && role !== 'super-admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  return null;
}

export async function GET() {
  const unauthorized = await requireSuperAdmin();
  if (unauthorized) return unauthorized;

  try {
    const [courseRows, projectRows] = await Promise.all([
      db
        .select({
          id: courses.id,
          title: courses.title,
          is_top: courses.is_top,
          is_featured: courses.is_featured,
        })
        .from(courses),
      db
        .select({
          id: guidedProjects.id,
          title: guidedProjects.title,
          is_top: guidedProjects.isTop,
          is_featured: guidedProjects.isFeatured,
        })
        .from(guidedProjects),
    ]);

    const items: TopFeatureItem[] = [
      ...courseRows.map((row) => ({
        id: row.id,
        title: row.title,
        type: 'course' as const,
        is_top: row.is_top ?? false,
        is_featured: row.is_featured ?? false,
      })),
      ...projectRows.map((row) => ({
        id: row.id,
        title: row.title,
        type: 'guidedProject' as const,
        is_top: row.is_top ?? false,
        is_featured: row.is_featured ?? false,
      })),
    ];

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error en GET /topFeature:', error);
    return NextResponse.json(
      { error: 'Error al obtener los cursos y proyectos' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const unauthorized = await requireSuperAdmin();
  if (unauthorized) return unauthorized;

  try {
    const {
      id,
      type = 'course',
      field,
      value,
    }: {
      id: number;
      type?: ItemKind;
      field: 'is_top' | 'is_featured';
      value: boolean;
    } = await req.json();

    if (
      !id ||
      (field !== 'is_top' && field !== 'is_featured') ||
      (type !== 'course' && type !== 'guidedProject') ||
      typeof value !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    if (type === 'guidedProject') {
      // The guided projects table uses camelCase columns for the same flags.
      const column = field === 'is_top' ? 'isTop' : 'isFeatured';
      await db
        .update(guidedProjects)
        .set({ [column]: value })
        .where(eq(guidedProjects.id, id));
    } else {
      await db
        .update(courses)
        .set({ [field]: value })
        .where(eq(courses.id, id));
    }

    // The student catalog caches this list for 60s. Mark it stale now so the
    // next visit re-reads the flags instead of waiting out the window.
    // `updateTag` would expire it immediately but is Server-Action-only, so a
    // route handler gets stale-while-revalidate via the `max` profile.
    revalidateTag('learning-items', 'max');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error en POST /topFeature:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el elemento' },
      { status: 500 }
    );
  }
}
