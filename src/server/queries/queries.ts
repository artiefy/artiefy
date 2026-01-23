'use server';

import { clerkClient } from '@clerk/nextjs/server'; // Clerk Client
import { desc, eq, inArray, or, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  anunciosUsuarios,
  categories,
  certificates,
  chat_messages,
  conversations,
  courses,
  coursesTaken,
  emailLogs,
  enrollmentPrograms,
  enrollments,
  materiaGrades,
  materias,
  modalidades,
  nivel as nivel,
  notas,
  notifications,
  pagos,
  pagoVerificaciones,
  parameterGrades,
  preferences,
  programas,
  projectActivities,
  projectActivityDeliveries,
  projectInvitations,
  projectParticipationRequests,
  projects,
  projectSchedule,
  projectsTaken,
  scores,
  ticketAssignees,
  ticketComments,
  tickets,
  userActivitiesProgress,
  userCartera,
  userCredentials,
  userCustomFields,
  userInscriptionDetails,
  userLessonsProgress,
  userProgramPrice,
  users,
  userTimeTracking,
} from '~/server/db/schema';

export async function deleteUserWithRelations(userId: string) {
  try {
    console.log(`🗑️ Iniciando eliminación de usuario ${userId}...`);

    // ORDEN IMPORTANTE: De hijos a padres para evitar violaciones de FK

    // 1. Eliminar cronogramas de proyectos donde el usuario es responsable de actividades
    const userActivities = await db
      .select({ id: projectActivities.id })
      .from(projectActivities)
      .where(eq(projectActivities.responsibleUserId, userId));

    if (userActivities.length > 0) {
      await db
        .delete(projectSchedule)
        .where(
          or(...userActivities.map((a) => eq(projectSchedule.activityId, a.id)))
        );
    }

    // 2. Eliminar entregas de actividades de proyectos
    await db
      .delete(projectActivityDeliveries)
      .where(eq(projectActivityDeliveries.userId, userId));

    // 3. Eliminar actividades de proyectos donde es responsable
    await db
      .delete(projectActivities)
      .where(eq(projectActivities.responsibleUserId, userId));

    // 4. Eliminar solicitudes de participación en proyectos
    await db
      .delete(projectParticipationRequests)
      .where(
        or(
          eq(projectParticipationRequests.userId, userId),
          eq(projectParticipationRequests.respondedBy, userId)
        )
      );

    // 5. Eliminar invitaciones a proyectos
    await db
      .delete(projectInvitations)
      .where(
        or(
          eq(projectInvitations.invitedUserId, userId),
          eq(projectInvitations.invitedByUserId, userId)
        )
      );

    // 6. Eliminar proyectos tomados
    await db.delete(projectsTaken).where(eq(projectsTaken.userId, userId));

    // 7. Eliminar proyectos creados (esto también eliminará objetivos específicos por cascade)
    await db.delete(projects).where(eq(projects.userId, userId));

    // 8. Eliminar verificaciones de pagos (antes de eliminar pagos)
    const userPayments = await db
      .select({ id: pagos.id })
      .from(pagos)
      .where(eq(pagos.userId, userId));

    if (userPayments.length > 0) {
      await db
        .delete(pagoVerificaciones)
        .where(
          or(...userPayments.map((p) => eq(pagoVerificaciones.pagoId, p.id)))
        );
    }

    // 9. Eliminar pagos
    await db
      .delete(pagos)
      .where(or(eq(pagos.userId, userId), eq(pagos.receiptVerifiedBy, userId)));

    // 10. Eliminar precio personalizado de programas
    await db
      .delete(userProgramPrice)
      .where(eq(userProgramPrice.userId, userId));

    // 11. Eliminar cartera del usuario
    await db.delete(userCartera).where(eq(userCartera.userId, userId));

    // 12. Eliminar mensajes de chat
    await db.delete(chat_messages).where(eq(chat_messages.senderId, userId));

    // 13. Eliminar conversaciones
    await db.delete(conversations).where(eq(conversations.senderId, userId));

    // 14. Eliminar certificados
    await db.delete(certificates).where(eq(certificates.userId, userId));

    // 15. Eliminar asignaciones de tickets
    await db.delete(ticketAssignees).where(eq(ticketAssignees.userId, userId));

    // 16. Eliminar comentarios de tickets
    await db.delete(ticketComments).where(eq(ticketComments.userId, userId));

    // 17. Eliminar tickets
    await db.delete(tickets).where(eq(tickets.creatorId, userId));

    // 18. Eliminar notificaciones
    await db.delete(notifications).where(eq(notifications.userId, userId));

    // 19. Eliminar campos personalizados
    await db
      .delete(userCustomFields)
      .where(eq(userCustomFields.userId, userId));

    // 20. Eliminar notas de materias
    await db.delete(notas).where(eq(notas.userId, userId));

    // 21. Eliminar calificaciones de materias
    await db.delete(materiaGrades).where(eq(materiaGrades.userId, userId));

    // 22. Eliminar calificaciones de parámetros
    await db.delete(parameterGrades).where(eq(parameterGrades.userId, userId));

    // 23. Eliminar inscripciones a programas
    await db
      .delete(enrollmentPrograms)
      .where(eq(enrollmentPrograms.userId, userId));

    // 24. Eliminar progreso de actividades
    await db
      .delete(userActivitiesProgress)
      .where(eq(userActivitiesProgress.userId, userId));

    // 25. Eliminar progreso de lecciones
    await db
      .delete(userLessonsProgress)
      .where(eq(userLessonsProgress.userId, userId));

    // 26. Eliminar tiempo de seguimiento
    await db
      .delete(userTimeTracking)
      .where(eq(userTimeTracking.userId, userId));

    // 27. Eliminar anuncios para usuarios específicos
    await db
      .delete(anunciosUsuarios)
      .where(eq(anunciosUsuarios.userId, userId));

    // 28. Eliminar inscripciones a cursos
    await db.delete(enrollments).where(eq(enrollments.userId, userId));

    // 29. Eliminar cursos tomados
    await db.delete(coursesTaken).where(eq(coursesTaken.userId, userId));

    // 30. Eliminar preferencias
    await db.delete(preferences).where(eq(preferences.userId, userId));

    // 31. Eliminar puntajes
    await db.delete(scores).where(eq(scores.userId, userId));

    // 32. Eliminar detalles de inscripción
    await db
      .delete(userInscriptionDetails)
      .where(eq(userInscriptionDetails.userId, userId));

    // 33. Eliminar credenciales
    await db.delete(userCredentials).where(eq(userCredentials.userId, userId));

    // 34. Eliminar logs de email
    await db.delete(emailLogs).where(eq(emailLogs.userId, userId));

    // 35. FINALMENTE, eliminar el usuario
    await db.delete(users).where(eq(users.id, userId));

    console.log(
      `✅ Usuario ${userId} eliminado exitosamente con todas sus relaciones`
    );
    return { success: true };
  } catch (error) {
    console.error(`❌ Error eliminando usuario ${userId}:`, error);
    throw error;
  }
}

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

