import { NextResponse } from 'next/server';

import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';

// Validación de entrada
const requestBodySchema = z.object({
  userId: z.string(),
  fieldKey: z.string().min(1, 'fieldKey requerido'),
  fieldValue: z.string().default(''),
  fieldType: z
    .enum(['text', 'integer', 'boolean', 'date', 'timestamp', 'decimal'])
    .default('text'),
  fieldDescription: z.string().default(''),
});

function sanitizeColumnName(raw: string): string {
  // normaliza: trim, a minúsculas, snake_case básico
  const norm = raw.trim().toLowerCase().replace(/\s+/g, '_');
  // valida nombre de columna válido: primero letra/_ y luego letras/dígitos/_
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(norm)) {
    throw new Error(
      'Nombre de columna inválido. Use solo letras, números y guion bajo (no iniciar con número).'
    );
  }
  // Evita algunos nombres reservados comunes
  const reserved = new Set([
    'select',
    'from',
    'where',
    'table',
    'user',
    'users',
    'order',
    'group',
    'by',
    'insert',
    'update',
    'delete',
    'and',
    'or',
    'not',
    'null',
    'true',
    'false',
  ]);
  if (reserved.has(norm)) {
    throw new Error('Nombre de columna inválido (reservado).');
  }
  return norm;
}

export async function POST(req: Request) {
  try {
    const body = requestBodySchema.parse(await req.json());
    const { userId, fieldKey, fieldValue, fieldType, fieldDescription } = body;

    // 1) Validar / normalizar nombre de columna
    const column = sanitizeColumnName(fieldKey);

    // 2) Determinar tipo SQL
    let sqlType = 'TEXT';
    switch (fieldType) {
      case 'integer':
        sqlType = 'INTEGER';
        break;
      case 'boolean':
        sqlType = 'BOOLEAN';
        break;
      case 'date':
        sqlType = 'DATE';
        break;
      case 'timestamp':
        sqlType = 'TIMESTAMP';
        break;
      case 'decimal':
        sqlType = 'DECIMAL(12,2)';
        break;
      default:
        sqlType = 'TEXT';
    }

    // 3) Crear la columna si no existe, nullable, con comentario si hay descripción

    const alterSql = `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "${column}" ${sqlType} NULL`;
    // Ejecutar alter table
    await db.execute(sql.raw(alterSql));

    // Si hay descripción, ejecuta el comentario en una consulta aparte
    if (fieldDescription && fieldDescription.trim() !== '') {
      const commentSql = `COMMENT ON COLUMN "users"."${column}" IS '${fieldDescription.replace(/'/g, "''")}'`;
      await db.execute(sql.raw(commentSql));
    }

    // 4) Actualizar el valor de esa columna para el usuario indicado
    let valueToSet: unknown = fieldValue;
    if (
      fieldType !== 'text' &&
      (fieldValue === '' || fieldValue === null || fieldValue === undefined)
    ) {
      valueToSet = null;
    }
    await db.execute(
      sql`UPDATE "users" SET ${sql.raw(`"${column}"`)} = ${valueToSet} WHERE "id" = ${userId}`
    );

    return NextResponse.json({ success: true, column, userId });
  } catch (err: unknown) {
    console.error(err);

    // Si el error viene de Zod o del sanitizado, devolvemos 400
    const message = err instanceof Error ? err.message : 'Solicitud inválida';
    if (
      message.includes('requerido') ||
      message.includes('inválido') ||
      message.includes('columna')
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Error al actualizar el usuario' },
      { status: 500 }
    );
  }
}
