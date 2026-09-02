'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { FaArrowLeft } from 'react-icons/fa';

import ProjectDetailView from '~/components/estudiantes/projects/ProjectDetailView';
import ModalResumen from '~/components/projects/Modals/ModalResumen';

import type { Project } from '~/types/project';

interface UserProjectWorkspaceProps {
  project: Project;
  /**
   * Only the owner edits. A visitor reaching a public project — or an invited
   * collaborator, who may upload deliverables but not rewrite the project —
   * gets the same view without `onEditSection`, which is what
   * `ProjectDetailView` requires to render its section controls.
   */
  canEdit?: boolean;
}

/**
 * Workspace for a courseless ("+ Nuevo proyecto") project created from
 * `/proyectos`. Reuses the same `ProjectDetailView` course-linked projects
 * get, wired to `ModalResumen` exactly like `ProjectsSection.tsx` does — the
 * pencil on each section reopens the 8-step wizard at that step, `projectId`
 * set so it EDITS this project instead of creating a new one.
 */
export function UserProjectWorkspace({
  project: initialProject,
  canEdit = true,
}: UserProjectWorkspaceProps) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<number | undefined>(undefined);
  const [addedSections, setAddedSections] = useState<
    Record<string, { name: string; content: string }>
  >({});

  const handleEditSection = (
    step: number,
    sections?: Record<string, { name: string; content: string }>
  ) => {
    if (sections) {
      setAddedSections(sections);
    }
    setModalStep(step);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModalStep(undefined);
    // Re-sync with the server (sections, activities, etc. the wizard may
    // have saved through other endpoints) without a hard reload.
    router.refresh();
  };

  const applyProjectUpdate = (updated: Record<string, unknown>) => {
    const description =
      typeof updated.description === 'string' ? updated.description : undefined;
    const planteamiento =
      typeof updated.planteamiento === 'string'
        ? updated.planteamiento
        : undefined;
    const justificacion =
      typeof updated.justificacion === 'string'
        ? updated.justificacion
        : undefined;
    const objetivoGeneral =
      typeof updated.objetivo_general === 'string'
        ? updated.objetivo_general
        : undefined;
    const name = typeof updated.name === 'string' ? updated.name : undefined;
    const requirements =
      typeof updated.requirements === 'string'
        ? updated.requirements
        : undefined;
    const typeProject =
      typeof updated.type_project === 'string'
        ? updated.type_project
        : undefined;
    const categoryId =
      typeof updated.categoryId === 'number' ? updated.categoryId : undefined;
    const fechaInicio =
      typeof updated.fechaInicio === 'string' ? updated.fechaInicio : undefined;
    const fechaFin =
      typeof updated.fechaFin === 'string' ? updated.fechaFin : undefined;

    setProject((prev) => ({
      ...prev,
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(planteamiento !== undefined ? { planteamiento } : {}),
      ...(justificacion !== undefined ? { justificacion } : {}),
      ...(objetivoGeneral !== undefined
        ? { objetivo_general: objetivoGeneral }
        : {}),
      ...(requirements !== undefined ? { requirements } : {}),
      ...(typeProject !== undefined ? { type_project: typeProject } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(fechaInicio !== undefined ? { fecha_inicio: fechaInicio } : {}),
      ...(fechaFin !== undefined ? { fecha_fin: fechaFin } : {}),
    }));
  };

  return (
    <div
      className="
        mx-auto max-w-5xl space-y-6 px-4 py-8
        sm:px-6
        lg:px-8
      "
    >
      <Link
        href="/proyectos"
        className="
          -ml-2 inline-flex h-10 w-full items-center justify-center gap-2
          rounded-md px-4 py-2 text-sm font-medium text-muted-foreground
          ring-offset-background transition-colors
          hover:bg-accent hover:text-black
          focus-visible:ring-2 focus-visible:ring-ring
          focus-visible:ring-offset-2 focus-visible:outline-none
          disabled:pointer-events-none disabled:opacity-50
          sm:w-auto sm:whitespace-nowrap
        "
      >
        <FaArrowLeft className="mr-2 size-4" />
        Volver a proyectos
      </Link>

      <ProjectDetailView
        project={project}
        onEditSection={canEdit ? handleEditSection : undefined}
        addedSections={addedSections}
        onAddedSectionsChange={setAddedSections}
      />

      {canEdit ? (
        <ModalResumen
          isOpen={showModal}
          onClose={handleModalClose}
          initialStep={modalStep}
          titulo={project.name}
          description={project.description ?? ''}
          planteamiento={project.planteamiento}
          justificacion={project.justificacion ?? ''}
          objetivoGen={project.objetivo_general ?? ''}
          objetivosEsp={[]}
          categoriaId={project.categoryId}
          courseId={undefined}
          projectId={project.id}
          coverImageKey={project.coverImageKey ?? undefined}
          coverVideoKey={undefined}
          tipoProyecto={project.type_project}
          onUpdateProject={applyProjectUpdate}
          fechaInicio={project.fecha_inicio ?? ''}
          fechaFin={project.fecha_fin ?? ''}
          actividades={[]}
          responsablesPorActividad={{}}
          horasPorActividad={{}}
          setHorasPorActividad={() => {}}
          horasPorDiaProyecto={6}
          setHorasPorDiaProyecto={() => {}}
          tiempoEstimadoProyecto={0}
          addedSections={addedSections}
          onAddedSectionsChange={setAddedSections}
          setTiempoEstimadoProyecto={() => {}}
          onProjectCreated={() => {
            router.refresh();
          }}
          setObjetivosEsp={() => {}}
          setActividades={() => {}}
          onAnterior={() => {}}
          setPlanteamiento={() => {}}
          setJustificacion={() => {}}
          setObjetivoGen={() => {}}
          setObjetivosEspProp={() => {}}
        />
      ) : null}
    </div>
  );
}
