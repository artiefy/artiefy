'use server';

import { clerkClient } from '@clerk/nextjs/server'; // Clerk Client
import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  categories,
  courses,
  enrollmentPrograms,
  enrollments,
  modalidades,
  nivel as nivel,
  programas,
  userCustomFields,
  users,
} from '~/server/db/schema';

import type { BaseCourse, Program } from '~/types';

function formatDateToClerk(date: Date): string {
  const year = date.getFullYear();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${day}-${month} ${hours}:${minutes}:${seconds}`;
}
export interface Materia {
  id: number;
  title: string;
  description: string;
  programaId: number;
  courseId: number;
  courseid: number;
  curso: BaseCourse | undefined;
}

export interface MassiveUserUpdateInput {
  userIds: string[];
  subscriptionEndDate?: string | null;
  planType?: 'none' | 'Pro' | 'Premium' | 'Enterprise';
  status?: string;
  permissions?: string[];
  programId?: number;
  courseId?: number;
  customFields?: Record<string, string>;
}

// Función para verificar el rol de admin y obtener usuarios
export async function getAdminUsers(query: string | undefined) {
  console.log('DEBUG: Ejecutando getAdminUsers con query ->', query);
  const client = await clerkClient();
  const usersResponse = await client.users.getUserList({ limit: 100 });
  const users = usersResponse.data;

  const filteredUsers = query
    ? users.filter(
        (user) =>
          (user.firstName ?? '').toLowerCase().includes(query.toLowerCase()) ||
          (user.lastName ?? '').toLowerCase().includes(query.toLowerCase()) ||
          user.emailAddresses.some((email) =>
            email.emailAddress.toLowerCase().includes(query.toLowerCase())
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
    role: user.publicMetadata.role ?? 'estudiante',
    status: user.publicMetadata.status ?? 'activo', // ✅ Agregar estado con valor por defecto
  }));

  return simplifiedUsers;
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
    await client.users.updateUser(id, {
      publicMetadata: { role },
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

    // Update in database
    await db
      .update(users)
      .set({
        role: 'estudiante' as const,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    console.log(`DEBUG: Rol eliminado para el usuario ${id}`);
  } catch (error) {
    console.error('Error al eliminar rol:', error);
    throw new Error('No se pudo eliminar el rol');
  }
}

export async function deleteUser(id: string) {
  try {
    // Delete from Clerk
    const client = await clerkClient();
    await client.users.deleteUser(id);

    // Delete from database
    await db.delete(users).where(eq(users.id, id));

    console.log(`DEBUG: Usuario ${id} eliminado correctamente de Clerk y BD`);
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

export async function createUser(
  firstName: string,
  lastName: string,
  email: string,
  role: string
) {
  try {
    // 🔹 Obtener la primera letra del primer nombre y primer apellido
    const firstInitial = firstName.charAt(0).toLowerCase();
    const lastInitial = lastName?.split(' ')[0]?.charAt(0).toLowerCase() || 'x'; // 'x' si no hay apellido

    // 🔹 Generar la contraseña base (iniciales del nombre y apellido)
    let generatedPassword = `${firstInitial}${lastInitial}`;

    // 🔹 Si la contraseña es menor a 8 caracteres, agregar "12345678" hasta completar
    if (generatedPassword.length < 8) {
      generatedPassword += '12345678'.slice(0, 8 - generatedPassword.length);
    }

    // 🔹 Agregar un número aleatorio para evitar que la contraseña sea "pwned"
    const randomDigits = Math.floor(10 + Math.random() * 90); // Número entre 10 y 99
    generatedPassword += randomDigits;

    // 🔹 Generar un nombre de usuario válido (mínimo 4 caracteres, máximo 64)
    let username = `${firstName}${lastName?.split(' ')[0] || ''}`.toLowerCase();
    if (username.length < 4) username += 'user';
    username = username.slice(0, 64);

    const client = await clerkClient();
    const newUser = await client.users.createUser({
      firstName,
      lastName,
      username,
      password: generatedPassword,
      emailAddress: [email],
      publicMetadata: { role, mustChangePassword: true },
    });

    console.log(
      `DEBUG: Usuario ${newUser.id} creado con contraseña: ${generatedPassword}`
    );
    return { user: newUser, generatedPassword };
  } catch (error: unknown) {
    console.error(
      'DEBUG: Error al crear usuario en Clerk:',
      JSON.stringify(error, null, 2)
    );
    throw new Error(
      (error as { message: string }).message || 'No se pudo crear el usuario'
    );
  }
}

export async function updateUserStatus(id: string, status: string) {
  try {
    // Update in Clerk
    const client = await clerkClient();
    await client.users.updateUser(id, {
      publicMetadata: { status },
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

    // Update both Clerk and database for each user
    for (const id of userIds) {
      // Update in Clerk
      await client.users.updateUser(id, {
        publicMetadata: { status },
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

export async function updateEnrollmentStatus(
  id: string,
  enrollmentStatus: 'Nuevo' | 'Graduando' | 'Egresado' | 'Aplaza' | 'Retirado'
) {
  try {
    await db
      .update(users)
      .set({
        enrollmentStatus,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    console.log(
      `DEBUG: Estado de inscripción del usuario ${id} actualizado a ${enrollmentStatus}`
    );
  } catch (error) {
    console.error('Error al actualizar estado de inscripción:', error);
    throw new Error('No se pudo actualizar el estado de inscripción');
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
  courseTypeId?: number | null; // 🔹 Add courseTypeId as optional and nullable
  isActive?: boolean; // 🔹 Add isActive as optional
}

export async function getCourses() {
  try {
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  } catch (error) {
    console.error('❌ Error al obtener cursos:', error);
    return [];
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
    // Insertar el curso (mantenemos el campo instructor por compatibilidad, usar el primer instructor si existe)
    const [newCourse] = await db
      .insert(courses)
      .values({
        title: courseData.title,
        categoryid: courseData.categoryid,
        instructor: courseData.instructors[0] ?? '', // Primer instructor o string vacío por compatibilidad
        modalidadesid: courseData.modalidadesid,
        nivelid: courseData.nivelid,
        creatorId: courseData.creatorId || 'defaultCreatorId',
        createdAt: new Date(courseData.createdAt),
        updatedAt: courseData.updatedAt
          ? new Date(courseData.updatedAt)
          : new Date(),
        courseTypeId: courseData.courseTypeId ?? 1,
        isActive: courseData.isActive ?? true,
      })
      .returning();

    // Insertar relaciones instructor-curso en la tabla course_instructors
    if (newCourse && courseData.instructors.length > 0) {
      const { courseInstructors } = await import('~/server/db/schema');

      await db.insert(courseInstructors).values(
        courseData.instructors.map((instructorId) => ({
          courseId: newCourse.id,
          instructorId,
          createdAt: new Date(),
        }))
      );
    }

    return [newCourse];
  } catch (error) {
    console.error('❌ Error al crear curso:', error);
    throw new Error('No se pudo crear el curso');
  }
}

// ✅ Función corregida con `courseId: number`
export async function updateCourse(courseId: number, courseData: CourseData) {
  try {
    const cleanedData = {
      ...courseData,
      instructor: courseData.instructors[0] ?? '', // Mantener compatibilidad con primer instructor
      createdAt: new Date(courseData.createdAt),
      updatedAt: courseData.updatedAt
        ? new Date(courseData.updatedAt)
        : new Date(),
      courseTypeId:
        typeof courseData.courseTypeId === 'number'
          ? courseData.courseTypeId
          : undefined,
    };

    const result = await db
      .update(courses)
      .set(cleanedData)
      .where(eq(courses.id, courseId))
      .returning();

    // Actualizar relaciones de instructores: eliminar las existentes y crear nuevas
    if (courseData.instructors && courseData.instructors.length > 0) {
      const { courseInstructors } = await import('~/server/db/schema');

      // Eliminar relaciones existentes
      await db
        .delete(courseInstructors)
        .where(eq(courseInstructors.courseId, courseId));

      // Insertar nuevas relaciones
      await db.insert(courseInstructors).values(
        courseData.instructors.map((instructorId) => ({
          courseId,
          instructorId,
          createdAt: new Date(),
        }))
      );
    }

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

export async function updateUserInClerk({
  userId,
  firstName,
  lastName,
  role,
  status,
  permissions,
}: {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  permissions: string[];
}) {
  try {
    const client = await clerkClient();

    // 🔥 Aseguramos que Clerk reciba TODOS los valores correctamente
    const updatedUser = await client.users.updateUser(userId, {
      firstName,
      lastName,
      publicMetadata: {
        role: role || 'estudiante', // Valor por defecto si no existe
        status: status || 'activo',
        permissions: Array.isArray(permissions) ? permissions : [], // Validar array
      },
    });

    console.log(
      `✅ Usuario ${userId} actualizado correctamente en Clerk.`,
      updatedUser
    );
    return true;
  } catch (error) {
    console.error('❌ Error al actualizar usuario en Clerk:', error);
    return false;
  }
}

export interface ProgramData {
  id?: number;
  title: string;
  description?: string | null;
  coverImageKey?: string | null;
  categoryid: number;
  creatorId: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  rating?: number | null;
}

// Obtener todos los programas
export async function getPrograms(): Promise<ProgramData[]> {
  return db.select().from(programas).execute();
}

// Obtener un programa por ID
export const getProgramById = async (id: string) => {
  // Buscar el programa
  const program = await db.query.programas.findFirst({
    where: eq(programas.id, parseInt(id, 10)),
    with: {
      materias: {
        with: {
          curso: true,
        },
      },
    },
  });

  if (!program) {
    throw new Error('Program not found');
  }

  // Obtener la cantidad de inscripciones
  const enrollmentCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(enrollmentPrograms)
    .where(eq(enrollmentPrograms.programaId, parseInt(id, 10)))
    .then((result) => Number(result[0]?.count ?? 0));

  // Transformar materias con sus cursos
  const transformedMaterias: Materia[] = program.materias.map((materia) => ({
    id: materia.id,
    title: materia.title,
    description: materia.description ?? '',
    programaId: materia.programaId ?? 0,
    courseId: materia.curso?.id ?? 0,
    courseid: materia.curso?.id ?? 0,
    curso: materia.curso
      ? {
          ...materia.curso,
          Nivelid: materia.curso.nivelid,
          totalStudents: enrollmentCount,
          lessons: [],
        }
      : undefined, // Ahora sí encaja con curso: BaseCourse | undefined
  }));

  // Armar el objeto final del programa
  const programData: Program = {
    id: program.id.toString(),
    title: program.title,
    description: program.description,
    coverImageKey: program.coverImageKey,
    createdAt: program.createdAt,
    updatedAt: program.updatedAt,
    creatorId: program.creatorId,
    rating: program.rating,
    categoryid: program.categoryid,
    materias: transformedMaterias,
  };

  return programData;
};

// Crear un nuevo programa
export async function createProgram(
  programData: Partial<ProgramData>
): Promise<ProgramData> {
  const result = await db
    .insert(programas)
    .values({
      title: programData.title ?? '',
      categoryid: programData.categoryid!,
      creatorId: programData.creatorId!,
      description: programData.description ?? null,
      coverImageKey: programData.coverImageKey ?? null,
      createdAt: programData.createdAt
        ? new Date(programData.createdAt)
        : new Date(),
      updatedAt: programData.updatedAt
        ? new Date(programData.updatedAt)
        : new Date(),
      rating: programData.rating ?? null,
    })
    .returning({
      id: programas.id,
      title: programas.title,
      description: programas.description,
      coverImageKey: programas.coverImageKey,
      categoryid: programas.categoryid,
      creatorId: programas.creatorId,
      createdAt: programas.createdAt,
      updatedAt: programas.updatedAt,
      rating: programas.rating,
    })
    .execute();

  return result[0];
}

// Actualizar un programa
export async function updateProgram(
  programId: number,
  programData: Partial<ProgramData>
): Promise<ProgramData> {
  const result = await db
    .update(programas)
    .set({
      title: programData.title,
      description: programData.description,
      coverImageKey: programData.coverImageKey,
      categoryid: programData.categoryid,
      creatorId: programData.creatorId,
      updatedAt: new Date(),
      rating: programData.rating,
    })
    .where(eq(programas.id, programId))
    .returning({
      id: programas.id,
      title: programas.title,
      description: programas.description,
      coverImageKey: programas.coverImageKey,
      categoryid: programas.categoryid,
      creatorId: programas.creatorId,
      createdAt: programas.createdAt,
      updatedAt: programas.updatedAt,
      rating: programas.rating,
    })
    .execute();
  return result[0];
}

// Eliminar un programa
export async function deleteProgram(programId: number): Promise<void> {
  await db.delete(programas).where(eq(programas.id, programId)).execute();
}

export {};

// Añade/actualiza el tipo para incluir TODOS los users.* que manejas en la UI
export interface FullUserUpdateInput {
  userId: string;

  // básicos
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'educador' | 'super-admin' | 'estudiante';
  status?: 'active' | 'inactive' | 'activo' | 'inactivo' | 'no verificado';
  email?: string;
  permissions?: string[];

  // contacto / perfil
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  birthDate?: string | Date | null;

  // plan / fechas
  planType?: 'none' | 'Pro' | 'Premium' | 'Enterprise' | null;
  purchaseDate?: string | Date | null;
  subscriptionEndDate?: string | Date | null;

  // ====== users.* (inscripción / cartera) ======
  document?: string | null;
  modalidad?: string | null;
  inscripcionValor?: number | string | null;
  paymentMethod?: string | null;

  cuota1Fecha?: string | Date | null;
  cuota1Metodo?: string | null;
  cuota1Valor?: number | string | null;

  valorPrograma?: number | string | null;

  identificacionTipo?: string | null;
  identificacionNumero?: string | null;
  nivelEducacion?: string | null;
  tieneAcudiente?: string | null;
  acudienteNombre?: string | null;
  acudienteContacto?: string | null;
  acudienteEmail?: string | null;

  programa?: string | null;
  fechaInicio?: string | Date | null;
  comercial?: string | null;
  sede?: string | null;
  horario?: string | null;
  numeroCuotas?: string | null;
  pagoInscripcion?: string | null;
  pagoCuota1?: string | null;

  idDocKey?: string | null;
  utilityBillKey?: string | null;
  diplomaKey?: string | null;
  pagareKey?: string | null;
  inscripcionOrigen?: string | null;
  carteraStatus?: string | null;
  enrollmentStatus?:
    | 'Nuevo'
    | 'Graduando'
    | 'Egresado'
    | 'Aplaza'
    | 'Retirado'
    | null;
  // matriculas
  programId?: number | null;
  courseId?: number | null;

  // campos personalizados extra (si los sigues usando)
  customFields?: Record<string, string>;
}

function formatDateForClerk(date?: string | Date | null): string | null {
  if (!date) return null;

  const baseDate =
    date instanceof Date ? new Date(date) : new Date(String(date));
  if (isNaN(baseDate.getTime())) return null;

  // Obtener hora actual
  const now = new Date();
  baseDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

  return baseDate.toISOString().slice(0, 19).replace('T', ' ');
}
export async function updateFullUser(
  input: FullUserUpdateInput
): Promise<boolean> {
  const {
    userId,
    firstName,
    lastName,
    role,
    status,
    email,
    permissions,
    phone,
    address,
    city,
    country,
    birthDate,
    planType,
    purchaseDate,
    subscriptionEndDate,
    customFields,

    // ====== users.* (inscripción / cartera) ======
    document,
    modalidad,

    inscripcionValor,
    paymentMethod,

    cuota1Fecha,
    cuota1Metodo,
    cuota1Valor,

    valorPrograma,

    identificacionTipo,
    identificacionNumero,
    nivelEducacion,
    tieneAcudiente,
    acudienteNombre,
    acudienteContacto,
    acudienteEmail,

    programa,
    fechaInicio,
    comercial,
    sede,
    horario,
    numeroCuotas,
    pagoInscripcion,
    pagoCuota1,

    idDocKey,
    utilityBillKey,
    diplomaKey,
    pagareKey,

    inscripcionOrigen,
    carteraStatus,
    enrollmentStatus,

    // matriculas
    programId,
    courseId,
  } = input;

  const client = await clerkClient();
  let userExistsInClerk = true;
  let existingMetadata = {};

  try {
    const user = await client.users.getUser(userId);
    existingMetadata = user.publicMetadata || {};
  } catch (err: unknown) {
    const error = err as { errors?: { code?: string }[]; status?: number };

    if (error.errors?.[0]?.code === 'not_found' || error.status === 404) {
      userExistsInClerk = false;
    } else {
      console.error('❌ Error obteniendo usuario de Clerk:', err);
      return false;
    }
  }

  const hasSubscriptionDate = !!subscriptionEndDate;
  let normalizedStatus =
    status?.toLowerCase() === 'activo'
      ? 'active'
      : (status?.toLowerCase() ?? 'active');

  if (hasSubscriptionDate && normalizedStatus === 'inactive') {
    normalizedStatus = 'active';
  }

  const formattedEndDate = formatDateForClerk(subscriptionEndDate);

  // Normalizadores seguros (no rompen null/undefined)
  const toNumOrNull = (v: unknown): number | null => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v === 'string') {
      const n = Number(v.replace(/[^\d.-]/g, ''));
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const toDateOrNull = (v: unknown): Date | null => {
    if (v == null || v === '') return null;
    const d = v instanceof Date ? v : new Date(v as string);
    return isNaN(d.getTime()) ? null : d;
  };

  const toLowerEnum = (v: unknown): string | null =>
    typeof v === 'string' ? v.trim().toLowerCase() : null;

  try {
    if (userExistsInClerk) {
      // (opcional) sanear metadata para evitar 422
      const newMetadataRaw = {
        ...existingMetadata,
        role: (role ?? 'estudiante') as
          | 'admin'
          | 'educador'
          | 'super-admin'
          | 'estudiante',
        planType: planType ?? 'none',
        subscriptionStatus: normalizedStatus,
        subscriptionEndDate: formattedEndDate ?? null,
        permissions: Array.isArray(permissions) ? permissions : [],

        // opcional, útil para ver datos en el Dashboard de Clerk:
        inscripcionOrigen: toLowerEnum(inscripcionOrigen),
        carteraStatus: toLowerEnum(carteraStatus),
        modalidad: modalidad ?? null,
        paymentMethod: paymentMethod ?? null,
        programa: programa ?? null,
      };

      const safeMetadata = JSON.parse(JSON.stringify(newMetadataRaw));

      // 1) Actualiza nombre
      await client.users.updateUser(userId, { firstName, lastName });

      // 2) Marca el email como verificado y primario (como en la UI)
      if (email) {
        const u = await client.users.getUser(userId);
        const target = email.toLowerCase();
        const ea = u.emailAddresses.find(
          (e) => e.emailAddress.toLowerCase() === target
        );

        if (ea) {
          // ✅ ya existe: hazlo verificado y primario
          await client.emailAddresses.updateEmailAddress(ea.id, {
            verified: true,
            primary: true,
          });
        } else {
          // ✅ no existe: créalo directamente como verificado y primario
          await client.emailAddresses.createEmailAddress({
            userId,
            emailAddress: email,
            verified: true,
            primary: true,
          });
        }
      }

      // 3) Metadata
      await client.users.updateUser(userId, { publicMetadata: safeMetadata });
    }

    await db
      .update(users)
      .set({
        // básicos
        name: `${firstName ?? ''} ${lastName ?? ''}`.trim(),
        role: role!,
        subscriptionStatus: status, // guardas "activo / inactivo / no verificado" si así lo usas en tu UI
        planType: ['none', 'Pro', 'Premium', 'Enterprise'].includes(
          planType ?? ''
        )
          ? planType!
          : null,
        email: email,

        // contacto / perfil
        phone: phone ?? null,
        address: address ?? null,
        city: city ?? null,
        country: country ?? null,
        birthDate: birthDate ? toDateOrNull(birthDate)?.toISOString() : null,

        // plan / fechas
        purchaseDate: purchaseDate ? toDateOrNull(purchaseDate) : null,
        subscriptionEndDate: formattedEndDate
          ? new Date(formattedEndDate)
          : null,

        // ====== users.* (inscripción / cartera) ======
        document: document ?? null,
        modalidad: modalidad ?? null,

        inscripcionValor: toNumOrNull(inscripcionValor),
        paymentMethod: paymentMethod ?? null,

        cuota1Fecha: cuota1Fecha
          ? toDateOrNull(cuota1Fecha)?.toISOString()
          : null,
        cuota1Metodo: cuota1Metodo ?? null,
        cuota1Valor: toNumOrNull(cuota1Valor),

        valorPrograma: toNumOrNull(valorPrograma),

        identificacionTipo: identificacionTipo ?? null,
        identificacionNumero: identificacionNumero ?? null,
        nivelEducacion: nivelEducacion ?? null,
        tieneAcudiente: tieneAcudiente ?? null,
        acudienteNombre: acudienteNombre ?? null,
        acudienteContacto: acudienteContacto ?? null,
        acudienteEmail: acudienteEmail ?? null,

        programa: programa ?? null,
        fechaInicio: toDateOrNull(fechaInicio)?.toISOString() ?? null,
        comercial: comercial ?? null,
        sede: sede ?? null,
        horario: horario ?? null,
        numeroCuotas: numeroCuotas ?? null,
        pagoInscripcion: pagoInscripcion ?? null,
        pagoCuota1: pagoCuota1 ?? null,

        idDocKey: idDocKey ?? null,
        utilityBillKey: utilityBillKey ?? null,
        diplomaKey: diplomaKey ?? null,
        pagareKey: pagareKey ?? null,

        inscripcionOrigen: ((): 'formulario' | 'artiefy' | null => {
          const v = toLowerEnum(inscripcionOrigen);
          if (v === 'formulario' || v === 'artiefy') return v;
          return null;
        })(),

        enrollmentStatus: (():
          | 'Nuevo'
          | 'Graduando'
          | 'Egresado'
          | 'Aplaza'
          | 'Retirado'
          | null => {
          const validStatuses = [
            'Nuevo',
            'Graduando',
            'Egresado',
            'Aplaza',
            'Retirado',
          ];
          const trimmed = (enrollmentStatus ?? '').toString().trim();
          if (trimmed && validStatuses.includes(trimmed)) {
            return trimmed as
              | 'Nuevo'
              | 'Graduando'
              | 'Egresado'
              | 'Aplaza'
              | 'Retirado';
          }
          return null;
        })(),

        // meta
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    if (customFields && Object.keys(customFields).length > 0) {
      for (const [key, value] of Object.entries(customFields)) {
        const existing = await db
          .select()
          .from(userCustomFields)
          .where(eq(userCustomFields.userId, userId))
          .then((rows) => rows.find((r) => r.fieldKey === key));

        if (existing) {
          await db
            .update(userCustomFields)
            .set({
              fieldValue: value,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(userCustomFields.userId, userId),
                eq(userCustomFields.fieldKey, key)
              )
            );
        } else {
          await db.insert(userCustomFields).values({
            userId,
            fieldKey: key,
            fieldValue: value,
          });
        }
      }
    }
    console.log(
      `usuario en programa: userId=${userId}, programaId=${input.programId}`
    );

    console.log(
      `usuario en programa: userId=${userId}, programaId=${programId}`
    );
    if (programId != null) {
      console.log(
        `📝 Matriculando usuario en programa: userId=${userId}, programaId=${programId}`
      );
      await db.insert(enrollmentPrograms).values({
        userId,
        programaId: programId,
        enrolledAt: new Date(),
        completed: false,
      });
    }

    if (courseId != null) {
      console.log(
        `📝 Matriculando usuario en curso: userId=${userId}, courseId=${courseId}`
      );
      const exists = await db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.userId, userId),
            eq(enrollments.courseId, courseId)
          )
        )
        .limit(1);
      if (exists.length === 0) {
        await db.insert(enrollments).values({
          userId,
          courseId: courseId,
          enrolledAt: new Date(),
          completed: false,
        });
      }

      // 3) Actualiza en tu base de datos
      await db
        .update(users)
        .set({
          planType: 'Premium',
          subscriptionStatus: 'active',
          subscriptionEndDate: subscriptionEndDate
            ? toDateOrNull(subscriptionEndDate)
            : null,
        })
        .where(eq(users.id, userId))
        .execute();

      // 4) Actualiza el metadata en Clerk
      const clerk = await clerkClient();
      const formattedEndDateStr = subscriptionEndDate
        ? formatDateToClerk(new Date(String(subscriptionEndDate)))
        : null;
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          planType: 'Premium',
          subscriptionStatus: 'active',
          subscriptionEndDate: formattedEndDateStr,
        },
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Error actualizando datos en BD:', error);
    return false;
  }
}

export async function updateMultipleUsers(
  input: MassiveUserUpdateInput
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = [];
  const failed: string[] = [];

  for (const userId of input.userIds) {
    // Obtener datos actuales del usuario desde la base de datos
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      failed.push(userId);
      continue;
    }

    const allowedStatuses = [
      'active',
      'inactive',
      'activo',
      'inactivo',
      'no verificado',
    ] as const;
    const rawStatus = input.status ?? user.subscriptionStatus ?? 'active';
    const statusValue = (
      allowedStatuses.includes(rawStatus as (typeof allowedStatuses)[number])
        ? rawStatus
        : 'active'
    ) as 'active' | 'inactive' | 'activo' | 'inactivo' | 'no verificado';

    const result = await updateFullUser({
      userId,
      firstName: user.name?.split(' ')[0] ?? 'Usuario',
      lastName: user.name?.split(' ').slice(1).join(' ') ?? 'Desconocido',
      email: user.email ?? '', // <-- Add email property from user object
      role: user.role ?? 'estudiante',
      status: statusValue,
      permissions: input.permissions ?? [],
      phone: user.phone ?? null,
      address: user.address ?? null,
      city: user.city ?? null,
      country: user.country ?? null,
      birthDate: user.birthDate ?? null,
      planType: input.planType ?? user.planType ?? 'none',
      purchaseDate: user.purchaseDate?.toISOString() ?? null,
      subscriptionEndDate:
        input.subscriptionEndDate ??
        user.subscriptionEndDate?.toISOString() ??
        null,
      customFields: input.customFields ?? {},
      programId: input.programId,
      courseId: input.courseId,
    });
    if (result) success.push(userId);
    else failed.push(userId);
  }

  return { success, failed };
}
