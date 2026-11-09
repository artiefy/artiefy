/**
 * POST /api/super-admin/academias/[id]/enviar  (solo super-admin de Artiefy)
 *
 * Envía a la academia contenido de Artiefy:
 *   { tipo: 'usuarios', usuarios: [{ email, nombre }], rol }
 *   { tipo: 'curso', courseId, conEducadores? }
 *   { tipo: 'programa', programaId, conEducadores? }
 * Usuarios: las cuentas existentes se vinculan (misma contraseña, aviso por
 * correo). Cursos y programas: se copian (clases, actividades, parámetros).
 */

import { type NextRequest, NextResponse } from 'next/server';

import { academiaPorId, ErrorAcademia } from '~/server/academy/academias';
import {
  esSuperAdminArtiefy,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import {
  enviarCurso,
  enviarPrograma,
  enviarUsuarios,
} from '~/server/academy/envios';
import { esRolAcademia } from '~/server/academy/usuarios';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const userId = await esSuperAdminArtiefy();
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const academia = await academiaPorId(Number((await params).id));
    if (!academia) throw new ErrorAcademia('Academia no encontrada', 404);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    if (body.tipo === 'usuarios') {
      if (!esRolAcademia(body.rol)) throw new ErrorAcademia('Rol inválido.');
      const usuarios = (Array.isArray(body.usuarios) ? body.usuarios : [])
        .map((u: { email?: unknown; nombre?: unknown }) => ({
          email: typeof u?.email === 'string' ? u.email : '',
          nombre: typeof u?.nombre === 'string' ? u.nombre : '',
        }))
        .filter((u) => u.email);
      if (usuarios.length === 0) {
        throw new ErrorAcademia('No hay usuarios para enviar.');
      }
      const resultados = await enviarUsuarios(academia, usuarios, body.rol);
      return NextResponse.json({ ok: true, resultados });
    }

    const conEducadores = body.conEducadores === true;
    if (body.tipo === 'curso') {
      const curso = await enviarCurso(
        academia,
        Number(body.courseId),
        userId,
        conEducadores
      );
      return NextResponse.json({ ok: true, ...curso, academia: academia.slug });
    }
    if (body.tipo === 'programa') {
      const programa = await enviarPrograma(
        academia,
        Number(body.programaId),
        userId,
        conEducadores
      );
      return NextResponse.json({
        ok: true,
        ...programa,
        academia: academia.slug,
      });
    }
    throw new ErrorAcademia('Tipo de envío inválido.');
  } catch (error) {
    return respuestaDeError(error, 'enviar a academia');
  }
}