export async function getAdminUsers(query?: string) {
  const client = await clerkClient();

  const allUsers: {
    id: string;
    firstName?: string;
    lastName?: string;
    emailAddresses: { emailAddress: string; id: string }[];
    primaryEmailAddressId?: string;
    phoneNumbers?: { id: string; phoneNumber: string }[];
    primaryPhoneNumberId?: string;
    publicMetadata?: Record<string, unknown>;
  }[] = [];

  let offset = 0;
  const limit = 100;

  while (true) {
    const resp = await client.users.getUserList({ limit, offset });
    if (!resp.data.length) break;

    allUsers.push(
      ...resp.data.map((u) => ({
        id: u.id,
        firstName: u.firstName ?? undefined,
        lastName: u.lastName ?? undefined,
        emailAddresses: u.emailAddresses.map((e) => ({
          id: e.id,
          emailAddress: e.emailAddress,
        })),
        primaryEmailAddressId: u.primaryEmailAddressId ?? undefined,
        phoneNumbers:
          u.phoneNumbers?.map((p) => ({
            id: p.id,
            phoneNumber: p.phoneNumber,
          })) ?? [],
        primaryPhoneNumberId: u.primaryPhoneNumberId ?? undefined,
        publicMetadata: (u.publicMetadata ?? {}) as Record<string, unknown>,
      }))
    );

    offset += limit;
  }

  // 🔹 Traer teléfonos desde la BD por ID
  const clerkIds = allUsers.map((u) => u.id);
  const dbPhones = clerkIds.length
    ? await db
        .select({ id: users.id, phone: users.phone })
        .from(users)
        .where(inArray(users.id, clerkIds))
    : [];
  const phoneById = new Map<string, string>(
    dbPhones.map((r) => [r.id, (r.phone ?? '').trim()])
  );

  const simplified = allUsers.map((u) => {
    const phoneFromDb = phoneById.get(u.id) ?? '';

    const phoneFromClerk =
      (u.primaryPhoneNumberId &&
        u.phoneNumbers?.find((p) => p.id === u.primaryPhoneNumberId)
          ?.phoneNumber) ??
      u.phoneNumbers?.[0]?.phoneNumber ??
      '';

    const phoneFromMetadata =
      typeof u.publicMetadata?.phone === 'string'
        ? (u.publicMetadata.phone as string).trim()
        : '';

    // 👉 Preferimos BD > Clerk > Metadata
    const phone = phoneFromDb || phoneFromClerk || phoneFromMetadata;

    const role =
      typeof u.publicMetadata?.role === 'string'
        ? (u.publicMetadata.role as string).trim().toLowerCase()
        : 'estudiante';

    const status =
      typeof u.publicMetadata?.subscriptionStatus === 'string'
        ? (u.publicMetadata.subscriptionStatus as string)
        : typeof u.publicMetadata?.status === 'string'
          ? (u.publicMetadata.status as string)
          : 'activo';

    return {
      id: u.id,
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      email:
        u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)
          ?.emailAddress ?? '',
      role,
      status,
      phone, // 👈 ahora viene desde la BD si existe
    };
  });

  const filtered = query
    ? simplified.filter((user) =>
        `${user.firstName} ${user.lastName} ${user.email}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : simplified;

  console.table(
    filtered.map((u) => ({ id: u.id, email: u.email, phone: u.phone || '' }))
  );

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
    await deleteUserWithRelations(id);

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

interface ClerkErrorItem {
  code: string;
  meta?: { paramName?: string };
}
interface ClerkApiError {
  clerkError: true;
  errors: ClerkErrorItem[];
}

function isClerkApiError(e: unknown): e is ClerkApiError {
  if (typeof e !== 'object' || e === null) return false;
  const maybe = e as Record<string, unknown>;
  if (maybe.clerkError !== true) return false;

  const errs = maybe.errors;
  if (!Array.isArray(errs)) return false;

  return errs.every((it) => {
    if (typeof it !== 'object' || it === null) return false;
    return 'code' in (it as Record<string, unknown>);
  });
}

export async function createUser(
  firstName: string,
  lastName: string,
  email: string,
  role: string,
  subscriptionStatus = 'active',
  subscriptionEndDate?: string
) {
  try {
    // 1) Generar password que cumpla políticas
    const generatedPassword = generateSecurePassword();

    // 2) Normalizar email (Clerk trata emails case-insensitive, pero mejor en minúsculas)
    const emailNormalized = (email ?? '').trim().toLowerCase();

    // dentro de createUser(...)
    const takeFirst = (s?: string) => {
      const first = (s ?? '').split(' ').find((p) => p.trim().length > 0);
      return first ?? '';
    };

    const normalize = (s: string) =>
      s
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();

    const firstPiece = normalize(takeFirst(firstName));
    const lastPiece = normalize(takeFirst(lastName));

    let baseUsername = (firstPiece + lastPiece).replace(/[^a-z0-9_]/g, '');
    if (baseUsername.length < 4)
      baseUsername = (baseUsername + 'user').slice(0, 60);
    else baseUsername = baseUsername.slice(0, 60);

    // 4) Garantizar que el username sea único en Clerk
    const uniqueUsername = await generateUniqueUsername(baseUsername);

    // 5) Crear usuario en Clerk
    const client = await clerkClient();
    try {
      const newUser = await client.users.createUser({
        firstName,
        lastName,
        username: uniqueUsername, // <- OBLIGATORIO sin llaves extra
        password: generatedPassword,
        emailAddress: [emailNormalized],
        publicMetadata: {
          role,
          mustChangePassword: true,
          planType: 'Premium',
          subscriptionStatus: subscriptionStatus ?? 'inactive',
          subscriptionEndDate: subscriptionEndDate ?? null,
        },
      });

      return { user: newUser, generatedPassword };
    } catch (error: unknown) {
      if (isClerkApiError(error)) {
        console.error(
          '[CLERK 422] createUser errors:',
          JSON.stringify(error.errors, null, 2)
        );

        const emailExists = error.errors.some(
          (e) =>
            e.code === 'form_identifier_exists' &&
            e.meta?.paramName === 'email_address'
        );
        if (emailExists) {
          return null;
        }
      }
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

    const newMetadata = {
      ...user.publicMetadata,
      subscriptionStatus: status,
      status,
    };

    // 3. Escribir el objeto de metadatos completo y actualizado
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
      const existingMetadata = metadataMap.get(id) ?? {};

      const newMetadata = {
        ...existingMetadata,
        subscriptionStatus: status,
        status,
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
  instructors: string[]; // Array de IDs de instructores (many-to-many)
  creatorId: string;
  createdAt: Date | string; // 🔹 Permitir `string` porque en errores previos llegaba como `string`
  updatedAt?: Date | string; // 🔹 Hacer opcional y permitir `string` porque en errores previos faltaba
  rating?: number | null;
  courseTypeId?: number | null; // 🔹 Add courseTypeId as an optional property
  isActive?: boolean | null; // 🔹 Allow null for isActive
  categoryName?: string; // 🔹 Add categoryName as an optional property
  requiresProgram?: boolean | null;
  programas?: { id: number; title: string }[];
  instructorName?: string; // Add instructorName as an optional property
  coverVideoCourseKey?: string | null;
  individualPrice?: number | null; // <-- añade esto
  certificationTypeId?: number | null; // 🔹 Add certificationTypeId as an optional property
  scheduleOptionId?: number | null; // 🔹 Add scheduleOptionId for horario
  spaceOptionId?: number | null; // 🔹 Add spaceOptionId for espacios
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
          courseTypeId: courses.courseTypeId,
          certificationTypeId: courses.certificationTypeId,
          individualPrice: courses.individualPrice,
          coverVideoCourseKey: courses.coverVideoCourseKey,
          scheduleOptionId: courses.scheduleOptionId,
          spaceOptionId: courses.spaceOptionId,
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
          instructors: [course.instructor], // Add instructors array for compatibility
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
        instructor: courseData.instructors[0] ?? '',
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
    console.log('==== 🟦 INICIANDO updateCourse ====');
    console.log('courseId:', courseId);
    console.log('courseData completo:', JSON.stringify(courseData, null, 2));
    console.log(
      'scheduleOptionId recibido:',
      courseData.scheduleOptionId,
      'tipo:',
      typeof courseData.scheduleOptionId
    );
    console.log(
      'spaceOptionId recibido:',
      courseData.spaceOptionId,
      'tipo:',
      typeof courseData.spaceOptionId
    );
    console.log(
      'certificationTypeId recibido:',
      courseData.certificationTypeId,
      'tipo:',
      typeof courseData.certificationTypeId
    );

    const updateData = {
      title: courseData.title,
      description: courseData.description ?? null,
      coverImageKey: courseData.coverImageKey ?? null,
      coverVideoCourseKey: courseData.coverVideoCourseKey ?? null,
      categoryid: courseData.categoryid,
      modalidadesid: courseData.modalidadesid,
      nivelid: courseData.nivelid,
      instructor: courseData.instructors[0] ?? '',
      creatorId: courseData.creatorId,
      rating: courseData.rating ?? 0,
      courseTypeId: courseData.courseTypeId ?? null,
      requiresProgram: courseData.requiresProgram ?? false,
      isActive: courseData.isActive ?? true,
      createdAt: new Date(courseData.createdAt),
      updatedAt: courseData.updatedAt
        ? new Date(courseData.updatedAt)
        : undefined,
      scheduleOptionId: courseData.scheduleOptionId ?? null,
      spaceOptionId: courseData.spaceOptionId ?? null,
      certificationTypeId: courseData.certificationTypeId ?? null,
    };

    console.log('📤 updateData.scheduleOptionId:', updateData.scheduleOptionId);
    console.log('📤 updateData.spaceOptionId:', updateData.spaceOptionId);
    console.log(
      '📤 updateData.certificationTypeId:',
      updateData.certificationTypeId
    );

    console.log('🚀 Ejecutando db.update(courses).set()...');
    const result = await db
      .update(courses)
      .set(updateData)
      .where(eq(courses.id, courseId))
      .returning();

    console.log('✅ UPDATE COMPLETADO');
    console.log('✅ result[0].scheduleOptionId:', result[0]?.scheduleOptionId);
    console.log('✅ result[0].spaceOptionId:', result[0]?.spaceOptionId);
    console.log(
      '✅ result[0].certificationTypeId:',
      result[0]?.certificationTypeId
    );

    return result;
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

function formatDateToClerk(date?: string | null): string | null {
  if (!date) return null;

  const baseDate = new Date(date);
  if (isNaN(baseDate.getTime())) return null;

  // Obtener hora actual
  const now = new Date();
  baseDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

  return baseDate.toISOString().slice(0, 19).replace('T', ' ');
}

export async function updateUserInClerk({
  userId,
  firstName,
  lastName,
  role,
  status,
  permissions,
  subscriptionEndDate,
  planType,
  profesion,
  descripcion,
  profileImageKey,
}: {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  permissions: string[];
  subscriptionEndDate?: string;
  planType?: string;
  profesion?: string;
  descripcion?: string;
  profileImageKey?: string;
}) {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    console.log('📥 Fecha original recibida:', subscriptionEndDate);
    const formattedEndDate = formatDateToClerk(subscriptionEndDate);
    console.log('📤 Fecha formateada para Clerk:', formattedEndDate);
    // Normalizar status: convertir "Activo" (u otros similares) a "active"

    const hasSubscriptionDate = !!subscriptionEndDate;

    let normalizedStatus =
      status?.toLowerCase() === 'activo'
        ? 'active'
        : (status?.toLowerCase() ?? 'active');

    // Si hay fecha de suscripción y el status es "inactive", forzamos a "active"
    if (hasSubscriptionDate && normalizedStatus === 'inactive') {
      normalizedStatus = 'active';
    }

    const newMetadata = {
      ...(user.publicMetadata ?? {}),
      role: (role || 'estudiante') as
        | 'admin'
        | 'educador'
        | 'super-admin'
        | 'estudiante',
      // normaliza planType a uno permitido
      planType:
        planType && ['none', 'Pro', 'Premium', 'Enterprise'].includes(planType)
          ? planType
          : 'none',
      // escribe ambas: compat para UIs viejas y nuevas
      subscriptionStatus: normalizedStatus,
      status: normalizedStatus,
      subscriptionEndDate: formattedEndDate,
      permissions: Array.isArray(permissions) ? permissions : [],
    };

    await client.users.updateUser(userId, {
      firstName,
      lastName,
      publicMetadata: newMetadata,
    });

    await db
      .update(users)
      .set({
        name: `${firstName} ${lastName}`,
        role: (role || 'estudiante') as
          | 'estudiante'
          | 'educador'
          | 'admin'
          | 'super-admin',
        subscriptionStatus: normalizedStatus,
        planType:
          planType &&
          ['none', 'Pro', 'Premium', 'Enterprise'].includes(planType)
            ? (planType as 'Pro' | 'Premium' | 'Enterprise' | 'none')
            : 'none',
        subscriptionEndDate: formattedEndDate
          ? new Date(formattedEndDate)
          : null,
        profesion: role === 'educador' ? profesion || null : null,
        descripcion: role === 'educador' ? descripcion || null : null,
        profileImageKey: role === 'educador' ? profileImageKey || null : null,
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
