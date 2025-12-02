import { NextResponse } from "next/server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { desc, ilike, or, sql } from "drizzle-orm";

import { db } from "~/server/db";
import { credentialsDeliveryLogs } from "~/server/db/schema";

interface UserPublicMetadata {
    role?: string;
}

interface CreateCredentialsBody {
    usuario?: unknown;
    correo?: unknown;
    nota?: unknown;
    contrasena?: unknown;
    userId?: unknown;
}

async function assertSuperAdmin(userId: string): Promise<boolean> {
    const client = await clerkClient();
    const me = await client.users.getUser(userId);
    const metadata = me.publicMetadata as UserPublicMetadata;
    return metadata?.role === "super-admin";
}

export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: "No autenticado" }, { status: 401 });
        }

        if (!(await assertSuperAdmin(userId))) {
            return NextResponse.json({ message: "No autorizado" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("q") ?? "").trim();
        const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
        const pageSize = Math.min(
            100,
            Math.max(1, Number(searchParams.get("pageSize") ?? "20"))
        );
        const offset = (page - 1) * pageSize;

        const whereClause = q
            ? or(
                ilike(credentialsDeliveryLogs.usuario, `%${q}%`),
                ilike(credentialsDeliveryLogs.correo, `%${q}%`),
                ilike(credentialsDeliveryLogs.nota, `%${q}%`)
            )
            : undefined;

        const [items, totalRes] = await Promise.all([
            db
                .select({
                    id: credentialsDeliveryLogs.id,
                    userId: credentialsDeliveryLogs.userId,
                    usuario: credentialsDeliveryLogs.usuario,
                    contrasena: credentialsDeliveryLogs.contrasena,
                    correo: credentialsDeliveryLogs.correo,
                    nota: credentialsDeliveryLogs.nota,
                    createdAt: credentialsDeliveryLogs.createdAt,
                })
                .from(credentialsDeliveryLogs)
                .where(whereClause)
                .orderBy(desc(credentialsDeliveryLogs.createdAt))
                .limit(pageSize)
                .offset(offset),

            db
                .select({ count: sql<number>`count(*)::int` })
                .from(credentialsDeliveryLogs)
                .where(whereClause),
        ]);

        const total = totalRes?.[0]?.count ?? 0;

        return NextResponse.json({
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            items,
        });
    } catch (err) {
        console.error("GET credentials-logs error:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: "No autenticado" }, { status: 401 });
        }

        if (!(await assertSuperAdmin(userId))) {
            return NextResponse.json({ message: "No autorizado" }, { status: 403 });
        }

        const body = (await req.json()) as CreateCredentialsBody;

        if (typeof body.usuario !== 'string' || !body.usuario.trim()) {
            return NextResponse.json(
                { message: "Campo 'usuario' es obligatorio y debe ser string" },
                { status: 400 }
            );
        }
        if (typeof body.correo !== 'string' || !body.correo.trim()) {
            return NextResponse.json(
                { message: "Campo 'correo' es obligatorio y debe ser string" },
                { status: 400 }
            );
        }
        if (typeof body.nota !== 'string' || !body.nota.trim()) {
            return NextResponse.json(
                { message: "Campo 'nota' es obligatorio y debe ser string" },
                { status: 400 }
            );
        }
        if (body.contrasena !== undefined && body.contrasena !== null && typeof body.contrasena !== 'string') {
            return NextResponse.json(
                { message: "Campo 'contrasena' debe ser string o null" },
                { status: 400 }
            );
        }
        if (body.userId !== undefined && body.userId !== null && typeof body.userId !== 'string') {
            return NextResponse.json(
                { message: "Campo 'userId' debe ser string o null" },
                { status: 400 }
            );
        }

        const usuario = body.usuario.trim();
        const correo = body.correo.trim();
        const nota = body.nota.trim();
        const contrasena = body.contrasena ?? null;
        const refUserId = body.userId ?? null;
        const [created] = await db
            .insert(credentialsDeliveryLogs)
            .values({
                userId: refUserId,
                usuario,
                correo,
                nota,
                contrasena,
            })
            .returning();

        return NextResponse.json(created, { status: 201 });
    } catch (err) {
        console.error("POST credentials-logs error:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}