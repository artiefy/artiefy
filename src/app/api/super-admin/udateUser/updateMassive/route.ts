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
    console.log(
      '═══════════════════════════════════════════════════════════════'
    );
    console.log('✅ INICIANDO ACTUALIZACIÓN MASIVA');
    console.log(
      '═══════════════════════════════════════════════════════════════'
    );
    console.log('👥 Usuarios a actualizar:', userIds);
    console.log('📝 Campos a actualizar:', JSON.stringify(fields, null, 2));

    // ✅ Convertir courseId a número si viene
    let parsedCourseId: number | null = null;
    if (fields.courseId !== undefined && fields.courseId !== null) {
      parsedCourseId = Number(fields.courseId);
      if (isNaN(parsedCourseId)) {
        console.warn(`⚠️ courseId inválido: ${fields.courseId}`);
        parsedCourseId = null;
      } else {
        console.log(`📚 Matriculando en CURSO: ${parsedCourseId}`);
      }
    }

    // ✅ Convertir programId a número si viene
    let parsedProgramId: number | null = null;
    if (fields.programId !== undefined && fields.programId !== null) {
      parsedProgramId = Number(fields.programId);
      if (isNaN(parsedProgramId)) {
        console.warn(`⚠️ programId inválido: ${fields.programId}`);
        parsedProgramId = null;
      } else {
        console.log(`🎓 Matriculando en PROGRAMA: ${parsedProgramId}`);
      }
    }

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
      console.log('\n');
      console.log(
        '───────────────────────────────────────────────────────────────'
      );
      console.log(`🔄 PROCESANDO USUARIO #${userId}`);
      console.log(
        '───────────────────────────────────────────────────────────────'
      );

      // Extraemos campos de Clerk / negocio
      const {
        name,
        role,
        status,
        permissions,
        planType,
        subscriptionEndDate,
        enrollmentStatus,
      } = fields as Record<string, unknown>;

      console.log('📋 Campos enviados:');
      console.log(`  • enrollmentStatus: ${enrollmentStatus}`);
      console.log(`  • status: ${status}`);
      console.log(`  • name: ${name}`);
      console.log(`  • role: ${role}`);
      console.log(`  • planType: ${planType}`);
      console.log(`  • courseId: ${parsedCourseId}`);
      console.log(`  • programId: ${parsedProgramId}`);

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
        if (RESERVED_KEYS.has(key)) continue; // programId, courseId, status, etc. ya tratados
        // ✅ enrollmentStatus va DIRECTO a la BD (sin mapeo)
        if (key === 'enrollmentStatus' && typeof value === 'string') {
          userUpdateFields.enrollmentStatus = value;
          console.log(`📝 Actualizando enrollmentStatus: ${value}`);
          continue;
        }
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

      console.log('💾 Guardando en BD...');
      await db.update(users).set(userUpdateFields).where(eq(users.id, userId));
      console.log(`✅ Usuario ${userId} actualizado en BD`);
      console.log(
        `   ├─ enrollmentStatus: ${userUpdateFields.enrollmentStatus ?? '(no cambiado)'}`
      );
      console.log(
        `   ├─ subscriptionStatus: ${userUpdateFields.subscriptionStatus ?? '(no cambiado)'}`
      );
      console.log(
        `   ├─ planType: ${userUpdateFields.planType ?? '(no cambiado)'}`
      );
      console.log(`   └─ nombre: ${userUpdateFields.name ?? '(no cambiado)'}`);

      // === Matriculación opcional ===
      console.log('\n🎓 PROCESANDO MATRICULACIÓN:');

      if (parsedProgramId !== null) {
        console.log(`  ➕ Matriculando en PROGRAMA ${parsedProgramId}...`);
        await db.insert(enrollmentPrograms).values({
          userId,
          programaId: parsedProgramId,
          enrolledAt: new Date(),
          completed: false,
        });
        console.log(`  ✅ Usuario matriculado en programa ${parsedProgramId}`);
      } else {
        console.log(`  ⏭️  Sin programa para matricular`);
      }

      if (parsedCourseId !== null) {
        console.log(`  ➕ Matriculando en CURSO ${parsedCourseId}...`);
        const exists = await db
          .select()
          .from(enrollments)
          .where(
            and(
              eq(enrollments.userId, userId),
              eq(enrollments.courseId, parsedCourseId)
            )
          )
          .limit(1);

        if (exists.length === 0) {
          console.log(`    📝 Creando nueva inscripción en curso...`);
          await db.insert(enrollments).values({
            userId,
            courseId: parsedCourseId,
            enrolledAt: new Date(),
            completed: false,
          });
          console.log(`    ✅ Usuario inscrito en curso ${parsedCourseId}`);
        } else {
          console.log(
            `    ℹ️  Usuario ya estaba inscrito en curso ${parsedCourseId}`
          );
        }

        // ✅ Solo actualizar Clerk si el usuario existe en Clerk
        if (userExistsInClerk) {
          console.log(`    🌐 Actualizando metadata en Clerk...`);
          await client.users.updateUserMetadata(userId, {
            publicMetadata: {
              planType: 'Premium',
              subscriptionStatus: 'active',
              subscriptionEndDate: endDateIso,
            },
          });
          console.log(`    ✅ Metadata actualizada en Clerk`);
        } else {
          console.log(
            `    ⚠️  Usuario NO existe en Clerk (omitiendo actualización)`
          );
        }

        // 🔹 Siempre actualizar DB (independiente de Clerk)
        console.log(`    💾 Actualizando planType/subscriptionStatus en BD...`);
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
        console.log(`    ✅ Plan y estado actualizado en BD`);
      } else {
        console.log(`  ⏭️  Sin curso para matricular`);
      }

      console.log('\n✅ USUARIO FINALIZADO');
      console.log(
        '═══════════════════════════════════════════════════════════════'
      );
    }

    console.log('\n');
    console.log(
      '═══════════════════════════════════════════════════════════════'
    );
    console.log('🎉 ¡ACTUALIZACIÓN MASIVA COMPLETADA EXITOSAMENTE!');
    console.log(`   Total usuarios actualizados: ${userIds.length}`);
    console.log(
      '═══════════════════════════════════════════════════════════════'
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('\n');
    console.error(
      '═══════════════════════════════════════════════════════════════'
    );
    console.error('❌ ERROR EN ACTUALIZACIÓN MASIVA');
    console.error(
      '═══════════════════════════════════════════════════════════════'
    );
    console.error('Error:', err);
    console.error(
      '═══════════════════════════════════════════════════════════════'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
