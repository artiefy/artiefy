-- 1. Insertar el usuario (necesario para las relaciones)
INSERT INTO users (id, role, email, name)
VALUES ('user1', 'admin', 'admin@example.com', 'Admin User')
ON CONFLICT (id) DO NOTHING;

-- 2. Insertar la categoría
INSERT INTO categories (name, description) 
VALUES ('Desarrollo Web', 'Categorías para cursos de desarrollo web y programación');

-- 3. Borrar e Insertar las modalidades fijas
DELETE FROM modalidades;
INSERT INTO modalidades (id, name, description)
VALUES 
(1, 'Presencial', 'Modalidad de estudio presencial en aula física'),
(2, 'Sincrónica', 'Modalidad de estudio en tiempo real a través de plataforma virtual'),
(3, 'Asincrónica', 'Modalidad de estudio a tu propio ritmo')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, 
    description = EXCLUDED.description;

-- 4. Insertar nivel
INSERT INTO nivel (name, description)
VALUES ('Básico', 'Nivel fundamental para principiantes');

-- 5. Insertar el programa
INSERT INTO programas (title, description, cover_image_key, creator_id, categoryid)
VALUES (
    'Técnico en Programación de Software',
    'Programa técnico con duración de 1 año',
    'program-cover.jpg',
    'user1',
    (SELECT id FROM categories WHERE name = 'Desarrollo Web' LIMIT 1)
);

-- 6. Insertar el curso principal con sus tres modalidades
INSERT INTO courses (
    title, 
    description, 
    categoryid, 
    instructor, 
    creator_id,
    modalidadesid,
    nivelid
)
VALUES 
(
    'Fundamentos del Desarrollo Frontend - Presencial',
    'Módulo inicial del programa Técnico en Programación de Software - Modalidad Presencial',
    (SELECT id FROM categories WHERE name = 'Desarrollo Web' LIMIT 1),
    'Instructor Principal',
    'user1',
    1, -- modalidad presencial
    (SELECT id FROM nivel WHERE name = 'Básico' LIMIT 1)
),
(
    'Fundamentos del Desarrollo Frontend - Sincrónico',
    'Módulo inicial del programa Técnico en Programación de Software - Modalidad Sincrónica',
    (SELECT id FROM categories WHERE name = 'Desarrollo Web' LIMIT 1),
    'Instructor Principal',
    'user1',
    2, -- modalidad sincrónica
    (SELECT id FROM nivel WHERE name = 'Básico' LIMIT 1)
),
(
    'Fundamentos del Desarrollo Frontend - Asincrónico',
    'Módulo inicial del programa Técnico en Programación de Software - Modalidad Asincrónica',
    (SELECT id FROM categories WHERE name = 'Desarrollo Web' LIMIT 1),
    'Instructor Principal',
    'user1',
    3, -- modalidad asincrónica
    (SELECT id FROM nivel WHERE name = 'Básico' LIMIT 1)
);

-- Insertar los otros dos cursos principales (Módulos 2 y 3)
INSERT INTO courses (
    title, 
    description, 
    categoryid, 
    instructor, 
    creator_id,
    modalidadesid,
    nivelid
)
VALUES 
(
    'Desarrollo Backend y Bases de Datos',
    'Módulo de desarrollo backend con Node.js/Express, bases de datos SQL y NoSQL',
    (SELECT id FROM categories WHERE name = 'Desarrollo Web' LIMIT 1),
    'Instructor Backend',
    'user1',
    1,
    (SELECT id FROM nivel WHERE name = 'Básico' LIMIT 1)
),
(
    'Desarrollo de Aplicaciones Móviles',
    'Módulo de desarrollo móvil con Flutter/React Native y principios de UX/UI móvil',
    (SELECT id FROM categories WHERE name = 'Desarrollo Web' LIMIT 1),
    'Instructor Móvil',
    'user1',
    1,
    (SELECT id FROM nivel WHERE name = 'Básico' LIMIT 1)
);

-- 7. Insertar los parámetros
INSERT INTO parametros (name, description, porcentaje, course_id)
VALUES 
('Evaluación Fundamentos', 'Evaluación de conceptos básicos', 100, 
 (SELECT id FROM courses WHERE title = 'Fundamentos del Desarrollo Frontend - Presencial' LIMIT 1)),
('Evaluación Desarrollo Web', 'Evaluación de HTML, CSS y JS', 100, 
 (SELECT id FROM courses WHERE title = 'Fundamentos del Desarrollo Frontend - Presencial' LIMIT 1)),
('Evaluación Herramientas', 'Evaluación de Git y GitHub', 100, 
 (SELECT id FROM courses WHERE title = 'Fundamentos del Desarrollo Frontend - Presencial' LIMIT 1));

