"user client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { UserButton } from "@clerk/nextjs"; // Botón de usuario de Clerk
import { getAdminUsers } from "~/server/queries/queries"; // Importar la función de la lógica del servidor
import { ChangeRole } from "./ChangeRole";
import { SearchUsers } from "./SearchUsers"; // Componente de búsqueda

export default async function AdminDashboard(params: {
  searchParams: Promise<{ search?: string }>;
}) {
  // Obtener los usuarios simplificados, pasando el query de búsqueda
  const query = (await params.searchParams).search;

  let simplifiedUsers = [];

  try {
    simplifiedUsers = await getAdminUsers(query);
  } catch (error) {
    // Redirigir o manejar error (ejemplo, si el usuario no tiene rol de admin)
    return (
      <div>
        <p>You are not authorized to view this page.</p>
      </div>
    );
  }

  return (
    <>
      <div>
        <header className="bg-[#ffff] p-5 text-2xl font-extrabold text-black">
          <h1>Dashboard Admin</h1>
          {/* Botón de usuario de Clerk */}
          <UserButton showName />
        </header>
      </div>
      <p className="mt-4 text-lg text-white">
        This is the protected admin dashboard restricted to users with the
        `admin` role.
      </p>
      <SearchUsers /> {/* Componente de búsqueda */}
      <div className="mt-6">
        {/* Mostrar cada usuario con datos simplificados */}
        {simplifiedUsers.map((user) => (
          <ChangeRole
            key={user.id}
            user={{
              ...user,
              role: typeof user.role === "string" ? user.role : null, // Validamos que sea string o null
            }}
          />
        ))}
      </div>
    </>
  );
}
