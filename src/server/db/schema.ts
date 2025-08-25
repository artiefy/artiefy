import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';

// Tabla de usuarios (con soporte para Clerk)
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    role: text('role', {
      enum: ['estudiante', 'educador', 'admin', 'super-admin'],
    }).notNull(),
    name: text('name'),
    email: text('email').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    phone: text('phone'),
    country: text('country'),
    city: text('city'),
    address: text('address'),
    age: integer('age'),
    birthDate: date('birth_date'),
    subscriptionStatus: text('subscription_status')
      .default('inactive')
      .notNull(),
    subscriptionEndDate: timestamp('subscription_end_date', {
      withTimezone: true,
      mode: 'date',
    }),
    planType: text('plan_type', {
      enum: ['none', 'Pro', 'Premium', 'Enterprise'], // Actualizar los valores exactos
    }),
    purchaseDate: timestamp('purchase_date', {
      withTimezone: true,
      mode: 'date',
    }),
  },
  (table) => [unique('users_email_role_unique').on(table.email, table.role)]
);

// Tabla de categorías
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  is_featured: boolean('is_featured').default(false),
});

// Tabla de nivel
export const nivel = pgTable('nivel', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
});

// Tabla de cursos
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  coverImageKey: text('cover_image_key').default(sql`NULL`), // Changed from .default(null)
  coverVideoCourseKey: text('cover_video_course_key').default(sql`NULL`),
  categoryid: integer('categoryid')
    .references(() => categories.id)
    .notNull(),
  instructor: text('instructor').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  creatorId: text('creator_id')
    .references(() => users.id)
    .notNull(),
  rating: real('rating').default(0),
  modalidadesid: integer('modalidadesid')
    .references(() => modalidades.id)
    .notNull(),
  nivelid: integer('nivelid')
    .references(() => nivel.id)
    .notNull(),
  courseTypeId: integer('course_type_id')
    .references(() => courseTypes.id)
    .default(sql`NULL`),
  individualPrice: integer('individual_price'),
  requiresProgram: boolean('requires_program').default(false),
  isActive: boolean('is_active').default(true),
  is_top: boolean('is_top').default(false),
  is_featured: boolean('is_featured').default(false),
});

// Tabla de tipos de actividades
export const typeActi = pgTable('type_acti', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
});

// Tabla de actividades
export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  typeid: integer('type_id')
    .references(() => typeActi.id)
    .notNull(),
  lessonsId: integer('lessons_id')
    .references(() => lessons.id)
    .notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  revisada: boolean('revisada').default(false),
  parametroId: integer('parametro_id').references(() => parametros.id),
  porcentaje: integer('porcentaje'),
  fechaMaximaEntrega: timestamp('fecha_maxima_entrega'),
});

// Tabla de inscripciones
export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  courseId: integer('course_id')
    .references(() => courses.id)
    .notNull(),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  completed: boolean('completed').default(false),
  isPermanent: boolean('is_permanent').default(false).notNull(),
});

// Tabla de preferencias
export const preferences = pgTable('preferences', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  area_cono: text('area_cono'),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  categoryid: integer('categoryid')
    .references(() => categories.id)
    .notNull(),
});

// Tabla de lecciones
export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(), // ID autoincremental de la lección
  title: varchar('title', { length: 255 }).notNull(), // Título de la lección
  description: text('description'), // Descripción de la lección
  duration: integer('duration').notNull(),
  coverImageKey: text('cover_image_key').notNull(), // Clave de la imagen en S3
  coverVideoKey: text('cover_video_key').notNull(), // Clave del video en S3
  courseId: integer('course_id')
    .references(() => courses.id)
    .notNull(), // Relación con la tabla cursos
  createdAt: timestamp('created_at').defaultNow().notNull(), // Fecha de creación
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // Fecha de última actualización
  lastUpdated: timestamp('last_updated').defaultNow().notNull(), // Fecha de última actualización
  resourceKey: text('resource_key').notNull(), // Clave del recurso en S3
  resourceNames: text('resource_names').notNull(), // Nombre del recurso
});

export const modalidades = pgTable('modalidades', {
  id: serial('id').primaryKey(), // ID autoincremental de la modalidad
  name: varchar('name', { length: 255 }).notNull(), // Nombre de la modalidad
  description: text('description'), // Descripción de la modalidad
});

