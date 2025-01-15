'use server';

import {
  getUserById,
  getAllUsers,
  createUser,
  deleteUserById,
  type User,
} from '~/models/estudiantes/userModels';

export async function getUserByIdAction(
  userId: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const user = await getUserById(userId);
    if (user) {
      return { success: true, user };
    } else {
      return { success: false, error: 'Usuario no encontrado' };
    }
  } catch (error) {
    console.error(`Error al obtener el usuario con ID ${userId}:`, error);
    return { success: false, error: 'No se pudo obtener el usuario' };
  }
}

export async function getAllUsersAction(): Promise<{
  success: boolean;
  users?: User[];
  error?: string;
}> {
  try {
    const users = await getAllUsers();
    return { success: true, users };
  } catch (error) {
    console.error('Error al obtener todos los usuarios:', error);
    return { success: false, error: 'No se pudieron obtener los usuarios' };
  }
}

export async function createUserAction(
  id: string,
  role: string,
  name: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await createUser(id, role, name, email);
    return { success: true };
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    return { success: false, error: 'No se pudo crear el usuario' };
  }
}

export async function deleteUserByIdAction(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteUserById(userId);
    return { success: true };
  } catch (error) {
    console.error(`Error al eliminar el usuario con ID ${userId}:`, error);
    return { success: false, error: 'No se pudo eliminar el usuario' };
  }
}
