'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  CodeXml,
  Eye,
  FileBox,
  FileText,
  Globe,
  HelpCircle,
  ImageOff,
  Layers,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  MessageSquare,
  Package,
  Pencil,
  PlayCircle,
  Plus,
  Quote,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import Select, { type MultiValue } from 'react-select';
import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import { ModalFormGuidedActivity } from '~/components/super-admin/modals/ModalFormGuidedActivity';
import { ModalFormGuidedObjective } from '~/components/super-admin/modals/ModalFormGuidedObjective';
import { ModalGuidedProjectForm } from '~/components/super-admin/modals/ModalGuidedProjectForm';
import { plansPersonas } from '~/types/plans';

import type { GuidedProject } from '~/types';

interface GuidedProjectAdminTabsProps {
  project: GuidedProject;
}

type TabKey = 'proyecto' | 'actividades' | 'recursos' | 'foro';

const splitLines = (value: string | null | undefined): string[] =>
  (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

const splitTags = (value: string | null | undefined): string[] =>
  (value ?? '')
    .split(/[,\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

const sectionClass =
  'rounded-2xl border border-[#1d283a] bg-[#061c37] p-6 md:p-8';
const sectionIconClass =
  'flex size-8 items-center justify-center rounded-lg border border-[#22C4D3]/30 bg-[#22C4D3]/15 text-[#22C4D3]';

// Generic "is this for you" copy — same for every guided project (mirrors
// the public project page).
const ES_PARA_TI = {
  si: [
    'Ya sabes lo básico de programación pero nunca has terminado un proyecto real de principio a fin.',
    'Estás cansado de ver tutoriales sin construir nada propio.',
    'Quieres un producto real para tu portafolio o para vender a negocios.',
    'Buscas tus primeros ingresos como freelance o con tu propio proyecto.',
  ],
  no: [
    'Nunca has escrito una línea de código (necesitas bases primero).',
    'Buscas un curso solo teórico sin construir nada.',
    'No tienes tiempo para dedicarle unas horas por semana.',
  ],
};

// Generic testimonials — same for every guided project.
const TESTIMONIALS = [
  {
    initials: 'CM',
    name: 'Carlos Méndez',
    role: 'Desarrollador freelance',
    quote:
      'Antes solo veía tutoriales y nunca terminaba nada. Con Artiefy construí un proyecto real de principio a fin, con el acompañamiento de Artie IA cuando me atascaba.',
  },
  {
    initials: 'LG',
    name: 'Laura Gómez',
    role: 'Emprendedora tech',
    quote:
      'Nunca pensé que podría tener un producto propio terminado. La constancia verificable me ayudó a mostrar mi trabajo y conseguir mi primer cliente.',
  },
  {
    initials: 'AR',
    name: 'Andrés Rojas',
    role: 'Full-stack junior',
    quote:
      'Lo que más me gustó fue que no era teoría: desde el día 1 estaba programando funcionalidad real. El proyecto quedó en mi portafolio.',
  },
  {
    initials: 'VR',
    name: 'Valentina Ruiz',
    role: 'Ingeniera de software',
    quote:
      'La retroalimentación del educador y de Artie IA me hicieron escribir código mucho más limpio. Aprendí a pensar en el usuario final, no solo en que "funcione".',
  },
];

// Generic FAQ — same for every guided project.
const FAQ_ITEMS = [
  {
    q: '¿Necesito mucho nivel para hacer este proyecto?',
    a: 'No. Solo necesitas bases de programación. El proyecto te lleva paso a paso desde la configuración hasta el producto desplegado. Si sabes lo básico, puedes lograrlo.',
  },
  {
    q: '¿Qué pasa si me trabo y no sé cómo seguir?',
    a: 'Artie IA te acompaña en tiempo real mientras programas, y el educador asignado resuelve tus dudas en el foro del proyecto.',
  },
  {
    q: '¿Cuánto tiempo necesito dedicarle?',
    a: 'Depende de tu ritmo, pero la mayoría de estudiantes avanza dedicando unas horas por semana.',
  },
  {
    q: '¿Esto me sirve para conseguir trabajo o clientes?',
    a: 'Sí. Terminas con un proyecto real en tu portafolio y una constancia verificable que puedes compartir con reclutadores o clientes.',
  },
  {
    q: '¿Cómo puedo pagar?',
    a: 'Con tarjeta o PSE, según el plan o proyecto que elijas.',
  },
  {
    q: '¿Necesito experiencia en ventas para vender lo que construyo?',
    a: 'No es necesario para completar el proyecto. Vender lo que construyas es un paso opcional posterior.',
  },
];

// Real Premium display price mirrors the override used on /planes (same
// hardcoded value, since plan pricing isn't exposed as a shared constant).
const PREMIUM_DISPLAY_PRICE = 124900;

function EditableList({
  items,
  onChange,
  onCommit,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  onCommit: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            value={item}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...items];
              next[idx] = e.target.value;
              onChange(next);
            }}
            onBlur={() => onCommit(items)}
            className="w-full rounded-lg border border-[#22C4D3]/30 bg-[#04101f] p-2 text-sm text-white outline-none focus:border-[#22C4D3]"
          />
          <button
            type="button"
            onClick={() => {
              const next = items.filter((_, i) => i !== idx);
              onChange(next);
              onCommit(next);
            }}
            className="shrink-0 text-white/40 hover:text-red-400"
            aria-label="Eliminar"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="flex items-center gap-1.5 text-xs font-medium text-[#22C4D3] hover:text-[#22C4D3]"
      >
        <Plus className="size-3.5" /> Agregar
      </button>
    </div>
  );
}