// Tabla de puntajes
export const scores = pgTable('scores', {
  id: serial('id').primaryKey(),
  score: real('score').notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  categoryid: integer('categoryid')
    .references(() => categories.id)
    .notNull(),
});

// Tabla de cursos tomados
export const coursesTaken = pgTable('courses_taken', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  courseId: integer('course_id')
    .references(() => courses.id)
    .notNull(),
});

// Tabla de proyectos
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  planteamiento: text('planteamiento').notNull(),
  justificacion: text('justificacion').notNull(),
  objetivo_general: text('objetivo_general').notNull(),
  coverImageKey: text('cover_image_key'),
  coverVideoKey: text('cover_video_key'), // <-- Nuevo campo para video
  type_project: varchar('type_project', { length: 255 }).notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  categoryId: integer('category_id')
    .references(() => categories.id)
    .notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  publicComment: text('public_comment'), // <-- Nuevo campo para comentario público
  // Cambia estos campos a snake_case para que Drizzle los mapee correctamente
  fecha_inicio: date('fecha_inicio'),
  fecha_fin: date('fecha_fin'),
  tipo_visualizacion: text('tipo_visualizacion', {
    enum: ['meses', 'dias'],
  }).default('meses'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  horas_por_dia: integer('horas_por_dia'), // NUEVO: Horas por día de trabajo
  total_horas: integer('total_horas'), // NUEVO: Total de horas del proyecto
  tiempo_estimado: integer('tiempo_estimado'), // NUEVO: Tiempo estimado (en días o similar)
  dias_estimados: integer('dias_estimados'), // NUEVO: Días estimados por cálculo automático
  dias_necesarios: integer('dias_necesarios'), // NUEVO: Días necesarios por edición manual
});

// Tabla de objetivos especificos proyectos
export const specificObjectives = pgTable('specific_objectives', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const specificObjectivesRelations = relations(
  specificObjectives,
  ({ one }) => ({
    project: one(projects, {
      fields: [specificObjectives.projectId],
      references: [projects.id],
    }),
  })
);
// Tabla de actividades proyectos
export const projectActivities = pgTable('project_activities', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  objectiveId: integer('objective_id') // <-- NUEVO: relación con specific_objectives
    .references(() => specificObjectives.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  // IMPORTANTE: El nombre en la BD es 'responsible_user_id', en el frontend mapea como 'responsibleUserId'
  responsibleUserId: text('responsible_user_id').references(() => users.id), // Usuario responsable (puede ser null)
  hoursPerDay: integer('hours_per_day'), // Horas al día dedicadas a la actividad
});

//Tabla de cronograma
export const projectSchedule = pgTable('project_schedule', {
  id: serial('id').primaryKey(),
  activityId: integer('activity_id')
    .references(() => projectActivities.id, { onDelete: 'cascade' })
    .notNull(),
  month: integer('month').notNull(), // 0 = enero, 11 = diciembre
});
//Relacion actividades Proyecto
export const projectActivitiesRelations = relations(
  projectActivities,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectActivities.projectId],
      references: [projects.id],
    }),
    objective: one(specificObjectives, {
      // <-- NUEVO: relación con objetivos específicos
      fields: [projectActivities.objectiveId],
      references: [specificObjectives.id],
    }),
    schedule: many(projectSchedule),
  })
);
//Relacion cronograma Actividades
export const projectScheduleRelations = relations(
  projectSchedule,
  ({ one }) => ({
    activity: one(projectActivities, {
      fields: [projectSchedule.activityId],
      references: [projectActivities.id],
    }),
  })
);

