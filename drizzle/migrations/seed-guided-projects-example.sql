-- Seed example (Lovable-style) content for the demo guided projects #2 and #3
-- so the student detail page renders fully. Idempotent for the educator profile
-- (only fills profesion/descripcion when empty; never overwrites real data).
-- Example copy — editable later from the super-admin guided project form.

-- Project #2 — "Desarrollo de App con IA y Next.js"
UPDATE guided_projects SET
  subtitle = 'Construye una app full-stack con Next.js e IA, de la idea al deploy.',
  problem_statement = 'Tener una idea no alcanza: hay que convertirla en un producto real. Vas a construir una aplicación funcional con Next.js integrando IA, paso a paso y con acompañamiento.',
  what_you_will_build = 'Una aplicación web completa con Next.js (App Router), autenticación, base de datos y una función de IA integrada, lista para desplegar.',
  prerequisites = E'Manejo básico de JavaScript o TypeScript.\nNociones de React (componentes y props).',
  tech_stack = 'TypeScript, Next.js, React, Drizzle ORM, PostgreSQL, OpenAI API',
  deliverables_description = E'Repositorio de la aplicación documentado.\nApp desplegada con una demo pública.\nIntegración de IA funcionando end-to-end.',
  students_count = 640,
  content_hours = 18,
  updated_at = now()
WHERE id = 2;

-- Project #3 — "SaaS de gestión de citas / agenda"
UPDATE guided_projects SET
  subtitle = 'Construye un SaaS de agenda y reservas multi-negocio, de cero a producción.',
  problem_statement = 'Barberías, consultorios y talleres pierden clientes por una agenda desordenada. Vas a construir un SaaS de reservas que cualquiera de esos negocios pueda usar.',
  what_you_will_build = 'Un SaaS multi-tenant de gestión de citas con calendario, reservas online, panel del negocio y notificaciones, listo para producción.',
  prerequisites = E'Manejo básico de TypeScript.\nNociones de bases de datos relacionales.',
  tech_stack = 'TypeScript, Next.js, Drizzle ORM, PostgreSQL, Tailwind CSS, Stripe',
  deliverables_description = E'Repositorio del SaaS documentado.\nPanel de negocio y flujo de reservas funcional.\nDeploy con una cuenta demo.',
  students_count = 410,
  content_hours = 22,
  updated_at = now()
WHERE id = 3;

-- Educator profiles for the instructors of #2 and #3 (only fills when empty)
UPDATE users SET
  profesion = COALESCE(NULLIF(profesion, ''), 'AI Engineer · Especialista en producto'),
  descripcion = COALESCE(
    NULLIF(descripcion, ''),
    'Ingeniero de software enfocado en IA aplicada y productos full-stack. Ha construido y desplegado aplicaciones y SaaS para equipos de producto y negocios reales.'
  ),
  updated_at = now()
WHERE id IN (SELECT instructor FROM guided_projects WHERE id IN (2, 3));

-- Example educator avatars (only fills when empty; uses an allowed image host)
UPDATE users u SET
  profile_image_key = COALESCE(NULLIF(u.profile_image_key, ''), m.url),
  updated_at = now()
FROM (VALUES
  ((SELECT instructor FROM guided_projects WHERE id = 2), 'https://i.pravatar.cc/150?img=33'),
  ((SELECT instructor FROM guided_projects WHERE id = 3), 'https://i.pravatar.cc/150?img=12')
) AS m(uid, url)
WHERE u.id = m.uid;
