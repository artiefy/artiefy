'use server';

import { clerkClient } from '@clerk/nextjs/server'; // Clerk Client
import { eq, desc, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  courses,
  categories,
  modalidades,
  nivel as nivel,
  materias,
  users,
  programas,
  userCredentials,
} from '~/server/db/schema';

// Add this cache object at module level
const categoryNameCache: Record<number, string> = {};

// Add these new interfaces
interface PaginatedResult<T> {
  data: T[];
  total: number;
}

interface GetCoursesOptions {
  page?: number;
  limit?: number;
  search?: string;
}

// Función para verificar el rol de admin y obtener usuarios
export async function getAdminUsers(query?: string) {
  console.log('DEBUG: Ejecutando getAdminUsers (SIN paginar por count)');

  const client = await clerkClient();
  const allUsers: {
    id: string;
    firstName?: string;
    lastName?: string;
    emailAddresses: { emailAddress: string; id: string }[];
    primaryEmailAddressId?: string;
    publicMetadata?: { role?: string; status?: string };
  }[] = [];

  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await client.users.getUserList({ limit, offset });
    const users = response.data;

    console.log(`🧪 Página offset: ${offset}, Traídos: ${users.length}`);

    if (!users.length) break;

    allUsers.push(
      ...users.map((user) => ({
        ...user,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        primaryEmailAddressId: user.primaryEmailAddressId ?? undefined,
      }))
    );

    offset += limit;
  }

  const simplifiedUsers = allUsers.map((user) => ({
    id: user.id,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email:
      user.emailAddresses.find(
        (email) => email.id === user.primaryEmailAddressId
      )?.emailAddress ?? '',
    role:
      typeof user.publicMetadata?.role === 'string'
        ? user.publicMetadata.role.trim().toLowerCase()
        : 'estudiante',
    status:
      typeof user.publicMetadata?.status === 'string'
        ? user.publicMetadata.status
        : 'activo',
  }));

  const filtered = query
    ? simplifiedUsers.filter((user) =>
        `${user.firstName} ${user.lastName} ${user.email}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : simplifiedUsers;

  console.log(`✅ Total de usuarios encontrados: ${filtered.length}`);
  return filtered;
}

// ✅ Función para actualizar el rol de un usuario
export async function setRoleWrapper({
  id,
  role,
}: {
  id: string;
  role: string;
}) {
  try {
    // Update in Clerk
    const client = await clerkClient();

    // 1. Leer el usuario para obtener los metadatos actuales
    const user = await client.users.getUser(id);
    const existingMetadata = user.publicMetadata;

    // 2. Fusionar los metadatos existentes con el nuevo rol
    const newMetadata = {
      ...existingMetadata,
      role: role, // Actualizar solo el rol
    };

    // 3. Escribir el objeto de metadatos completo y actualizado
    await client.users.updateUser(id, {
      publicMetadata: newMetadata,
    });

    // Update in database
    await db
      .update(users)
      .set({
        role: role as 'estudiante' | 'educador' | 'admin' | 'super-admin',
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    console.log(`DEBUG: Rol actualizado para usuario ${id} en Clerk y BD`);
  } catch (error) {
    console.error('Error al actualizar el rol:', error);
    throw new Error('No se pudo actualizar el rol');
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
    console.error('Error al eliminar rol:', error);
    throw new Error('No se pudo eliminar el rol');
  }
}

export async function deleteUser(id: string) {
  try {
    // Primero eliminar las credenciales
    await db.delete(userCredentials).where(eq(userCredentials.userId, id));

    // Delete from Clerk (manejando el caso de usuario no encontrado)
    try {
      const client = await clerkClient();
      await client.users.deleteUser(id);
    } catch (clerkError: unknown) {
      if (
        typeof clerkError === 'object' &&
        clerkError !== null &&
        'status' in clerkError &&
        typeof (clerkError as { status: unknown }).status === 'number' &&
        (clerkError as { status: number }).status !== 404
      ) {
        if (clerkError instanceof Error) {
          throw clerkError;
        }
        throw new Error('Unknown Clerk error during user deletion');
      }
      console.log(
        `Usuario ${id} no encontrado en Clerk, continuando con eliminación local`
      );
    }

    // Delete from database
    await db.delete(users).where(eq(users.id, id));

    console.log(`DEBUG: Usuario ${id} eliminado correctamente de la BD`);
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw new Error('No se pudo eliminar el usuario');
  }
}

export async function updateUserInfo(
  id: string,
  firstName: string,
  lastName: string
) {
  try {
    const client = await clerkClient();
    await client.users.updateUser(id, { firstName, lastName });
    console.log(`DEBUG: Usuario ${id} actualizado correctamente`);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw new Error('No se pudo actualizar el usuario');
  }
}

function generateSecurePassword(length = 14): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*()_+-={}[]<>?';

  const allChars = uppercase + lowercase + numbers + symbols;

  let password = '';
  // Asegurar al menos un carácter de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Completar el resto de la contraseña
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Mezclar la contraseña para evitar patrones predecibles
  return password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
}

async function generateUniqueUsername(baseUsername: string): Promise<string> {
  const client = await clerkClient();
  let username = baseUsername;
  let counter = 1;

  while (true) {
    try {
      const existingUsers = await client.users.getUserList({
        username: [username],
      });

      if (existingUsers.data.length === 0) {
        return username;
      }

      username = `${baseUsername}${counter}`;
      counter++;
    } catch {
      return username;
    }
  }
}

export async function createUser(
  firstName: string,
  lastName: string,
  email: string,
  role: string
) {
  try {
    const generatedPassword = generateSecurePassword();
    let baseUsername =
      `${firstName}${lastName?.split(' ')[0] || ''}`.toLowerCase();
    if (baseUsername.length < 4) baseUsername += 'user';
    baseUsername = baseUsername.slice(0, 60); // Leave room for numbers

    const uniqueUsername = await generateUniqueUsername(baseUsername);

    const client = await clerkClient();
    try {
      const newUser = await client.users.createUser({
        firstName,
        lastName,
        username: uniqueUsername,
        password: generatedPassword,
        emailAddress: [email],
        publicMetadata: { role, mustChangePassword: true },
      });

      return { user: newUser, generatedPassword };
    } catch (error: unknown) {
      // Si el error es por email duplicado, retornamos null sin lanzar error
      if (
        (
          error as { errors?: { code: string; meta?: { paramName: string } }[] }
        )?.errors?.some(
          (e) =>
            e.code === 'form_identifier_exists' &&
            e.meta?.paramName === 'email_address'
        )
      ) {
        return null;
      }
      // Si es otro tipo de error, lo lanzamos
      throw error;
    }
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
}

export async function updateUserStatus(id: string, status: string) {
  try {
    // Update in Clerk
    const client = await clerkClient();

		// 1. Leer el usuario para obtener sus metadatos públicos actuales
		const user = await client.users.getUser(id);

		// 2. Fusionar los metadatos existentes con el nuevo estado
		const newMetadata = {
			...user.publicMetadata,
			status: status, // Actualizar/añadir solo la clave 'status'
		};

		// 3. Escribir el objeto completo de metadatos de vuelta a Clerk
		await client.users.updateUser(id, {
			publicMetadata: newMetadata,
		});

    // Update in database
    await db
      .update(users)
      .set({
        subscriptionStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    console.log(
      `DEBUG: Estado del usuario ${id} actualizado a ${status} en Clerk y BD`
    );
  } catch (error) {
    console.error('Error al actualizar el estado del usuario:', error);
    throw new Error('No se pudo actualizar el estado del usuario');
  }
}

export async function updateMultipleUserStatus(
  userIds: string[],
  status: string
) {
  try {
	const client = await clerkClient();

		// 1. Obtener los datos de todos los usuarios en una sola llamada a la API.
		const userList = await client.users.getUserList({ userId: userIds });

		// 2. Crear un mapa para acceder fácilmente a los metadatos de cada usuario.
		const metadataMap = new Map(
			userList.data.map((user) => [user.id, user.publicMetadata])
		);
    // Update both Clerk and database for each user
    for (const id of userIds) {
	

		const existingMetadata = metadataMap.get(id) || {};

			// Fusionar los metadatos existentes con el nuevo estado.
			const newMetadata = {
				...existingMetadata,
				status: status,
			};

			// Escribir el objeto de metadatos completo y actualizado en Clerk.
			await client.users.updateUser(id, {
				publicMetadata: newMetadata,
			});

      // Update in database
      await db
        .update(users)
        .set({
          subscriptionStatus: status,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));
    }

    console.log(
      `DEBUG: Se actualizaron ${userIds.length} usuarios a estado ${status} en Clerk y BD`
    );
  } catch (error) {
    console.error('Error al actualizar múltiples usuarios:', error);
    throw new Error('No se pudieron actualizar los usuarios');
  }
}

export interface CourseData {
  id?: number;
  title: string;
  description?: string | null; // 🔹 Permitir `null` y hacerla opcional
  coverImageKey: string | null; // 🔹 Permitir `null` y hacerla opcional
  categoryid: number;
  modalidadesid: number;
  nivelid: number;
  instructor: string;
  creatorId: string;
  createdAt: Date | string; // 🔹 Permitir `string` porque en errores previos llegaba como `string`
  updatedAt?: Date | string; // 🔹 Hacer opcional y permitir `string` porque en errores previos faltaba
  rating?: number | null;
  courseTypeId?: number; // 🔹 Add courseTypeId as an optional property
  isActive?: boolean | null; // 🔹 Allow null for isActive
  categoryName?: string; // 🔹 Add categoryName as an optional property
  requiresProgram?: boolean | null;
  programas?: { id: number; title: string }[];
  instructorName?: string; // Add instructorName as an optional property
  coverVideoCourseKey?: string | null;
}

export interface Materia {
  id: number;
  title: string;
  description: string;
  programaId: number;
  courseid: number;
}

export async function getCourses(
  options: GetCoursesOptions = {}
): Promise<PaginatedResult<CourseData>> {
  const { page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;

  try {
    // Get cached categories or fetch them
    if (Object.keys(categoryNameCache).length === 0) {
      const categoryResults = await db.select().from(categories);
      categoryResults.forEach((cat) => {
        categoryNameCache[cat.id] = cat.name;
      });
    }

    // Get courses with their materias and programas
    const [coursesData, countResult] = await Promise.all([
      db
        .select({
          id: courses.id,
          title: courses.title,
          description: courses.description,
          categoryid: courses.categoryid,
          modalidadesid: courses.modalidadesid,
          instructor: courses.instructor,
          coverImageKey: courses.coverImageKey,
          creatorId: courses.creatorId,
          nivelid: courses.nivelid,
          rating: courses.rating,
          isActive: courses.isActive,
          createdAt: courses.createdAt,
        })
        .from(courses)
        .orderBy(desc(courses.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ count: sql`count(*)` }).from(courses),
    ]);

    // Get instructors info from Clerk
    const clerk = await clerkClient();
    console.log('Fetching instructor info for courses:', coursesData);

    const instructorsInfo = await Promise.all(
      coursesData.map(async (course) => {
        if (!course.instructor) {
          return { id: '', name: 'Sin instructor asignado' };
        }

        try {
          // First try to get from users table
          const dbUser = await db
            .select()
            .from(users)
            .where(eq(users.id, course.instructor))
            .limit(1);

          if (dbUser?.[0]?.name) {
            return { id: course.instructor, name: dbUser[0].name };
          }

          // If not in DB, try Clerk
          try {
            const user = await clerk.users.getUser(course.instructor);
            const name =
              `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
            return {
              id: course.instructor,
              name: name || course.instructor, // Fallback to instructor ID if no name
            };
          } catch (_) {
            // If Clerk fails, use the instructor field directly
            return {
              id: course.instructor,
              name: course.instructor, // Use the instructor field as is
            };
          }
        } catch (error) {
          console.error(
            `Error fetching instructor for course ${course.id}:`,
            error
          );
          return { id: course.instructor, name: course.instructor };
        }
      })
    );

    // Create lookup for instructor names
    const instructorNames = Object.fromEntries(
      instructorsInfo.map((info) => [info.id, info.name])
    );

    // Get materias and programas for each course with instructor names
    const coursesWithRelations = await Promise.all(
      coursesData.map(async (course) => {
        const materiaResults = await db
          .select({
            materiaId: materias.id,
            programaId: materias.programaId,
            programaTitle: programas.title,
          })
          .from(materias)
          .leftJoin(programas, eq(materias.programaId, programas.id))
          .where(eq(materias.courseid, course.id));

        const uniquePrograms = materiaResults
          .filter((m) => m.programaId !== null)
          .reduce((acc: { id: number; title: string }[], curr) => {
            if (!acc.some((p) => p.id === curr.programaId)) {
              acc.push({ id: curr.programaId!, title: curr.programaTitle! });
            }
            return acc;
          }, []);

        return {
          ...course,
          categoryName:
            categoryNameCache[course.categoryid] ?? 'Unknown Category',
          programas: uniquePrograms,
          instructorName:
            instructorNames[course.instructor] || course.instructor,
        };
      })
    );

    return {
      data: coursesWithRelations,
      total: Number(countResult[0]?.count ?? 0),
    };
  } catch (error) {
    console.error('❌ Error al obtener cursos:', error);
    return { data: [], total: 0 };
  }
}

