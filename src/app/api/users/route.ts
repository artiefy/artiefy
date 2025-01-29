// src/app/api/users/route.ts

import { NextResponse } from "next/server";
import {
  createUser,
  getAdminUsers,
  deleteUser,
  setRoleWrapper,
  removeRole,
  updateUserInfo,
  updateUserStatus,
  updateMultipleUserStatus
} from "~/server/queries/queries"; 
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("search") || "";
    const users = await getAdminUsers(query);
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, role } = await request.json();

    const { user, generatedPassword } = await createUser(firstName, lastName, email, role);
    
    const safeUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username, // <-- OJO, aquí
        email: user.emailAddresses.find((addr) => addr.id === user.primaryEmailAddressId)?.emailAddress,
        role: user.publicMetadata?.role || "estudiante",
      };
      
    return NextResponse.json({
      user: safeUser,
      generatedPassword,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE /api/users?id=xxx (para eliminar usuario)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");
    if (!userId) {
      return NextResponse.json({ error: "Falta el parámetro id" }, { status: 400 });
    }
    await deleteUser(userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PATCH /api/users (para actualizar algo: rol, nombre, etc.)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, id, role, firstName, lastName } = body;

    if (action === "setRole") {
      await setRoleWrapper({ id, role });
      return NextResponse.json({ success: true });
    }
    if (action === "removeRole") {
      await removeRole(id);
      return NextResponse.json({ success: true });
    }
    if (action === "updateUserInfo") {
      await updateUserInfo(id, firstName, lastName);
      return NextResponse.json({ success: true });
    }

    if (action === "updateStatus") {
        await updateUserStatus(id, status);
        return NextResponse.json({ success: true });
      }

      if (action === "updateMultipleStatus") {
        await updateMultipleUserStatus(userIds, status);
        return NextResponse.json({ success: true });
      }

    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
