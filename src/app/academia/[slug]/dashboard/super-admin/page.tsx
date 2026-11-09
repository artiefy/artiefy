import { Suspense } from 'react';

import {
  type EstadisticasAcademia,
  InicioSuperAdminAcademia,
} from '~/components/academy/InicioSuperAdminAcademia';
import { type Academia } from '~/server/academy/academias';
import { ETIQUETA_ROL, listarUsuarios } from '~/server/academy/usuarios';

import { PanelDeRol } from '../_components/PanelDeRol';

// <slug>.artiefy.com/dashboard/super-admin — Inicio: Estadísticas y
// Configuraciones de la academia.

type Props = { params: Promise<{ slug: string }> };

const SEMANA_MS = 7 * 24 * 60 * 60 * 1000;

// Inicio de la ventana de "nuevos" (últimos 7 días).
const haceUnaSemana = () => Date.now() - SEMANA_MS;

export default function SuperAdminAcademiaPage({ params }: Props) {
  return (
    <Suspense>
      <PanelDeRol
        params={params}
        rol="super-admin"
        saludo={false}
        render={({ academia }) => <Inicio academia={academia} />}
      />
    </Suspense>
  );
}

async function Inicio({ academia }: { academia: Academia }) {
  const usuarios = await listarUsuarios(academia.id);
  const desde = haceUnaSemana();
  const nuevos = usuarios
    .filter((u) => u.createdAt.getTime() >= desde)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const estadisticas: EstadisticasAcademia = {
    usuarios: nuevos.length,
    estudiantes: nuevos.filter((u) => u.role === 'estudiante').length,
    educadores: nuevos.filter((u) => u.role === 'educador').length,
    recientes: nuevos.slice(0, 10).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      rol: ETIQUETA_ROL[u.role],
      fecha: u.createdAt.toISOString(),
    })),
  };

  return (
    <InicioSuperAdminAcademia
      academia={{
        slug: academia.slug,
        nombre: academia.nombre,
        acronimo: academia.acronimo,
        tipo: academia.tipo,
        documentoTipo: academia.documentoTipo,
        documentoNumero: academia.documentoNumero,
        esArtiefy: academia.esArtiefy,
        colorPrimario: academia.colorPrimario,
        colorFondo: academia.colorFondo,
      }}
      estadisticas={estadisticas}
    />
  );
}
