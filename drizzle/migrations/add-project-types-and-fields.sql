-- Migración: Agregar tabla project_types y campos faltantes en projects
-- Fecha: 2026-01-30

-- 1. Crear tabla project_types para tipos predefinidos
CREATE TABLE IF NOT EXISTS "project_types" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "description" TEXT,
    "icon" VARCHAR(50),
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 2. Insertar tipos de proyecto predefinidos
INSERT INTO
    "project_types" ("name", "description", "icon")
VALUES (
        'Desarrollo Web',
        'Proyectos de desarrollo de sitios y aplicaciones web',
        'globe'
    ),
    (
        'Desarrollo Móvil',
        'Aplicaciones para dispositivos móviles iOS y Android',
        'smartphone'
    ),
    (
        'Ciencia de Datos',
        'Análisis de datos, Machine Learning e IA',
        'chart-bar'
    ),
    (
        'Diseño UX/UI',
        'Diseño de experiencia e interfaces de usuario',
        'palette'
    ),
    (
        'DevOps',
        'Automatización, CI/CD e infraestructura',
        'server'
    ),
    (
        'Ciberseguridad',
        'Proyectos de seguridad informática',
        'shield'
    ),
    (
        'IoT',
        'Internet de las Cosas y sistemas embebidos',
        'cpu'
    ),
    (
        'Blockchain',
        'Aplicaciones descentralizadas y contratos inteligentes',
        'link'
    ),
    (
        'Game Development',
        'Desarrollo de videojuegos',
        'gamepad'
    ),
    (
        'Robótica',
        'Proyectos de robótica y automatización',
        'robot'
    ),
    (
        'Otro',
        'Otros tipos de proyectos',
        'folder'
    ) ON CONFLICT (name) DO NOTHING;

-- 3. Agregar nuevos campos a la tabla projects
ALTER TABLE "projects"
ADD COLUMN IF NOT EXISTS "project_type_id" INTEGER REFERENCES "project_types" ("id"),
ADD COLUMN IF NOT EXISTS "course_id" INTEGER REFERENCES "courses" ("id"),
ADD COLUMN IF NOT EXISTS "needs_collaborators" BOOLEAN DEFAULT false NOT NULL;

-- 3.5 Agregar campo icon a project_types si no existe (para tablas existentes)
ALTER TABLE "project_types"
ADD COLUMN IF NOT EXISTS "icon" VARCHAR(50);

-- 4. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS "idx_projects_project_type_id" ON "projects" ("project_type_id");

CREATE INDEX IF NOT EXISTS "idx_projects_course_id" ON "projects" ("course_id");

CREATE INDEX IF NOT EXISTS "idx_projects_category_id" ON "projects" ("category_id");

CREATE INDEX IF NOT EXISTS "idx_projects_user_id" ON "projects" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_projects_is_public" ON "projects" ("is_public");

-- 5. Migrar datos existentes: intentar mapear type_project (varchar) a project_type_id
-- Solo si hay proyectos existentes
UPDATE "projects" p
SET
    "project_type_id" = pt.id
FROM "project_types" pt
WHERE
    LOWER(p.type_project) = LOWER(pt.name)
    AND p.project_type_id IS NULL;

-- 6. Para proyectos sin match, asignarlos a "Otro"
UPDATE "projects" p
SET
    "project_type_id" = (
        SELECT id
        FROM "project_types"
        WHERE
            name = 'Otro'
    )
WHERE
    p.project_type_id IS NULL;

-- 7. Comentarios en las tablas
COMMENT ON
TABLE "project_types" IS 'Tipos predefinidos de proyectos disponibles en la plataforma';

COMMENT ON COLUMN "projects"."project_type_id" IS 'FK a project_types - Tipo de proyecto (nuevo campo normalizado)';

COMMENT ON COLUMN "projects"."type_project" IS 'Tipo de proyecto como texto (legacy - mantener por compatibilidad)';

COMMENT ON COLUMN "projects"."course_id" IS 'FK a courses - Curso asociado al proyecto (opcional)';

COMMENT ON COLUMN "projects"."needs_collaborators" IS 'Indica si el proyecto busca colaboradores';