// Tabla de proyectos tomados
export const projectsTaken = pgTable('projects_taken', {
  id: serial('id').primaryKey(), // ID autoincremental
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  projectId: integer('project_id')
    .references(() => projects.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabla de progreso de lecciones por usuario
export const userLessonsProgress = pgTable('user_lessons_progress', {
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  lessonId: integer('lesson_id')
    .references(() => lessons.id)
    .notNull(),
  progress: real('progress').default(0).notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  isLocked: boolean('is_locked').default(true),
  isNew: boolean('is_new').default(true).notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

//tabla de foros
export const forums = pgTable('forums', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id')
    .references(() => courses.id)
    .notNull(), // Relación con el curso
  title: varchar('title', { length: 255 }).notNull(), // Título del foro (por ejemplo, "Discusiones del curso X")
  userId: text('user_id')
    .references(() => users.id)
    .notNull(), // El usuario que crea el foro
  description: text('description'), // Descripción opcional del foro
  coverImageKey: text('cover_image_key'), // NUEVO: para imagen
  documentKey: text('document_key'), // NUEVO: para archivo PDF, Word, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(), // Fecha de creación
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // Fecha de última actualización
});

//tabla de posts
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  forumId: integer('forum_id')
    .references(() => forums.id)
    .notNull(), // Relación con el foro
  userId: text('user_id')
    .references(() => users.id)
    .notNull(), // El usuario que hace el post
  content: text('content').notNull(), // Contenido del post
  createdAt: timestamp('created_at').defaultNow().notNull(), // Fecha de creación
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // Fecha de última actualización
});

export const postReplies = pgTable('post_replies', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .references(() => posts.id)
    .notNull(), // Relaciona la respuesta con el post original
  userId: text('user_id')
    .references(() => users.id)
    .notNull(), // El usuario que hace la respuesta
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
});

// Tabla de progreso de actividades por usuario
export const userActivitiesProgress = pgTable('user_activities_progress', {
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  activityId: integer('activity_id')
    .references(() => activities.id)
    .notNull(),
  progress: real('progress').default(0).notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  revisada: boolean('revisada').references(() => activities.revisada),
  attemptCount: integer('attempt_count').default(0),
  finalGrade: real('final_grade'),
  lastAttemptAt: timestamp('last_attempt_at'),
});

//Tabla de sistema de tickets
export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  creatorId: text('creator_id')
    .references(() => users.id)
    .notNull(),
  comments: varchar('comments', { length: 255 }),
  description: text('description').notNull(),
  estado: text('estado', {
    enum: ['abierto', 'en proceso', 'en revision', 'solucionado', 'cerrado'],
  })
    .default('abierto')
    .notNull(),
  tipo: text('tipo', {
    enum: ['otro', 'bug', 'revision', 'logs'],
  }).notNull(),
  email: text('email').notNull(),
  coverImageKey: text('cover_image_key'),
  videoKey: text('video_key'),
  documentKey: text('document_key'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  title: varchar('title', { length: 50 }).notNull(),
});

//Tabla de comentarios de tickets
export const ticketComments = pgTable('ticket_comments', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id')
    .references(() => tickets.id)
    .notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  sender: text('sender').notNull().default('support'), // Puede ser 'user' o 'admin'
});

//Tabla de parametros
export const parametros = pgTable('parametros', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  porcentaje: integer('porcentaje').notNull(),
  courseId: integer('course_id')
    .references(() => courses.id)
    .notNull(),
});

export const programas = pgTable('programas', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  coverImageKey: text('cover_image_key'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  creatorId: text('creator_id')
    .references(() => users.id)
    .notNull(),
  rating: real('rating').default(0),
  categoryid: integer('categoryid')
    .references(() => categories.id)
    .notNull(),
});

// Tabla de materias
export const materias = pgTable('materias', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  programaId: integer('programa_id').references(() => programas.id),
  courseid: integer('courseid').references(() => courses.id), // courseid can be null
});

export const courseTypes = pgTable('course_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  requiredSubscriptionLevel: varchar('required_subscription_level', {
    length: 255,
    enum: ['none', 'pro', 'premium'],
  }).notNull(),
  isPurchasableIndividually: boolean('is_purchasable_individually').default(
    false
  ),
  price: integer('price'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const materiaGrades = pgTable(
  'materia_grades',
  {
    id: serial('id').primaryKey(),
    materiaId: integer('materia_id')
      .references(() => materias.id)
      .notNull(),
    userId: text('user_id')
      .references(() => users.id)
      .notNull(),
    grade: real('grade').notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.materiaId, table.userId] }),
    unique('uniq_materia_user').on(table.materiaId, table.userId),
  ]
);

export const parameterGrades = pgTable(
  'parameter_grades',
  {
    id: serial('id').primaryKey(),
    parameterId: integer('parametro_id')
      .references(() => parametros.id)
      .notNull(),
    userId: text('user_id')
      .references(() => users.id)
      .notNull(),
    grade: real('grade').notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [unique('uniq_parameter_user').on(table.parameterId, table.userId)]
);

// Tabla de credenciales de usuario
export const userCredentials = pgTable('user_credentials', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  password: text('password').notNull(),
  clerkUserId: text('clerk_user_id').notNull(),
  email: text('email').notNull(),
});