export async function deleteCourse(courseId: number) {
  try {
    return await db.delete(courses).where(eq(courses.id, courseId)).returning();
  } catch (error) {
    console.error('❌ Error al eliminar curso:', error);
    throw new Error('No se pudo eliminar el curso');
  }
}

export async function getModalidades() {
  try {
    const data = await db.select().from(modalidades);
    return data || []; // ✅ Devuelve un array vacío si `data` es `undefined`
  } catch (error) {
    console.error('❌ Error al obtener modalidades:', error);
    return [];
  }
}

// ✅ Función corregida con el tipo adecuado para `courseData`
export async function createCourse(courseData: CourseData) {
  try {
    return await db
      .insert(courses)
      .values({
        title: courseData.title,
        categoryid: courseData.categoryid,
        instructor: courseData.instructor,
        modalidadesid: courseData.modalidadesid,
        nivelid: courseData.nivelid,
        creatorId: courseData.creatorId || 'defaultCreatorId',
        createdAt: new Date(courseData.createdAt),
        updatedAt: courseData.updatedAt
          ? new Date(courseData.updatedAt)
          : new Date(),
        courseTypeId: courseData.courseTypeId ?? 1, // <-- Aquí colocas un valor seguro por defecto
        isActive: courseData.isActive ?? true,
        coverImageKey: courseData.coverImageKey ?? null,
        coverVideoCourseKey: courseData.coverVideoCourseKey ?? null,
      })
      .returning();
  } catch (error) {
    console.error('❌ Error al crear curso:', error);
    throw new Error('No se pudo crear el curso');
  }
}

