import { NextResponse } from 'next/server';

import { z } from 'zod';

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
    const parsed = updateSchema.parse(body);
    const status = parsed.status ?? 'activo';
    const permissions = parsed.permissions ?? [];

    const result = await updateMultipleUsers({
      userIds: parsed.userIds,
      status,
      permissions,
      subscriptionEndDate: parsed.subscriptionEndDate,
      planType: parsed.planType,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('❌ Error en updateMassive:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
