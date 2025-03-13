// server/queries/queries.ts

import { clerkClient } from '@clerk/nextjs/server'; // Clerk Client

// Función para verificar el rol de admin y obtener usuarios
export async function getAdminUsers(query: string | undefined) {
	// Obtener la lista de usuarios desde Clerk
	const client = await clerkClient();
	const users = query ? (await client.users.getUserList({ query })).data : [];

	// Simplificar la lista de usuarios
	const simplifiedUsers = users.map((user) => ({
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.emailAddresses.find(
			(email) => email.id === user.primaryEmailAddressId
		)?.emailAddress,
		role: user.publicMetadata.role ?? 'estudiante', // Si role no existe, asignar 'estudiante'
	}));

	return simplifiedUsers;
}