// ✅ Función corregida con `courseId: number`
export async function updateCourse(courseId: number, courseData: CourseData) {
  try {
    console.log('📝 Actualizando curso:');
    console.log('ID:', courseId);
    console.log('coverImageKey recibido:', courseData.coverImageKey);
    console.log(
      'coverVideoCourseKey recibido:',
      courseData.coverVideoCourseKey
    );

    return await db
      .update(courses)
      .set({
        ...courseData,
        createdAt: new Date(courseData.createdAt),
        updatedAt: courseData.updatedAt
          ? new Date(courseData.updatedAt)
          : undefined,
        coverImageKey: courseData.coverImageKey ?? null,
        coverVideoCourseKey: courseData.coverVideoCourseKey ?? null,
      })
      .where(eq(courses.id, courseId))
      .returning();
  } catch (error) {
    console.error('❌ Error al actualizar curso:', error);
    throw new Error('No se pudo actualizar el curso');
  }
}

// ✅ Obtener todas las categorías
export async function getCategories() {
  try {
    return (await db.select().from(categories)) || [];
  } catch (error) {
    console.error('❌ Error al obtener categorías:', error);
    return [];
  }
}

// ✅ Obtener todas las
export async function getNivel() {
  try {
    return (await db.select().from(nivel)) || [];
  } catch (error) {
    console.error('❌ Error al obtener niveles:', error);
    return [];
  }
}