-- 8. Insertar las materias
INSERT INTO materias (title, description, programa_id, courseid)
VALUES 
('Fundamentos de Programación I (PS-101)', 'Conceptos fundamentales de programación', 
 (SELECT id FROM programas WHERE title = 'Técnico en Programación de Software' LIMIT 1),
 (SELECT id FROM courses WHERE title = 'Fundamentos del Desarrollo Frontend - Presencial' LIMIT 1)),
('Lenguajes de Programación (PS-102)', 'HTML, CSS, y JavaScript',
 (SELECT id FROM programas WHERE title = 'Técnico en Programación de Software' LIMIT 1),
 (SELECT id FROM courses WHERE title = 'Fundamentos del Desarrollo Frontend - Presencial' LIMIT 1)),
('Diseño de Interfaces de Usuario (PS-103)', 'Git, GitHub e IDEs',
 (SELECT id FROM programas WHERE title = 'Técnico en Programación de Software' LIMIT 1),
 (SELECT id FROM courses WHERE title = 'Fundamentos del Desarrollo Frontend - Presencial' LIMIT 1));

-- Asociar los cursos al programa
INSERT INTO materias (title, description, programa_id, courseid)
VALUES 
('Desarrollo Backend', 'Módulo completo de backend y bases de datos', 
 (SELECT id FROM programas WHERE title = 'Técnico en Programación de Software' LIMIT 1),
 (SELECT id FROM courses WHERE title = 'Desarrollo Backend y Bases de Datos' LIMIT 1)),
('Desarrollo Móvil', 'Módulo de desarrollo de aplicaciones móviles',
 (SELECT id FROM programas WHERE title = 'Técnico en Programación de Software' LIMIT 1),
 (SELECT id FROM courses WHERE title = 'Desarrollo de Aplicaciones Móviles' LIMIT 1));

-- 9. Insertar las lecciones
INSERT INTO lessons (title, description, duration, cover_image_key, cover_video_key, course_id, resource_key, resource_names)
VALUES 
('Programación Básica y Algoritmos', 'Fundamentos de programación', 120, 'img1.jpg', 'vid1.mp4', 
 (SELECT id FROM courses WHERE title = 'Fundamentos del Desarrollo Frontend - Presencial' LIMIT 1), 'res1.pdf', 'Material de estudio 1'),
('Desarrollo Web Front-end', 'HTML, CSS y JavaScript', 120, 'img2.jpg', 'vid2.mp4',
 (SELECT id FROM courses WHERE title = 'Fundamentos del Desarrollo Frontend - Presencial' LIMIT 1), 'res2.pdf', 'Material de estudio 2'),
('Control de Versiones', 'Git y GitHub', 120, 'img3.jpg', 'vid3.mp4',
 (SELECT id FROM courses WHERE title = 'Fundamentos del Desarrollo Frontend - Presencial' LIMIT 1), 'res3.pdf', 'Material de estudio 3');

-- 10. Insertar tipo de actividades
INSERT INTO type_acti (name, description)
VALUES ('Proyecto', 'Actividad práctica de desarrollo')
RETURNING id;

-- 11. Insertar las actividades (versión simplificada y corregida)
WITH type_id AS (
    SELECT id FROM type_acti WHERE name = 'Proyecto' LIMIT 1
),
lesson_ids AS (
    SELECT id, title 
    FROM lessons 
    WHERE course_id = (SELECT id FROM courses WHERE title = 'Fundamentos del Desarrollo Frontend - Presencial' LIMIT 1)
),
param_ids AS (
    SELECT id, name 
    FROM parametros 
    WHERE course_id = (SELECT id FROM courses WHERE title = 'Fundamentos del Desarrollo Frontend - Presencial' LIMIT 1)
)
INSERT INTO activities (name, description, type_id, lessons_id, parametro_id, porcentaje)
SELECT 
    data.name, 
    data.description,
    (SELECT id FROM type_id),
    l.id,
    p.id,
    100
FROM (
    VALUES 
        ('Proyecto de Algoritmos', 'Desarrollar algoritmos básicos', 'Programación Básica y Algoritmos', 'Evaluación Fundamentos'),
        ('Proyecto Frontend', 'Crear una página web', 'Desarrollo Web Front-end', 'Evaluación Desarrollo Web'),
        ('Proyecto Git', 'Crear y gestionar repositorio', 'Control de Versiones', 'Evaluación Herramientas')
) as data(name, description, lesson_title, param_name)
JOIN lesson_ids l ON l.title = data.lesson_title
JOIN param_ids p ON p.name = data.param_name;