// Tabla de certificados
export const certificates = pgTable('certificates', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  courseId: integer('course_id')
    .references(() => courses.id)
    .notNull(),
  grade: real('grade').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // Puedes agregar un código público para validación si lo deseas
  publicCode: varchar('public_code', { length: 32 }),
  studentName: varchar('student_name', { length: 255 }), // <-- Nuevo campo para el nombre original
});

// Relaciones de programas
export const programasRelations = relations(programas, ({ one, many }) => ({
  creator: one(users, {
    fields: [programas.creatorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [programas.categoryid],
    references: [categories.id],
  }),
  materias: many(materias),
}));

// Relaciones de materias
export const materiasRelations = relations(materias, ({ one }) => ({
  programa: one(programas, {
    fields: [materias.programaId],
    references: [programas.id],
  }),
  curso: one(courses, {
    fields: [materias.courseid], // Changed from courseId to courseid
    references: [courses.id],
  }),
}));

// Add courses relations for materias
export const coursesRelations = relations(courses, ({ many, one }) => ({
  lessons: many(lessons),
  enrollments: many(enrollments),
  creator: one(users, {
    fields: [courses.creatorId],
    references: [users.id],
    relationName: 'createdCourses',
  }),
  modalidad: one(modalidades, {
    fields: [courses.modalidadesid],
    references: [modalidades.id],
  }),
  nivel: one(nivel, {
    fields: [courses.nivelid],
    references: [nivel.id],
  }),
  category: one(categories, {
    fields: [courses.categoryid],
    references: [categories.id],
  }),
  coursesTaken: many(coursesTaken),
  materias: many(materias), // Asegurarnos que esta relación está presente
  courseType: one(courseTypes, {
    fields: [courses.courseTypeId],
    references: [courseTypes.id],
  }),
}));

// Tabla de notas
export const notas = pgTable('notas', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  materiaId: integer('materia_id')
    .references(() => materias.id)
    .notNull(),
  nota: real('nota').notNull(),
});

// Relaciones de notas
export const notasRelations = relations(notas, ({ one }) => ({
  user: one(users, {
    fields: [notas.userId],
    references: [users.id],
  }),
  materia: one(materias, {
    fields: [notas.materiaId],
    references: [materias.id],
  }),
}));

// Tabla de inscripción a programas
export const enrollmentPrograms = pgTable('enrollment_programs', {
  id: serial('id').primaryKey(),
  programaId: integer('programa_id')
    .references(() => programas.id)
    .notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  completed: boolean('completed').default(false),
});

// Relaciones de enrollmentPrograms
export const enrollmentProgramsRelations = relations(
  enrollmentPrograms,
  ({ one }) => ({
    programa: one(programas, {
      fields: [enrollmentPrograms.programaId],
      references: [programas.id],
    }),
    user: one(users, {
      fields: [enrollmentPrograms.userId],
      references: [users.id],
    }),
  })
);

// Relaciones
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
  createdCourses: many(courses),
  preferences: many(preferences),
  scores: many(scores),
  coursesTaken: many(coursesTaken),
  projects: many(projects),
  projectsTaken: many(projectsTaken),
  userLessonsProgress: many(userLessonsProgress),
  userActivitiesProgress: many(userActivitiesProgress),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  courses: many(courses),
  preferences: many(preferences),
  scores: many(scores),
  projects: many(projects),
}));

export const modalidadesRelations = relations(modalidades, ({ many }) => ({
  courses: many(courses),
}));

export const nivelRelations = relations(nivel, ({ many }) => ({
  courses: many(courses),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  activities: many(activities),
  userLessonsProgress: many(userLessonsProgress),
}));

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [activities.lessonsId],
    references: [lessons.id],
  }),
  parametro: one(parametros, {
    fields: [activities.parametroId],
    references: [parametros.id],
  }),
  typeActi: one(typeActi, {
    fields: [activities.typeid],
    references: [typeActi.id],
  }),
  userActivitiesProgress: many(userActivitiesProgress),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

