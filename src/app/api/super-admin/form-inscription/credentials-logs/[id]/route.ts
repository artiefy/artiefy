import { NextResponse } from "next/server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { credentialsDeliveryLogs } from "~/server/db/schema";

interface UserPublicMetadata {
    role?: string;
}

interface UpdateCredentialsBody {
    usuario?: unknown;
    correo?: unknown;
    nota?: unknown;
    contrasena?: unknown;
}

async function assertSuperAdmin(userId: string): Promise<boolean> {
    const client = await clerkClient();
    const me = await client.users.getUser(userId);
    const metadata = me.publicMetadata as UserPublicMetadata;
    return metadata?.role === "super-admin";
}

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: "No autenticado" }, { status: 401 });
        }
        if (!(await assertSuperAdmin(userId))) {
            return NextResponse.json({ message: "No autorizado" }, { status: 403 });
        }

        const id = Number(params.id);
        if (!id)
            return NextResponse.json({ message: "Id inválido" }, { status: 400 });

        const item = await db.query.credentialsDeliveryLogs.findFirst({
            where: eq(credentialsDeliveryLogs.id, id),
        });

        if (!item)
            return NextResponse.json({ message: "No encontrado" }, { status: 404 });

        return NextResponse.json(item);
    } catch (err) {
        console.error("GET credentials-logs/[id] error:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: "No autenticado" }, { status: 401 });
        }
        if (!(await assertSuperAdmin(userId))) {
            return NextResponse.json({ message: "No autorizado" }, { status: 403 });
        }

        const id = Number(params.id);
        if (!id)
            return NextResponse.json({ message: "Id inválido" }, { status: 400 });

        const body = (await req.json()) as UpdateCredentialsBody;

        const patch: Partial<typeof credentialsDeliveryLogs.$inferInsert> = {};

        if (body.usuario !== undefined && body.usuario !== null) {
            if (typeof body.usuario !== 'string') {
                return NextResponse.json(
                    { message: "Campo 'usuario' debe ser string" },
                    { status: 400 }
                );
            }
            patch.usuario = body.usuario.trim();
        }
        if (body.correo !== undefined && body.correo !== null) {
            if (typeof body.correo !== 'string') {
                return NextResponse.json(
                    { message: "Campo 'correo' debe ser string" },
                    { status: 400 }
                );
            }
            patch.correo = body.correo.trim();
        }
        if (body.nota !== undefined && body.nota !== null) {
            if (typeof body.nota !== 'string') {
                return NextResponse.json(
                    { message: "Campo 'nota' debe ser string" },
                    { status: 400 }
                );
            }
            patch.nota = body.nota.trim();
        }
        if (body.contrasena !== undefined) {
            if (body.contrasena !== null && typeof body.contrasena !== 'string') {
                return NextResponse.json(
                    { message: "Campo 'contrasena' debe ser string o null" },
                    { status: 400 }
                );
            }
            patch.contrasena = body.contrasena ?? null;
        }

        if (Object.keys(patch).length === 0) {
            return NextResponse.json(
                { message: "Nada para actualizar" },
                { status: 400 }
            );
        }

        const [updated] = await db
            .update(credentialsDeliveryLogs)
            .set(patch)
            .where(eq(credentialsDeliveryLogs.id, id))
            .returning();

        if (!updated)
            return NextResponse.json({ message: "No encontrado" }, { status: 404 });

        return NextResponse.json(updated);
    } catch (err) {
        console.error("PATCH credentials-logs/[id] error:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: "No autenticado" }, { status: 401 });
        }
        if (!(await assertSuperAdmin(userId))) {
            return NextResponse.json({ message: "No autorizado" }, { status: 403 });
        }

        const id = Number(params.id);
        if (!id)
            return NextResponse.json({ message: "Id inválido" }, { status: 400 });

        const [deleted] = await db
            .delete(credentialsDeliveryLogs)
            .where(eq(credentialsDeliveryLogs.id, id))
            .returning();

        if (!deleted)
            return NextResponse.json({ message: "No encontrado" }, { status: 404 });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("DELETE credentials-logs/[id] error:", err);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}
