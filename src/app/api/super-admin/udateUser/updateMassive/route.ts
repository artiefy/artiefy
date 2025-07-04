import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '~/server/db';
import {
  users,
  userCustomFields,
  enrollmentPrograms,
  enrollments,
} from '~/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';

const updateSchema = z.object({
  userIds: z.array(z.string()),
  fields: z.record(z.any()),
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

      // Desestructuramos
      let {
        name,
        firstName,
        lastName,
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

      console.log('📝 Datos recibidos para este usuario:', {
        name,
        firstName,
        lastName,
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
        customFields,
      });

      // Si solo mandaron `name`, divídelo en firstName + lastName
      if (!firstName && !lastName && name) {
        const split = name.trim().split(' ');
        firstName = split[0];
        lastName = split.slice(1).join(' ') || '';
        console.log(
          `✂️ Dividido name -> firstName: "${firstName}", lastName: "${lastName}"`
        );
      }

      const client = await clerkClient();
      let userExistsInClerk = true;
      let existingMetadata = {};

      try {
        const clerkUser = await client.users.getUser(userId);
        existingMetadata = clerkUser.publicMetadata || {};
      } catch (err: any) {
        if (err?.errors?.[0]?.code === 'not_found' || err?.status === 404) {
          userExistsInClerk = false;
        } else {
          console.error('❌ Clerk err:', err);
          return NextResponse.json(
            { error: 'Error con Clerk' },
            { status: 500 }
          );
        }
      }

      let normalizedStatus =
        status?.toLowerCase() === 'activo'
          ? 'active'
          : (status?.toLowerCase() ?? 'active');

      if (subscriptionEndDate && normalizedStatus === 'inactive') {
        normalizedStatus = 'active';
      }

      const formattedEndDate = subscriptionEndDate
        ? new Date(subscriptionEndDate).toISOString().split('T')[0]
        : null;

      const newMetadata = {
        ...existingMetadata,
        role: role || 'estudiante',
        planType: planType ?? 'none',
        subscriptionStatus: normalizedStatus,
        subscriptionEndDate: formattedEndDate,
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

      // Preparamos SET dinámico
      const validPlanTypes = ['none', 'Pro', 'Premium', 'Enterprise'];
      const resolvedPlanType = planType
        ? validPlanTypes.includes(planType)
          ? planType
          : 'Premium'
        : 'Premium';

      const userUpdateFields: Record<string, any> = { updatedAt: new Date() };

      if (name) {
        userUpdateFields.name = name;
      } else if (firstName || lastName) {
        userUpdateFields.name = `${firstName ?? ''} ${lastName ?? ''}`.trim();
      }

      if (role !== undefined) userUpdateFields.role = role;
      if (status !== undefined) userUpdateFields.subscriptionStatus = status;
      if (planType !== undefined) userUpdateFields.planType = resolvedPlanType;
      if (phone !== undefined) userUpdateFields.phone = phone;
      if (address !== undefined) userUpdateFields.address = address;
      if (city !== undefined) userUpdateFields.city = city;
      if (country !== undefined) userUpdateFields.country = country;
      if (birthDate !== undefined)
        userUpdateFields.birthDate = new Date(birthDate);
      if (purchaseDate !== undefined)
        userUpdateFields.purchaseDate = new Date(purchaseDate);
      if (subscriptionEndDate !== undefined)
        userUpdateFields.subscriptionEndDate = new Date(subscriptionEndDate);

      console.log(`🚀 Campos SET para UPDATE en DB:`, userUpdateFields);

      await db.update(users).set(userUpdateFields).where(eq(users.id, userId));
      console.log(`✅ DB users actualizado para ${userId}`);

      for (const [key, value] of Object.entries(customFields)) {
        console.log(`💾 Guardando custom field: ${key} = ${value}`);
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
        console.log(`🎓 Matriculando en programa ID: ${programId}`);
        await db.insert(enrollmentPrograms).values({
          userId,
          programaId: programId,
          enrolledAt: new Date(),
          completed: false,
        });
      }

      if (courseId != null) {
        console.log(`📚 Matriculando en curso ID: ${courseId}`);
        const exists = await db
          .select()
          .from(enrollments)
          .where(
            and(
              eq(enrollments.userId, userId),
              eq(enrollments.courseId, courseId)
            )
          )
          .limit(1);

        if (exists.length === 0) {
          console.log(`➕ Inscribiendo en nuevo curso`);
          await db.insert(enrollments).values({
            userId,
            courseId,
            enrolledAt: new Date(),
            completed: false,
          });
        }

        console.log(`🔄 Actualizando Clerk metadata por inscripción en curso`);
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            planType: 'Premium',
            subscriptionStatus: 'active',
            subscriptionEndDate: formattedEndDate,
          },
        });

        await db
          .update(users)
          .set({
            planType: 'Premium',
            subscriptionStatus: 'active',
            subscriptionEndDate: subscriptionEndDate
              ? new Date(subscriptionEndDate)
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