export const preferencesRelations = relations(preferences, ({ one }) => ({
  user: one(users, {
    fields: [preferences.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [preferences.categoryid],
    references: [categories.id],
  }),
}));

export const scoresRelations = relations(scores, ({ one }) => ({
  user: one(users, {
    fields: [scores.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [scores.categoryid],
    references: [categories.id],
  }),
}));

export const coursesTakenRelations = relations(coursesTaken, ({ one }) => ({
  user: one(users, {
    fields: [coursesTaken.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [coursesTaken.courseId],
    references: [courses.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [projects.categoryId],
    references: [categories.id],
  }),
  projectsTaken: many(projectsTaken),
  specificObjectives: many(specificObjectives),
}));

export const projectsTakenRelations = relations(projectsTaken, ({ one }) => ({
  user: one(users, {
    fields: [projectsTaken.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [projectsTaken.projectId],
    references: [projects.id],
  }),
}));

export const userLessonsProgressRelations = relations(
  userLessonsProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [userLessonsProgress.userId],
      references: [users.id],
    }),
    lesson: one(lessons, {
      fields: [userLessonsProgress.lessonId],
      references: [lessons.id],
    }),
  })
);

export const userActivitiesProgressRelations = relations(
  userActivitiesProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [userActivitiesProgress.userId],
      references: [users.id],
    }),
    activity: one(activities, {
      fields: [userActivitiesProgress.activityId],
      references: [activities.id],
    }),
  })
);

//relaciones de foros
export const forumRelations = relations(forums, ({ one, many }) => ({
  course: one(courses, {
    fields: [forums.courseId],
    references: [courses.id],
  }), // Un foro está asociado a un solo curso (relación uno a uno)
  posts: many(posts), // Un foro puede tener muchos posts (comentarios o temas de discusión)
}));

export const postRelations = relations(posts, ({ one }) => ({
  forum: one(forums, {
    fields: [posts.forumId],
    references: [forums.id],
  }), // Un post pertenece a un foro
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }), // Un post tiene un usuario creador
}));

export const userTimeTracking = pgTable('user_time_tracking', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  courseId: integer('course_id')
    .references(() => courses.id)
    .notNull(),
  date: date('date').defaultNow().notNull(),
  timeSpent: integer('time_spent').default(0).notNull(),
});

export const anuncios = pgTable('anuncios', {
  id: serial('id').primaryKey(),
  titulo: text('titulo').notNull(),
  descripcion: text('descripcion').notNull(),
  cover_image_key: text('cover_image_key').notNull(),
  activo: boolean('activo').default(true),
  tipo_destinatario: text('tipo_destinatario').notNull().default('todos'), // Puede ser 'todos', 'cursos', 'programas', 'custom'
});

export const anunciosCursos = pgTable('anuncios_cursos', {
  id: serial('id').primaryKey(),
  anuncioId: integer('anuncio_id')
    .references(() => anuncios.id)
    .notNull(),
  courseId: integer('course_id')
    .references(() => courses.id)
    .notNull(),
});

export const anunciosProgramas = pgTable('anuncios_programas', {
  id: serial('id').primaryKey(),
  anuncioId: integer('anuncio_id')
    .references(() => anuncios.id)
    .notNull(),
  programaId: integer('programa_id') // Reemplaza esto con la clave de la tabla de programas
    .notNull(),
});

export const anunciosUsuarios = pgTable('anuncios_usuarios', {
  id: serial('id').primaryKey(),
  anuncioId: integer('anuncio_id')
    .references(() => anuncios.id)
    .notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
});

export const courseTypesRelations = relations(courseTypes, ({ many }) => ({
  courses: many(courses),
}));

export const materiaGradesRelations = relations(materiaGrades, ({ one }) => ({
  materia: one(materias, {
    fields: [materiaGrades.materiaId],
    references: [materias.id],
  }),
  user: one(users, {
    fields: [materiaGrades.userId],
    references: [users.id],
  }),
}));

export const ticketAssignees = pgTable('ticket_assignees', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id')
    .notNull()
    .references(() => tickets.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  creator: one(users, {
    fields: [tickets.creatorId],
    references: [users.id],
  }),
  assignees: many(ticketAssignees),
  comments: many(ticketComments),
}));

export const ticketAssigneesRelations = relations(
  ticketAssignees,
  ({ one }) => ({
    ticket: one(tickets, {
      fields: [ticketAssignees.ticketId],
      references: [tickets.id],
    }),
    user: one(users, {
      fields: [ticketAssignees.userId],
      references: [users.id],
    }),
  })
);

export const ticketCommentsRelations = relations(ticketComments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketComments.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketComments.userId],
    references: [users.id],
  }),
}));

