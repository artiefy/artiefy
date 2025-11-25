import { NextResponse } from "next/server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { credentialsDeliveryLogs } from "~/server/db/schema";

async function assertSuperAdmin(userId: string) {
    const client = await clerkClient();
    const me = await client.users.getUser(userId);
    const role = (me.publicMetadata as any)?.role;
    return role === "super-admin";
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

        const body = await req.json();

        const patch: Partial<typeof credentialsDeliveryLogs.$inferInsert> = {};
        if (body.usuario !== undefined) patch.usuario = String(body.usuario).trim();
        if (body.correo !== undefined) patch.correo = String(body.correo).trim();
        if (body.nota !== undefined) patch.nota = String(body.nota).trim();
        if (body.contrasena !== undefined)
            patch.contrasena = body.contrasena ? String(body.contrasena) : null;

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
