import { clerkClient } from '@clerk/nextjs/server';
import { and, eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  academyEstudianteDatos,
  academyProgramaCursos,
  academyProgramas,
} from '~/server/db/schema';

import { type Academia, ErrorAcademia } from './academias';
import { matricularEstudiantes } from './estudiantes';
import { registrarLog } from './logs';
import { agregarUsuario, membresia } from './usuarios';

import 'server-only';

// Formulario público de inscripción de una academia (el mismo de Artiefy).
// Cada inscripción queda en la lista de estudiantes de la academia: crea o
// vincula la cuenta, guarda sus datos (los de "Gestión de Estudiantes") y la
// matricula en los cursos del programa elegido.

const texto = (v: unknown, max = 300) =>
  typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '';

// Campo del formulario → columna de la lista de estudiantes.
const MAPA: [string, string][] = [
  ['telefono', 'telefono'],
  ['identificacionTipo', 'tipo_documento'],
  ['identificacionNumero', 'numero_documento'],
  ['fechaInicio', 'fecha_inicio'],
  ['comercial', 'comercial'],
  ['sede', 'sede'],
  ['horario', 'horario'],
  ['programa', 'programa_texto'],
  ['direccion', 'direccion'],
  ['pais', 'pais'],
  ['ciudad', 'ciudad'],
  ['birthDate', 'fecha_nacimiento'],
  ['nivelEducacion', 'nivel_educacion'],
  ['tieneAcudiente', 'acudiente'],
  ['acudienteNombre', 'acudiente_nombre'],
  ['acudienteContacto', 'acudiente_contacto'],
  ['acudienteEmail', 'acudiente_email'],
  ['modalidad', 'modalidad'],
  ['pagoInscripcion', 'pago_inscripcion'],
  ['pagoCuota1', 'pago_cuota1'],
  ['numeroCuotas', 'numero_cuotas'],
  ['docIdentidadKey', 'doc_identidad'],
  ['actaGradoKey', 'doc_acta_grado'],
  ['reciboServicioKey', 'doc_recibo_servicio'],
  ['pagareKey', 'doc_pagare'],
  ['comprobanteInscripcionKey', 'doc_comprobante_inscripcion'],
];

// Tipo de documento del formulario ("CC (Cédula de ciudadanía)") → sigla de
// la columna "Tipo de documento" de la lista. Los demás se guardan tal cual.
const SIGLAS_DOCUMENTO: [RegExp, string][] = [
  [/^CC|c[ée]dula de ciudadan/i, 'CC'],
  [/^TI|tarjeta de identidad/i, 'TI'],
  [/c[ée]dula de extranjer/i, 'CE'],
  [/^pasaporte/i, 'PA'],
  [/protecci[óo]n temporal/i, 'PPT'],
  [/^NIT|identificaci[óo]n tributaria/i, 'NIT'],
];
const siglaDocumento = (v: string) =>
  SIGLAS_DOCUMENTO.find(([re]) => re.test(v))?.[1] ?? v;

export async function inscribirDesdeFormulario(
  academia: Academia,
  body: Record<string, unknown>
) {
  const nombre = [
    body.primerNombre,
    body.segundoNombre,
    body.primerApellido,
    body.segundoApellido,
  ]
    .map((v) => texto(v, 60))
    .filter(Boolean)
    .join(' ');
  const email = texto(body.email, 200).toLowerCase();
  if (!texto(body.primerNombre) || !texto(body.primerApellido)) {
    throw new ErrorAcademia('Escribe tu nombre y apellido.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ErrorAcademia('El correo no es válido.');
  }
  if (!texto(body.identificacionNumero)) {
    throw new ErrorAcademia('Escribe tu número de identificación.');
  }

  // Cuenta: se crea o se vincula como estudiante. Si ya estaba en la
  // academia (con cualquier rol) no se toca su rol.
  const resultado = await agregarUsuarioSiFalta(academia, email, nombre);
  const cuenta = resultado.cuenta;

  // Datos para la lista de estudiantes (sin pisar el estado si ya tenía).
  const datos: Record<string, string> = { origen: 'Formulario' };
  for (const [campo, columna] of MAPA) {
    const valor = texto(body[campo], 500);
    if (valor) datos[columna] = valor;
  }
  if (datos.tipo_documento) {
    datos.tipo_documento = siglaDocumento(datos.tipo_documento);
  }
  datos.fecha_compra = new Date().toISOString().slice(0, 10);
  await db
    .insert(academyEstudianteDatos)
    .values({
      academyId: academia.id,
      userId: cuenta.userId,
      datos: { estado: 'Nuevo', ...datos },
    })
    .onConflictDoUpdate({
      target: [academyEstudianteDatos.academyId, academyEstudianteDatos.userId],
      set: {
        datos: sql`jsonb_build_object('estado', 'Nuevo') || ${academyEstudianteDatos.datos} || ${JSON.stringify(datos)}::jsonb`,
        updatedAt: new Date(),
      },
    });

  // Programa elegido: matrícula en sus cursos.
  const advertencias: string[] = [];
  const tituloPrograma = texto(body.programa, 255);
  let programa: { id: number; title: string } | undefined;
  if (tituloPrograma) {
    [programa] = await db
      .select({ id: academyProgramas.id, title: academyProgramas.title })
      .from(academyProgramas)
      .where(
        and(
          eq(academyProgramas.academyId, academia.id),
          eq(academyProgramas.title, tituloPrograma)
        )
      )
      .limit(1);
    if (programa && cuenta.role === 'estudiante') {
      const cursos = await db
        .select({ courseId: academyProgramaCursos.courseId })
        .from(academyProgramaCursos)
        .where(eq(academyProgramaCursos.programaId, programa.id));
      for (const { courseId } of cursos) {
        await matricularEstudiantes(academia.id, courseId, [
          cuenta.userId,
        ]).catch(() =>
          advertencias.push('No se pudo matricular en un curso del programa.')
        );
      }
    }
  }

  await registrarLog(
    academia.id,
    'Inscripción desde el formulario',
    `${nombre} <${email}>${programa ? ` · ${programa.title}` : ''}`
  );
  return {
    ok: true,
    program: { title: programa?.title ?? tituloPrograma },
    emailSent: resultado.correoEnviado,
    advertencias,
  };
}

async function agregarUsuarioSiFalta(
  academia: Academia,
  email: string,
  nombre: string
) {
  const clerk = await clerkClient();
  const { data } = await clerk.users.getUserList({ emailAddress: [email] });
  const existente = data[0] ? await membresia(academia.id, data[0].id) : null;
  if (existente) return { cuenta: existente, correoEnviado: false };

  const r = await agregarUsuario(academia, {
    email,
    nombre,
    rol: 'estudiante',
  });
  const { data: nuevos } = await clerk.users.getUserList({
    emailAddress: [email],
  });
  const cuenta = nuevos[0] ? await membresia(academia.id, nuevos[0].id) : null;
  if (!cuenta) throw new ErrorAcademia('No se pudo crear la inscripción.', 500);
  return { cuenta, correoEnviado: r.correoEnviado };
}
