import { NextResponse } from 'next/server';

import { clerkClient } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { enrollmentPrograms, enrollments, users } from '~/server/db/schema';

const updateSchema = z.object({
  userIds: z.array(z.string()),
  fields: z.record(z.string(), z.unknown()),
});

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      console.error('❌ Error validación:', parsed.error.format());
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    const { userIds, fields } = parsed.data;
    console.log('✅ Payload recibido del FRONTEND:');
    console.log('➡️ userIds:', userIds);
    console.log('➡️ fields:', fields);

    // Claves reservadas que NO se mandan tal cual a DB (las procesamos con lógica específica)
    const RESERVED_KEYS = new Set([
      'programId',
      'courseId',
      'name',
      'permissions',
      'status', // la mapeamos a subscriptionStatus
    ]);

    // Columnas fecha conocidas (conversión a Date)
    const DATE_KEYS = new Set([
      'birthDate',
      'purchaseDate',
      'subscriptionEndDate',
      'fechaInicio',
      'createdAt',
      'updatedAt',
    ]);

    for (const userId of userIds) {
      console.log(`\n🔄 Procesando usuario: ${userId}`);

      // Extraemos campos de Clerk / negocio
      const {
        name,
        role,
        status,
        permissions,
        planType,
        subscriptionEndDate,
        programId,
        courseId,
      } = fields as Record<string, unknown>;

      // Derivar firstName / lastName si viene name
      let firstName: string | undefined;
      let lastName: string | undefined;
      if (typeof name === 'string' && name.trim() !== '') {
        const parts = name.trim().split(/\s+/);
        firstName = parts[0];
        lastName = parts.slice(1).join(' ') || '';
        console.log(
          `✂️ name -> firstName="${firstName}", lastName="${lastName}"`
        );
      }

      // === Clerk ===
      const client = await clerkClient();
      let userExistsInClerk = true;
      let existingMetadata: Record<string, unknown> = {};

      try {
        const clerkUser = await client.users.getUser(userId);
        existingMetadata = clerkUser.publicMetadata ?? {};
      } catch (err) {
        const e = err as { errors?: { code: string }[]; status?: number };
        if (e?.errors?.[0]?.code === 'not_found' || e?.status === 404) {
          userExistsInClerk = false;
        } else {
          console.error('❌ Clerk err:', err);
          return NextResponse.json(
            { error: 'Error con Clerk' },
            { status: 500 }
          );
        }
      }

      const normalizedStatus =
        typeof status === 'string' && status.toLowerCase() === 'activo'
          ? 'active'
          : typeof status === 'string'
            ? status.toLowerCase()
            : 'active';

      const endDateIso =
        typeof subscriptionEndDate === 'string' && subscriptionEndDate
          ? new Date(subscriptionEndDate).toISOString().split('T')[0]
          : null;

      const newMetadata = {
        ...existingMetadata,
        role: typeof role === 'string' ? role : 'estudiante',
        planType: typeof planType === 'string' ? planType : 'none',
        subscriptionStatus: normalizedStatus,
        subscriptionEndDate: endDateIso,
        permissions: Array.isArray(permissions) ? permissions : [],
        fullName: `${firstName ?? ''} ${lastName ?? ''}`.trim(),
      };

      if (userExistsInClerk) {
        console.log(`🛠 Actualizando Clerk user ${userId}...`);
        await client.users.updateUser(userId, {
          firstName,
          lastName,
          publicMetadata: newMetadata,
        });
      }

      // === DB: UPDATE DINÁMICO SOLO EN `users` ===
      const validPlanTypes = ['none', 'Pro', 'Premium', 'Enterprise'];
      const resolvedPlanType =
        typeof planType === 'string' && validPlanTypes.includes(planType)
          ? planType
          : planType === undefined
            ? undefined
            : 'Premium';

      // Construimos el SET a partir de `fields` sin listar columnas manualmente.
      const userUpdateFields: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      // name → name; si no viene, y derivamos first/last, componemos name
      if (typeof name === 'string') {
        userUpdateFields.name = name;
      } else if (firstName || lastName) {
        userUpdateFields.name = `${firstName ?? ''} ${lastName ?? ''}`.trim();
      }

      if (typeof role === 'string') userUpdateFields.role = role;
      if (typeof status === 'string')
        userUpdateFields.subscriptionStatus = status;
      if (resolvedPlanType !== undefined)
        userUpdateFields.planType = resolvedPlanType;

      for (const [key, value] of Object.entries(
        fields as Record<string, unknown>
      )) {
        if (RESERVED_KEYS.has(key)) continue; // programId, courseId, etc. ya tratados
        if (key === 'subscriptionEndDate') {
          userUpdateFields.subscriptionEndDate =
            value != null
              ? new Date(
                  value instanceof Date
                    ? value
                    : typeof value === 'string'
                      ? value
                      : JSON.stringify(value)
                )
              : null;
          continue;
        }
        if (DATE_KEYS.has(key)) {
          userUpdateFields[key] =
            value != null
              ? new Date(
                  value instanceof Date
                    ? value
                    : typeof value === 'string'
                      ? value
                      : JSON.stringify(value)
                )
              : null;
          continue;
        }
        // Caso general (cualquier columna dinámica de `users`)
        userUpdateFields[key] = value as unknown;
      }
      console.log('🚀 SET (users):', userUpdateFields);

      await db.update(users).set(userUpdateFields).where(eq(users.id, userId));
      console.log(`✅ DB users actualizado para ${userId}`);

      // === Matriculación opcional (se mantiene como estaba) ===
      if (programId != null) {
        await db.insert(enrollmentPrograms).values({
          userId,
          programaId: programId as number,
          enrolledAt: new Date(),
          completed: false,
        });
      }

      if (courseId != null) {
        const exists = await db
          .select()
          .from(enrollments)
          .where(
            and(
              eq(enrollments.userId, userId),
              eq(enrollments.courseId, courseId as number)
            )
          )
          .limit(1);

        if (exists.length === 0) {
          console.log('➕ Inscribiendo en nuevo curso');
          await db.insert(enrollments).values({
            userId,
            courseId: courseId as number,
            enrolledAt: new Date(),
            completed: false,
          });
        }

        console.log('🔄 Sync Clerk metadata por inscripción en curso');
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            planType: 'Premium',
            subscriptionStatus: 'active',
            subscriptionEndDate: endDateIso,
          },
        });

        await db
          .update(users)
          .set({
            planType: 'Premium',
            subscriptionStatus: 'active',
            subscriptionEndDate:
              typeof subscriptionEndDate === 'string'
                ? new Date(subscriptionEndDate)
                : null,
          })
          .where(eq(users.id, userId));
      }

      console.log(
        `✅ Usuario ${userId} actualizado completamente (solo users.*)`
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Error en updateMassive:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
