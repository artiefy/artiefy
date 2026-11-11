/**
 * /api/academia/[slug]/estudiantes  (super-admin de esa academia)
 *
 * GET    — estudiantes (con sus datos, cursos, grupos y programas) y las
 *          columnas propias de la academia.
 * PATCH  — { userIds[], campo, valor } guarda un dato (celda o "Editar
 *          Masivamente"); valor vacío lo borra.
 *          { accion: 'grupos', userId, grupoIds[] } grupos del estudiante.
 *          { accion: 'correo', userId, email } correo de la cuenta.
 * POST   — { etiqueta, opciones[] } agrega una columna propia.
 * DELETE ?columna= — quita una columna propia.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import {
  cambiarCorreo,
  cambiarGruposDeEstudiante,
  crearColumna,
  eliminarColumna,
  guardarDato,
  listarColumnas,
  listarEstudiantes,
} from '~/server/academy/estudiantes';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string }> };

const resolver = async (params: Ctx['params']) =>
  cuentaDeAcademia((await params).slug, ['super-admin']);

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await resolver(params);
    const [estudiantes, columnas] = await Promise.all([
      listarEstudiantes(academia.id),
      listarColumnas(academia.id),
    ]);
    return NextResponse.json({ estudiantes, columnas });
  } catch (error) {
    return respuestaDeError(error, 'estudiantes: listar');
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await resolver(params);
    const body = (await request.json().catch(() => ({}))) as {
      accion?: unknown;
      userId?: unknown;
      grupoIds?: unknown;
      email?: unknown;
      userIds?: unknown;
      campo?: unknown;
      valor?: unknown;
    };
    const userId = typeof body.userId === 'string' ? body.userId : '';
    if (body.accion === 'grupos') {
      const grupoIds = Array.isArray(body.grupoIds)
        ? body.grupoIds.map(Number).filter(Number.isInteger)
        : [];
      await cambiarGruposDeEstudiante(academia.id, userId, grupoIds);
      return NextResponse.json({ ok: true });
    }
    if (body.accion === 'correo') {
      const email = typeof body.email === 'string' ? body.email : '';
      await cambiarCorreo(academia.id, userId, email);
      await registrarLog(
        academia.id,
        'Correo cambiado',
        `${userId} → ${email}`
      );
      return NextResponse.json({ ok: true });
    }
    const userIds = Array.isArray(body.userIds)
      ? body.userIds.filter((v): v is string => typeof v === 'string')
      : [];
    const campo = typeof body.campo === 'string' ? body.campo : '';
    const valor = typeof body.valor === 'string' ? body.valor : '';
    const cambiados = await guardarDato(academia.id, userIds, campo, valor);
    if (userIds.length > 1) {
      await registrarLog(
        academia.id,
        'Edición masiva de estudiantes',
        `${campo} → ${valor || '(vacío)'} (${cambiados})`
      );
    }
    return NextResponse.json({ ok: true, cambiados });
  } catch (error) {
    return respuestaDeError(error, 'estudiantes: guardar dato');
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await resolver(params);
    const body = (await request.json().catch(() => ({}))) as {
      etiqueta?: unknown;
      opciones?: unknown;
    };
    const etiqueta = typeof body.etiqueta === 'string' ? body.etiqueta : '';
    const opciones = Array.isArray(body.opciones)
      ? body.opciones.filter((v): v is string => typeof v === 'string')
      : [];
    const columna = await crearColumna(academia.id, etiqueta, opciones);
    await registrarLog(academia.id, 'Columna agregada', etiqueta);
    return NextResponse.json({ ok: true, ...columna }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error, 'estudiantes: crear columna');
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await resolver(params);
    const clave = request.nextUrl.searchParams.get('columna') ?? '';
    await eliminarColumna(academia.id, clave);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'estudiantes: quitar columna');
  }
}
