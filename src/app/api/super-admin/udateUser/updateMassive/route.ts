import { NextResponse } from 'next/server';

import { clerkClient } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import {
  enrollmentPrograms,
  enrollments,
  userCustomFields,
  users,
} from '~/server/db/schema';

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

    for (const userId of userIds) {
      console.log(`\n🔄 Procesando usuario: ${userId}`);

      // Desestructuramos y usamos const para que no dé prefer-const
      const {
        name,
        role,
        status,
        permissions,
        phone,
        address,
        city,
        country,
        birthDate,
        planType,
        purchaseDate,
        subscriptionEndDate,
        programId,
        courseId,
        ...customFields
      } = fields;

      let firstName: string | undefined;
      let lastName: string | undefined;

      // Si hay solo name, dividirlo
      if (typeof name === 'string' && name.trim() !== '') {
        const split = name.trim().split(' ');
        firstName = split[0];
        lastName = split.slice(1).join(' ') || '';
        console.log(
          `✂️ Dividido name -> firstName: "${firstName}", lastName: "${lastName}"`
        );
      }

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

      const endDateIso = subscriptionEndDate
        ? new Date(subscriptionEndDate as string).toISOString().split('T')[0]
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
        console.log(`🛠 Actualizando Clerk user ${userId} con`, {
          firstName,
          lastName,
          publicMetadata: newMetadata,
        });
        await client.users.updateUser(userId, {
          firstName,
          lastName,
          publicMetadata: newMetadata,
        });
      }

      // SET dinámico para DB
      const validPlanTypes = ['none', 'Pro', 'Premium', 'Enterprise'];
      const resolvedPlanType =
        typeof planType === 'string' && validPlanTypes.includes(planType)
          ? planType
          : 'Premium';

      const userUpdateFields: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (typeof name === 'string') {
        userUpdateFields.name = name;
      } else if (firstName || lastName) {
        userUpdateFields.name = `${firstName ?? ''} ${lastName ?? ''}`.trim();
      }

      if (typeof role === 'string') userUpdateFields.role = role;
      if (typeof status === 'string')
        userUpdateFields.subscriptionStatus = status;
      if (planType !== undefined) userUpdateFields.planType = resolvedPlanType;
      if (typeof phone === 'string') userUpdateFields.phone = phone;
      if (typeof address === 'string') userUpdateFields.address = address;
      if (typeof city === 'string') userUpdateFields.city = city;
      if (typeof country === 'string') userUpdateFields.country = country;
      if (birthDate !== undefined)
        userUpdateFields.birthDate = new Date(birthDate as string);
      if (purchaseDate !== undefined)
        userUpdateFields.purchaseDate = new Date(purchaseDate as string);
      if (subscriptionEndDate !== undefined)
        userUpdateFields.subscriptionEndDate = new Date(
          subscriptionEndDate as string
        );

      console.log(`🚀 Campos SET para UPDATE en DB:`, userUpdateFields);

      await db.update(users).set(userUpdateFields).where(eq(users.id, userId));
      console.log(`✅ DB users actualizado para ${userId}`);

      // Custom fields
      for (const [key, value] of Object.entries(customFields)) {
        await db
          .insert(userCustomFields)
          .values({
            userId,
            fieldKey: key,
            fieldValue: String(value),
          })
          .onConflictDoUpdate({
            target: [userCustomFields.userId, userCustomFields.fieldKey],
            set: { fieldValue: String(value), updatedAt: new Date() },
          });
      }

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
          console.log(`➕ Inscribiendo en nuevo curso`);
          await db.insert(enrollments).values({
            userId,
            courseId: courseId as number,
            enrolledAt: new Date(),
            completed: false,
          });
        }

        console.log(`🔄 Actualizando Clerk metadata por inscripción en curso`);
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
            subscriptionEndDate: subscriptionEndDate
              ? new Date(subscriptionEndDate as string)
              : null,
          })
          .where(eq(users.id, userId));
      }

      console.log(`✅ Usuario ${userId} actualizado completamente`);
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