export function GuidedProjectAdminTabs({
  project,
}: GuidedProjectAdminTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey | null) ?? 'proyecto';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // ─── Modo Educador (edición inline) ───────────────────────────────────────
  const [educatorMode, setEducatorMode] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [categoriesList, setCategoriesList] = useState<
    { id: number; name: string }[]
  >([]);
  const [modalidadesList, setModalidadesList] = useState<
    { id: number; name: string }[]
  >([]);
  const [educatorsList, setEducatorsList] = useState<
    { id: string; name: string }[]
  >([]);

  const [editState, setEditState] = useState(() => ({
    title: project.title,
    subtitle: project.subtitle ?? '',
    description: project.description ?? '',
    problemStatement: project.problemStatement ?? '',
    howItWorksList: splitLines(project.howItWorks),
    whatYouWillBuildList: splitLines(project.whatYouWillBuild),
    prerequisitesList: splitLines(project.prerequisites),
    techStackList: splitTags(project.techStack),
    deliverablesList: splitLines(project.deliverablesDescription),
    categoryId: project.categoryId,
    modalidadId: project.modalidadId,
    instructorIds:
      project.instructors && project.instructors.length > 0
        ? project.instructors.map((i) => i.id)
        : project.instructor
          ? [project.instructor]
          : [],
    isActive: project.isActive,
  }));

  useEffect(() => {
    if (!educatorMode) return;
    if (categoriesList.length && modalidadesList.length && educatorsList.length)
      return;

    const loadEditOptions = async () => {
      try {
        const [catRes, modRes, edRes] = await Promise.all([
          fetch('/api/educadores/categories'),
          fetch('/api/educadores/modalidades'),
          fetch('/api/super-admin/changeEducators'),
        ]);
        const [cat, mod, ed] = await Promise.all([
          catRes.json(),
          modRes.json(),
          edRes.json(),
        ]);
        setCategoriesList(cat);
        setModalidadesList(mod);
        setEducatorsList(ed);
      } catch {
        toast.error('Error al cargar opciones de edición');
      }
    };

    void loadEditOptions();
  }, [
    educatorMode,
    categoriesList.length,
    modalidadesList.length,
    educatorsList.length,
  ]);

  const savePatch = async (
    patch: Record<string, unknown>,
    successMsg = 'Guardado'
  ) => {
    try {
      const res = await fetch(`/api/guided-projects?id=${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      toast.success(successMsg);
    } catch {
      toast.error('Error al guardar los cambios');
    }
  };

  const handleCoverFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });
      if (!uploadRes.ok) throw new Error();
      const { url, fields, key } = await uploadRes.json();
      const formDataUpload = new FormData();
      Object.entries(fields as Record<string, string>).forEach(([k, v]) => {
        formDataUpload.append(k, v);
      });
      formDataUpload.append('file', file);
      const s3Res = await fetch(url, { method: 'POST', body: formDataUpload });
      if (!s3Res.ok) throw new Error();
      await savePatch(
        { coverImageKey: key, coverVideoKey: 'none' },
        'Portada actualizada'
      );
      router.refresh();
    } catch {
      toast.error('Error al subir la imagen');
    } finally {
      setUploadingCover(false);
    }
  };

  const objectives = project.objectives ?? [];

  const [expandedObjectiveId, setExpandedObjectiveId] = useState<number | null>(
    objectives[0]?.id ?? null
  );
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingObjectiveId, setEditingObjectiveId] = useState<number | null>(
    null
  );
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityModalObjectiveId, setActivityModalObjectiveId] = useState<
    number | null
  >(null);
  const [editingActivityId, setEditingActivityId] = useState<number | null>(
    null
  );
  const [expandedActivityId, setExpandedActivityId] = useState<number | null>(
    null
  );

  const handleDeleteProject = async () => {
    if (!confirm('¿Estás seguro de eliminar este proyecto guiado?')) return;
    try {
      const response = await fetch(`/api/guided-projects?id=${project.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      toast.success('Proyecto eliminado');
      router.push('/dashboard/super-admin/proyectos-guiados');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el proyecto');
    }
  };

  const handleToggleObjective = async (
    objectiveId: number,
    isEnabled: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/guided-projects/${project.id}/objectives?id=${objectiveId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEnabled: !isEnabled }),
        }
      );
      if (!response.ok) throw new Error('Error al actualizar');
      toast.success(isEnabled ? 'Sesión deshabilitada' : 'Sesión habilitada');
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      toast.error('No se pudo actualizar el estado de la sesión');
    }
  };

  const handleDeleteObjective = async (objectiveId: number) => {
    if (!confirm('¿Eliminar esta sesión? Se eliminarán sus actividades.'))
      return;
    try {
      const response = await fetch(
        `/api/guided-projects/${project.id}/objectives?id=${objectiveId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Error al eliminar');
      toast.success('Sesión eliminada');
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar la sesión');
    }
  };

  const handleDeleteActivity = async (
    objectiveId: number,
    activityId: number
  ) => {
    if (!confirm('¿Eliminar esta actividad?')) return;
    try {
      const response = await fetch(
        `/api/guided-projects/${project.id}/objectives/${objectiveId}/activities?id=${activityId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Error al eliminar');
      toast.success('Actividad eliminada');
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar actividad');
    }
  };

  const prerequisites = splitLines(project.prerequisites);
  const techStack = splitTags(project.techStack);
  const deliverables = splitLines(project.deliverablesDescription);
  const howItWorksText = project.howItWorks?.trim() ?? '';
  const proPlan = plansPersonas.find((plan) => plan.name === 'Pro');
  const individualPriceValue =
    typeof project.individualPrice === 'number' && project.individualPrice > 0
      ? project.individualPrice
      : null;
  const hasEducatorInfo = Boolean(
    project.instructorName ||
    project.instructorProfesion ||
    project.instructorDescripcion
  );
  const educators =
    project.instructors && project.instructors.length > 0
      ? project.instructors
      : [
          {
            id: project.instructor,
            name: project.instructorName ?? null,
            profesion: project.instructorProfesion ?? null,
            descripcion: project.instructorDescripcion ?? null,
            profileImageKey: project.instructorProfileImageKey ?? null,
          },
        ];

  const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'proyecto', label: 'Proyecto', icon: <Rocket className="size-4" /> },
    {
      key: 'actividades',
      label: 'Actividades',
      icon: <Layers className="size-4" />,
    },
    {
      key: 'recursos',
      label: 'Recursos',
      icon: <FileBox className="size-4" />,
    },
    { key: 'foro', label: 'Foro', icon: <MessageSquare className="size-4" /> },
  ];

  const renderCoverMediaAndActions = () => (
    <div className="relative overflow-hidden rounded-2xl border border-[#1d283a] bg-[#061c37]">
      <label
        className={`card-premium group relative block aspect-video w-full overflow-hidden ${
          educatorMode ? 'cursor-pointer' : ''
        }`}
      >
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-40 transition-opacity duration-300 group-hover:opacity-20" />
        {educatorMode && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            {uploadingCover ? (
              <span className="text-sm font-semibold text-white">
                Subiendo...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-[#22C4D3] px-3 py-1.5 text-xs font-semibold text-[#080c16]">
                <Pencil className="size-3.5" />
                Cambiar imagen
              </span>
            )}
          </div>
        )}
        {educatorMode && (
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleCoverFileChange(e)}
          />
        )}
        {project.coverVideoKey && project.coverVideoKey !== 'none' ? (
          <video
            src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverVideoKey}`}
            poster={
              project.coverImageKey
                ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`
                : undefined
            }
            autoPlay
            loop
            muted
            playsInline
            aria-label={`Video de ${project.title}`}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : project.coverImageKey ? (
          <Image
            src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`}
            alt={project.title}
            width={400}
            height={225}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
            priority
            quality={85}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#3AF4EF]/20 to-[#01142B]/20">
            <ImageOff className="size-10 text-white/40" />
          </div>
        )}
      </label>

      <div className="space-y-4 p-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#22C4D3]/40 bg-[#22C4D3]/15 px-3 py-1.5 text-sm font-medium text-[#22C4D3]">
          <Rocket className="size-3.5" />
          <span>Proyecto Guiado</span>
        </div>

        <div className="grid w-full grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setEditProjectOpen(true)}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-[#22c4d3] px-3 text-xs font-semibold text-[#080c16] transition hover:bg-[#1fb0be] md:text-sm"
          >
            <Pencil className="size-3.5" />
            Editar
          </button>
          <button
            type="button"
            onClick={handleDeleteProject}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 md:text-sm"
          >
            <Trash2 className="size-3.5" />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="overflow-x-clip">
      {/* Banda de Modo Educador */}
      <div
        className="mt-3 flex w-screen -translate-x-1/2 items-center justify-between gap-3 border-y border-[#1f5f74]/35 bg-[#08253f] px-3 py-2 whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:px-4"
        style={{ marginLeft: '50%', marginRight: '50%' }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#22C4D3]/20 bg-[#10324f] text-[#22C4D3] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <Eye className="size-3.5" />
          </span>
          <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
            <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#22C4D3]/30 bg-[#0e3554] px-2.5 py-1 text-[9px] font-semibold tracking-[0.14em] text-[#22C4D3] uppercase sm:text-[10px]">
              <Eye className="size-3.5" />
              Vista del educador
            </div>
            <p className="truncate text-[10px] leading-none text-white/60 sm:text-xs">
              Edita texto y guarda cambios en esta sesión.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setEducatorMode((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors sm:px-4 sm:py-2 sm:text-sm ${
              educatorMode
                ? 'bg-[#061a33] hover:bg-[#09213f]'
                : 'bg-[#0b2b4a] hover:bg-[#0e355c]'
            }`}
            aria-label={
              educatorMode
                ? 'Desactivar modo educador'
                : 'Activar modo educador'
            }
          >
            <Pencil className="size-4" />
            {educatorMode ? 'Editando' : 'Activar edición'}
          </button>
          <Link
            href="/dashboard/super-admin"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-[#22C4D3] transition-colors hover:bg-white/5 hover:text-[#6cecf4] sm:size-9"
            aria-label="Volver al panel"
            title="Volver al panel"
          >
            <span aria-hidden="true">←</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2">
          {/* Card principal (hero) — mismo estilo que la página pública */}
          <div className="relative w-full">
            <div className="relative overflow-hidden rounded-2xl border border-[#1d283a] bg-[#061c37] p-4 shadow-2xl sm:p-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#22C4D3]/40 bg-[#22C4D3]/15 px-3 py-1.5 text-[#22C4D3]">
                  <Rocket className="size-3.5" />
                  <span className="text-xs font-semibold tracking-wide">
                    Proyecto Guiado
                  </span>
                  {educatorMode && <Pencil className="size-3.5" />}
                </div>

                {educatorMode ? (
                  <input
                    value={editState.title}
                    onChange={(e) =>
                      setEditState((s) => ({ ...s, title: e.target.value }))
                    }
                    onBlur={() => savePatch({ title: editState.title })}
                    className="w-full rounded-lg border border-[#22C4D3]/40 bg-[#04101f] p-2 text-2xl font-bold text-white outline-none focus:border-[#22C4D3] md:text-3xl"
                  />
                ) : (
                  <h1 className="font-display text-2xl leading-tight font-bold text-white md:text-3xl">
                    {project.title}
                  </h1>
                )}

                {educatorMode ? (
                  <input
                    value={editState.subtitle}
                    onChange={(e) =>
                      setEditState((s) => ({
                        ...s,
                        subtitle: e.target.value,
                      }))
                    }
                    onBlur={() => savePatch({ subtitle: editState.subtitle })}
                    placeholder="Subtítulo"
                    className="w-full rounded-lg border border-[#22C4D3]/40 bg-[#04101f] p-2 text-base text-white/80 outline-none focus:border-[#22C4D3]"
                  />
                ) : (
                  (project.subtitle ?? project.description) && (
                    <p className="text-base text-[#94A3B8]">
                      {project.subtitle ?? project.description}
                    </p>
                  )
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {educatorMode ? (
                    <select
                      value={editState.categoryId}
                      onChange={(e) => {
                        const categoryId = Number(e.target.value);
                        setEditState((s) => ({ ...s, categoryId }));
                        void savePatch({ categoryId });
                      }}
                      className="rounded-full border border-[#22C4D3]/40 bg-[#04101f] px-3 py-1.5 text-xs font-medium text-white outline-none focus:border-[#22C4D3]"
                    >
                      {categoriesList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#22C4D3]/40 px-3 py-1.5 text-xs font-medium text-white">
                      {project.category?.name ?? 'N/A'}
                    </span>
                  )}

                  {(project.modalidad?.name || educatorMode) &&
                    (educatorMode ? (
                      <select
                        value={editState.modalidadId}
                        onChange={(e) => {
                          const modalidadId = Number(e.target.value);
                          setEditState((s) => ({ ...s, modalidadId }));
                          void savePatch({ modalidadId });
                        }}
                        className="rounded-full border border-[#22C4D3]/40 bg-[#04101f] px-3 py-1.5 text-xs font-medium text-white outline-none focus:border-[#22C4D3]"
                      >
                        {modalidadesList.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#22C4D3]/40 px-3 py-1.5 text-xs font-medium text-white">
                        {project.modalidad?.name}
                      </span>
                    ))}

                  {educatorMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        const isActive = !editState.isActive;
                        setEditState((s) => ({ ...s, isActive }));
                        void savePatch({ isActive });
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        editState.isActive
                          ? 'border-green-500/50 bg-green-500/20 text-green-300'
                          : 'border-red-500/50 bg-red-500/20 text-red-300'
                      }`}
                    >
                      {editState.isActive ? 'Activo' : 'Inactivo'}
                    </button>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                        project.isActive
                          ? 'border-green-500/50 bg-green-500/20 text-green-300'
                          : 'border-red-500/50 bg-red-500/20 text-red-300'
                      }`}
                    >
                      {project.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 lg:hidden">
                {renderCoverMediaAndActions()}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="relative z-10 mt-8 flex flex-wrap gap-2 rounded-2xl border border-[#22C4D3]/20 bg-[#04101f]/60 p-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(item.key)}
                  className={`
                flex items-center gap-2 rounded-full px-4 py-2 text-sm
                font-medium transition-all
                ${
                  isActive
                    ? 'bg-[#22C4D3] text-[#080c16]'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }
              `}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {/* Proyecto */}
            {activeTab === 'proyecto' && (
              <div className="space-y-6">
                <section className={sectionClass}>
                  <div className="mb-4 flex items-center gap-2">
                    <div className={sectionIconClass}>
                      <FileText className="size-4" />
                    </div>
                    <h2 className="flex items-center gap-1.5 text-xl font-bold text-white">
                      Descripción
                      {educatorMode && <Pencil className="size-3.5" />}
                    </h2>
                  </div>
                  {educatorMode ? (
                    <textarea
                      value={editState.description}
                      onChange={(e) =>
                        setEditState((s) => ({
                          ...s,
                          description: e.target.value,
                        }))
                      }
                      onBlur={() =>
                        savePatch({ description: editState.description })
                      }
                      rows={3}
                      className="w-full rounded-lg border border-[#22C4D3]/40 bg-[#04101f] p-2 text-sm text-white outline-none focus:border-[#22C4D3]"
                    />
                  ) : (
                    <p className="text-sm leading-relaxed text-white/80">
                      {project.description || 'Sin descripción'}
                    </p>
                  )}
                </section>

                {(project.problemStatement?.trim() || educatorMode) && (
                  <section className={sectionClass}>
                    <div className="mb-4 flex items-center gap-2">
                      <div className={sectionIconClass}>
                        <TriangleAlert className="size-4" />
                      </div>
                      <h2 className="flex items-center gap-1.5 text-xl font-bold text-white">
                        El problema
                        {educatorMode && <Pencil className="size-3.5" />}
                      </h2>
                    </div>
                    {educatorMode ? (
                      <textarea
                        value={editState.problemStatement}
                        onChange={(e) =>
                          setEditState((s) => ({
                            ...s,
                            problemStatement: e.target.value,
                          }))
                        }
                        onBlur={() =>
                          savePatch({
                            problemStatement: editState.problemStatement,
                          })
                        }
                        rows={3}
                        placeholder="¿Qué problema resuelve este proyecto?"
                        className="w-full rounded-lg border border-[#22C4D3]/30 bg-[#04101f] p-2 text-sm text-white outline-none focus:border-[#22C4D3]"
                      />
                    ) : (
                      <p className="leading-relaxed whitespace-pre-line text-white/80">
                        {project.problemStatement}
                      </p>
                    )}
                  </section>
                )}

                {(howItWorksText || educatorMode) && (
                  <section className={sectionClass}>
                    <div className="mb-4 flex items-center gap-2">
                      <div className={sectionIconClass}>
                        <Lightbulb className="size-4" />
                      </div>
                      <h2 className="flex items-center gap-1.5 text-xl font-bold text-white">
                        Cómo funciona
                        {educatorMode && <Pencil className="size-3.5" />}
                      </h2>
                    </div>
                    {educatorMode ? (
                      <EditableList
                        items={editState.howItWorksList}
                        onChange={(items) =>
                          setEditState((s) => ({ ...s, howItWorksList: items }))
                        }
                        onCommit={(items) =>
                          savePatch({
                            howItWorks: items.filter(Boolean).join('\n'),
                          })
                        }
                        placeholder="Paso a paso..."
                      />
                    ) : (
                      <p className="leading-relaxed whitespace-pre-line text-white/80">
                        {howItWorksText}
                      </p>
                    )}
                  </section>
                )}

                {(project.whatYouWillBuild?.trim() || educatorMode) && (
                  <section className={sectionClass}>
                    <div className="mb-4 flex items-center gap-2">
                      <div className={sectionIconClass}>
                        <Target className="size-4" />
                      </div>
                      <h2 className="flex items-center gap-1.5 text-xl font-bold text-white">
                        Lo que vas a construir
                        {educatorMode && <Pencil className="size-3.5" />}
                      </h2>
                    </div>
                    {educatorMode ? (
                      <EditableList
                        items={editState.whatYouWillBuildList}
                        onChange={(items) =>
                          setEditState((s) => ({
                            ...s,
                            whatYouWillBuildList: items,
                          }))
                        }
                        onCommit={(items) =>
                          savePatch({
                            whatYouWillBuild: items.filter(Boolean).join('\n'),
                          })
                        }
                        placeholder="Describe lo que el estudiante construirá"
                      />
                    ) : (
                      <p className="leading-relaxed whitespace-pre-line text-white/80">
                        {project.whatYouWillBuild}
                      </p>
                    )}
                  </section>
                )}

                {(deliverables.length > 0 || educatorMode) && (
                  <section className={sectionClass}>
                    <div className="mb-4 flex items-center gap-2">
                      <div className={sectionIconClass}>
                        <Package className="size-4" />
                      </div>
                      <h2 className="flex items-center gap-1.5 text-xl font-bold text-white">
                        Lo que tendrás al terminar
                        {educatorMode && <Pencil className="size-3.5" />}
                      </h2>
                    </div>
                    {educatorMode ? (
                      <EditableList
                        items={editState.deliverablesList}
                        onChange={(items) =>
                          setEditState((s) => ({
                            ...s,
                            deliverablesList: items,
                          }))
                        }
                        onCommit={(items) =>
                          savePatch({
                            deliverablesDescription: items
                              .filter(Boolean)
                              .join('\n'),
                          })
                        }
                        placeholder="Repositorio documentado"
                      />
                    ) : (
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {deliverables.map((item) => (
                          <li
                            key={item}
                            className="flex gap-3 rounded-xl border border-[#22C4D3]/20 bg-[#22C4D3]/5 p-4"
                          >
                            <Package className="mt-0.5 size-5 shrink-0 text-[#22C4D3]" />
                            <span className="text-sm leading-relaxed text-white/90">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                {/* Constancia Verificable — contenido genérico, igual en todos los proyectos */}
                <section className={sectionClass}>
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#22C4D3]/30 bg-[#22C4D3]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#22C4D3]">
                    <Award className="size-3.5" />
                    CONSTANCIA VERIFICABLE
                  </div>
                  <h2 className="font-display mb-3 text-xl font-bold text-white md:text-2xl">
                    Termina con una{' '}
                    <span className="text-[#22C4D3]">Constancia</span> que
                    puedes mostrar
                  </h2>
                  <p className="mb-6 leading-relaxed text-white/70">
                    Al completar el proyecto recibes una constancia publicada en
                    la WEB y verificable. No es un PDF más: es una página en
                    línea con tu producto funcionando, tu código y tu demo.
                  </p>
                  <div className="rounded-xl border border-[#22C4D3]/30 bg-[#04101f] p-5">
                    <div className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[#22C4D3]">
                      <Award className="size-3.5" />
                      CONSTANCIA
                    </div>
                    <p className="text-sm leading-relaxed text-white/70">
                      Artiefy certifica a{' '}
                      <span className="text-white">[Tu nombre]</span> por
                      participar y finalizar el proyecto formativo aplicado:
                    </p>
                    <p className="mt-2 mb-4 font-semibold text-white">
                      {project.title}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#061c37] px-2.5 py-1 text-xs text-white/70">
                        <Globe className="size-3.5" /> Producto en vivo
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#061c37] px-2.5 py-1 text-xs text-white/70">
                        <FaGithub className="size-3.5" /> Código en GitHub
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#061c37] px-2.5 py-1 text-xs text-white/70">
                        <PlayCircle className="size-3.5" /> Video demo
                      </span>
                    </div>
                    <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                      <CheckCircle2 className="size-3.5" /> Verificable
                      públicamente
                    </div>
                  </div>
                </section>

                {(prerequisites.length > 0 || educatorMode) && (
                  <section className={sectionClass}>
                    <div className="mb-4 flex items-center gap-2">
                      <div className={sectionIconClass}>
                        <ListChecks className="size-4" />
                      </div>
                      <h2 className="flex items-center gap-1.5 text-xl font-bold text-white">
                        Lo que necesitas para empezar
                        {educatorMode && <Pencil className="size-3.5" />}
                      </h2>
                    </div>
                    {educatorMode ? (
                      <EditableList
                        items={editState.prerequisitesList}
                        onChange={(items) =>
                          setEditState((s) => ({
                            ...s,
                            prerequisitesList: items,
                          }))
                        }
                        onCommit={(items) =>
                          savePatch({
                            prerequisites: items.filter(Boolean).join('\n'),
                          })
                        }
                        placeholder="Manejo básico de TypeScript"
                      />
                    ) : (
                      <ul className="space-y-2">
                        {prerequisites.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm text-white/80"
                          >
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#22C4D3]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                {(techStack.length > 0 || educatorMode) && (
                  <section className={sectionClass}>
                    <div className="mb-4 flex items-center gap-2">
                      <div className={sectionIconClass}>
                        <CodeXml className="size-4" />
                      </div>
                      <h2 className="flex items-center gap-1.5 text-xl font-bold text-white">
                        Stack tecnológico
                        {educatorMode && <Pencil className="size-3.5" />}
                      </h2>
                    </div>
                    {educatorMode ? (
                      <EditableList
                        items={editState.techStackList}
                        onChange={(items) =>
                          setEditState((s) => ({ ...s, techStackList: items }))
                        }
                        onCommit={(items) =>
                          savePatch({
                            techStack: items.filter(Boolean).join(', '),
                          })
                        }
                        placeholder="Next.js"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {techStack.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border border-[#22C4D3]/30 bg-[#22C4D3]/10 px-3 py-1.5 font-mono text-xs text-[#22C4D3]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* ¿Es para ti? — contenido genérico, igual en todos los proyectos */}
                <section className={sectionClass}>
                  <h2 className="font-display mb-6 text-xl font-bold text-white md:text-2xl">
                    ¿Es para ti?
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <div className="mb-3 flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 className="size-4" />
                        <h3 className="font-semibold">Es para ti si...</h3>
                      </div>
                      <ul className="space-y-2">
                        {ES_PARA_TI.si.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm text-white/70"
                          >
                            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[#04101f] p-4">
                      <div className="mb-3 flex items-center gap-2 text-white/60">
                        <XCircle className="size-4" />
                        <h3 className="font-semibold text-white">
                          No es para ti si...
                        </h3>
                      </div>
                      <ul className="space-y-2">
                        {ES_PARA_TI.no.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm text-white/70"
                          >
                            <XCircle className="mt-0.5 size-3.5 shrink-0 text-white/50" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                {(hasEducatorInfo || educatorMode) && (
                  <section
                    className={`${sectionClass} relative space-y-6 overflow-hidden`}
                  >
                    <h2 className="relative flex items-center gap-1.5 text-lg font-bold text-white md:text-xl">
                      Tu educador en este proyecto
                      {educatorMode && <Pencil className="size-3.5" />}
                    </h2>
                    {educatorMode && (
                      <Select
                        isMulti
                        value={educatorsList
                          .filter((e) => editState.instructorIds.includes(e.id))
                          .map((e) => ({ value: e.id, label: e.name }))}
                        onChange={(
                          selected: MultiValue<{ value: string; label: string }>
                        ) => {
                          const instructorIds = selected.map(
                            (opt) => opt.value
                          );
                          setEditState((s) => ({ ...s, instructorIds }));
                          void savePatch({ instructors: instructorIds });
                        }}
                        options={educatorsList.map((e) => ({
                          value: e.id,
                          label: e.name,
                        }))}
                        placeholder="Seleccionar instructores..."
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: '#04101f',
                            borderColor: 'rgb(34 196 211 / 0.4)',
                            color: 'white',
                          }),
                          input: (base) => ({ ...base, color: 'white' }),
                          singleValue: (base) => ({ ...base, color: 'white' }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: '#04101f',
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused
                              ? 'rgb(34 196 211 / 0.2)'
                              : '#04101f',
                            color: 'white',
                          }),
                          multiValue: (base) => ({
                            ...base,
                            backgroundColor: 'rgb(34 196 211 / 0.3)',
                          }),
                          multiValueLabel: (base) => ({
                            ...base,
                            color: 'white',
                          }),
                        }}
                      />
                    )}
                    {educators.map((educator) => (
                      <div
                        key={educator.id}
                        className="relative flex flex-col-reverse items-start gap-6 md:flex-row md:items-center md:justify-between md:gap-10"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="text-2xl font-bold text-white md:text-3xl">
                            {educator.name}
                          </h3>
                          {educator.profesion && (
                            <p className="mt-1 text-sm font-semibold text-[#22C4D3] md:text-base">
                              {educator.profesion}
                            </p>
                          )}
                          {educator.descripcion && (
                            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
                              {educator.descripcion}
                            </p>
                          )}
                        </div>
                        <div className="relative shrink-0 self-center">
                          <div className="absolute inset-0 -m-8 rounded-full bg-[#22C4D3]/25 blur-3xl" />
                          {educator.profileImageKey ? (
                            <Image
                              src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${educator.profileImageKey}`}
                              alt={educator.name ?? 'Educador'}
                              width={160}
                              height={160}
                              className="relative size-32 rounded-2xl [mask-image:linear-gradient(to_right,transparent,black_35%)] object-cover md:size-40"
                              quality={70}
                            />
                          ) : (
                            <div className="relative flex size-32 items-center justify-center rounded-2xl bg-[#0d2a4d] text-3xl font-bold text-[#22C4D3] md:size-40">
                              {(educator.name ?? 'E').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                {/* Lo que dicen los alumnos — contenido genérico */}
                <section className={sectionClass}>
                  <div className="mb-6 flex items-center gap-2">
                    <div className={sectionIconClass}>
                      <Quote className="size-4" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      Lo que dicen los alumnos
                    </h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {TESTIMONIALS.map((testimonial) => (
                      <div
                        key={testimonial.name}
                        className="rounded-xl border border-white/10 bg-[#04101f] p-4"
                      >
                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#22C4D3]/20 text-xs font-bold text-[#22C4D3]">
                            {testimonial.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {testimonial.name}
                            </p>
                            <p className="truncate text-xs text-white/50">
                              {testimonial.role}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed text-white/70">
                          &quot;{testimonial.quote}&quot;
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Elige cómo empezar — vista previa de solo lectura, mismo estilo público */}
                <section className={sectionClass}>
                  <h2 className="font-display mb-6 text-center text-xl font-bold text-white md:text-2xl">
                    Elige cómo empezar
                  </h2>
                  <div
                    className={`mx-auto grid max-w-3xl gap-4 ${individualPriceValue ? 'sm:grid-cols-2' : 'max-w-md'}`}
                  >
                    <div className="relative rounded-2xl border-2 border-[#22C4D3]/60 bg-[#04101f] p-5">
                      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#22C4D3]/15 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#22C4D3]">
                        <Sparkles className="size-3" /> RECOMENDADO
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        Suscripción Pro o Premium
                      </h3>
                      <p className="mt-2 text-2xl font-bold text-white">
                        Desde{' '}
                        {(proPlan?.price ?? 99900).toLocaleString('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          maximumFractionDigits: 0,
                        })}{' '}
                        <span className="text-sm font-normal text-white/50">
                          COP / mes
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-white/50">
                        Premium desde{' '}
                        {PREMIUM_DISPLAY_PRICE.toLocaleString('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          maximumFractionDigits: 0,
                        })}{' '}
                        COP / mes, con acceso ilimitado.
                      </p>
                      <ul className="mt-4 space-y-2">
                        {[
                          'Acceso a TODOS los proyectos guiados, cursos y programas.',
                          'Artie Inteligencia Artificial para el desarrollo de proyectos.',
                          'Soporte del educador en el foro.',
                          'Constancia verificable en cada proyecto.',
                        ].map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm text-white/70"
                          >
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#22C4D3]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-5 flex h-11 w-full items-center justify-center rounded-full bg-[#22c4d3] px-4 text-sm font-semibold text-[#080c16]">
                        Ver planes
                      </div>
                    </div>

                    {individualPriceValue && (
                      <div className="rounded-2xl border border-white/10 bg-[#04101f] p-5">
                        <h3 className="text-lg font-bold text-white">
                          Proyecto individual
                        </h3>
                        <p className="mt-2 text-2xl font-bold text-white">
                          {individualPriceValue.toLocaleString('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            maximumFractionDigits: 0,
                          })}
                        </p>
                        <p className="mt-1 text-xs text-white/50">
                          Solo este proyecto
                        </p>
                        <ul className="mt-4 space-y-2">
                          {[
                            'Acceso a este proyecto guiado.',
                            'Artie IA incluida en el proyecto.',
                            'Constancia verificable publicada en la WEB.',
                          ].map((item) => (
                            <li
                              key={item}
                              className="flex items-start gap-2 text-sm text-white/70"
                            >
                              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#22C4D3]" />
                              {item}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-5 flex h-11 w-full items-center justify-center rounded-full border border-[#22C4D3]/40 px-4 text-sm font-semibold text-[#22C4D3]">
                          Comprar proyecto
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-5 text-center text-xs text-white/50">
                    Pago seguro con tarjeta o PSE. Vista previa — el precio del
                    plan se toma del que elija cada estudiante.
                  </p>
                </section>

                {/* Garantía de tu primer mes — contenido genérico */}
                <section className={sectionClass}>
                  <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#22C4D3]/30 bg-[#22C4D3]/10 text-[#22C4D3]">
                      <ShieldCheck className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Garantía de tu primer mes
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-white/70">
                        Si en tu primer mes no avanzas en el proyecto, te
                        devolvemos tu dinero. Queremos que construyas algo real,
                        no que te quedes con un cobro inútil.
                      </p>
                      <p className="mt-2 text-xs text-white/40">
                        Aplican términos y condiciones.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Preguntas frecuentes — contenido genérico */}
                <section className={sectionClass}>
                  <div className="mb-4 flex items-center gap-2">
                    <div className={sectionIconClass}>
                      <HelpCircle className="size-4" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      Preguntas frecuentes
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {FAQ_ITEMS.map((item, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div
                          key={item.q}
                          className="overflow-hidden rounded-lg border border-white/10"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                            className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-white/5"
                          >
                            <span className="text-sm font-semibold text-white">
                              {item.q}
                            </span>
                            <ChevronDown
                              className={`size-4 shrink-0 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {isOpen && (
                            <div className="border-t border-white/10 bg-[#04101f] p-4">
                              <p className="text-sm leading-relaxed text-white/70">
                                {item.a}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {!educatorMode &&
                  !project.problemStatement?.trim() &&
                  !howItWorksText &&
                  !project.whatYouWillBuild?.trim() &&
                  prerequisites.length === 0 &&
                  techStack.length === 0 &&
                  deliverables.length === 0 &&
                  !hasEducatorInfo && (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#22C4D3]/30 bg-[#061c37]/50 p-16 text-center">
                      <FileText className="size-10 text-white/30" />
                      <p className="text-sm text-white/50">
                        Este proyecto aún no tiene contenido enriquecido.
                        Edítalo para completar el problema, cómo funciona,
                        stack, etc.
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* Actividades */}
            {activeTab === 'actividades' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold text-white">
                    Objetivos{' '}
                    <span className="ml-2 inline-block rounded-full bg-[#22C4D3] px-2 py-0.5 text-xs font-bold text-[#080c16]">
                      {objectives.length}
                    </span>
                  </h2>
                  <Button
                    onClick={() => {
                      setEditingObjectiveId(null);
                      setSessionModalOpen(true);
                    }}
                    className="bg-[#22C4D3] text-white hover:bg-[#1fb0be]"
                  >
                    + Nueva sesión
                  </Button>
                </div>

                {objectives.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#22C4D3]/30 bg-[#061c37]/50 p-16 text-center">
                    <ClipboardList className="size-10 text-white/30" />
                    <p className="text-sm text-white/50">
                      No hay sesiones creadas todavía
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {objectives.map((objective, objectiveIndex) => {
                      const activities = objective.activities ?? [];
                      const isOpen = expandedObjectiveId === objective.id;

                      return (
                        <div
                          key={objective.id}
                          className={`overflow-hidden rounded-2xl border border-[#22C4D3]/20 bg-[#061c37]/60 ${
                            !objective.isEnabled ? 'opacity-70' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const willOpen = !isOpen;
                              setExpandedObjectiveId(
                                willOpen ? objective.id : null
                              );
                              setExpandedActivityId(
                                willOpen ? (activities[0]?.id ?? null) : null
                              );
                            }}
                            className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/5"
                          >
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#22C4D3]/20 text-xs font-bold text-[#22C4D3]">
                              {objectiveIndex + 1}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                {!objective.isEnabled && (
                                  <LockKeyhole className="size-3.5 shrink-0 text-amber-400" />
                                )}
                                <span className="truncate font-semibold text-white">
                                  {objective.title || 'Sin título'}
                                </span>
                              </span>
                            </span>
                            <span className="mr-1 text-xs whitespace-nowrap text-white/50">
                              {activities.length}{' '}
                              {activities.length === 1
                                ? 'actividad'
                                : 'actividades'}
                            </span>
                            <ChevronDown
                              className={`size-4 shrink-0 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            />
                          </button>

                          {isOpen && (
                            <div className="border-t border-[#22C4D3]/10 bg-[#04101f]/40 p-4">
                              {objective.description && (
                                <p className="mb-4 text-sm leading-relaxed text-white/70">
                                  {objective.description}
                                </p>
                              )}

                              <div className="mb-4 flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleToggleObjective(
                                      objective.id,
                                      objective.isEnabled
                                    )
                                  }
                                  className="border-white/20 text-white/70 hover:bg-white/10"
                                >
                                  {objective.isEnabled
                                    ? 'Deshabilitar sesión'
                                    : 'Habilitar sesión'}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setEditingObjectiveId(objective.id);
                                    setSessionModalOpen(true);
                                  }}
                                  className="bg-yellow-500 text-white hover:bg-yellow-600"
                                >
                                  Editar sesión
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleDeleteObjective(objective.id)
                                  }
                                  className="bg-red-500 text-white hover:bg-red-600"
                                >
                                  Eliminar sesión
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setActivityModalObjectiveId(objective.id);
                                    setEditingActivityId(null);
                                    setActivityModalOpen(true);
                                  }}
                                  className="bg-[#22C4D3] text-white hover:bg-[#1fb0be]"
                                >
                                  + Nueva actividad
                                </Button>
                              </div>

                              {activities.length === 0 ? (
                                <p className="rounded-lg border border-dashed border-[#22C4D3]/20 p-4 text-center text-sm text-white/50">
                                  No hay actividades en esta sesión.
                                </p>
                              ) : (
                                <div className="overflow-hidden rounded-xl border border-[#22C4D3]/10">
                                  {activities.map((activity, activityIndex) => {
                                    const detailHref = `/dashboard/super-admin/proyectos-guiados/${project.id}/${objective.id}/actividades/${activity.id}`;
                                    const isActivityOpen =
                                      expandedActivityId === activity.id;
                                    return (
                                      <div
                                        key={activity.id}
                                        className="border-b border-[#22C4D3]/10 bg-[#061c37]/70 last:border-b-0"
                                      >
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setExpandedActivityId(
                                              isActivityOpen
                                                ? null
                                                : activity.id
                                            )
                                          }
                                          className="w-full p-4 text-left transition-colors hover:bg-white/5"
                                        >
                                          <span className="mb-1 block text-xs text-white/50">
                                            Actividad {activityIndex + 1}
                                          </span>
                                          <span className="flex items-center justify-between gap-3">
                                            <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                                              <span className="text-sm font-medium text-white">
                                                {activity.name}
                                              </span>
                                              {activity.weekNumber != null && (
                                                <span className="flex items-center gap-1 text-xs text-white/50">
                                                  <CalendarDays className="size-3" />
                                                  Semana {activity.weekNumber}
                                                </span>
                                              )}
                                            </span>
                                            <span className="flex shrink-0 items-center gap-2">
                                              {activity.revisada && (
                                                <CheckCircle2
                                                  className="size-4 text-emerald-400"
                                                  aria-label="Revisada"
                                                />
                                              )}
                                              <ChevronDown
                                                className={`size-4 text-white/50 transition-transform ${isActivityOpen ? 'rotate-180' : ''}`}
                                              />
                                            </span>
                                          </span>
                                        </button>

                                        {isActivityOpen && (
                                          <div className="space-y-3 px-4 pb-4">
                                            {activity.description && (
                                              <div className="rounded-lg bg-white/5 p-3">
                                                <span className="mb-1 block text-xs font-medium text-white/50">
                                                  Descripción
                                                </span>
                                                <p className="text-sm leading-relaxed text-white/80">
                                                  {activity.description}
                                                </p>
                                              </div>
                                            )}

                                            <div className="flex flex-wrap gap-2">
                                              <Link
                                                href={detailHref}
                                                className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
                                              >
                                                <BookOpen className="size-3.5" />
                                                Instrucción
                                              </Link>
                                              <Link
                                                href={detailHref}
                                                className="inline-flex items-center gap-1.5 rounded-md bg-[#22C4D3] px-3 py-1.5 text-xs font-medium text-[#080c16] hover:bg-[#1fb0be]"
                                              >
                                                <Wrench className="size-3.5" />
                                                Construir
                                              </Link>
                                              <Link
                                                href={`${detailHref}#estudiantes`}
                                                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-black hover:bg-emerald-400"
                                              >
                                                <Send className="size-3.5" />
                                                Entregar
                                              </Link>

                                              <button
                                                onClick={() => {
                                                  setActivityModalObjectiveId(
                                                    objective.id
                                                  );
                                                  setEditingActivityId(
                                                    activity.id
                                                  );
                                                  setActivityModalOpen(true);
                                                }}
                                                className="ml-auto text-xs text-white/50 hover:text-white"
                                              >
                                                Editar
                                              </button>
                                              <button
                                                onClick={() =>
                                                  handleDeleteActivity(
                                                    objective.id,
                                                    activity.id
                                                  )
                                                }
                                                className="text-xs text-white/50 hover:text-red-400"
                                              >
                                                Eliminar
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Recursos */}
            {activeTab === 'recursos' && (
              <div className="rounded-2xl border border-[#22C4D3]/20 bg-[#061c37] p-8 text-center text-white/50">
                Los recursos del proyecto estarán disponibles pronto.
              </div>
            )}

            {/* Foro */}
            {activeTab === 'foro' && (
              <div className="rounded-2xl border border-[#22C4D3]/20 bg-[#061c37] p-8 text-center text-white/50">
                El foro de este proyecto estará disponible pronto.
              </div>
            )}
          </div>
        </div>

        {/* Portada fija (sticky) mientras se hace scroll por el contenido */}
        <div className="hidden lg:block">
          <div className="sticky top-6 flex flex-col space-y-6 self-start">
            {renderCoverMediaAndActions()}
          </div>
        </div>
      </div>

      <ModalGuidedProjectForm
        open={editProjectOpen}
        onOpenChange={setEditProjectOpen}
        projectId={project.id}
        onSuccess={() => router.refresh()}
      />

      <ModalFormGuidedObjective
        open={sessionModalOpen}
        onOpenChange={setSessionModalOpen}
        projectId={project.id}
        objectiveId={editingObjectiveId}
        orderIndex={objectives.length}
        onSuccess={() => router.refresh()}
      />

      {activityModalObjectiveId !== null && (
        <ModalFormGuidedActivity
          open={activityModalOpen}
          onOpenChange={setActivityModalOpen}
          projectId={project.id}
          objectiveId={activityModalObjectiveId}
          activityId={editingActivityId}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
