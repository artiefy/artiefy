'use client';

import React, { useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { UsersIcon } from '@heroicons/react/24/solid';
import { FaArrowLeft } from 'react-icons/fa';

import { Header } from '~/components/estudiantes/layout/Header';
import {
  getProjectById,
  ProjectDetail,
} from '~/server/actions/project/getProjectById';
import { Category } from '~/types';

import ModalCategoria from '../../components/Modals/ModalCategoria';
import ModalConfirmacionEliminacion from '../../components/Modals/ModalConfirmacionEliminacion';
import ModalIntegrantesProyectoInfo from '../../components/Modals/ModalIntegrantesProyectoInfo';
import ModalResumen from '../../components/Modals/ModalResumen';

export default function DetalleProyectoPage() {
  const params = useParams();
  const projectId = Number(params?.id);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
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

  // Calcula el número máximo de meses usados en el cronograma
  const maxMes = React.useMemo(() => {
    if (!project?.actividades?.length) return 0;
    const allMonths = project.actividades.flatMap((a) => a.meses ?? []);
    return allMonths.length ? Math.max(...allMonths) + 1 : 1;
  }, [project]);

  // Genera los nombres de los meses para la cabecera
  const mesesHeader = React.useMemo(() => {
    const meses = [];
    const now = new Date();
    for (let i = 0; i < maxMes; i++) {
      const d = new Date(now);
      d.setMonth(now.getMonth() + i);
      meses.push(d.toLocaleString('es-ES', { month: 'long' }).toUpperCase());
    }
    return meses;
  }, [maxMes]);

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
          <div className="flex h-[35vh] w-full flex-col justify-end rounded-lg bg-gray-700 p-4">
            <h1 className="text-4xl font-bold text-cyan-300">{project.name}</h1>
            <div className="mt-2 text-lg text-cyan-200">
              Tipo de Proyecto: {project.type_project}
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
        </div>
        <div className="flex flex-col gap-2">
          <button className="rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700">
            {project.isPublic ? 'Proyecto Público' : 'Publicar Proyecto'}
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
        <h3 className="mb-2 text-center font-semibold">Cronograma</h3>
        {project.actividades && project.actividades.length > 0 && maxMes > 0 ? (
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full table-auto border-collapse text-sm text-white">
              <thead className="sticky top-0 z-10 bg-gray-300 text-black">
                <tr>
                  <th className="border bg-gray-200 px-2 py-2 text-left break-words">
                    Actividad
                  </th>
                  {mesesHeader.map((mes, i) => (
                    <th
                      key={i}
                      className="border bg-gray-200 px-2 py-2 text-left break-words whitespace-normal"
                    >
                      {mes}
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
                    {mesesHeader.map((_, i) => (
                      <td
                        key={i}
                        className={`border px-2 py-2 ${
                          act.meses?.includes(i)
                            ? 'bg-cyan-300 font-bold text-white'
                            : 'bg-white'
                        }`}
                      />
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
        numMeses={maxMes} // <-- pasa la cantidad de meses calculada
        setActividades={() => {
          /* función vacía para cumplir con la prop, sin error de eslint */
        }}
        setObjetivosEsp={() => {
          /* función vacía para cumplir con la prop, sin error de eslint */
        }}
        // Puedes agregar más props si tu ModalResumen lo requiere
      />
    </div>
  );
}