export async function updateUserInClerk({
	userId,
	firstName,
	lastName,
	role,
	status,
	permissions,
	subscriptionEndDate,
}: {
	userId: string;
	firstName: string;
	lastName: string;
	role: string;
	status: string;
	permissions: string[];
	subscriptionEndDate?: string;
}) {
	try {
		const client = await clerkClient();

		// 1. Leer el usuario para obtener los metadatos existentes
		const user = await client.users.getUser(userId);

		// 2. Fusionar los metadatos existentes con los nuevos valores
		const newMetadata = {
			...user.publicMetadata, // Preserva todos los campos existentes
			role: (role || 'estudiante') as
				| 'admin'
				| 'educador'
				| 'super-admin'
				| 'estudiante',
			status: status || 'activo',
			permissions: Array.isArray(permissions) ? permissions : [],
			subscriptionEndDate: subscriptionEndDate ?? null,
		};
		
		// 3. Actualizar en Clerk con el objeto completo y fusionado
		await client.users.updateUser(userId, {
			firstName,
			lastName,
			publicMetadata: newMetadata,
		});

		// 🧠 También actualizar en Drizzle (esta parte ya era correcta)
		await db
			.update(users)
			.set({
				name: `${firstName} ${lastName}`,
				role: (role || 'estudiante') as
					| 'estudiante'
					| 'educador'
					| 'admin'
					| 'super-admin',
				subscriptionStatus: status || 'activo',
				subscriptionEndDate: subscriptionEndDate
					? new Date(subscriptionEndDate)
					: null,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));

		console.log(`✅ Usuario ${userId} actualizado en Clerk y BD`);
		return true;
	} catch (error) {
		console.error('❌ Error al actualizar usuario:', error);
		return false;
	}
}

