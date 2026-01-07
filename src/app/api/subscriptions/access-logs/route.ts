import { type NextRequest, NextResponse } from 'next/server';

import { desc, eq, ilike, or, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { accessLogs, users } from '~/server/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10))
    );
    const search = searchParams.get('q')?.trim() ?? '';
    const filter = searchParams.get('filter') ?? 'all'; // 'all' | 'inside' | 'completed'

    const offset = (page - 1) * pageSize;

    // Build where conditions
    const conditions = [];

    // Search filter - search by user name or email
    if (search) {
      conditions.push(
        or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))
      );
    }

    // Status filter
    if (filter === 'inside') {
      // Only entry, no exit (person is still inside)
      conditions.push(sql`${accessLogs.exitTime} IS NULL`);
    } else if (filter === 'completed') {
      // Has both entry and exit
      conditions.push(sql`${accessLogs.exitTime} IS NOT NULL`);
    }

    // Build the query with user join
    const baseQuery = db
      .select({
        id: accessLogs.id,
        userId: accessLogs.userId,
        entryTime: accessLogs.entryTime,
        exitTime: accessLogs.exitTime,
        subscriptionStatus: accessLogs.subscriptionStatus,
        esp32Status: accessLogs.esp32Status,
        createdAt: accessLogs.createdAt,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
        userRole: users.role,
      })
      .from(accessLogs)
      .leftJoin(users, eq(accessLogs.userId, users.id));

    // Apply conditions if any
    let query;
    if (conditions.length > 0) {
      const combinedCondition = conditions.reduce((acc, cond) =>
        acc ? sql`${acc} AND ${cond}` : cond
      );
      query = baseQuery
        .where(combinedCondition)
        .orderBy(desc(accessLogs.entryTime))
        .limit(pageSize)
        .offset(offset);
    } else {
      query = baseQuery
        .orderBy(desc(accessLogs.entryTime))
        .limit(pageSize)
        .offset(offset);
    }

    const logs = await query;

    // Count total for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(accessLogs)
      .leftJoin(users, eq(accessLogs.userId, users.id));

    let countResult;
    if (conditions.length > 0) {
      const combinedCondition = conditions.reduce((acc, cond) =>
        acc ? sql`${acc} AND ${cond}` : cond
      );
      countResult = await countQuery.where(combinedCondition);
    } else {
      countResult = await countQuery;
    }

    const total = Number(countResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / pageSize);

    // Count people currently inside (no exit time)
    const insideCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(accessLogs)
      .where(sql`${accessLogs.exitTime} IS NULL`);
    const insideCount = Number(insideCountResult[0]?.count ?? 0);

    return NextResponse.json({
      items: logs,
      page,
      pageSize,
      total,
      totalPages,
      insideCount,
    });
  } catch (error) {
    console.error('Error fetching access logs:', error);
    return NextResponse.json(
      { message: 'Error al obtener los registros de acceso' },
      { status: 500 }
    );
  }
}
