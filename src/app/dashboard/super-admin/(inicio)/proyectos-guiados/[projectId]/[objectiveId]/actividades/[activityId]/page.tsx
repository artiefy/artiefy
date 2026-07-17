'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  BookOpen,
  ClipboardList,
  Download,
  MessageSquare,
  Trash2,
  Trophy,
  Users,
  VideoOff,
} from 'lucide-react';
import { toast } from 'sonner';

import FormActCompletado from '~/components/educators/layout/FormActCompletado';
import QuestionSubidaList from '~/components/educators/layout/ListActSubidaFile';
import ListPreguntaAbierta from '~/components/educators/layout/ListPreguntaAbierta';
import ListPreguntaAbierta2 from '~/components/educators/layout/ListPreguntaAbierta2';
import PreguntasAbiertas from '~/components/educators/layout/PreguntasAbiertas';
import PreguntasAbiertas2 from '~/components/educators/layout/PreguntasAbiertas2';
import QuestionForm from '~/components/educators/layout/QuestionsForms';
import QuestionList from '~/components/educators/layout/QuestionsList';
import SeleccionActi from '~/components/educators/layout/SeleccionActi';
import QuestionVOFForm from '~/components/educators/layout/VerdaderoOFalseForm';
import QuestionVOFList from '~/components/educators/layout/VerdaderoOFalseList';
import { Badge } from '~/components/educators/ui/badge';
import { Button } from '~/components/educators/ui/button';
import { Card } from '~/components/educators/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/super-admin/ui/breadcrumb';
import { uploadFileToS3 } from '~/lib/uploadFileToS3';

import type {
  Completado,
  Question,
  QuestionFilesSubida,
  VerdaderoOFlaso,
} from '~/types/typesActi';

type TipoPregunta = 'OM' | 'FOV' | 'COMPLETADO' | 'ARCHIVO';
type EditableQuestion = (
  Question | VerdaderoOFlaso | Completado | QuestionFilesSubida
) & { tipo: TipoPregunta };

interface PorcentajeResponse {
  usado: number;
  disponible: number;
  resumen: {
    opcionMultiple: number;
    verdaderoFalso: number;
    completar: number;
  };
}

interface GuidedProject {
  id: number;
  title: string;
}

interface Objective {
  id: number;
  title: string;
}

interface Activity {
  id: number;
  name: string;
  description: string | null;
  typeId: number;
  weekNumber: number | null;
  startDate: string | null;
  endDate: string | null;
  porcentaje: number | null;
  fechaMaximaEntrega: string | null;
  revisada: boolean | null;
  instructionVideoKey: string | null;
  instructionText: string | null;
}

interface StudentProgress {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  progress: number;
  isCompleted: boolean;
  revisada: boolean | null;
  attemptCount: number | null;
  finalGrade: number | null;
  lastAttemptAt: string | null;
}