export async function getMateriasByCourseId(
  courseId: string
): Promise<Materia[]> {
  try {
    const result = await db
      .select()
      .from(materias)
      .where(eq(materias.courseid, parseInt(courseId)));
    return result as Materia[];
  } catch (error) {
    console.error('Error fetching materias:', error);
    return [];
  }
}

// Remove the old getCategoryNameById since we now use cache
export async function getCategoryNameById(id: number): Promise<string> {
  return Promise.resolve(categoryNameCache[id] ?? 'Unknown Category');
}

// Update this function to get instructor name from users table
export async function getInstructorNameById(id: string): Promise<string> {
  try {
    // First try local DB
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (user?.[0]?.name) {
      return user[0].name;
    }

    // Try Clerk but handle 404 gracefully
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(id);
      return (
        `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() ||
        'Unknown Instructor'
      );
    } catch (clerkError) {
      // If Clerk returns 404 or any other error, return a default value
      console.log(`Instructor ${id} not found in Clerk:`, clerkError);
      return id || 'Unknown Instructor'; // Return the ID if available, otherwise Unknown Instructor
    }
  } catch (error) {
    console.error('Error getting instructor name:', error);
    return id || 'Unknown Instructor'; // Return the ID if available, otherwise Unknown Instructor
  }
}
export {};