// Tabla de conversaciones
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  senderId: text('sender_id')
    .references(() => users.id)
    .notNull(),
  status: text('status', { enum: ['activo', 'cerrado'] })
    .default('activo')
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  title: text('title').notNull(),
  curso_id: integer('curso_id')
    .references(() => courses.id)
    .unique()
    .notNull(), // Relación con el curso
});

// Relación de mensajes con conversaciones
export const chat_messages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  conversation_id: integer('conversation_id')
    .references(() => conversations.id)
    .notNull(),
  sender: text('sender').notNull(), // Este campo puede ser el ID del usuario o su nombre
  senderId: text('sender_id').references(() => users.id),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Tabla de roles secundarios
export const rolesSecundarios = pgTable('roles_secundarios', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabla de permisos
export const permisos = pgTable('permisos', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(), // Este puede mantenerse como identificador único si lo deseas
  description: text('description'),
  servicio: varchar('servicio', { length: 100 }).notNull(), // Ej: 'cursos', 'usuarios'
  accion: text('accion', {
    enum: [
      'create',
      'read',
      'update',
      'delete',
      'approve',
      'assign',
      'publish',
    ],
  }).notNull(), // Esto establece las acciones válidas
});

// Relación N:M entre roles_secundarios y permisos
export const roleSecundarioPermisos = pgTable(
  'role_secundario_permisos',
  {
    roleId: integer('role_id')
      .references(() => rolesSecundarios.id)
      .notNull(),
    permisoId: integer('permiso_id')
      .references(() => permisos.id)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permisoId] })]
);

export const userCustomFields = pgTable('user_custom_fields', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  fieldKey: varchar('field_key', { length: 255 }).notNull(),
  fieldValue: text('field_value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  isMarked: boolean('is_marked').default(false), // <-- nuevo campo para marcar si el usuario la vio
  createdAt: timestamp('created_at').defaultNow(),
  metadata: jsonb('metadata'),
});

// Tabla de entregas de actividades de proyecto
export const projectActivityDeliveries = pgTable(
  'project_activity_deliveries',
  {
    id: serial('id').primaryKey(),
    activityId: integer('activity_id')
      .references(() => projectActivities.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    entregado: boolean('entregado').default(false).notNull(),
    aprobado: boolean('aprobado').default(false).notNull(),
    entregaUrl: text('entrega_url'), // opcional: link a archivo o evidencia (mantener por compatibilidad)

    // Nuevos campos para diferentes tipos de archivos
    documentKey: text('document_key'), // Para documentos (PDF, Word, Excel, etc.)
    documentName: text('document_name'), // Nombre original del documento
    imageKey: text('image_key'), // Para imágenes (JPG, PNG, etc.)
    imageName: text('image_name'), // Nombre original de la imagen
    videoKey: text('video_key'), // Para videos (MP4, AVI, etc.)
    videoName: text('video_name'), // Nombre original del video
    compressedFileKey: text('compressed_file_key'), // Para archivos comprimidos (RAR, ZIP, 7z, etc.)
    compressedFileName: text('compressed_file_name'), // Nombre original del archivo comprimido

    // Metadatos adicionales
    fileTypes: text('file_types'), // JSON string con los tipos de archivos subidos
    totalFiles: integer('total_files').default(0), // Contador total de archivos

    comentario: text('comentario'), // opcional: comentario del usuario
    feedback: text('feedback'), // opcional: comentario del responsable
    entregadoAt: timestamp('entregado_at').defaultNow(),
    aprobadoAt: timestamp('aprobado_at'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [unique('unique_activity_user').on(table.activityId, table.userId)]
);

// Relaciones para projectActivityDeliveries
export const projectActivityDeliveriesRelations = relations(
  projectActivityDeliveries,
  ({ one }) => ({
    activity: one(projectActivities, {
      fields: [projectActivityDeliveries.activityId],
      references: [projectActivities.id],
    }),
    user: one(users, {
      fields: [projectActivityDeliveries.userId],
      references: [users.id],
    }),
  })
);

export const courseCourseTypes = pgTable(
  'course_course_types',
  {
    courseId: integer('course_id')
      .references(() => courses.id)
      .notNull(),
    courseTypeId: integer('course_type_id')
      .references(() => courseTypes.id)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.courseId, table.courseTypeId] })]
);

