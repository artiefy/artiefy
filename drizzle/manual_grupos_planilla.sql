-- Planilla de asistencia por grupo ("hojas = grupos") estilo referencia.
-- Cabecera editable de la planilla + fechas + archivado en grupos.
ALTER TABLE grupos
  ADD COLUMN IF NOT EXISTS espacio text,
  ADD COLUMN IF NOT EXISTS empresa text,
  ADD COLUMN IF NOT EXISTS educador text,
  ADD COLUMN IF NOT EXISTS horario text,
  ADD COLUMN IF NOT EXISTS curso text,
  ADD COLUMN IF NOT EXISTS fecha_inicio date,
  ADD COLUMN IF NOT EXISTS fecha_fin date,
  ADD COLUMN IF NOT EXISTS archivado boolean NOT NULL DEFAULT false;

-- Modalidad y observaciones por alumno dentro del grupo.
ALTER TABLE grupo_estudiantes
  ADD COLUMN IF NOT EXISTS modalidad text,
  ADD COLUMN IF NOT EXISTS observaciones text;
