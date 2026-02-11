'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Calendar,
  ChevronDown,
  CircleCheckBig,
  ClipboardList,
  Clock,
  Code,
  FileText,
  Lightbulb,
  ListChecks,
  MessageSquare,
  Pencil,
  Target,
  TriangleAlert,
  Upload,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '~/components/projects/ui/tabs';
import { useGenerateContent } from '~/hooks/useGenerateContent';

import { Progress } from './ui/progress';
import AddCustomSectionModal from './AddCustomSectionModal';
import AddSectionDropdown from './AddSectionDropdown';

import type { Project } from '~/types/project';

interface ProjectDetailViewProps {
  project: Project;
  onEditSection?: (
    step: number,
    addedSections?: Record<string, { name: string; content: string }>
  ) => void;
  addedSections?: Record<string, { name: string; content: string }>;
  onAddedSectionsChange?: (
    sections: Record<string, { name: string; content: string }>
  ) => void;
}

export default function ProjectDetailView({
  project,
  onEditSection,
  addedSections: initialAddedSections = {},
  onAddedSectionsChange,
}: ProjectDetailViewProps) {
  const totalSections = 7;
  const hasBasicInfo = Boolean(
    project.name?.trim() &&
    ((project.description ?? '').trim() || (project.planteamiento ?? '').trim())
  );
  const hasProblema = Boolean(project.planteamiento?.trim());
  const hasJustificacion = Boolean(project.justificacion?.trim());
  const hasProblemaJustificacion = hasProblema && hasJustificacion;
  const hasObjetivoGeneral = Boolean(project.objetivo_general?.trim());
  const hasRequisitos = (() => {
    if (!project.requirements) return false;
    try {
      const parsed = JSON.parse(project.requirements) as unknown;
      return Array.isArray(parsed) && parsed.some((item) => item?.trim?.());
    } catch {
      return false;
    }
  })();
  const hasDuracion = Boolean(project.fecha_inicio && project.fecha_fin);
  const hasObjetivosEspecificos =
    Array.isArray(project.objetivos_especificos) &&
    project.objetivos_especificos.length > 0;
  const hasCronograma = (() => {
    const objectives = project.objetivos_especificos ?? [];
    const objectiveActivities = objectives.flatMap(
      (obj) => obj.actividades ?? []
    );
    const activities = project.activities ?? [];
    return [...objectiveActivities, ...activities].some(
      (activity) => activity.startDate && activity.endDate
    );
  })();
  const completedSections = [
    hasBasicInfo,
    hasProblemaJustificacion,
    hasObjetivoGeneral,
    hasRequisitos,
    hasDuracion,
    hasObjetivosEspecificos,
    hasCronograma,
  ].filter(Boolean).length;
  const fallbackProgress = Math.round(
    (completedSections / totalSections) * 100
  );
  const progressPercentage =
    typeof project.progressPercentage === 'number'
      ? project.progressPercentage
      : fallbackProgress;
  const isProjectComplete = completedSections === totalSections;
  const [timelineView, setTimelineView] = useState<
    'dias' | 'semanas' | 'meses'
  >('semanas');
  const [expandedObjectives, setExpandedObjectives] = useState<
    Record<number, boolean>
  >({});
  const [expandedActivities, setExpandedActivities] = useState<
    Record<number, boolean>
  >({});
  const [activityDescriptions, setActivityDescriptions] = useState<
    Record<number, string>
  >({});
  const [uploadingActivities, setUploadingActivities] = useState<
    Record<number, boolean>
  >({});
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>(
    {}
  );
  const [removingActivities, setRemovingActivities] = useState<
    Record<number, boolean>
  >({});
  const [savingDescriptions, setSavingDescriptions] = useState<
    Record<number, boolean>
  >({});
  const [editingDescriptions, setEditingDescriptions] = useState<
    Record<number, boolean>
  >({});
  const [deliverableOverrides, setDeliverableOverrides] = useState<
    Record<number, { url: string; name: string; submittedAt: string }>
  >({});
  const [addedSections, setAddedSectionsState] =
    useState<Record<string, { name: string; content: string }>>(
      initialAddedSections
    );
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [isAddingSectionLoading, setIsAddingSectionLoading] = useState(false);
  const [isDeletingSection, setIsDeletingSection] = useState<string | null>(
    null
  );
  const [pendingSection, setPendingSection] = useState<{
    id: string;
    name: string;
    isCustom: boolean;
  } | null>(null);

  const { generateContent } = useGenerateContent();

  // Sincronizar estado local con cambios de prop del padre
  useEffect(() => {
    console.log(
      `📋 ProjectDetailView: Sincronizando secciones desde prop:`,
      initialAddedSections
    );
    setAddedSectionsState(initialAddedSections);
  }, [initialAddedSections]);

  const setAddedSections = (
    sections:
      | Record<string, { name: string; content: string }>
      | ((
          prev: Record<string, { name: string; content: string }>
        ) => Record<string, { name: string; content: string }>)
  ) => {
    const newSections =
      typeof sections === 'function' ? sections(addedSections) : sections;
    setAddedSectionsState(newSections);
    onAddedSectionsChange?.(newSections);
  };

  const handleSectionSelect = async (sectionId: string, isCustom?: boolean) => {
    if (isCustom) {
      setPendingSection({ id: 'custom', name: '', isCustom: true });
      setShowAddCustomModal(true);
      return;
    }

    if (!addedSections[sectionId]) {
      setPendingSection({
        id: sectionId,
        name: getSectionLabel(sectionId),
        isCustom: false,
      });
      setShowAddCustomModal(true);
    }
  };

  const getSectionLabel = (sectionId: string): string => {
    const labels: Record<string, string> = {
      introduccion: 'Introducción',
      justificacion: 'Justificación',
      'marco-teorico': 'Marco Teórico',
      metodologia: 'Metodología',
      alcance: 'Alcance',
      equipo: 'Equipo',
    };
    return labels[sectionId] ?? sectionId;
  };

  const handleAddCustomSection = async (name: string, description: string) => {
    setIsAddingSectionLoading(true);
    try {
      const sectionId = pendingSection?.isCustom
        ? `custom-${Date.now()}`
        : (pendingSection?.id ?? `custom-${Date.now()}`);
      const sectionName = pendingSection?.isCustom
        ? name
        : (pendingSection?.name ?? name);
      const newSections = {
        ...addedSections,
        [sectionId]: { name: sectionName, content: description },
      };

      console.log(`📝 handleAddCustomSection: Guardando sección personalizada`);
      // Guardar en BD de forma silenciosa
      const response = await fetch('/api/project-sections-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          sections: newSections,
        }),
      });

      if (response.ok) {
        // Actualizar estado local solo si se guardó exitosamente
        setAddedSections(newSections);
        setShowAddCustomModal(false);
        setPendingSection(null);
        toast.success('Sección personalizada agregada correctamente');
        console.log(
          `✅ handleAddCustomSection: Sección personalizada guardada`
        );
      } else {
        const error = await response.json();
        console.error(`❌ handleAddCustomSection: ${error.error}`);
        toast.error(error.error || 'Error al agregar sección');
      }
    } catch (error) {
      console.error('❌ handleAddCustomSection: Error:', error);
      toast.error('Error al agregar sección');
    } finally {
      setIsAddingSectionLoading(false);
    }
  };

  const sectionContext = useMemo(() => {
    const parts = [
      project.name?.trim() ? `Título del proyecto: ${project.name.trim()}` : '',
      project.description?.trim()
        ? `Descripción del proyecto: ${project.description.trim()}`
        : project.planteamiento?.trim()
          ? `Descripción del proyecto: ${project.planteamiento.trim()}`
          : '',
      project.planteamiento?.trim()
        ? `Problema: ${project.planteamiento.trim()}`
        : '',
      project.justificacion?.trim()
        ? `Justificación: ${project.justificacion.trim()}`
        : '',
      project.objetivo_general?.trim()
        ? `Objetivo general: ${project.objetivo_general.trim()}`
        : '',
    ].filter(Boolean);

    const extraSections = Object.entries(addedSections)
      .map(([id, section]) => {
        const label = section.name?.trim() || id;
        const content = section.content?.trim() || '';
        if (!content) return `Sección ${label}: (sin contenido)`;
        return `Sección ${label}: ${content}`;
      })
      .filter(Boolean)
      .slice(0, 6);

    const context = [...parts, ...extraSections].join('\n');
    return context.length > 2000 ? context.slice(0, 2000) : context;
  }, [project, addedSections]);

  const handleGenerateSectionDescription = async (
    currentText: string,
    sectionTitleOverride: string
  ) => {
    if (!pendingSection) return null;
    const sectionTitle =
      sectionTitleOverride.trim() || pendingSection.name || 'Sección';
    const basePrompt = currentText.trim()
      ? `Mejora y reescribe el contenido de la sección "${sectionTitle}" manteniendo el significado.`
      : `Genera el contenido para la sección "${sectionTitle}" de un proyecto educativo.`;
    const prompt = `${basePrompt}\n\nContexto del proyecto:\n${sectionContext}\n\nResponde solo con el contenido de la sección.`;

    const result = await generateContent({
      type: 'descripcion',
      prompt,
      titulo: project.name ?? '',
      descripcion: project.description ?? project.planteamiento ?? '',
      existingText: currentText,
      sectionTitle,
      sectionsContext: sectionContext,
    });

    return result;
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      setIsDeletingSection(sectionId);
      console.log(`🗑️ Eliminando sección: ${sectionId}`);

      const response = await fetch('/api/project-sections-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          sectionId,
        }),
      });

      if (response.ok) {
        // Eliminar del estado local
        setAddedSections((prev) => {
          const newSections = { ...prev };
          delete newSections[sectionId];
          return newSections;
        });
        toast.success('Sección eliminada correctamente');
        console.log(`✅ Sección eliminada: ${sectionId}`);
      } else {
        const error = await response.json();
        console.error(`❌ Error al eliminar: ${error.error}`);
        toast.error(error.error || 'Error al eliminar sección');
      }
    } catch (error) {
      console.error('❌ Error al eliminar sección:', error);
      toast.error('Error al eliminar sección');
    } finally {
      setIsDeletingSection(null);
    }
  };

  const normalizeActivityId = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value.trim());
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const orderActivities = <T extends { id?: unknown }>(list: T[]) =>
    list
      .map((item, index) => ({
        item,
        index,
        id: normalizeActivityId(item.id),
      }))
      .sort((a, b) => {
        if (a.id == null && b.id == null) return a.index - b.index;
        if (a.id == null) return 1;
        if (b.id == null) return -1;
        return b.id - a.id;
      })
      .map(({ item }) => item);

  const toggleObjective = (objectiveId: number) => {
    setExpandedObjectives((prev) => ({
      ...prev,
      [objectiveId]: !prev[objectiveId],
    }));
  };

  const fetchDeliverable = async (activityId: number) => {
    const res = await fetch(
      `/api/projects/activities/${activityId}/deliverable`
    );
    if (!res.ok) return;
    const data = (await res.json()) as {
      success?: boolean;
      data?: {
        deliverableUrl?: string | null;
        deliverableName?: string | null;
        deliverableDescription?: string | null;
        deliverableSubmittedAt?: string | null;
      };
    };

    if (data?.data?.deliverableDescription) {
      setActivityDescriptions((prev) => ({
        ...prev,
        [activityId]: data.data?.deliverableDescription ?? '',
      }));
    }

    if (data?.data?.deliverableUrl) {
      setDeliverableOverrides((prev) => ({
        ...prev,
        [activityId]: {
          url: data.data?.deliverableUrl ?? '',
          name: data.data?.deliverableName ?? '',
          submittedAt: data.data?.deliverableSubmittedAt ?? '',
        },
      }));
    } else {
      setDeliverableOverrides((prev) => ({
        ...prev,
        [activityId]: { url: '', name: '', submittedAt: '' },
      }));
    }
  };

  const toggleActivity = (activityKey: number, activityId?: number) => {
    setExpandedActivities((prev) => ({
      ...prev,
      [activityKey]: !prev[activityKey],
    }));

    if (activityId && !expandedActivities[activityKey]) {
      void fetchDeliverable(activityId);
    }
  };

  const handleDeliverableUpload = async (
    activityId: number,
    file: File,
    description: string
  ) => {
    try {
      setUploadingActivities((prev) => ({ ...prev, [activityId]: true }));
      setUploadProgress((prev) => ({ ...prev, [activityId]: 0 }));

      const res = await fetch(
        `/api/projects/activities/${activityId}/deliverable`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            description,
          }),
        }
      );

      if (!res.ok) {
        throw new Error('No se pudo subir el entregable');
      }

      const data = (await res.json()) as {
        url: string;
        fields: Record<string, string>;
        fileUrl: string;
        key: string;
        submittedAt?: string;
      };

      // Usar XMLHttpRequest para seguimiento de progreso
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100
            );
            setUploadProgress((prev) => ({
              ...prev,
              [activityId]: percentComplete,
            }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error('Error al subir el archivo a S3'));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Error al subir el archivo a S3'));
        });

        xhr.open('POST', data.url);

        const formData = new FormData();
        Object.entries(data.fields).forEach(([field, value]) => {
          formData.append(field, value);
        });
        formData.append('file', file);

        xhr.send(formData);
      });

      setDeliverableOverrides((prev) => ({
        ...prev,
        [activityId]: {
          url: data.fileUrl,
          name: file.name,
          submittedAt: data.submittedAt ?? new Date().toISOString(),
        },
      }));
    } catch (error) {
      console.error('Error al subir entregable:', error);
    } finally {
      setUploadingActivities((prev) => ({ ...prev, [activityId]: false }));
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[activityId];
        return newProgress;
      });
    }
  };

  const handleDescriptionSave = async (
    activityId: number,
    description: string
  ) => {
    try {
      setSavingDescriptions((prev) => ({ ...prev, [activityId]: true }));

      const res = await fetch(
        `/api/projects/activities/${activityId}/deliverable`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description }),
        }
      );

      if (!res.ok) {
        throw new Error('No se pudo guardar la descripción');
      }

      setActivityDescriptions((prev) => ({
        ...prev,
        [activityId]: description,
      }));
      return true;
    } catch (error) {
      console.error('Error al guardar descripción:', error);
      return false;
    } finally {
      setSavingDescriptions((prev) => ({ ...prev, [activityId]: false }));
    }
  };

  const handleDeliverableRemove = async (activityId: number) => {
    try {
      setRemovingActivities((prev) => ({ ...prev, [activityId]: true }));

      const res = await fetch(
        `/api/projects/activities/${activityId}/deliverable`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        throw new Error('No se pudo eliminar el entregable');
      }

      setDeliverableOverrides((prev) => ({
        ...prev,
        [activityId]: { url: '', name: '', submittedAt: '' },
      }));
    } catch (error) {
      console.error('Error al eliminar entregable:', error);
    } finally {
      setRemovingActivities((prev) => ({ ...prev, [activityId]: false }));
    }
  };

  const parseDateForDisplay = (dateString: string) => {
    if (!dateString) return null;
    const datePart = dateString.slice(0, 10);
    const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/u.test(datePart);
    if (!dateOnlyMatch) return null;
    const [year, month, day] = datePart.split('-').map((part) => Number(part));
    if (!year || !month || !day) return null;
    return new Date(Date.UTC(year, month - 1, day, 12));
  };

  const formatDate = (dateString: string) => {
    const parsed = parseDateForDisplay(dateString);
    if (!parsed) return '';
    return parsed.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Bogota',
    });
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota',
    });
  };

  const parseTimelineDate = (value?: string | null) => {
    if (!value) return null;
    const [datePart] = value.split(/[T ]/u);
    if (!datePart) return null;
    const [year, month, day] = datePart.split('-').map((part) => Number(part));
    if (!year || !month || !day) return null;
    return new Date(Date.UTC(year, month - 1, day));
  };

  const formatShortDate = (date: Date) =>
    date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });

  const formatMonthLabel = (date: Date) =>
    date.toLocaleDateString('es-CO', { month: 'short', timeZone: 'UTC' });

  const addDaysUTC = (date: Date, days: number) =>
    new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate() + days
      )
    );

  const getTimelineColumns = (
    startDate: Date | null,
    endDate: Date | null,
    view: 'dias' | 'semanas' | 'meses'
  ) => {
    if (!startDate || !endDate)
      return [] as Array<{
        label: string;
        sublabel: string;
      }>;

    const msPerDay = 1000 * 60 * 60 * 24;
    const toUTCStart = (date: Date) =>
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const totalDays =
      Math.max(
        0,
        Math.floor((toUTCStart(endDate) - toUTCStart(startDate)) / msPerDay)
      ) + 1;

    if (view === 'dias') {
      return Array.from({ length: totalDays }, (_, index) => {
        const date = addDaysUTC(startDate, index);
        return {
          label: `Dia ${index + 1}`,
          sublabel: formatShortDate(date),
        };
      });
    }

    if (view === 'semanas') {
      const totalWeeks = Math.ceil(totalDays / 7);
      return Array.from({ length: totalWeeks }, (_, index) => {
        const date = addDaysUTC(startDate, index * 7);
        return {
          label: `Sem ${index + 1}`,
          sublabel: formatShortDate(date),
        };
      });
    }

    const columns: Array<{ label: string; sublabel: string }> = [];
    const cursor = new Date(
      Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1)
    );
    const endCursor = new Date(
      Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1)
    );
    while (cursor <= endCursor) {
      columns.push({
        label: formatMonthLabel(cursor),
        sublabel: cursor.getFullYear().toString(),
      });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return columns;
  };

  const getTimelineRows = () => {
    const rows: Array<{
      id?: number;
      key: string;
      title: string;
      startDate: Date | null;
      endDate: Date | null;
      deliverableUrl?: string | null;
    }> = [];

    const objectiveActivities = new Set<number>();

    (project.objetivos_especificos ?? []).forEach((objective, objIndex) => {
      (objective.actividades ?? []).forEach((activity, actIndex) => {
        if (typeof activity.id === 'number') {
          objectiveActivities.add(activity.id);
        }
        rows.push({
          id: typeof activity.id === 'number' ? activity.id : undefined,
          key: `${objIndex + 1}.${actIndex + 1}`,
          title: activity.descripcion || 'Actividad sin título',
          startDate: parseTimelineDate(activity.startDate),
          endDate: parseTimelineDate(activity.endDate),
          deliverableUrl: activity.deliverableUrl ?? null,
        });
      });
    });

    const extras = project.activities ?? [];
    extras.forEach((activity, index) => {
      if (
        typeof activity.id === 'number' &&
        objectiveActivities.has(activity.id)
      ) {
        return;
      }
      rows.push({
        id: typeof activity.id === 'number' ? activity.id : undefined,
        key: `A${index + 1}`,
        title: activity.descripcion || 'Actividad sin título',
        startDate: parseTimelineDate(activity.startDate),
        endDate: parseTimelineDate(activity.endDate),
        deliverableUrl: activity.deliverableUrl ?? null,
      });
    });

    return rows
      .map((row, index) => ({ ...row, orderIndex: index }))
      .sort((a, b) => {
        if (a.id == null && b.id == null) return a.orderIndex - b.orderIndex;
        if (a.id == null) return 1;
        if (b.id == null) return -1;
        return b.id - a.id;
      })
      .map(({ orderIndex, ...row }) => row);
  };

  // Proyecto iniciado: al menos un campo está lleno
  return (
    <section className="space-y-6">
      {/* Header del proyecto */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            {/* Badges de Estado, Tipo y Categoría */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {/* Badge de Estado */}
              {isProjectComplete ? (
                <div className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/20 px-2.5 py-0.5 text-xs font-semibold text-green-400 transition-colors hover:bg-primary/80 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1 h-3 w-3"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="m9 12 2 2 4-4"></path>
                  </svg>
                  Completado
                </div>
              ) : (
                <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-400 transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none">
                  <Clock className="mr-1 h-3 w-3" />
                  En progreso
                </div>
              )}
              {/* Badge de Tipo de Proyecto */}
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none">
                {project.type_project}
              </div>
              {/* Badge de Categoría */}
              {project.categoryName && (
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none">
                  {project.categoryName}
                </div>
              )}
            </div>

            {/* Colaboradores */}
            <div className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>0 colaboradores</span>
            </div>

            <h2 className="mb-3 text-xl font-bold text-foreground md:text-2xl">
              {project.name}
            </h2>
            {project.description?.trim() ? (
              <p className="leading-relaxed text-muted-foreground">
                {project.description}
              </p>
            ) : (
              <p className="text-muted-foreground">
                No hay descripcion definida aun.
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Entrega: {formatDate(project.createdAt)}</span>
            </div>
            <button
              type="button"
              onClick={() => onEditSection?.(1, addedSections)}
              className="inline-flex h-8 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-black focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso del proyecto</span>
            <span className="font-medium" style={{ color: '#22c4d3' }}>
              {progressPercentage}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercentage}
            className="relative h-2 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: '#1a2333' }}
          >
            <div
              className="h-full flex-1 transition-all"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: '#22c4d3',
              }}
            />
          </div>
        </div>
      </div>
      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="inline-flex h-auto items-center justify-center rounded-md border border-border/50 bg-card/50 p-1 text-muted-foreground">
          <TabsTrigger
            value="overview"
            className="gap-1.5 rounded-sm px-2.5 py-1.5 text-xs text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-background data-[state=active]:shadow-sm"
          >
            <FileText className="h-3.5 w-3.5" />
            Resumen
          </TabsTrigger>
          <TabsTrigger
            value="submissions"
            className="gap-1.5 rounded-sm px-2.5 py-1.5 text-xs text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-background data-[state=active]:shadow-sm"
          >
            <Upload className="h-3.5 w-3.5" />
            Entregas
          </TabsTrigger>
          <TabsTrigger
            value="feedback"
            className="gap-1.5 rounded-sm px-2.5 py-1.5 text-xs text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-background data-[state=active]:shadow-sm"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Retroalimentación
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="gap-1.5 rounded-sm px-2.5 py-1.5 text-xs text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-background data-[state=active]:shadow-sm"
          >
            <Calendar className="h-3.5 w-3.5" />
            Cronograma
          </TabsTrigger>
          <TabsTrigger
            value="code"
            className="gap-1.5 rounded-sm px-2.5 py-1.5 text-xs text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-background data-[state=active]:shadow-sm"
          >
            <Code className="h-3.5 w-3.5" />
            Código
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Botón Agregar Sección */}
          <div className="flex justify-end">
            <AddSectionDropdown
              addedSections={Object.keys(addedSections)}
              onSectionSelect={handleSectionSelect}
            />
          </div>

          {/* Problema */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20">
                  <TriangleAlert className="h-4 w-4 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Problema
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onEditSection?.(2, addedSections)}
                className="inline-flex h-8 w-8 items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-black focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            {project.planteamiento && project.planteamiento.trim() !== '' ? (
              <p className="leading-relaxed text-muted-foreground">
                {project.planteamiento}
              </p>
            ) : (
              <p className="text-muted-foreground">
                No hay problema definido aún.
              </p>
            )}
          </div>

          {/* Justificación - Solo si existe */}
          {(project.justificacion || addedSections['justificacion']) && (
            <div className="rounded-xl border border-border/50 bg-card/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/20">
                    <Lightbulb className="h-4 w-4 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Justificación
                  </h3>
                </div>
              </div>
              {project.justificacion ||
              addedSections['justificacion']?.content ? (
                <p className="leading-relaxed text-muted-foreground">
                  {project.justificacion ||
                    addedSections['justificacion']?.content}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  No hay contenido definido aún.
                </p>
              )}
            </div>
          )}

          {/* Objetivo General */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'rgba(34, 196, 211, 0.2)' }}
                >
                  <Target className="h-4 w-4" style={{ color: '#22c4d3' }} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Objetivo General
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onEditSection?.(3, addedSections)}
                className="inline-flex h-8 w-8 items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-black focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            {project.objetivo_general ? (
              <p className="leading-relaxed text-muted-foreground">
                {project.objetivo_general}
              </p>
            ) : (
              <p className="text-muted-foreground">
                No hay objetivo general definido aún.
              </p>
            )}
          </div>

          {/* Requisitos */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
                  <ClipboardList className="h-4 w-4 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Requisitos
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onEditSection?.(4, addedSections)}
                className="inline-flex h-8 w-8 items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-black focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            {(() => {
              let reqs: string[] = [];
              try {
                reqs = Array.isArray(project.requirements)
                  ? project.requirements
                  : JSON.parse(project.requirements ?? '[]');
              } catch {
                reqs = [];
              }
              const filtered = reqs.filter(
                (r) => typeof r === 'string' && r.trim() !== ''
              );
              return filtered.length > 0 ? (
                <ul className="space-y-3">
                  {filtered.map((req, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-muted-foreground"
                    >
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
                        {idx + 1}
                      </div>
                      {req}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  No hay requisitos definidos aún.
                </p>
              );
            })()}
          </div>

          {/* Objetivos Específicos */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                  <ListChecks className="h-4 w-4 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Objetivos Específicos
                </h3>
                <span className="text-sm text-muted-foreground">
                  {(() => {
                    const objetivos = project.objetivos_especificos ?? [];
                    const completados = objetivos.filter(
                      (obj) =>
                        (obj.actividades ?? []).length > 0 &&
                        (obj.actividades ?? []).every(
                          (act) => act.startDate && act.endDate
                        )
                    ).length;
                    return `${completados}/${objetivos.length} completados`;
                  })()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onEditSection?.(6, addedSections)}
                className="inline-flex h-8 w-8 items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-black focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            {project.objetivos_especificos &&
            project.objetivos_especificos.length > 0 ? (
              <div className="space-y-3">
                {project.objetivos_especificos.map((objetivo, idx) => {
                  const actividades = orderActivities(
                    objetivo.actividades ?? []
                  );
                  const actividadesCompletadas = actividades.filter((act) =>
                    Boolean(
                      deliverableOverrides[act.id ?? 0]?.url ??
                      act.deliverableUrl
                    )
                  ).length;
                  const objetivoCompletado =
                    actividades.length > 0 &&
                    actividadesCompletadas === actividades.length;
                  const estadoObjetivo = objetivoCompletado
                    ? 'Completado'
                    : 'En progreso';

                  return (
                    <div
                      key={objetivo.id}
                      className="overflow-hidden rounded-lg border border-border/50"
                    >
                      <button
                        type="button"
                        onClick={() => toggleObjective(objetivo.id)}
                        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/30"
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                            objetivoCompletado
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {objetivoCompletado ? (
                            <CircleCheckBig className="h-4 w-4" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span
                          className={`flex-1 text-sm ${
                            objetivoCompletado
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {objetivo.description}
                        </span>
                        <span className="mr-2 text-xs text-muted-foreground">
                          {actividadesCompletadas}/{actividades.length}{' '}
                          actividades
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            objetivoCompletado
                              ? 'border-transparent bg-green-500/20 text-green-400'
                              : 'border-transparent bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {estadoObjetivo}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            expandedObjectives[objetivo.id]
                              ? 'rotate-180'
                              : 'rotate-0'
                          }`}
                        />
                      </button>

                      {expandedObjectives[objetivo.id] &&
                        actividades.length > 0 && (
                          <div className="border-t border-border/50 bg-muted/20">
                            {actividades.map((actividad, actIdx) => {
                              const activityId = normalizeActivityId(
                                (
                                  actividad as {
                                    id?: unknown;
                                    activityId?: unknown;
                                    activity_id?: unknown;
                                  }
                                ).id ??
                                  (
                                    actividad as {
                                      activityId?: unknown;
                                    }
                                  ).activityId ??
                                  (
                                    actividad as {
                                      activity_id?: unknown;
                                    }
                                  ).activity_id
                              );
                              const activityKey =
                                activityId ??
                                -(objetivo.id * 1000 + actIdx + 1);
                              const deliverableUrl =
                                (activityId
                                  ? deliverableOverrides[activityId]?.url
                                  : '') ??
                                actividad.deliverableUrl ??
                                '';
                              const activityDescription =
                                activityDescriptions[activityKey] ??
                                actividad.deliverableDescription ??
                                '';
                              const deliverableSubmittedAt =
                                (activityId
                                  ? deliverableOverrides[activityId]
                                      ?.submittedAt
                                  : '') ??
                                actividad.deliverableSubmittedAt ??
                                '';
                              const hasSavedDescription = Boolean(
                                actividad.deliverableDescription
                              );
                              const isEditingDescription =
                                editingDescriptions[activityKey] ??
                                !hasSavedDescription;
                              const isUploading = activityId
                                ? uploadingActivities[activityId]
                                : false;
                              const uploadProgressValue = activityId
                                ? (uploadProgress[activityId] ?? 0)
                                : 0;
                              const isSaving = activityId
                                ? savingDescriptions[activityId]
                                : false;
                              const isRemoving = activityId
                                ? removingActivities[activityId]
                                : false;
                              const actividadCompletada =
                                Boolean(deliverableUrl);
                              const estadoActividad = actividadCompletada
                                ? 'Completado'
                                : 'En progreso';

                              return (
                                <div
                                  key={actIdx}
                                  className="border-b border-border/30 last:border-b-0"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleActivity(
                                        activityKey,
                                        activityId ?? undefined
                                      )
                                    }
                                    className="w-full p-4 text-left transition-colors hover:bg-muted/30"
                                  >
                                    <div className="mb-1 flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">
                                        Actividad {actIdx + 1}
                                      </span>
                                      <span
                                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                          actividadCompletada
                                            ? 'border-transparent bg-green-500/20 text-green-400'
                                            : 'border-transparent bg-blue-500/20 text-blue-400'
                                        }`}
                                      >
                                        {estadoActividad}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <h4 className="text-sm font-medium text-foreground">
                                          {actividad.descripcion}
                                        </h4>
                                        {(actividad.startDate ||
                                          actividad.endDate) && (
                                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            {actividad.startDate && (
                                              <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(
                                                  actividad.startDate
                                                )}
                                              </span>
                                            )}
                                            {actividad.startDate &&
                                              actividad.endDate && (
                                                <span>-</span>
                                              )}
                                            {actividad.endDate && (
                                              <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(actividad.endDate)}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {!actividadCompletada && (
                                          <span className="animate-pulse rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                                            Entregar
                                          </span>
                                        )}
                                        <ChevronDown
                                          className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${
                                            expandedActivities[activityKey]
                                              ? 'rotate-180'
                                              : 'rotate-0'
                                          }`}
                                        />
                                      </div>
                                    </div>
                                  </button>

                                  {expandedActivities[activityKey] && (
                                    <div className="space-y-3 px-4 pb-4">
                                      <div className="rounded-lg bg-muted/30 p-3">
                                        <span className="mb-1 block text-xs font-medium text-muted-foreground">
                                          Descripción
                                        </span>
                                        <textarea
                                          value={activityDescription}
                                          onChange={(event) =>
                                            setActivityDescriptions((prev) => ({
                                              ...prev,
                                              [activityKey]: event.target.value,
                                            }))
                                          }
                                          readOnly={!isEditingDescription}
                                          className={`w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                                            isEditingDescription
                                              ? ''
                                              : 'cursor-not-allowed opacity-70'
                                          }`}
                                          rows={3}
                                          placeholder="Describe el entregable..."
                                        />
                                        <div className="mt-2 flex justify-end">
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              if (!isEditingDescription) {
                                                setEditingDescriptions(
                                                  (prev) => ({
                                                    ...prev,
                                                    [activityKey]: true,
                                                  })
                                                );
                                                return;
                                              }

                                              if (!activityId) {
                                                alert(
                                                  'Guarda el proyecto para generar la actividad antes de editar la descripción.'
                                                );
                                                return;
                                              }

                                              const success =
                                                await handleDescriptionSave(
                                                  activityId,
                                                  activityDescription
                                                );
                                              if (success) {
                                                setEditingDescriptions(
                                                  (prev) => ({
                                                    ...prev,
                                                    [activityKey]: false,
                                                  })
                                                );
                                              }
                                            }}
                                            disabled={!activityId || isSaving}
                                            className="inline-flex h-8 items-center justify-center rounded-[12px] bg-[#22c4d3] px-3 text-xs font-semibold text-[#01152d] transition-colors hover:bg-[#1fb4c2] disabled:cursor-not-allowed disabled:opacity-70"
                                          >
                                            {isSaving
                                              ? 'Guardando...'
                                              : isEditingDescription
                                                ? 'Guardar Descripción'
                                                : 'Editar Descripción'}
                                          </button>
                                        </div>
                                      </div>
                                      <div className="rounded-lg bg-muted/30 p-3">
                                        <span className="mb-2 block text-xs font-medium text-muted-foreground">
                                          Entrega
                                        </span>
                                        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[13px] bg-[#22c4d3] px-3 text-sm font-medium text-[#01152d] transition-colors hover:bg-[#1fb4c2]">
                                          <Upload className="h-4 w-4" />
                                          {isUploading
                                            ? 'Subiendo...'
                                            : 'Subir entregable'}
                                          <input
                                            type="file"
                                            className="hidden"
                                            onChange={(event) => {
                                              if (!activityId) {
                                                alert(
                                                  'Guarda el proyecto para generar la actividad antes de subir un entregable.'
                                                );
                                                return;
                                              }
                                              const selectedFile =
                                                event.target.files?.[0];
                                              if (!selectedFile) return;
                                              void handleDeliverableUpload(
                                                activityId,
                                                selectedFile,
                                                activityDescription
                                              );
                                            }}
                                          />
                                        </label>
                                        {isUploading && (
                                          <div className="mt-3 rounded-lg border border-border/40 bg-background/60 p-3">
                                            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                                              <span className="h-2 w-2 animate-pulse rounded-full bg-[#22c4d3]" />
                                              Subiendo archivo...{' '}
                                              {uploadProgressValue}%
                                            </div>
                                            <Progress
                                              value={uploadProgressValue}
                                              className="h-2 w-full"
                                            />
                                          </div>
                                        )}
                                        {deliverableUrl && (
                                          <div className="mt-3 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                                            <div className="mb-2 flex items-center justify-between">
                                              <span className="flex items-center gap-2 text-sm font-medium text-green-400">
                                                <CircleCheckBig className="h-4 w-4" />
                                                Entregado
                                              </span>
                                              <div className="flex items-center gap-2">
                                                {deliverableSubmittedAt && (
                                                  <span className="text-xs text-muted-foreground">
                                                    {formatDateTime(
                                                      deliverableSubmittedAt
                                                    )}
                                                  </span>
                                                )}
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    if (!activityId) return;
                                                    void handleDeliverableRemove(
                                                      activityId
                                                    );
                                                  }}
                                                  disabled={
                                                    !activityId || isRemoving
                                                  }
                                                  className="inline-flex h-7 items-center justify-center rounded-[10px] border border-red-500/30 bg-red-500/10 px-2 text-[11px] font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                                                >
                                                  {isRemoving
                                                    ? 'Quitando...'
                                                    : 'Quitar archivo'}
                                                </button>
                                              </div>
                                            </div>
                                            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                                              <FileText className="h-4 w-4" />
                                              {(activityId
                                                ? deliverableOverrides[
                                                    activityId
                                                  ]?.name
                                                : undefined) ??
                                                actividad.deliverableName}
                                            </div>
                                            {activityDescription && (
                                              <div className="mt-2 border-t border-green-500/20 pt-2">
                                                <span className="text-xs text-muted-foreground">
                                                  Retroalimentación:
                                                </span>
                                                <p className="mt-1 text-sm text-foreground">
                                                  {activityDescription}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay objetivos específicos definidos aún.
              </p>
            )}
          </div>

          {/* Cronograma */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
                  <Calendar className="h-4 w-4 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Cronograma
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg bg-muted/30 p-1">
                  {(['dias', 'semanas', 'meses'] as const).map((view) => (
                    <button
                      key={view}
                      type="button"
                      onClick={() => setTimelineView(view)}
                      className={`inline-flex h-7 items-center justify-center gap-2 rounded-md px-3 text-xs font-medium whitespace-nowrap ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
                        timelineView === view
                          ? 'bg-accent text-background hover:bg-accent/90'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {view === 'dias'
                        ? 'Días'
                        : view === 'semanas'
                          ? 'Semanas'
                          : 'Meses'}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onEditSection?.(7, addedSections)}
                  className="inline-flex h-8 w-8 items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-black focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </div>
            {(() => {
              const allRows = getTimelineRows();
              const timelineRows = allRows.filter(
                (row) => row.startDate && row.endDate
              );
              const rangeStart = timelineRows.reduce<Date | null>(
                (acc, row) =>
                  !row.startDate
                    ? acc
                    : acc
                      ? row.startDate < acc
                        ? row.startDate
                        : acc
                      : row.startDate,
                null
              );
              const rangeEnd = timelineRows.reduce<Date | null>(
                (acc, row) =>
                  !row.endDate
                    ? acc
                    : acc
                      ? row.endDate > acc
                        ? row.endDate
                        : acc
                      : row.endDate,
                null
              );
              const columns = getTimelineColumns(
                rangeStart,
                rangeEnd,
                timelineView
              );
              const columnWidth = 80;
              const gridWidth = Math.max(columns.length * columnWidth, 1);
              const msPerDay = 1000 * 60 * 60 * 24;
              const toUTCStart = (date: Date) =>
                Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
              const diffDays = (from: Date, to: Date) =>
                Math.max(
                  0,
                  Math.floor((toUTCStart(to) - toUTCStart(from)) / msPerDay)
                );
              const today = new Date();
              const todayUTC = new Date(
                Date.UTC(
                  today.getUTCFullYear(),
                  today.getUTCMonth(),
                  today.getUTCDate()
                )
              );

              const getStatusClass = (row: {
                startDate: Date | null;
                endDate: Date | null;
                deliverableUrl?: string | null;
              }) => {
                if (row.deliverableUrl) return 'bg-green-500';
                if (!row.startDate || !row.endDate)
                  return 'bg-muted-foreground/50';
                if (row.endDate < todayUTC) return 'bg-red-500';
                if (row.startDate <= todayUTC && row.endDate >= todayUTC) {
                  return 'bg-accent';
                }
                return 'bg-muted-foreground/50';
              };

              if (timelineRows.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground">
                    No hay cronograma definido aún.
                  </p>
                );
              }

              return (
                <>
                  <div className="scrollbar-thin w-full max-w-full overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/50 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-track]:bg-transparent">
                    <div className="flex min-w-[720px]">
                      <div className="w-52 shrink-0 border-r border-border/30">
                        <div className="mb-2 flex h-10 items-end border-b border-border/50 pr-3 pb-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Actividad
                          </span>
                        </div>
                        <div className="space-y-2">
                          {timelineRows.map((row) => (
                            <div
                              key={row.key}
                              className="flex h-6 items-center pr-3"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-accent">
                                  {row.key}
                                </span>
                                <span
                                  className="max-w-[140px] truncate text-xs text-foreground"
                                  title={row.title}
                                >
                                  {row.title}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div style={{ minWidth: gridWidth }}>
                          <div className="mb-2 flex h-10 border-b border-border/50">
                            {columns.map((column, index) => (
                              <div
                                key={`${column.label}-${index}`}
                                className="flex flex-col justify-end border-l border-border/30 px-1 pb-2 text-center first:border-l-0"
                                style={{ width: columnWidth }}
                              >
                                <div className="truncate text-xs text-muted-foreground">
                                  {column.label}
                                </div>
                                <div className="truncate text-xs font-medium text-foreground">
                                  {column.sublabel}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2">
                            {timelineRows.map((row) => {
                              if (
                                !row.startDate ||
                                !row.endDate ||
                                !rangeStart
                              ) {
                                return null;
                              }
                              const startDate = row.startDate;
                              const endDate = row.endDate;
                              const getUnitRange = () => {
                                if (timelineView === 'dias') {
                                  const offsetUnits = diffDays(
                                    rangeStart,
                                    startDate
                                  );
                                  const durationUnits =
                                    diffDays(startDate, endDate) + 1;
                                  return { offsetUnits, durationUnits };
                                }

                                if (timelineView === 'semanas') {
                                  const offsetDays = diffDays(
                                    rangeStart,
                                    startDate
                                  );
                                  const endOffsetDays = diffDays(
                                    rangeStart,
                                    endDate
                                  );
                                  const offsetUnits = Math.floor(
                                    offsetDays / 7
                                  );
                                  const durationUnits =
                                    Math.floor(endOffsetDays / 7) -
                                    offsetUnits +
                                    1;
                                  return { offsetUnits, durationUnits };
                                }

                                const rangeMonthIndex =
                                  rangeStart.getUTCFullYear() * 12 +
                                  rangeStart.getUTCMonth();
                                const startIndex =
                                  startDate.getUTCFullYear() * 12 +
                                  startDate.getUTCMonth();
                                const endIndex =
                                  endDate.getUTCFullYear() * 12 +
                                  endDate.getUTCMonth();
                                const offsetUnits =
                                  startIndex - rangeMonthIndex;
                                const durationUnits = endIndex - startIndex + 1;
                                return { offsetUnits, durationUnits };
                              };

                              const { offsetUnits, durationUnits } =
                                getUnitRange();
                              const leftPx = offsetUnits * columnWidth;
                              const widthPx = durationUnits * columnWidth;
                              return (
                                <div
                                  key={`row-${row.key}`}
                                  className="group relative h-6 rounded bg-muted/20"
                                >
                                  <div className="absolute inset-0 flex">
                                    {columns.map((_, index) => (
                                      <div
                                        key={`grid-${row.key}-${index}`}
                                        className="border-l border-border/20 first:border-l-0"
                                        style={{ width: columnWidth }}
                                      />
                                    ))}
                                  </div>
                                  <div
                                    className={`absolute top-1 h-4 rounded-full transition-all group-hover:opacity-80 ${getStatusClass(
                                      row
                                    )}`}
                                    title={`${row.title}: ${formatShortDate(
                                      startDate
                                    )} - ${formatShortDate(endDate)}`}
                                    style={{
                                      left: leftPx,
                                      width: widthPx,
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border/50 pt-4">
                    <span className="text-xs text-muted-foreground">
                      Estado:
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span className="text-xs text-muted-foreground">
                        Completado
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-accent" />
                      <span className="text-xs text-muted-foreground">
                        En progreso
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground">
                        Pendiente
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-xs text-muted-foreground">
                        Atrasado
                      </span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </TabsContent>

        <TabsContent value="submissions">
          <div className="rounded-xl border border-border/50 bg-card/50 p-6 text-center">
            <p className="text-muted-foreground">
              No hay entregas registradas aún.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="feedback">
          <div className="rounded-xl border border-border/50 bg-card/50 p-6 text-center">
            <p className="text-muted-foreground">
              No hay retroalimentación disponible aún.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <div className="rounded-xl border border-border/50 bg-card/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
                  <Calendar className="h-4 w-4 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Cronograma
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg bg-muted/30 p-1">
                  {(['dias', 'semanas', 'meses'] as const).map((view) => (
                    <button
                      key={view}
                      type="button"
                      onClick={() => setTimelineView(view)}
                      className={`inline-flex h-7 items-center justify-center gap-2 rounded-md px-3 text-xs font-medium whitespace-nowrap ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
                        timelineView === view
                          ? 'bg-accent text-background hover:bg-accent/90'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {view === 'dias'
                        ? 'Días'
                        : view === 'semanas'
                          ? 'Semanas'
                          : 'Meses'}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onEditSection?.(7, addedSections)}
                  className="inline-flex h-8 w-8 items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-black focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </div>
            {(() => {
              const allRows = getTimelineRows();
              const timelineRows = allRows.filter(
                (row) => row.startDate && row.endDate
              );
              const rangeStart = timelineRows.reduce<Date | null>(
                (acc, row) =>
                  !row.startDate
                    ? acc
                    : acc
                      ? row.startDate < acc
                        ? row.startDate
                        : acc
                      : row.startDate,
                null
              );
              const rangeEnd = timelineRows.reduce<Date | null>(
                (acc, row) =>
                  !row.endDate
                    ? acc
                    : acc
                      ? row.endDate > acc
                        ? row.endDate
                        : acc
                      : row.endDate,
                null
              );
              const columns = getTimelineColumns(
                rangeStart,
                rangeEnd,
                timelineView
              );
              const columnWidth = 80;
              const gridWidth = Math.max(columns.length * columnWidth, 1);
              const msPerDay = 1000 * 60 * 60 * 24;
              const toUTCStart = (date: Date) =>
                Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
              const diffDays = (from: Date, to: Date) =>
                Math.max(
                  0,
                  Math.floor((toUTCStart(to) - toUTCStart(from)) / msPerDay)
                );
              const today = new Date();
              const todayUTC = new Date(
                Date.UTC(
                  today.getUTCFullYear(),
                  today.getUTCMonth(),
                  today.getUTCDate()
                )
              );

              const getStatusClass = (row: {
                startDate: Date | null;
                endDate: Date | null;
                deliverableUrl?: string | null;
              }) => {
                if (row.deliverableUrl) return 'bg-green-500';
                if (!row.startDate || !row.endDate)
                  return 'bg-muted-foreground/50';
                if (row.endDate < todayUTC) return 'bg-red-500';
                if (row.startDate <= todayUTC && row.endDate >= todayUTC) {
                  return 'bg-accent';
                }
                return 'bg-muted-foreground/50';
              };

              if (timelineRows.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground">
                    No hay cronograma definido aún.
                  </p>
                );
              }

              return (
                <>
                  <div className="scrollbar-thin w-full max-w-full overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/50 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-track]:bg-transparent">
                    <div className="flex min-w-[720px]">
                      <div className="w-52 shrink-0 border-r border-border/30">
                        <div className="mb-2 flex h-10 items-end border-b border-border/50 pr-3 pb-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Actividad
                          </span>
                        </div>
                        <div className="space-y-2">
                          {timelineRows.map((row) => (
                            <div
                              key={row.key}
                              className="flex h-6 items-center pr-3"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-accent">
                                  {row.key}
                                </span>
                                <span
                                  className="max-w-[140px] truncate text-xs text-foreground"
                                  title={row.title}
                                >
                                  {row.title}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div style={{ minWidth: gridWidth }}>
                          <div className="mb-2 flex h-10 border-b border-border/50">
                            {columns.map((column, index) => (
                              <div
                                key={`${column.label}-${index}`}
                                className="flex flex-col justify-end border-l border-border/30 px-1 pb-2 text-center first:border-l-0"
                                style={{ width: columnWidth }}
                              >
                                <div className="truncate text-xs text-muted-foreground">
                                  {column.label}
                                </div>
                                <div className="truncate text-xs font-medium text-foreground">
                                  {column.sublabel}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2">
                            {timelineRows.map((row) => {
                              if (
                                !row.startDate ||
                                !row.endDate ||
                                !rangeStart
                              ) {
                                return null;
                              }
                              const startDate = row.startDate;
                              const endDate = row.endDate;
                              const getUnitRange = () => {
                                if (timelineView === 'dias') {
                                  const offsetUnits = diffDays(
                                    rangeStart,
                                    startDate
                                  );
                                  const durationUnits =
                                    diffDays(startDate, endDate) + 1;
                                  return { offsetUnits, durationUnits };
                                }

                                if (timelineView === 'semanas') {
                                  const offsetDays = diffDays(
                                    rangeStart,
                                    startDate
                                  );
                                  const endOffsetDays = diffDays(
                                    rangeStart,
                                    endDate
                                  );
                                  const offsetUnits = Math.floor(
                                    offsetDays / 7
                                  );
                                  const durationUnits =
                                    Math.floor(endOffsetDays / 7) -
                                    offsetUnits +
                                    1;
                                  return { offsetUnits, durationUnits };
                                }

                                const rangeMonthIndex =
                                  rangeStart.getUTCFullYear() * 12 +
                                  rangeStart.getUTCMonth();
                                const startIndex =
                                  startDate.getUTCFullYear() * 12 +
                                  startDate.getUTCMonth();
                                const endIndex =
                                  endDate.getUTCFullYear() * 12 +
                                  endDate.getUTCMonth();
                                const offsetUnits =
                                  startIndex - rangeMonthIndex;
                                const durationUnits = endIndex - startIndex + 1;
                                return { offsetUnits, durationUnits };
                              };

                              const { offsetUnits, durationUnits } =
                                getUnitRange();
                              const leftPx = offsetUnits * columnWidth;
                              const widthPx = durationUnits * columnWidth;
                              return (
                                <div
                                  key={`row-${row.key}`}
                                  className="group relative h-6 rounded bg-muted/20"
                                >
                                  <div className="absolute inset-0 flex">
                                    {columns.map((_, index) => (
                                      <div
                                        key={`grid-${row.key}-${index}`}
                                        className="border-l border-border/20 first:border-l-0"
                                        style={{ width: columnWidth }}
                                      />
                                    ))}
                                  </div>
                                  <div
                                    className={`absolute top-1 h-4 rounded-full transition-all group-hover:opacity-80 ${getStatusClass(
                                      row
                                    )}`}
                                    title={`${row.title}: ${formatShortDate(
                                      startDate
                                    )} - ${formatShortDate(endDate)}`}
                                    style={{
                                      left: leftPx,
                                      width: widthPx,
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border/50 pt-4">
                    <span className="text-xs text-muted-foreground">
                      Estado:
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span className="text-xs text-muted-foreground">
                        Completado
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-accent" />
                      <span className="text-xs text-muted-foreground">
                        En progreso
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground">
                        Pendiente
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-xs text-muted-foreground">
                        Atrasado
                      </span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </TabsContent>

        <TabsContent value="code">
          <div className="rounded-xl border border-border/50 bg-card/50 p-6 text-center">
            <p className="text-muted-foreground">
              El repositorio de código se mostrará aquí próximamente.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Secciones Agregadas */}
      {Object.entries(addedSections).map(([sectionId, section]) => (
        <div
          key={sectionId}
          className="mt-4 rounded-xl border border-border/50 bg-card/50 p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              {section.name}
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEditSection?.(8, addedSections)}
                className="inline-flex h-8 w-8 items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-black focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                title="Editar sección en modal"
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSection(sectionId)}
                disabled={isDeletingSection === sectionId}
                className="inline-flex h-8 w-8 items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-red-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
                title="Eliminar sección"
              >
                {isDeletingSection === sectionId ? '⏳' : '×'}
              </button>
            </div>
          </div>
          {section.content ? (
            <p className="leading-relaxed text-muted-foreground">
              {section.content}
            </p>
          ) : (
            <p className="text-muted-foreground">Sin contenido.</p>
          )}
        </div>
      ))}

      {/* Modal Agregar Sección */}
      <AddCustomSectionModal
        isOpen={showAddCustomModal}
        onClose={() => {
          setShowAddCustomModal(false);
          setPendingSection(null);
        }}
        onAdd={handleAddCustomSection}
        isLoading={isAddingSectionLoading}
        initialName={pendingSection?.name ?? ''}
        nameLocked={Boolean(pendingSection && !pendingSection.isCustom)}
        onGenerateDescription={handleGenerateSectionDescription}
      />
    </section>
  );
}