export const courseCourseTypesRelations = relations(
  courseCourseTypes,
  ({ one }) => ({
    course: one(courses, {
      fields: [courseCourseTypes.courseId],
      references: [courses.id],
    }),
    courseType: one(courseTypes, {
      fields: [courseCourseTypes.courseTypeId],
      references: [courseTypes.id],
    }),
  })
);

// Tabla de solicitudes de participación en proyectos
export const projectParticipationRequests = pgTable(
  'project_participation_requests',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .references(() => users.id)
      .notNull(),
    projectId: integer('project_id')
      .references(() => projects.id)
      .notNull(),
    requestType: text('request_type', {
      enum: ['participation', 'resignation'],
    })
      .default('participation')
      .notNull(), // Nuevo campo para el tipo de solicitud
    status: text('status', {
      enum: ['pending', 'approved', 'rejected'],
    })
      .default('pending')
      .notNull(),
    requestMessage: text('request_message'), // Mensaje opcional del solicitante
    responseMessage: text('response_message'), // Mensaje opcional del responsable del proyecto
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    respondedAt: timestamp('responded_at'),
    respondedBy: text('responded_by').references(() => users.id), // Quien respondió la solicitud
  }
);

// Relaciones para projectParticipationRequests
export const projectParticipationRequestsRelations = relations(
  projectParticipationRequests,
  ({ one }) => ({
    user: one(users, {
      fields: [projectParticipationRequests.userId],
      references: [users.id],
    }),
    project: one(projects, {
      fields: [projectParticipationRequests.projectId],
      references: [projects.id],
    }),
    responder: one(users, {
      fields: [projectParticipationRequests.respondedBy],
      references: [users.id],
    }),
  })
);
// Añadir esta nueva relación cerca de las demás relaciones
export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(users, {
    fields: [certificates.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [certificates.courseId],
    references: [courses.id],
  }),
}));

export const classMeetings = pgTable('class_meetings', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id),
  title: varchar('title', { length: 255 }).notNull(),
  startDateTime: timestamp('start_datetime', { withTimezone: true }).notNull(),
  endDateTime: timestamp('end_datetime', { withTimezone: true }).notNull(),
  joinUrl: varchar('join_url', { length: 1024 }),
  weekNumber: integer('week_number'),
  createdAt: timestamp('created_at').defaultNow(),
  meetingId: varchar('meeting_id', { length: 255 }).notNull(),
  // 🆕 Agregado: Ruta del video en S3
  video_key: varchar('video_key', { length: 255 }),
  progress: integer('progress'), // <-- Nuevo campo opcional para progreso (0-100)
});
export const comercials = pgTable('comercials', {
  id: serial('id').primaryKey(),
  contact: text('contact').notNull(),
});

export const dates = pgTable('dates', {
  id: serial('id').primaryKey(),
  startDate: date('start_date').notNull(),
});

// 🆕 Datos de inscripción no presentes en `users` + llaves de S3
export const userInscriptionDetails = pgTable('user_inscription_details', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),

  // Campos “extra” (no duplicados en users)
  identificacionTipo: text('identificacion_tipo').notNull(),
  identificacionNumero: text('identificacion_numero').notNull(),
  nivelEducacion: text('nivel_educacion').notNull(),
  tieneAcudiente: text('tiene_acudiente'), // 'Sí' | 'No'
  acudienteNombre: text('acudiente_nombre'),
  acudienteContacto: text('acudiente_contacto'),
  acudienteEmail: text('acudiente_email'),
  programa: text('programa').notNull(),
  fechaInicio: text('fecha_inicio').notNull(),
  comercial: text('comercial'),
  sede: text('sede').notNull(),
  horario: text('horario').notNull(),
  pagoInscripcion: text('pago_inscripcion').notNull(), // 'Sí' | 'No'
  pagoCuota1: text('pago_cuota1').notNull(), // 'Sí' | 'No'
  modalidad: text('modalidad').notNull(), // 'Virtual' | 'Presencial'
  numeroCuotas: text('numero_cuotas').notNull(),

  // 🗂️ Claves S3 de los documentos
  idDocKey: text('id_doc_key'), // Documento de identidad
  utilityBillKey: text('utility_bill_key'), // Recibo servicio público
  diplomaKey: text('diploma_key'), // Acta/Bachiller o Noveno
  pagareKey: text('pagare_key'), // Pagaré

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const horario = pgTable('horario', {
  id: serial('id').primaryKey(),
  schedule: text('contact').notNull(),
});
