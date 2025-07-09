'use client';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

import { UsersIcon } from '@heroicons/react/24/solid';
import { ImageIcon } from 'lucide-react';
import { FaArrowLeft } from 'react-icons/fa';

import { Header } from '~/components/estudiantes/layout/Header';
import {
  getProjectById,
  ProjectDetail,
} from '~/server/actions/project/getProjectById';
import { Category } from '~/types';

import ModalCategoria from '../../../../components/projects/Modals/ModalCategoria';
import ModalConfirmacionEliminacion from '../../../../components/projects/Modals/ModalConfirmacionEliminacion';
import ModalIntegrantesProyectoInfo from '../../../../components/projects/Modals/ModalIntegrantesProyectoInfo';
import ModalResumen from '../../../../components/projects/Modals/ModalResumen';

export default function DetalleProyectoPage() {
  const params = useParams();
  const projectId = Number(params?.id);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [ModalCategoriaOpen, setModalCategoriaOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [responsable, setResponsable] = useState<string>(
    'Nombre del Responsable'
  );
  const [_categoria, setCategoria] = useState<Category | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      setLoading(true);
      const data = await getProjectById(projectId);
      setProject(data);
      setLoading(false);

      // Obtener el nombre del responsable si el proyecto existe
      if (data?.userId) {
        try {
          const res = await fetch(`/api/user?userId=${data.userId}`);
          if (res.ok) {
            const user: { name?: string } = await res.json();
            setResponsable(user?.name ?? 'Nombre del Responsable');
          } else {
            setResponsable('Nombre del Responsable');
          }
        } catch {
          setResponsable('Nombre del Responsable');
        }
      }

      // Obtener la categoría del proyecto
      if (data?.categoryId) {
        try {
          // Cambia 'id' por 'categoryId' en la URL
          const url = `/api/projects/categoriesProjects?categoryId=${encodeURIComponent(data.categoryId)}`;
          const res = await fetch(url);
          if (res.ok) {
            const cat: Category | Category[] = await res.json();
            setCategoria(Array.isArray(cat) ? cat[0] : cat);
          } else {
            setCategoria(null);
          }
        } catch (err) {
          console.error('Error obteniendo categoría:', err);
          setCategoria(null);
        }
      }
    })();
  }, [projectId]);

  // Construir la URL de la imagen usando la misma lógica que en la página de proyectos
  const projectImageUrl = React.useMemo(() => {
    if (!project?.coverImageKey) return null;

    // Usar la misma lógica que en la página de proyectos
    return `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`;
  }, [project?.coverImageKey]);

  // Detectar el tipo de cronograma usando el campo tipo_visualizacion si existe
  const cronogramaInfo = React.useMemo(() => {
    if (!project?.actividades?.length)
      return { tipo: 'sin_datos', maxUnidades: 0 };

    // Prioridad: usar tipo_visualizacion si existe
    let tipo: 'dias' | 'meses' = 'meses';
    if (
      project?.tipo_visualizacion === 'dias' ||
      project?.tipo_visualizacion === 'meses'
    ) {
      tipo = project.tipo_visualizacion;
    } else {
      // fallback heurística
      const allValues = project.actividades.flatMap((a) => a.meses ?? []);
      if (!allValues.length) return { tipo: 'sin_datos', maxUnidades: 0 };
      const maxValue = Math.max(...allValues);
      tipo = maxValue >= 10 ? 'dias' : 'meses';
    }

    // Calcular maxUnidades según tipo y fechas
    let maxUnidades = 0;
    if (tipo === 'dias' && project.fecha_inicio && project.fecha_fin) {
      const [y1, m1, d1] = project.fecha_inicio.split('-').map(Number);
      const [y2, m2, d2] = project.fecha_fin.split('-').map(Number);
      const fechaInicio = new Date(Date.UTC(y1, m1 - 1, d1));
      const fechaFin = new Date(Date.UTC(y2, m2 - 1, d2));
      maxUnidades =
        Math.floor(
          (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24)
        ) + 1;
    } else if (tipo === 'meses' && project.fecha_inicio && project.fecha_fin) {
      const fechaInicio = new Date(project.fecha_inicio);
      const fechaFin = new Date(project.fecha_fin);
      let count = 0;
      const fechaActual = new Date(fechaInicio);
      while (fechaActual <= fechaFin) {
        count++;
        fechaActual.setMonth(fechaActual.getMonth() + 1);
      }
      maxUnidades = count;
    } else {
      // fallback: usar heurística anterior
      const allValues = project.actividades.flatMap((a) => a.meses ?? []);
      maxUnidades = allValues.length ? Math.max(...allValues) + 1 : 0;
    }

    return { tipo, maxUnidades };
  }, [project]);

  // Genera las cabeceras según el tipo detectado y las fechas reales del proyecto
  const unidadesHeader = React.useMemo(() => {
    const unidades = [];
    if (
      cronogramaInfo.tipo === 'dias' &&
      project?.fecha_inicio &&
      project?.fecha_fin
    ) {
      // Generar días exactos entre fecha_inicio y fecha_fin
      const [y1, m1, d1] = project.fecha_inicio.split('-').map(Number);
      const [y2, m2, d2] = project.fecha_fin.split('-').map(Number);
      let fechaActual = new Date(Date.UTC(y1, m1 - 1, d1));
      const fechaFin = new Date(Date.UTC(y2, m2 - 1, d2));
      let i = 0;
      while (fechaActual <= fechaFin) {
        unidades.push({
          indice: i,
          etiqueta: `Día ${i + 1}`,
          fecha: fechaActual.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'UTC',
          }),
        });
        fechaActual = new Date(fechaActual.getTime() + 24 * 60 * 60 * 1000);
        i++;
      }
    } else if (
      cronogramaInfo.tipo === 'meses' &&
      project?.fecha_inicio &&
      project?.fecha_fin
    ) {
      // Generar meses exactos entre fecha_inicio y fecha_fin
      const fechaInicio = new Date(project.fecha_inicio);
      const fechaFin = new Date(project.fecha_fin);
      let i = 0;
      const fechaActual = new Date(fechaInicio);
      while (fechaActual <= fechaFin) {
        unidades.push({
          indice: i,
          etiqueta: `Mes ${i + 1}`,
          fecha: fechaActual
            .toLocaleString('es-ES', { month: 'long', year: 'numeric' })
            .toUpperCase(),
        });
        fechaActual.setMonth(fechaActual.getMonth() + 1);
        i++;
      }
    } else if (project?.actividades && project.actividades.length > 0) {
      // Fallback: mostrar tantas columnas como el mayor índice de meses/días en actividades
      const maxIndex = Math.max(
        ...project.actividades.flatMap((a) => a.meses ?? [0])
      );
      for (let i = 0; i <= maxIndex; i++) {
        unidades.push({
          indice: i,
          etiqueta:
            cronogramaInfo.tipo === 'dias'
              ? `Día ${i + 1}`
              : `Mes ${i + 1}`,
          fecha: '',
        });
      }
    }
    return unidades;
  }, [cronogramaInfo, project?.fecha_inicio, project?.fecha_fin, project?.actividades]);

  // Publicar o despublicar proyecto
  const handleTogglePublicarProyecto = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic: !project?.isPublic }),
      });
      if (res.ok) {
        setProject((prev) =>
          prev ? { ...prev, isPublic: !prev.isPublic } : prev
        );
      } else {
        alert('No se pudo actualizar el estado público del proyecto');
      }
    } catch {
      alert('Error al actualizar el estado público del proyecto');
    }
  };

  // Define una interfaz para el proyecto actualizado
  interface UpdatedProjectData {
    name?: string;
    planteamiento?: string;
    justificacion?: string;
    objetivo_general?: string;
    objetivos_especificos?: string[];
    actividades?: { descripcion: string; meses: number[] }[];
    type_project?: string;
    categoryId?: number;
    coverImageKey?: string;
  }

  const handleUpdateProject = (updatedProjectData: UpdatedProjectData) => {
    setProject((prev) => {
      if (!prev) return prev;

      const updatedProject = {
        ...prev,
        name: updatedProjectData.name ?? prev.name,
        planteamiento: updatedProjectData.planteamiento ?? prev.planteamiento,
        justificacion: updatedProjectData.justificacion ?? prev.justificacion,
        objetivo_general:
          updatedProjectData.objetivo_general ?? prev.objetivo_general,
        objetivos_especificos:
          updatedProjectData.objetivos_especificos ??
          prev.objetivos_especificos,
        actividades: updatedProjectData.actividades
          ? updatedProjectData.actividades.map((act) => ({
              descripcion: act.descripcion,
              meses: act.meses || [],
            }))
          : prev.actividades,
        type_project: updatedProjectData.type_project ?? prev.type_project,
        categoryId: updatedProjectData.categoryId ?? prev.categoryId,
        coverImageKey: updatedProjectData.coverImageKey ?? prev.coverImageKey,
        updatedAt: new Date().toISOString(),
      };

      // Forzar un re-render del cronograma
      console.log('Proyecto actualizado:', updatedProject);
      return updatedProject;
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#041C3C] text-white">
        Cargando proyecto...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#041C3C] text-white">
        Proyecto no encontrado
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#041C3C] px-6 py-4 text-white">
      {/* Header (Navbar superior) */}
      <Header />
      {/* Título y etiquetas */}
      <section className="mt-6">
        <div className="mb-6 flex items-start gap-4">
          <button
            className="ml-8 text-2xl font-semibold text-cyan-300 transition hover:scale-155"
            onClick={() => router.push('/proyectos')}
          >
            <FaArrowLeft />
          </button>
          <div className="relative flex h-[35vh] w-full flex-col justify-end rounded-lg bg-gray-700 p-4">
            {/* Imagen del proyecto */}
            {projectImageUrl && !imageError ? (
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <Image
                  src={projectImageUrl}
                  alt={project.name}
                  fill
                  className="object-cover opacity-30"
                  unoptimized
                  onError={() => {
                    console.error(
                      'Error cargando imagen del proyecto:',
                      project.name,
                      'ID:',
                      project.id,
                      'URL que falló:',
                      projectImageUrl
                    );
                    setImageError(true);
                  }}
                  onLoad={() => {
                    console.log(
                      'Imagen cargada exitosamente para el proyecto:',
                      project.name,
                      'URL:',
                      projectImageUrl
                    );
                  }}
                />
              </div>
            ) : (
              // Placeholder cuando no hay imagen o falla la carga
              project.coverImageKey && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-700/50">
                  <div className="text-center text-slate-400">
                    <ImageIcon className="mx-auto mb-2 h-12 w-12" />
                    <p className="text-sm">
                      {imageError
                        ? 'Error al cargar imagen'
                        : 'Cargando imagen...'}
                    </p>
                  </div>
                </div>
              )
            )}
            {/* Contenido del título sobre la imagen */}
            <div className="relative z-10">
              <h1 className="text-4xl font-bold text-cyan-300">
                {project.name}
              </h1>
              <div className="mt-2 text-lg text-cyan-200">
                Tipo de Proyecto: {project.type_project}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-3">
          <div>
            <button
              onClick={() => setModalCategoriaOpen(true)}
              className="flex items-center gap-1 rounded bg-[#1F3246] px-3 py-1 text-sm text-cyan-300 hover:scale-105"
            >
              Categoria:{' '}
              <span className="ml-1 font-semibold text-white">
                {_categoria?.name ?? 'Sin categoría'}
              </span>
            </button>
          </div>
          <ModalCategoria
            isOpen={ModalCategoriaOpen}
            onClose={() => setModalCategoriaOpen(false)}
            categoria={_categoria}
          />
          <div>
            <span className="rounded bg-[#1F3246] px-3 py-1 text-sm text-cyan-300">
              📅 Creado:{' '}
              {project.createdAt
                ? new Date(project.createdAt).toLocaleDateString()
                : ''}
            </span>
          </div>
          <div>
            <span className="rounded bg-[#1F3246] px-3 py-1 text-sm text-cyan-300">
              📅 Actualizado:{' '}
              {project.updatedAt
                ? new Date(project.updatedAt).toLocaleDateString()
                : ''}
            </span>
          </div>
          <div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 rounded bg-[#1F3246] px-3 py-1 text-sm text-purple-300 hover:scale-105"
            >
              # <UsersIcon className="inline h-4 w-4 text-purple-300" />{' '}
              Integrantes
            </button>
          </div>
          <ModalIntegrantesProyectoInfo
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />

          <div className="ml-auto flex flex-col gap-2">
            <div className="rounded bg-[#1F3246] px-3 py-1 text-center text-2xl font-semibold text-cyan-300">
              Nombre del Responsable
            </div>
            <div className="rounded bg-[#1F3246] px-3 py-7 text-center text-cyan-300">
              {responsable}
            </div>
          </div>
        </div>
      </section>

      {/* Información y botones */}
      <section className="mt-6 flex items-start justify-between">
        <div>
          <p className="text-lg">{project.planteamiento}</p>
          {/* Mostrar fechas de inicio y fin si existen */}
          {project.fecha_inicio && project.fecha_fin && (
            <div className="mt-2 text-base text-cyan-200">
              <span>
                <b>Fecha de inicio:</b>{' '}
                {new Date(project.fecha_inicio).toLocaleDateString('es-ES')}
              </span>
              <br />
              <span>
                <b>Fecha de fin:</b>{' '}
                {new Date(project.fecha_fin).toLocaleDateString('es-ES')}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            className={
              project.isPublic
                ? 'rounded bg-yellow-600 px-4 py-2 font-semibold text-white hover:bg-yellow-700'
                : 'rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700'
            }
            onClick={handleTogglePublicarProyecto}
          >
            {project.isPublic ? 'Despublicar Proyecto' : 'Publicar Proyecto'}
          </button>
          <button
            className="rounded bg-cyan-600 px-4 py-2 font-semibold text-white hover:bg-cyan-700"
            onClick={() => setIsEditModalOpen(true)}
          >
            Editar Proyecto
          </button>
          <button
            className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
            onClick={() => setConfirmOpen(true)}
          >
            Eliminar Proyecto
          </button>
          {/* Modal de confirmación */}
          <ModalConfirmacionEliminacion
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            projectId={projectId}
          />
        </div>
      </section>

      {/* Secciones de contenido */}
      <section className="mt-8 grid grid-cols-2 gap-6">
        {[
          {
            title: 'Planteamiento del Problema',
            content: project.planteamiento,
          },
          {
            title: 'Justificación',
            content: project.justificacion,
          },
          {
            title: 'Objetivo General',
            content: project.objetivo_general,
          },
          {
            title: 'Objetivos Específicos',
            content: (
              <ul className="ml-5 list-disc">
                {project.objetivos_especificos?.length > 0 ? (
                  project.objetivos_especificos.map(
                    (obj: string, idx: number) => <li key={idx}>{obj}</li>
                  )
                ) : (
                  <li>No hay objetivos específicos</li>
                )}
              </ul>
            ),
          },
          {
            title: 'Actividades',
            content: (
              <ul className="ml-5 list-disc">
                {project.actividades?.length > 0 ? (
                  project.actividades.map(
                    (act: { descripcion: string }, idx: number) => (
                      <li key={idx}>{act.descripcion}</li>
                    )
                  )
                ) : (
                  <li>No hay actividades</li>
                )}
              </ul>
            ),
          },
        ].map((item, i) => (
          <div key={i} className="relative rounded bg-[#1F3246] p-4">
            <h3 className="text-md font-semibold">{item.title}</h3>
            <div className="mt-2">{item.content}</div>
          </div>
        ))}
      </section>

      {/* Cronograma */}
      <section className="relative mx-auto mt-6 max-w-3xl rounded bg-[#1F3246] p-4">
        <h3 className="mb-2 text-center font-semibold">
          Cronograma (
          {cronogramaInfo.tipo === 'dias' ? 'Por Días' : 'Por Meses'})
        </h3>

        {project.actividades &&
        project.actividades.length > 0 &&
        unidadesHeader.length > 0 ? (
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full table-auto border-collapse text-sm text-white">
              <thead className="sticky top-0 z-10 bg-gray-300 text-black">
                <tr>
                  <th className="border bg-gray-200 px-2 py-2 text-left break-words">
                    Actividad
                  </th>
                  {unidadesHeader.map((unidad) => (
                    <th
                      key={unidad.indice}
                      className="border bg-gray-200 px-2 py-2 text-center break-words whitespace-normal"
                    >
                      <div className="text-xs font-semibold">
                        {unidad.etiqueta}
                      </div>
                      <div className="text-xs font-normal">{unidad.fecha}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {project.actividades.map((act, idx) => (
                  <tr key={idx}>
                    <td className="border bg-white px-2 py-2 font-medium break-words text-black">
                      {act.descripcion}
                    </td>
                    {unidadesHeader.map((unidad) => (
                      <td
                        key={unidad.indice}
                        className={`border px-2 py-2 text-center ${
                          act.meses?.includes(unidad.indice)
                            ? 'bg-cyan-300 font-bold text-white'
                            : 'bg-white'
                        }`}
                      >
                        {act.meses?.includes(unidad.indice) ? '✓' : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center">Sin cronograma</p>
        )}
      </section>

      <ModalResumen
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        titulo={project.name}
        planteamiento={project.planteamiento}
        justificacion={project.justificacion}
        objetivoGen={project.objetivo_general}
        objetivosEsp={project.objetivos_especificos}
        actividad={project.actividades?.map((a) => a.descripcion) || []}
        cronograma={
          project.actividades
            ? project.actividades.reduce(
                (acc, act) => {
                  acc[act.descripcion] = act.meses || [];
                  return acc;
                },
                {} as Record<string, number[]>
              )
            : {}
        }
        categoriaId={project.categoryId}
        numMeses={cronogramaInfo.maxUnidades}
        setActividades={() => {
          // Función requerida por la interfaz pero sin implementación necesaria
        }}
        setObjetivosEsp={() => {
          // Función requerida por la interfaz pero sin implementación necesaria
        }}
        projectId={project.id}
        coverImageKey={project.coverImageKey ?? undefined}
        tipoProyecto={project.type_project ?? undefined}
        tipoVisualizacion={
          project.tipo_visualizacion === 'dias'
            ? 'dias'
            : project.tipo_visualizacion === 'meses'
              ? 'meses'
              : cronogramaInfo.tipo === 'dias'
                ? 'dias'
                : 'meses'
        }
        fechaInicio={project.fecha_inicio ?? undefined}
        fechaFin={project.fecha_fin ?? undefined}
        onUpdateProject={handleUpdateProject}
      />
    </div>
  );
}
