import { NextResponse } from 'next/server';

import { z } from 'zod';
import { db } from '~/server/db';
import { users, userCustomFields } from '~/server/db/schema';
import { eq } from 'drizzle-orm';

import { updateMultipleUsers } from '~/server/queries/queriesSuperAdmin';

const updateSchema = z.object({
  userIds: z.array(z.string()),
  subscriptionEndDate: z.string().nullable().optional(),
  planType: z.enum(['none', 'Pro', 'Premium', 'Enterprise']).optional(),
  status: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userIds, fields } = body;

    if (!Array.isArray(userIds) || typeof fields !== 'object') {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    for (const userId of userIds) {
      const updateFields: Record<string, any> = {};
      const customFields: Record<string, string> = {};

      for (const [key, value] of Object.entries(fields)) {
        if (key.startsWith('customFields.')) {
          customFields[key.split('.')[1]] = String(value);
        } else {
          updateFields[key] = value;
        }
      }

      if (Object.keys(updateFields).length > 0) {
        await db.update(users).set(updateFields).where(eq(users.id, userId));
      }

      for (const [fieldKey, fieldValue] of Object.entries(customFields)) {
        await db
          .insert(userCustomFields)
          .values({
            userId,
            fieldKey,
            fieldValue,
          })
          .onConflictDoUpdate({
            target: [userCustomFields.userId, userCustomFields.fieldKey],
            set: { fieldValue },
          });
      }
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