export default function GuidedActivityDetailPage({
  params,
}: {
  params: Promise<{
    projectId: string;
    objectiveId: string;
    activityId: string;
  }>;
}) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [objectiveId, setObjectiveId] = useState<string | null>(null);
  const [activityId, setActivityId] = useState<string | null>(null);

  const [project, setProject] = useState<GuidedProject | null>(null);
  const [objective, setObjective] = useState<Objective | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [students, setStudents] = useState<StudentProgress[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [gradeDrafts, setGradeDrafts] = useState<
    Record<string, { finalGrade: string; revisada: boolean }>
  >({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  // Instrucción (video + texto) de la actividad
  const [editingInstruction, setEditingInstruction] = useState(false);
  const [instructionTextDraft, setInstructionTextDraft] = useState('');
  const [instructionVideoFile, setInstructionVideoFile] = useState<File | null>(
    null
  );
  const [instructionVideoPreview, setInstructionVideoPreview] = useState<
    string | null
  >(null);
  const [instructionUploading, setInstructionUploading] = useState(false);

  // Contenido de la actividad: preguntas según el tipo (OM/FOV/COMPLETADO/ARCHIVO)
  const [questions, setQuestions] = useState<TipoPregunta[]>([]);
  const [editingQuestion, setEditingQuestion] =
    useState<EditableQuestion | null>(null);
  const [selectedActivityType, setSelectedActivityType] = useState('');
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [porcentajeUsado, setPorcentajeUsado] = useState(0);
  const [porcentajeDisponible, setPorcentajeDisponible] = useState(100);
  const [resumenPorTipo, setResumenPorTipo] = useState({
    opcionMultiple: 0,
    verdaderoFalso: 0,
    completar: 0,
  });

  const router = useRouter();
  const activityIdNumber = activityId ? parseInt(activityId) : null;

  type DetailTab = 'instruccion' | 'contenido' | 'calificaciones' | 'recursos';
  const [activeDetailTab, setActiveDetailTab] =
    useState<DetailTab>('instruccion');

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.hash === '#estudiantes'
    ) {
      setActiveDetailTab('calificaciones');
    }
  }, []);

  useEffect(() => {
    void params.then((p) => {
      setProjectId(p.projectId);
      setObjectiveId(p.objectiveId);
      setActivityId(p.activityId);
    });
  }, [params]);

  const fetchContext = useCallback(async () => {
    if (!projectId || !objectiveId || !activityId) return;
    setLoading(true);
    try {
      const [projectRes, objectiveRes, activityRes] = await Promise.all([
        fetch(`/api/guided-projects?id=${projectId}`),
        fetch(`/api/guided-projects/${projectId}/objectives?id=${objectiveId}`),
        fetch(
          `/api/guided-projects/${projectId}/objectives/${objectiveId}/activities?id=${activityId}`
        ),
      ]);
      if (projectRes.ok) setProject((await projectRes.json()) as GuidedProject);
      if (objectiveRes.ok)
        setObjective((await objectiveRes.json()) as Objective);
      if (activityRes.ok) {
        setActivity((await activityRes.json()) as Activity);
      } else {
        toast.error('No se pudo cargar la actividad');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar la actividad');
    } finally {
      setLoading(false);
    }
  }, [projectId, objectiveId, activityId]);

  const fetchStudents = useCallback(async () => {
    if (!projectId || !objectiveId || !activityId) return;
    setLoadingStudents(true);
    try {
      const response = await fetch(
        `/api/guided-projects/${projectId}/objectives/${objectiveId}/activities/${activityId}/progress`
      );
      if (!response.ok) throw new Error('Error al cargar estudiantes');
      const data = (await response.json()) as StudentProgress[];
      setStudents(Array.isArray(data) ? data : []);
      setGradeDrafts(
        Object.fromEntries(
          (Array.isArray(data) ? data : []).map((s) => [
            s.userId,
            {
              finalGrade: s.finalGrade != null ? String(s.finalGrade) : '',
              revisada: s.revisada ?? false,
            },
          ])
        )
      );
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar el progreso de los estudiantes');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [projectId, objectiveId, activityId]);

  useEffect(() => {
    void fetchContext();
    void fetchStudents();
  }, [fetchContext, fetchStudents]);

  // Las actividades de tipo archivo solo tienen un formulario fijo
  useEffect(() => {
    if (activity?.typeId === 1) {
      setQuestions(['ARCHIVO']);
    }
  }, [activity]);

  useEffect(() => {
    if (!activity || editingInstruction) return;
    setInstructionTextDraft(activity.instructionText ?? '');
    setInstructionVideoFile(null);
    setInstructionVideoPreview(
      activity.instructionVideoKey
        ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${activity.instructionVideoKey}`
        : null
    );
  }, [activity, editingInstruction]);

  const handleInstructionVideoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInstructionVideoFile(file);
    setInstructionVideoPreview(URL.createObjectURL(file));
  };

  const handleSaveInstruction = async () => {
    if (!projectId || !objectiveId || !activityId) return;
    setInstructionUploading(true);
    try {
      let instructionVideoKey = activity?.instructionVideoKey ?? null;
      if (instructionVideoFile) {
        const result = await uploadFileToS3(instructionVideoFile);
        instructionVideoKey = result.key;
      }

      const response = await fetch(
        `/api/guided-projects/${projectId}/objectives/${objectiveId}/activities?id=${activityId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instructionVideoKey,
            instructionText: instructionTextDraft || null,
          }),
        }
      );
      if (!response.ok) throw new Error('Error al guardar');
      toast.success('Instrucción guardada');
      setEditingInstruction(false);
      await fetchContext();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar la instrucción');
    } finally {
      setInstructionUploading(false);
    }
  };

  const fetchPorcentajes = useCallback(() => {
    if (activityIdNumber === null) return;
    fetch(
      `/api/educadores/actividades/porcentajes?activityId=${activityIdNumber}`
    )
      .then((res) => res.json() as Promise<PorcentajeResponse>)
      .then((data) => {
        setPorcentajeUsado(Number(data.usado));
        setPorcentajeDisponible(Number(data.disponible));
        setResumenPorTipo({
          opcionMultiple: Number(data.resumen.opcionMultiple),
          verdaderoFalso: Number(data.resumen.verdaderoFalso),
          completar: Number(data.resumen.completar),
        });
      })
      .catch((err) => {
        console.error('Error obteniendo porcentajes por tipo:', err);
      });
  }, [activityIdNumber]);

  useEffect(() => {
    fetchPorcentajes();
  }, [shouldRefresh, fetchPorcentajes]);

  const handleAddQuestion = () => {
    if (selectedActivityType) {
      setQuestions([selectedActivityType as TipoPregunta]);
      setSelectedActivityType('');
    }
  };

  const handleFormSubmit = () => {
    setEditingQuestion(null);
    setQuestions([]);
    setShouldRefresh((prev) => !prev);
  };

  const handleCancelQuestion = () => {
    setEditingQuestion(null);
    setQuestions([]);
  };

  const handleDeleteActivity = async () => {
    if (!projectId || !objectiveId || !activityId) return;
    if (!confirm('¿Eliminar esta actividad?')) return;
    try {
      const response = await fetch(
        `/api/guided-projects/${projectId}/objectives/${objectiveId}/activities?id=${activityId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Error al eliminar');
      toast.success('Actividad eliminada');
      router.push(
        `/dashboard/super-admin/proyectos-guiados/${projectId}?tab=actividades`
      );
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar la actividad');
    }
  };

  const handleToggleRevisada = async () => {
    if (!projectId || !objectiveId || !activityId || !activity) return;
    try {
      const response = await fetch(
        `/api/guided-projects/${projectId}/objectives/${objectiveId}/activities?id=${activityId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ revisada: !activity.revisada }),
        }
      );
      if (!response.ok) throw new Error('Error al actualizar');
      await fetchContext();
    } catch (error) {
      console.error('Error:', error);
      toast.error('No se pudo actualizar el estado de revisión');
    }
  };

  const handleSaveGrade = async (userId: string) => {
    if (!projectId || !objectiveId || !activityId) return;
    const draft = gradeDrafts[userId];
    if (!draft) return;

    const parsedGrade =
      draft.finalGrade.trim() === '' ? undefined : Number(draft.finalGrade);
    if (parsedGrade !== undefined && Number.isNaN(parsedGrade)) {
      toast.error('La nota debe ser un número válido');
      return;
    }

    setSavingUserId(userId);
    try {
      const response = await fetch(
        `/api/guided-projects/${projectId}/objectives/${objectiveId}/activities/${activityId}/progress`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            finalGrade: parsedGrade,
            revisada: draft.revisada,
          }),
        }
      );
      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? 'Error al guardar');
      }
      toast.success('Calificación guardada');
      await fetchStudents();
    } catch (error) {
      console.error('Error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar la nota'
      );
    } finally {
      setSavingUserId(null);
    }
  };

  if (loading || !activity) {
    return (
      <main className="flex h-screen flex-col items-center justify-center">
        <div className="size-32 rounded-full border-y-2 border-primary">
          <span className="sr-only" />
        </div>
        <span className="text-primary">Cargando...</span>
      </main>
    );
  }

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden px-1 py-2 md:px-3 md:py-4"
      style={{ backgroundColor: 'rgb(25, 45, 80)' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/50 via-[#1a2d4a]/30 to-black/50" />

      <Breadcrumb className="relative z-10 mb-8">
        <BreadcrumbList className="flex flex-wrap gap-2">
          <BreadcrumbItem>
            <BreadcrumbLink
              className="text-cyan-400 transition-colors duration-300 hover:text-cyan-300"
              href="/dashboard/super-admin"
            >
              Inicio
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              className="text-cyan-400 transition-colors duration-300 hover:text-cyan-300"
              href="/dashboard/super-admin/proyectos-guiados"
            >
              Proyectos Guiados
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              className="text-cyan-400 transition-colors duration-300 hover:text-cyan-300"
              href={`/dashboard/super-admin/proyectos-guiados/${projectId}`}
            >
              {project?.title ?? 'Proyecto'}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              className="text-cyan-400 transition-colors duration-300 hover:text-cyan-300"
              href={`/dashboard/super-admin/proyectos-guiados/${projectId}?tab=actividades`}
            >
              {objective?.title ?? 'Sesión'}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink className="text-white/60">
              {activity.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Video hero (siempre visible, como el reproductor de clase) */}
      <div className="relative z-10 mb-6 aspect-video w-full overflow-hidden rounded-2xl border-2 border-cyan-500/30 bg-slate-900 shadow-2xl">
        {activity.instructionVideoKey ? (
          <video controls className="size-full object-cover">
            <source
              src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${activity.instructionVideoKey}`}
              type="video/mp4"
            />
            Tu navegador no soporta la reproducción de videos.
          </video>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-white/40">
            <VideoOff className="size-10" />
            <p className="text-sm">
              Sin video de instrucción — agrégalo en la pestaña
              &quot;Instrucción&quot;.
            </p>
          </div>
        )}
      </div>

      {/* Encabezado compacto */}
      <Card className="relative z-10 mb-6 border-2 border-cyan-500/30 bg-slate-800 p-4 shadow-xl sm:p-6">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {activity.weekNumber != null && (
              <Badge className="border-cyan-500/50 bg-cyan-500/20 text-xs text-cyan-300">
                Semana {activity.weekNumber}
              </Badge>
            )}
            <Badge
              className={`text-xs ${
                activity.revisada
                  ? 'border-green-500/50 bg-green-500/20 text-green-300'
                  : 'border-gray-500/50 bg-gray-500/20 text-gray-300'
              }`}
            >
              {activity.revisada ? 'Revisada' : 'Sin revisar'}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleRevisada}
              className="border-white/20 text-white/70 hover:bg-white/10"
            >
              Marcar {activity.revisada ? 'sin revisar' : 'revisada'}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteActivity}
              className="flex items-center gap-1.5 bg-red-500 text-white hover:bg-red-600"
            >
              <Trash2 className="size-3.5" />
              Eliminar
            </Button>
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white md:text-3xl">
          {activity.name}
        </h1>
        <p className="text-sm leading-relaxed text-white/80">
          {activity.description || 'Sin descripción'}
        </p>
      </Card>

      {/* Tabs */}
      <div className="relative z-10 mb-6 flex flex-wrap gap-2 rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-2">
        {(
          [
            { key: 'instruccion', label: 'Instrucción', icon: BookOpen },
            { key: 'contenido', label: 'Contenido', icon: ClipboardList },
            {
              key: 'calificaciones',
              label: `Calificaciones (${students.length})`,
              icon: Trophy,
            },
            { key: 'recursos', label: 'Recursos', icon: Download },
          ] as { key: DetailTab; label: string; icon: typeof BookOpen }[]
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveDetailTab(tab.key)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeDetailTab === tab.key
                  ? 'bg-cyan-500 text-black'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Instrucción */}
      {activeDetailTab === 'instruccion' && (
        <Card className="relative z-10 mb-10 border-2 border-cyan-500/20 bg-slate-800 p-4 shadow-xl sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">
              Texto e instrucciones
            </h2>
            {!editingInstruction && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingInstruction(true)}
                className="border-white/20 text-white/70 hover:bg-white/10"
              >
                Editar instrucción
              </Button>
            )}
          </div>

          {editingInstruction ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                  Texto de instrucciones
                </label>
                <textarea
                  value={instructionTextDraft}
                  onChange={(e) => setInstructionTextDraft(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-cyan-500/30 bg-white/5 px-3 py-2 text-sm text-white transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                  Video de instrucción
                </label>
                <label className="flex h-40 max-w-sm cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-cyan-500/30 bg-white/5 transition hover:border-cyan-400">
                  {instructionVideoPreview ? (
                    <video
                      src={instructionVideoPreview}
                      controls
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-white/50">
                      Clic para subir video
                    </span>
                  )}
                  <input
                    type="file"
                    accept="video/mp4"
                    className="hidden"
                    onChange={handleInstructionVideoChange}
                  />
                </label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveInstruction}
                  disabled={instructionUploading}
                  className="bg-cyan-500 text-white hover:bg-cyan-600"
                >
                  {instructionUploading ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingInstruction(false)}
                  className="border-white/20 text-white/70 hover:bg-white/10"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : activity.instructionText ? (
            <p className="mb-6 text-sm leading-relaxed whitespace-pre-line text-white/80">
              {activity.instructionText}
            </p>
          ) : (
            <p className="mb-6 text-sm text-white/50">
              Esta actividad todavía no tiene instrucción configurada.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-cyan-500/30 bg-white/5 p-4">
              <p className="mb-1 text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                Semana
              </p>
              <p className="text-sm text-white">
                {activity.weekNumber ?? 'N/A'}
              </p>
            </div>
            <div className="rounded-xl border border-cyan-500/30 bg-white/5 p-4">
              <p className="mb-1 text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                Porcentaje
              </p>
              <p className="text-sm text-white">
                {activity.porcentaje != null
                  ? `${activity.porcentaje}%`
                  : 'N/A'}
              </p>
            </div>
            <div className="rounded-xl border border-cyan-500/30 bg-white/5 p-4">
              <p className="mb-1 text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                Fecha fin
              </p>
              <p className="text-sm text-white">
                {activity.endDate
                  ? new Date(activity.endDate).toLocaleDateString('es-ES')
                  : 'N/A'}
              </p>
            </div>
            <div className="rounded-xl border border-cyan-500/30 bg-white/5 p-4">
              <p className="mb-1 text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                Entrega máxima
              </p>
              <p className="text-sm text-white">
                {activity.fechaMaximaEntrega
                  ? new Date(activity.fechaMaximaEntrega).toLocaleDateString(
                      'es-ES'
                    )
                  : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Recursos */}
      {activeDetailTab === 'recursos' && (
        <div className="relative z-10 mb-10 rounded-2xl border border-cyan-500/20 bg-slate-800 p-8 text-center text-white/50">
          Los recursos de esta actividad estarán disponibles pronto.
        </div>
      )}

      <div
        className="relative z-10 mb-10 space-y-6"
        hidden={activeDetailTab !== 'contenido'}
      >
        <h2 className="text-2xl font-bold text-white">
          Contenido de la actividad
        </h2>

        {activity.typeId === 1 && activityIdNumber !== null && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-cyan-500/20 bg-slate-800 p-4 sm:p-6">
              <h3 className="mb-1 text-lg font-semibold text-cyan-300">
                Preguntas de subida de archivo
              </h3>
              <p className="mb-4 text-xs text-white/60">
                Define qué debe entregar el estudiante en esta actividad.
              </p>

              {questions.includes('ARCHIVO') && !editingQuestion && (
                <FormActCompletado
                  activityId={activityIdNumber}
                  onSubmit={handleFormSubmit}
                  onCancel={handleCancelQuestion}
                />
              )}
              {editingQuestion?.tipo === 'ARCHIVO' &&
                'parametros' in editingQuestion && (
                  <FormActCompletado
                    activityId={activityIdNumber}
                    editingQuestion={editingQuestion}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancelQuestion}
                  />
                )}
            </div>

            <div className="rounded-2xl border border-cyan-500/20 bg-slate-800 p-4 sm:p-6">
              <QuestionSubidaList
                key={`subida-${shouldRefresh}`}
                activityId={activityIdNumber}
                onEdit={(q) => setEditingQuestion({ ...q, tipo: 'ARCHIVO' })}
              />
            </div>
          </div>
        )}

        {activity.typeId === 2 && activityIdNumber !== null && (
          <div className="space-y-6">
            <SeleccionActi
              selectedColor="#0f172a"
              onSelectChange={setSelectedActivityType}
            />

            <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-4 text-sm text-white sm:p-6">
              <p className="mb-3 font-semibold text-cyan-300">
                Distribución de preguntas:
              </p>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span>Opción Múltiple</span>
                  <span className="font-medium">
                    {resumenPorTipo.opcionMultiple}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Verdadero/Falso</span>
                  <span className="font-medium">
                    {resumenPorTipo.verdaderoFalso}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Completar</span>
                  <span className="font-medium">
                    {resumenPorTipo.completar}%
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-white/20 pt-2 font-semibold">
                  <span>Total usado</span>
                  <span>{porcentajeUsado}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-white/70 sm:text-sm">
                  <span>Disponible</span>
                  <span>{porcentajeDisponible}%</span>
                </div>
              </div>
            </div>

            {selectedActivityType && (
              <Button
                onClick={handleAddQuestion}
                className="mx-auto block border border-cyan-500/30 bg-transparent px-6 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-950/40"
              >
                Agregar pregunta
              </Button>
            )}

            {questions.map((questionType, index) => (
              <div key={index}>
                {questionType === 'OM' && (
                  <QuestionForm
                    activityId={activityIdNumber}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancelQuestion}
                    isUploading={false}
                  />
                )}
                {questionType === 'FOV' && (
                  <QuestionVOFForm
                    activityId={activityIdNumber}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancelQuestion}
                    isUploading={false}
                  />
                )}
                {questionType === 'COMPLETADO' && (
                  <PreguntasAbiertas
                    activityId={activityIdNumber}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancelQuestion}
                    isUploading={false}
                  />
                )}
              </div>
            ))}

            {editingQuestion?.tipo === 'OM' && (
              <QuestionForm
                activityId={activityIdNumber}
                onSubmit={handleFormSubmit}
                onCancel={handleCancelQuestion}
                isUploading={false}
                editingQuestion={editingQuestion as Question}
              />
            )}
            {editingQuestion?.tipo === 'FOV' && (
              <QuestionVOFForm
                activityId={activityIdNumber}
                onSubmit={handleFormSubmit}
                onCancel={handleCancelQuestion}
                isUploading={false}
                editingQuestion={editingQuestion as VerdaderoOFlaso}
              />
            )}

            <div className="space-y-6">
              <QuestionVOFList
                key={`vof-${shouldRefresh}`}
                activityId={activityIdNumber}
                onEdit={(q) => setEditingQuestion({ ...q, tipo: 'FOV' })}
                shouldRefresh={shouldRefresh}
              />
              <QuestionList
                key={`om-${shouldRefresh}`}
                activityId={activityIdNumber}
                onEdit={(q) => setEditingQuestion({ ...q, tipo: 'OM' })}
              />
              <ListPreguntaAbierta
                key={`abierta-${shouldRefresh}`}
                activityId={activityIdNumber}
                shouldRefresh={shouldRefresh}
              />
            </div>
          </div>
        )}

        {activity.typeId === 4 && activityIdNumber !== null && (
          <div className="space-y-6">
            <PreguntasAbiertas2
              activityId={activityIdNumber}
              onSubmit={handleFormSubmit}
              isUploading={false}
            />
            <ListPreguntaAbierta2 activityId={activityIdNumber} />
          </div>
        )}

        {![1, 2, 4].includes(activity.typeId) && (
          <p className="text-sm text-white/50">
            Este tipo de actividad no tiene contenido configurable.
          </p>
        )}
      </div>

      <div hidden={activeDetailTab !== 'calificaciones'}>
        <div
          id="estudiantes"
          className="relative z-10 mb-6 flex scroll-mt-24 items-center justify-between"
        >
          <h2 className="text-2xl font-bold text-white">
            Estudiantes{' '}
            <span className="ml-2 inline-block rounded-full bg-cyan-500 px-2 py-0.5 text-xs font-bold text-slate-950">
              {students.length}
            </span>
          </h2>
        </div>

        {loadingStudents ? (
          <div className="relative z-10 flex items-center gap-3 text-white/60">
            <div className="size-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            Cargando estudiantes...
          </div>
        ) : students.length === 0 ? (
          <div className="relative z-10 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-cyan-500/30 bg-slate-800/50 p-16 text-center">
            <Users className="size-10 text-white/30" />
            <p className="text-sm text-white/50">
              Aún no hay estudiantes con progreso registrado en esta actividad.
            </p>
          </div>
        ) : (
          <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {students.map((student) => {
              const draft = gradeDrafts[student.userId] ?? {
                finalGrade: '',
                revisada: false,
              };
              return (
                <Card
                  key={student.userId}
                  className="border-2 border-cyan-500/20 bg-slate-800/80 p-5 shadow-lg"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white">
                        {student.userName ?? 'Sin nombre'}
                      </p>
                      <p className="text-xs text-white/50">
                        {student.userEmail ?? student.userId}
                      </p>
                    </div>
                    <Badge
                      className={`shrink-0 text-[11px] ${
                        student.isCompleted
                          ? 'border-green-500/50 bg-green-500/20 text-green-300'
                          : 'border-yellow-500/50 bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      {student.isCompleted ? 'Completado' : 'En progreso'}
                    </Badge>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-white/70">
                    <p>Progreso: {Math.round(student.progress * 100)}%</p>
                    <p>Intentos: {student.attemptCount ?? 0}</p>
                    <p className="col-span-2">
                      Último intento:{' '}
                      {student.lastAttemptAt
                        ? new Date(student.lastAttemptAt).toLocaleString(
                            'es-ES'
                          )
                        : 'N/A'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                      Nota final
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={draft.finalGrade}
                      onChange={(e) =>
                        setGradeDrafts((prev) => ({
                          ...prev,
                          [student.userId]: {
                            ...draft,
                            finalGrade: e.target.value,
                          },
                        }))
                      }
                      placeholder="Ej: 4.5"
                      className="w-full rounded-lg border border-cyan-500/30 bg-white/5 px-3 py-2 text-sm text-white transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 focus:outline-none"
                    />
                    <label className="flex items-center gap-2 text-xs text-white/70">
                      <input
                        type="checkbox"
                        checked={draft.revisada}
                        onChange={(e) =>
                          setGradeDrafts((prev) => ({
                            ...prev,
                            [student.userId]: {
                              ...draft,
                              revisada: e.target.checked,
                            },
                          }))
                        }
                      />
                      Revisada
                    </label>
                    <Button
                      size="sm"
                      onClick={() => handleSaveGrade(student.userId)}
                      disabled={savingUserId === student.userId}
                      className="w-full bg-cyan-500 text-white hover:bg-cyan-600"
                    >
                      {savingUserId === student.userId
                        ? 'Guardando...'
                        : 'Guardar calificación'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative z-10 mt-10 rounded-2xl border border-cyan-500/20 bg-slate-800 p-6">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-white">
          <MessageSquare className="size-4" />
          Comentarios
        </h2>
        <p className="text-sm text-white/50">
          Los comentarios en esta actividad estarán disponibles pronto.
        </p>
      </div>
    </div>
  );
}
