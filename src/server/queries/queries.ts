// server/queries/queries.ts
"use server";

import { clerkClient } from '@clerk/nextjs/server'; // Clerk Client
import crypto from "crypto";


// Función para verificar el rol de admin y obtener usuarios
export async function getAdminUsers(query: string | undefined) {
    console.log("DEBUG: Ejecutando getAdminUsers con query ->", query);

    const client = await clerkClient();
    const usersResponse = await client.users.getUserList();
    const users = usersResponse.data;

    const filteredUsers = query
        ? users.filter(user =>
            (user.firstName?.toLowerCase().includes(query.toLowerCase()) ||
             user.lastName?.toLowerCase().includes(query.toLowerCase()) ||
             user.emailAddresses.some(email =>
                 email.emailAddress.toLowerCase().includes(query.toLowerCase())
             )
            )
        )
        : users;

    const simplifiedUsers = filteredUsers.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses.find(
            (email) => email.id === user.primaryEmailAddressId
        )?.emailAddress,
        role: user.publicMetadata.role || 'estudiante', 
        status: user.publicMetadata.status || 'activo' // ✅ Agregar estado con valor por defecto
    }));

    return simplifiedUsers;
}


// ✅ Función para actualizar el rol de un usuario
export async function setRoleWrapper({ id, role }: { id: string; role: string }) {
	try {
      const client = await clerkClient();
	  await client.users.updateUser(id, {
		publicMetadata: { role }, // ✅ Actualiza el rol en Clerk
	  });
	} catch (error) {
	  console.error("Error al actualizar el rol:", error);
	  throw new Error("No se pudo actualizar el rol");
	}
  }
  
  // ✅ Función para eliminar el rol de un usuario
  export async function removeRole(id: string) {
	try {
	  const client = await clerkClient();
	  await client.users.updateUser(id, {
		publicMetadata: {}, // 🔥 Esto elimina el campo role correctamente
	  });
	  console.log(`DEBUG: Rol eliminado para el usuario ${id}`);
	} catch (error) {
	  console.error("Error al eliminar rol:", error);
	  throw new Error("No se pudo eliminar el rol");
	}
  }


  export async function deleteUser(id: string) {
	try {
	  const client = await clerkClient();
	  await client.users.deleteUser(id);
	  console.log(`DEBUG: Usuario ${id} eliminado correctamente`);
	} catch (error) {
	  console.error("Error al eliminar usuario:", error);
	  throw new Error("No se pudo eliminar el usuario");
	}
  }

  
  export async function updateUserInfo(id: string, firstName: string, lastName: string) {
	try {
	  const client = await clerkClient();
	  
	  // Actualizar nombre
	  await client.users.updateUser(id, { firstName, lastName });
  
	  console.log(`DEBUG: Usuario ${id} actualizado correctamente`);
	} catch (error) {
	  console.error("Error al actualizar usuario:", error);
	  throw new Error("No se pudo actualizar el usuario");
	}
  }


function generateRandomPassword(length: number = 12): string {
  const randomBytes = crypto.randomBytes(length);
  return randomBytes.toString("base64").slice(0, length);
}
function generateUsername(firstName: string, lastName: string): string {
	// Extrae hasta 4 letras del nombre
	const firstPart = firstName.slice(0, 3).toLowerCase();
	// Extrae hasta 2 letras del apellido
	const secondPart = lastName.slice(0, 3).toLowerCase();
	// Combina
	return firstPart + secondPart;
  }
  

export async function createUser(
	firstName: string,
	lastName: string,
	email: string,
	role: string
  ) {
	try {
	  const generatedPassword = generateRandomPassword(12);
	  const username = generateUsername(firstName, lastName);
	  const client = await clerkClient();
	  const newUser = await client.users.createUser({
		firstName,
		lastName,
		username: username,
		password: generatedPassword,
		emailAddress: [email],
		publicMetadata: { role },
	  });
  
	  console.log(`DEBUG: Usuario ${newUser.id} creado exitosamente`);
  	  return {
		user: newUser,
		generatedPassword,
	  };
	} catch (error: any) {
	  console.error("DEBUG: Error al crear usuario en Clerk:", JSON.stringify(error, null, 2));
	  throw new Error(error.message || "No se pudo crear el usuario");
	}
  }

  export async function updateUserStatus(id: string, status: string) {
    try {
        const client = await clerkClient();
        await client.users.updateUser(id, {
            publicMetadata: { status }, // 
        });

        console.log(`DEBUG: Estado del usuario ${id} actualizado a ${status}`);
    } catch (error) {
        console.error("Error al actualizar el estado del usuario:", error);
        throw new Error("No se pudo actualizar el estado del usuario");
    }
}


export async function updateMultipleUserStatus(userIds: string[], status: string) {
    try {
        const client = await clerkClient();
        
        for (const id of userIds) {
            await client.users.updateUser(id, {
                publicMetadata: { status },
            });
        }

        console.log(`DEBUG: Se actualizaron ${userIds.length} usuarios a estado ${status}`);
    } catch (error) {
        console.error("Error al actualizar múltiples usuarios:", error);
        throw new Error("No se pudieron actualizar los usuarios");
    }
}
