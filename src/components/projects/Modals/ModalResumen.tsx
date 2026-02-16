'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  Pencil,
  Plus,
  RefreshCw,
  Target,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import AddCustomSectionModal from '~/components/estudiantes/projects/AddCustomSectionModal';
import AddSectionDropdown from '~/components/estudiantes/projects/AddSectionDropdown';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/projects/ui/select';
import { useGenerateContent } from '~/hooks/useGenerateContent';
import { useProjectAutoSave } from '~/hooks/useProjectAutoSave';
import { ObjetivosInput, SpecificObjective } from '~/types/objectives';

import '~/styles/select-custom.css';
import '~/styles/ai-generate-loader.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const normalizeDateInput = (value?: string | null) => {
  if (!value) return '';
  const [datePart] = value.split(/[T ]/u);
  return datePart ?? '';
};

const parseDateInputToUTC = (value?: string) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
};

const formatDateInput = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDurationToDate = (
  startDate: string,
  amount: number,
  unit: 'dias' | 'semanas' | 'meses' | 'anos'
) => {
  const start = parseDateInputToUTC(startDate);
  if (!start || !Number.isFinite(amount) || amount < 1) return '';

  const end = new Date(start);
  if (unit === 'dias') {
    end.setUTCDate(end.getUTCDate() + amount - 1);
  } else if (unit === 'semanas') {
    end.setUTCDate(end.getUTCDate() + amount * 7 - 1);
  } else if (unit === 'meses') {
    end.setUTCMonth(end.getUTCMonth() + amount);
    end.setUTCDate(end.getUTCDate() - 1);
  } else {
    end.setUTCFullYear(end.getUTCFullYear() + amount);
    end.setUTCDate(end.getUTCDate() - 1);
  }

  return formatDateInput(end);
};

const buildProjectContext = (title?: string, description?: string) => {
  const parts = [title, description]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  if (parts.length === 0) return null;
  return parts.join(' - ');
};

const normalizeRequirementLine = (line: string) => {
  let cleaned = line.trim();
  if (!cleaned) return '';
  // Remove common bullet characters
  cleaned = cleaned.replace(/^[-*•]+\s*/u, '');
  // Remove numeric list markers like "1.", "2)", "3 -"
  cleaned = cleaned.replace(/^\d+\s*[.)-]\s*/u, '');
  // Remove letter list markers only when followed by punctuation like "a." or "b)"
  cleaned = cleaned.replace(/^[a-zA-Z]\s*[.)-]\s*/u, '');
  cleaned = cleaned.trim();
  if (!cleaned) return '';
  const lower = cleaned.toLowerCase();
  if (lower === 'requisitos' || lower === 'requisito') return '';
  if (cleaned.endsWith(':')) return '';
  // Capitalize first letter
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return cleaned;
};

const dedupeRequirements = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

type ObjectivesParseOptions = {
  projectStart?: string;
  projectEnd?: string;
  durationEstimate?: number;
  durationUnit?: 'dias' | 'semanas' | 'meses' | 'anos';
};

const normalizeDateValue = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    const normalized = trimmed.replace(/\//gu, '-');
    const datePart = normalizeDateInput(normalized);
    if (datePart) return datePart;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return '';
    return formatDateInput(
      new Date(
        Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
      )
    );
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return formatDateInput(
      new Date(
        Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
      )
    );
  }
  return '';
};

const extractJsonPayload = (content: string) => {
  const trimmed = content.trim();
  if (!trimmed) return null;
  const withoutFence = trimmed
    .replace(/^```(?:json)?/iu, '')
    .replace(/```$/iu, '')
    .trim();
  const firstBrace = withoutFence.indexOf('{');
  const lastBrace = withoutFence.lastIndexOf('}');
  const firstBracket = withoutFence.indexOf('[');
  const lastBracket = withoutFence.lastIndexOf(']');
  let candidate = '';
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidate = withoutFence.slice(firstBrace, lastBrace + 1);
  } else if (firstBracket !== -1 && lastBracket > firstBracket) {
    candidate = withoutFence.slice(firstBracket, lastBracket + 1);
  } else if (withoutFence.startsWith('{') || withoutFence.startsWith('[')) {
    candidate = withoutFence;
  }
  if (!candidate) return null;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
};

const parseObjectivesFromJson = (
  payload: unknown
): SpecificObjective[] | null => {
  const pickString = (obj: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
  };

  const getArray = (obj: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
      const value = obj[key];
      if (Array.isArray(value)) return value;
    }
    return null;
  };

  const rawObjectives = Array.isArray(payload)
    ? payload
    : isRecord(payload)
      ? (payload.objetivos ??
        payload.objectives ??
        payload.objetivos_especificos ??
        payload.data ??
        payload.result)
      : null;

  if (!Array.isArray(rawObjectives)) return null;

  const objetivos = rawObjectives
    .map((obj, index) => {
      if (!isRecord(obj)) {
        if (typeof obj === 'string' && obj.trim()) {
          return {
            id: `${Date.now()}_${index}`,
            title: obj.trim(),
            activities: [],
          } as SpecificObjective;
        }
        return null;
      }
      const title = pickString(obj, [
        'title',
        'objetivo',
        'description',
        'name',
      ]);
      const rawActivities =
        getArray(obj, ['activities', 'actividades', 'tareas']) ?? [];
      const activities = rawActivities
        .map((act, actIndex) => {
          if (typeof act === 'string') {
            return { title: act.trim(), startDate: '', endDate: '' };
          }
          if (!isRecord(act)) return null;
          const actTitle = pickString(act, [
            'title',
            'actividad',
            'descripcion',
            'description',
            'name',
          ]);
          const startDate = normalizeDateValue(
            act.startDate ?? act.start_date ?? act.fecha_inicio ?? act.inicio
          );
          const endDate = normalizeDateValue(
            act.endDate ?? act.end_date ?? act.fecha_fin ?? act.fin
          );
          return {
            title: actTitle,
            startDate,
            endDate,
          };
        })
        .filter(
          (act): act is { title: string; startDate: string; endDate: string } =>
            Boolean(act && act.title.trim())
        );

      if (!title) return null;
      return {
        id: String(obj.id ?? `${Date.now()}_${index}`),
        title,
        activities,
      } as SpecificObjective;
    })
    .filter((obj): obj is SpecificObjective => Boolean(obj));

  return objetivos.length > 0 ? objetivos : null;
};

const applyFallbackDates = (
  objetivos: SpecificObjective[],
  options: ObjectivesParseOptions
) => {
  const hasAnyDates = objetivos.some((obj) =>
    obj.activities?.some((act) => act.startDate || act.endDate)
  );
  if (hasAnyDates) return objetivos;

  const start = options.projectStart ?? '';
  const end =
    options.projectEnd ??
    (start && options.durationEstimate
      ? addDurationToDate(
          start,
          options.durationEstimate,
          options.durationUnit ?? 'dias'
        )
      : '');
  if (!start || !end) return objetivos;

  const startDate = parseDateInputToUTC(start);
  const endDate = parseDateInputToUTC(end);
  if (!startDate || !endDate) return objetivos;

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays =
    Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;

  const flatActivities: Array<{
    objectiveIndex: number;
    activityIndex: number;
  }> = [];
  objetivos.forEach((obj, objIndex) => {
    obj.activities.forEach((_, actIndex) => {
      flatActivities.push({
        objectiveIndex: objIndex,
        activityIndex: actIndex,
      });
    });
  });

  if (flatActivities.length === 0 || totalDays <= 0) return objetivos;

  const cloned = objetivos.map((obj) => ({
    ...obj,
    activities: obj.activities.map((act) => ({ ...act })),
  }));

  if (totalDays < flatActivities.length) {
    flatActivities.forEach((ref, idx) => {
      const offset = Math.min(idx, totalDays - 1);
      const date = new Date(startDate);
      date.setUTCDate(date.getUTCDate() + offset);
      const safeDate = date > endDate ? endDate : date;
      const formatted = formatDateInput(safeDate);
      cloned[ref.objectiveIndex].activities[ref.activityIndex].startDate =
        formatted;
      cloned[ref.objectiveIndex].activities[ref.activityIndex].endDate =
        formatted;
    });
    return cloned;
  }

  const baseDays = Math.floor(totalDays / flatActivities.length);
  let remainder = totalDays % flatActivities.length;
  const cursor = new Date(startDate);

  flatActivities.forEach((ref) => {
    const span = Math.max(1, baseDays + (remainder > 0 ? 1 : 0));
    if (remainder > 0) remainder -= 1;

    const startValue = new Date(cursor);
    const endValue = new Date(cursor);
    endValue.setUTCDate(endValue.getUTCDate() + span - 1);

    const safeEnd = endValue > endDate ? endDate : endValue;
    cloned[ref.objectiveIndex].activities[ref.activityIndex].startDate =
      formatDateInput(startValue);
    cloned[ref.objectiveIndex].activities[ref.activityIndex].endDate =
      formatDateInput(safeEnd);

    cursor.setUTCDate(cursor.getUTCDate() + span);
  });

  return cloned;
};

const parseObjectivesWithActivities = (
  content: string,
  options: ObjectivesParseOptions = {}
): SpecificObjective[] => {
  const jsonPayload = extractJsonPayload(content);
  const jsonObjectives = jsonPayload
    ? parseObjectivesFromJson(jsonPayload)
    : null;
  if (jsonObjectives && jsonObjectives.length > 0) {
    return applyFallbackDates(jsonObjectives, options);
  }

  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const objetivos: SpecificObjective[] = [];
  let current: SpecificObjective | null = null;

  const finishCurrent = () => {
    if (!current) return;
    const title = current.title.trim();
    if (!title) {
      current = null;
      return;
    }
    const activities = current.activities.filter((act) => act.title.trim());
    objetivos.push({ ...current, title, activities });
    current = null;
  };

  for (const rawLine of lines) {
    const cleaned = rawLine.replace(/^[-*•]+\s*/u, '').trim();
    if (!cleaned) continue;
    const lower = cleaned.toLowerCase();
    if (lower === 'actividades' || lower === 'actividades:') continue;

    const activityMatch = cleaned.match(
      /^(?:actividad|act\.?|tarea)\s*[:\-]?\s*(.+)$/iu
    );
    if (activityMatch) {
      if (current) {
        current.activities.push({
          title: activityMatch[1].trim(),
          startDate: '',
          endDate: '',
        });
      }
      continue;
    }

    const objectiveMatch = cleaned.match(
      /^(?:objetivo\s*\d*|obj\.?\s*\d*|\d+)\s*[.)-]?\s*[:\-]?\s*(.+)$/iu
    );
    if (objectiveMatch) {
      finishCurrent();
      current = {
        id: `${Date.now()}_${objetivos.length}`,
        title: objectiveMatch[1].trim(),
        activities: [],
      };
      continue;
    }

    if (current) {
      current.activities.push({ title: cleaned, startDate: '', endDate: '' });
    }
  }

  finishCurrent();

  if (objetivos.length > 0) {
    return applyFallbackDates(objetivos, options);
  }

  const fallback = lines.map((line, index) => ({
    id: `${Date.now()}_${index}`,
    title: line,
    activities: [],
  }));

  return applyFallbackDates(fallback, options);
};

// Activity and SpecificObjective types are imported from src/types/objectives.ts

type UpdatedProjectData = Record<string, unknown>;
type Section = { name: string; content: string };

const areSectionsEqual = (
  a: Record<string, Section>,
  b: Record<string, Section>
) => {
  if (a === b) return true;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    const aSection = a[key];
    const bSection = b[key];
    if (!aSection || !bSection) return false;
    if (aSection.name !== bSection.name) return false;
    if (aSection.content !== bSection.content) return false;
  }
  return true;
};

interface ModalResumenProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
  titulo?: string;
  planteamiento?: string;
  justificacion?: string;
  objetivoGen?: string;
  objetivosEsp?: ObjetivosInput;
  categoriaId?: number;
  tipoProyecto?: string;
  projectId?: number;
  coverImageKey?: string;
  coverVideoKey?: string;
  onUpdateProject?: (updatedProject: UpdatedProjectData) => void;
  fechaInicio?: string;
  fechaFin?: string;
  tipoVisualizacion?: 'meses' | 'dias' | 'horas';
  actividades?: {
    descripcion: string;
    meses: number[];
    objetivoId?: string;
    responsibleUserId?: string;
    hoursPerDay?: number;
  }[];
  courseId?: number;
  onProjectCreated?: () => void;
  setObjetivosEsp: (value: ObjetivosInput) => void;
  setActividades: (value: string[]) => void;
  responsablesPorActividad?: Record<string, string>;
  horasPorActividad?: Record<string, number>;
  setHorasPorActividad?: (value: Record<string, number>) => void;
  horasPorDiaProyecto?: number;
  setHorasPorDiaProyecto?: (value: number) => void;
  tiempoEstimadoProyecto?: number;
  setTiempoEstimadoProyecto?: (value: number) => void;
  onAnterior?: (data?: {
    planteamiento?: string;
    justificacion?: string;
    objetivoGen?: string;
    objetivosEsp?: ObjetivosInput;
  }) => void;
  setPlanteamiento?: (value: string) => void;
  setJustificacion?: (value: string) => void;
  setObjetivoGen?: (value: string) => void;
  setObjetivosEspProp?: (value: ObjetivosInput) => void;
  cronograma?: unknown;
  addedSections?: Record<string, { name: string; content: string }>;
  onAddedSectionsChange?: (
    sections: Record<string, { name: string; content: string }>
  ) => void;
}

const steps = [
  {
    id: 1,
    title: 'Información Básica',
    description: 'Título y descripción del proyecto',
  },
  {
    id: 2,
    title: 'Problema',
    description: 'Define el problema a resolver',
  },
  {
    id: 3,
    title: 'Objetivo General',
    description: 'Define el objetivo principal',
  },
  {
    id: 4,
    title: 'Requisitos',
    description: 'Especifica los requisitos del proyecto',
  },
  { id: 5, title: 'Duración', description: 'Estima la duración del proyecto' },
  {
    id: 6,
    title: 'Objetivos y Actividades',
    description: 'Detalla objetivos específicos y actividades',
  },
  { id: 7, title: 'Cronograma', description: 'Planifica el cronograma' },
  {
    id: 8,
    title: 'Secciones Personalizadas',
    description: 'Agrega contenido personalizado',
  },
];

const ModalResumen: React.FC<ModalResumenProps> = ({
  isOpen,
  onClose,
  initialStep,
  titulo = '',
  planteamiento,
  justificacion,
  objetivoGen,
  objetivosEsp,
  categoriaId,
  tipoProyecto,
  projectId,
  coverImageKey,
  coverVideoKey,
  fechaInicio,
  fechaFin,
  tipoVisualizacion,
  onUpdateProject,
  actividades,
  courseId,
  onProjectCreated,
  addedSections = {},
  onAddedSectionsChange,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [timelineView, setTimelineView] = useState<
    'dias' | 'semanas' | 'meses'
  >('semanas');
  const [currentProjectId, setCurrentProjectId] = useState<number | undefined>(
    projectId
  );
  const [isProjectCreated, setIsProjectCreated] = useState(Boolean(projectId));
  const [localAddedSections, setLocalAddedSections] = useState(addedSections);
  const [showAddCustomSectionModal, setShowAddCustomSectionModal] =
    useState(false);
  const [isAddingCustomSection, setIsAddingCustomSection] = useState(false);
  const [pendingSection, setPendingSection] = useState<{
    id: string;
    name: string;
    isCustom: boolean;
  } | null>(null);
  const [isSavingSections, setIsSavingSections] = useState(false);
  const lastLoadedProjectId = useRef<number | undefined>(undefined);
  const hasInitializedRef = useRef(false); // Para evitar resetear currentStep en cada cambio de datos
  const activitiesDirtyRef = useRef(false);
  const hasEditedSectionsRef = useRef(false);
  const hadSectionsRef = useRef(false);
  const lastSectionsProjectIdRef = useRef<number | undefined>(undefined);
  const lastSectionsSaveIdRef = useRef(0);
  const [creationError, setCreationError] = useState<string | null>(null);
  const typingTimersRef = useRef<Record<string, number>>({});
  const typingTokensRef = useRef<Record<string, number>>({});

  const stopTyping = (key: string) => {
    const timer = typingTimersRef.current[key];
    if (typeof timer === 'number') {
      window.clearTimeout(timer);
      delete typingTimersRef.current[key];
    }
    typingTokensRef.current[key] = (typingTokensRef.current[key] ?? 0) + 1;
  };

  const shouldReduceMotion = () => {
    if (typeof window === 'undefined') return true;
    return (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  };

  const typeIntoField = (
    key: string,
    fullText: string,
    apply: (value: string) => void
  ) => {
    stopTyping(key);
    if (!fullText) {
      apply('');
      return;
    }
    if (shouldReduceMotion()) {
      apply(fullText);
      return;
    }

    const token = (typingTokensRef.current[key] ?? 0) + 1;
    typingTokensRef.current[key] = token;
    const total = fullText.length;
    const intervalMs = 12;
    const chunk = Math.max(1, Math.ceil(total / 180));
    let index = 0;

    const step = () => {
      if (typingTokensRef.current[key] !== token) return;
      index = Math.min(total, index + chunk);
      apply(fullText.slice(0, index));
      if (index < total) {
        typingTimersRef.current[key] = window.setTimeout(step, intervalMs);
      }
    };

    step();
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      onClose();
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('project-modal-open'));
    } else {
      window.dispatchEvent(new CustomEvent('project-modal-close'));
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    return () => {
      Object.values(typingTimersRef.current).forEach((timer) => {
        window.clearTimeout(timer);
      });
      typingTimersRef.current = {};
      typingTokensRef.current = {};
    };
  }, []);
  const normalizeInitialObjetivos = (src?: ObjetivosInput) => {
    if (!src) return [] as SpecificObjective[];
    if (Array.isArray(src) && src.length > 0 && typeof src[0] === 'string') {
      return (src as string[]).map((s, i) => ({
        id: `${Date.now()}_${i}`,
        title: s,
        activities: [],
      }));
    }
    return src as SpecificObjective[];
  };

  const [formData, setFormData] = useState({
    titulo,
    description: '', // Descripción general (generada por IA)
    planteamiento: planteamiento ?? '', // Problema a resolver
    requirements: [] as string[], // Requisitos
    justificacion: justificacion ?? '',
    objetivoGen: objetivoGen ?? '',
    objetivosEsp: normalizeInitialObjetivos(objetivosEsp),
    categoriaId,
    tipoProyecto: tipoProyecto ?? '',
    projectTypeId: undefined as number | undefined,
    isPublic: false,
    needsCollaborators: false,
    durationEstimate: 1 as number,
    durationUnit: 'dias' as 'dias' | 'semanas' | 'meses' | 'anos',
    fechaInicio: normalizeDateInput(fechaInicio),
    fechaFin: normalizeDateInput(fechaFin),
    multimedia: [] as Array<{
      name: string;
      url: string;
      type: string;
      key?: string;
    }>,
  });

  const modalMetrics = useMemo(() => {
    if (!isOpen || typeof window === 'undefined') {
      return { overlayHeight: 0, modalTop: 0 };
    }
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const height = Math.max(doc.scrollHeight, doc.clientHeight);
    const isSmallScreen = window.innerWidth < 640;
    const desiredTop = scrollTop + (isSmallScreen ? 20 : 80);
    const modalHeight = isSmallScreen
      ? Math.min(window.innerHeight * 0.82, height)
      : 650;
    const minTop = isSmallScreen ? 20 : 24;
    const maxTop = Math.max(minTop, height - modalHeight);
    return {
      overlayHeight: height,
      modalTop: Math.min(desiredTop, maxTop),
    };
  }, [isOpen]);

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

  const createCustomSectionId = (
    existing: Record<string, { name: string; content: string }>
  ) => {
    let newId = `custom-${Date.now()}`;
    while (existing[newId]) {
      newId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    }
    return newId;
  };

  const updateLocalSections = (
    next:
      | Record<string, { name: string; content: string }>
      | ((
          prev: Record<string, { name: string; content: string }>
        ) => Record<string, { name: string; content: string }>)
  ) => {
    const resolved =
      typeof next === 'function' ? next(localAddedSections) : next;
    setLocalAddedSections(resolved);
    onAddedSectionsChange?.(resolved);
    hasEditedSectionsRef.current = true;
  };

  const buildSectionContext = () => {
    const parts = [
      formData.titulo?.trim()
        ? `Título del proyecto: ${formData.titulo.trim()}`
        : '',
      formData.description?.trim()
        ? `Descripción del proyecto: ${formData.description.trim()}`
        : '',
      formData.planteamiento?.trim()
        ? `Problema: ${formData.planteamiento.trim()}`
        : '',
      formData.justificacion?.trim()
        ? `Justificación: ${formData.justificacion.trim()}`
        : '',
      formData.objetivoGen?.trim()
        ? `Objetivo general: ${formData.objetivoGen.trim()}`
        : '',
      formData.requirements?.length
        ? `Requisitos: ${formData.requirements.join(', ')}`
        : '',
    ].filter(Boolean);

    const extraSections = Object.entries(localAddedSections)
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
  };

  const handleAddSectionFromModal = (sectionId: string, isCustom?: boolean) => {
    if (isCustom) {
      setPendingSection({ id: 'custom', name: '', isCustom: true });
      setShowAddCustomSectionModal(true);
      return;
    }

    if (localAddedSections[sectionId]) return;

    setPendingSection({
      id: sectionId,
      name: getSectionLabel(sectionId),
      isCustom: false,
    });
    setShowAddCustomSectionModal(true);
  };

  const handleAddCustomSectionFromModal = (
    name: string,
    description: string
  ) => {
    setIsAddingCustomSection(true);
    const sectionId = pendingSection?.isCustom
      ? createCustomSectionId(localAddedSections)
      : (pendingSection?.id ?? createCustomSectionId(localAddedSections));
    const sectionName = pendingSection?.isCustom
      ? name
      : (pendingSection?.name ?? name);
    updateLocalSections({
      ...localAddedSections,
      [sectionId]: {
        name: sectionName,
        content: description,
      },
    });
    setShowAddCustomSectionModal(false);
    setPendingSection(null);
    setIsAddingCustomSection(false);
  };

  const handleGenerateSectionDescription = async (
    currentText: string,
    sectionTitleOverride: string
  ) => {
    if (!pendingSection) return null;
    const sectionTitle =
      sectionTitleOverride.trim() || pendingSection.name || 'Sección';
    const context = buildSectionContext();
    const basePrompt = currentText.trim()
      ? `Mejora y reescribe el contenido de la sección "${sectionTitle}" manteniendo el significado.`
      : `Genera el contenido para la sección "${sectionTitle}" de un proyecto educativo.`;
    const prompt = `${basePrompt}\n\nContexto del proyecto:\n${context}\n\nResponde solo con el contenido de la sección.`;

    const result = await generateContent({
      type: 'descripcion',
      prompt,
      titulo: formData.titulo ?? '',
      descripcion: formData.description ?? '',
      existingText: currentText,
      sectionTitle,
      sectionsContext: context,
    });

    return result;
  };

  const renderSectionCard = (sectionId: string, section: Section) => (
    <div
      key={sectionId}
      className="rounded-lg border border-border/50 bg-card/30 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex-1">
          <input
            type="text"
            value={section.name}
            onChange={(e) => {
              updateLocalSections({
                ...localAddedSections,
                [sectionId]: {
                  ...section,
                  name: e.target.value,
                },
              });
            }}
            className="mb-2 flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm font-semibold ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Nombre de la sección"
          />
          <div className="text-xs text-muted-foreground">
            Se guarda automáticamente mientras escribes
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const next = { ...localAddedSections };
            delete next[sectionId];
            updateLocalSections(next);
          }}
          className="ml-2 inline-flex h-8 w-8 items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          title="Eliminar sección"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <textarea
        className="flex min-h-[120px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        placeholder={`Contenido de ${section.name}...`}
        value={section.content}
        onChange={(e) => {
          updateLocalSections({
            ...localAddedSections,
            [sectionId]: {
              ...section,
              content: e.target.value,
            },
          });
        }}
      />
    </div>
  );

  // Cargar tipos de proyecto desde el backend
  const { data: _projectTypes = [] } = useSWR<
    Array<{
      id: number;
      name: string;
      description?: string | null;
      icon?: string | null;
    }>
  >('/api/project-types', fetcher);

  // Cargar categorías desde el backend
  const { data: categories = [] } = useSWR<
    Array<{ id: number; name: string; description?: string | null }>
  >('/api/categories', fetcher);

  // Cargar datos del proyecto cuando existe un projectId
  const { data: existingProject } = useSWR(
    projectId ? `/api/projects/${projectId}?details=true` : null,
    fetcher
  );

  // Hook para generar contenido con IA
  const {
    generateContent,
    isGenerating,
    error: generationError,
    clearError,
  } = useGenerateContent();
  const [activeGenerateKey, setActiveGenerateKey] = useState<string | null>(
    null
  );
  const isGeneratingFor = (key: string) =>
    isGenerating && activeGenerateKey === key;
  const runGenerate = async (key: string, action: () => Promise<void>) => {
    setActiveGenerateKey(key);
    try {
      await action();
    } finally {
      setActiveGenerateKey(null);
    }
  };
  // IMPORTANTE: Todos los hooks DEBEN estar antes del return condicional
  // para cumplir con las Reglas de los Hooks de React
  const { trigger: createProject, isMutating: isCreatingProject } =
    useSWRMutation(
      '/api/projects?draft=true',
      async (
        url: string,
        { arg }: { arg: Record<string, unknown> }
      ): Promise<{ id?: number }> => {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(arg),
        });
        if (!res.ok) {
          throw new Error('Error al crear el proyecto');
        }
        return (await res.json()) as { id?: number };
      }
    );

  // Hook de auto-guardado
  const { saveProject, isSaving } = useProjectAutoSave({
    projectId: currentProjectId,
    enabled: isProjectCreated && Boolean(currentProjectId),
    debounceMs: 2000,
  });
  const isAutoSaving = isSaving || isSavingSections;

  // Auto-guardar cuando cambian los datos (después de que el proyecto fue creado)
  // Incluye todos los campos de info básica: título, descripción, categoría, tipo de proyecto, etc.
  useEffect(() => {
    if (!isProjectCreated || !currentProjectId) return;

    const objetivosPayload = formData.objetivosEsp
      .filter((obj) => obj.title.trim() !== '')
      .map((obj) => ({ id: obj.id, title: obj.title.trim() }));

    const actividadesPayload = formData.objetivosEsp.flatMap((obj, objIndex) =>
      obj.activities
        .filter((act) => act.title.trim() !== '')
        .map((act) => ({
          descripcion: act.title.trim(),
          meses: [],
          objetivoId: obj.id,
          objetivoIndex: objIndex,
          startDate: act.startDate || null,
          endDate: act.endDate || null,
        }))
    );

    const descriptionTrimmed = (formData.description ?? '').trim();

    const serverDescription =
      typeof (existingProject as Record<string, unknown>)?.description ===
      'string'
        ? String((existingProject as Record<string, unknown>).description)
        : '';

    const shouldOmitDescription =
      descriptionTrimmed === '' &&
      existingProject &&
      serverDescription.trim() !== '';

    const dataToSave = {
      // Campos de info básica (sección 1)
      // Nota: omitimos `description` si está vacío en el formulario pero
      // el servidor ya tiene una descripción no vacía para evitar sobrescribirla
      name: formData.titulo.trim(),
      ...(shouldOmitDescription ? {} : { description: descriptionTrimmed }),
      categoryId: formData.categoriaId,
      type_project: formData.tipoProyecto.trim(),
      isPublic: formData.isPublic,
      needsCollaborators: formData.needsCollaborators,
      // Campos de otras secciones - siempre enviar el valor para que se guarde aunque esté vacío
      planteamiento: (formData.planteamiento ?? '').trim(),
      justificacion: (formData.justificacion ?? '').trim(),
      objetivo_general: (formData.objetivoGen ?? '').trim(),
      requirements: JSON.stringify(formData.requirements),
      durationEstimate: formData.durationEstimate,
      durationUnit: formData.durationUnit,
      fechaInicio: formData.fechaInicio || undefined,
      fechaFin: formData.fechaFin || undefined,
      ...(activitiesDirtyRef.current
        ? {
            objetivos_especificos: objetivosPayload,
            actividades: actividadesPayload,
          }
        : {}),
    };

    saveProject(dataToSave);
    onUpdateProject?.(dataToSave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Campos de info básica
    formData.titulo,
    formData.description,
    formData.categoriaId,
    formData.tipoProyecto,
    formData.isPublic,
    formData.needsCollaborators,
    // Campos de otras secciones
    formData.planteamiento,
    formData.justificacion,
    formData.objetivoGen,
    formData.requirements,
    formData.durationEstimate,
    formData.durationUnit,
    formData.fechaInicio,
    formData.fechaFin,
    formData.objetivosEsp,
    isProjectCreated,
    currentProjectId,
  ]);

  // Auto-save para secciones agregadas (debounce 1.2s)
  useEffect(() => {
    if (!isOpen || !isProjectCreated || !currentProjectId) return;
    if (!hasEditedSectionsRef.current) return;
    if (
      Object.keys(localAddedSections).length === 0 &&
      !hadSectionsRef.current
    ) {
      return;
    }

    const timer = setTimeout(async () => {
      const saveId = lastSectionsSaveIdRef.current + 1;
      lastSectionsSaveIdRef.current = saveId;
      setIsSavingSections(true);
      try {
        console.log(
          `💾 Modal: Auto-guardando ${Object.keys(localAddedSections).length} secciones`
        );
        const response = await fetch('/api/project-sections-save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: currentProjectId,
            sections: localAddedSections,
          }),
        });

        if (response.ok) {
          console.log(`✅ Modal: Secciones auto-guardadas correctamente`);
        } else {
          const error = await response.json();
          console.error(`❌ Modal: Error al auto-guardar:`, error);
        }
      } catch (error) {
        console.error('❌ Modal: Error al auto-guardar secciones:', error);
      } finally {
        if (lastSectionsSaveIdRef.current === saveId) {
          setIsSavingSections(false);
        }
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isOpen, isProjectCreated, currentProjectId, localAddedSections]);

  useEffect(() => {
    if (!isOpen) {
      hasEditedSectionsRef.current = false;
      hadSectionsRef.current = false;
      lastSectionsProjectIdRef.current = undefined;
      setIsSavingSections(false);
      if (!areSectionsEqual(localAddedSections, addedSections)) {
        setLocalAddedSections(addedSections);
      }
      return;
    }

    const shouldSync =
      lastSectionsProjectIdRef.current !== projectId ||
      !hasEditedSectionsRef.current;

    if (shouldSync) {
      if (!areSectionsEqual(localAddedSections, addedSections)) {
        setLocalAddedSections(addedSections);
      }
      hadSectionsRef.current = Object.keys(addedSections).length > 0;
      lastSectionsProjectIdRef.current = projectId;
    }
  }, [isOpen, projectId, addedSections, localAddedSections]);

  useEffect(() => {
    if (Object.keys(localAddedSections).length > 0) {
      hadSectionsRef.current = true;
    }
  }, [localAddedSections]);

  // Sincronizar estado SOLO cuando se abre el modal por primera vez
  useEffect(() => {
    if (!isOpen) {
      // Cuando el modal se cierra, resetear la bandera para la próxima apertura
      hasInitializedRef.current = false;
      return;
    }

    // Solo resetear currentStep en la primera apertura del modal
    // No cuando existingProject cambia por auto-guardado
    const shouldResetStep = !hasInitializedRef.current;

    // Solo resetear al abrir el modal, no cuando cambian los valores internos
    const timer = setTimeout(() => {
      // Cambiar el paso solo la primera vez que se abre el modal
      if (shouldResetStep) {
        setCurrentStep(initialStep ?? 1);
        hasInitializedRef.current = true;
      }
      setCurrentProjectId(projectId);
      setIsProjectCreated(Boolean(projectId));

      // Si existe un proyecto cargado, usar sus datos; sino, usar los props
      // IMPORTANTE: Solo sincronizar si es la primera carga (no cuando el usuario está editando)
      const dataToSet = existingProject || {
        name: titulo,
        planteamiento,
        justificacion,
        objetivo_general: objetivoGen,
        objetivos_especificos: objetivosEsp,
        category_id: categoriaId,
        type_project: tipoProyecto,
      };

      const parsedRequirements = (() => {
        if (typeof dataToSet?.requirements !== 'string') return undefined;
        try {
          const parsed = JSON.parse(dataToSet.requirements) as unknown;
          if (Array.isArray(parsed)) {
            return parsed.filter(
              (item): item is string => typeof item === 'string'
            );
          }
        } catch {
          return undefined;
        }
        return undefined;
      })();

      const parsedObjectives = (() => {
        const objetivos = (dataToSet as { objetivos_especificos?: unknown })
          ?.objetivos_especificos;
        if (!Array.isArray(objetivos)) return undefined;
        return objetivos
          .map((obj, idx) => {
            if (!obj || typeof obj !== 'object') return null;
            const objective = obj as {
              id?: number | string;
              description?: string;
              title?: string;
              actividades?: {
                descripcion?: string;
                startDate?: string;
                endDate?: string;
              }[];
            };
            const title =
              typeof objective.title === 'string'
                ? objective.title
                : typeof objective.description === 'string'
                  ? objective.description
                  : '';
            const activities = Array.isArray(objective.actividades)
              ? objective.actividades.map((act) => ({
                  title: act.descripcion ?? '',
                  startDate: normalizeDateInput(act.startDate),
                  endDate: normalizeDateInput(act.endDate),
                }))
              : [];
            return {
              id: String(objective.id ?? idx),
              title,
              activities,
            } as SpecificObjective;
          })
          .filter((obj): obj is SpecificObjective => !!obj);
      })();

      setFormData((prevData) => {
        const shouldSync = lastLoadedProjectId.current !== projectId;
        const hasServerData = Boolean(existingProject);
        const needsRequirementsHydration =
          prevData.requirements.length === 0 &&
          (parsedRequirements?.length ?? 0) > 0;
        const needsObjectivesHydration =
          prevData.objetivosEsp.length === 0 &&
          (parsedObjectives?.length ?? 0) > 0;
        const needsDatesHydration =
          (parsedObjectives?.length ?? 0) > 0 &&
          prevData.objetivosEsp.some((obj, objIndex) =>
            obj.activities?.some((act, actIndex) => {
              const parsedAct =
                parsedObjectives?.[objIndex]?.activities?.[actIndex];
              if (!parsedAct) return false;
              return (
                (!act.startDate && !!parsedAct.startDate) ||
                (!act.endDate && !!parsedAct.endDate)
              );
            })
          );

        // Si ya hay datos en el formulario y aún no se han guardado cambios,
        // no sobrescribir con datos del servidor (para evitar perder ediciones)
        // Solo sincronizar si estamos cargando un proyecto nuevo o llegó data del servidor
        if (
          shouldSync ||
          (hasServerData &&
            (needsRequirementsHydration ||
              needsObjectivesHydration ||
              needsDatesHydration)) ||
          (prevData.titulo === '' && prevData.planteamiento === '')
        ) {
          lastLoadedProjectId.current = projectId;
          // Primera carga: sincronizar con los datos del servidor
          return {
            ...prevData,
            titulo: dataToSet.name || titulo,
            description:
              (dataToSet as { description?: string | null })?.description ??
              prevData.description,
            planteamiento: dataToSet.planteamiento || planteamiento,
            justificacion: dataToSet.justificacion || justificacion,
            objetivoGen: dataToSet.objetivo_general || objetivoGen,
            objetivosEsp:
              (parsedObjectives ?? dataToSet.objetivos_especificos) ||
              objetivosEsp,
            categoriaId: dataToSet.category_id ?? categoriaId ?? undefined,
            tipoProyecto: dataToSet.type_project ?? tipoProyecto ?? '',
            requirements: parsedRequirements ?? prevData.requirements,
            durationEstimate:
              typeof dataToSet.tiempo_estimado === 'number'
                ? dataToSet.tiempo_estimado
                : typeof dataToSet.durationEstimate === 'number'
                  ? dataToSet.durationEstimate
                  : prevData.durationEstimate,
            durationUnit:
              (dataToSet.duration_unit ??
                dataToSet.durationUnit ??
                prevData.durationUnit) ||
              prevData.durationUnit,
            fechaInicio:
              normalizeDateInput(
                (dataToSet as { fecha_inicio?: string | null })?.fecha_inicio
              ) || prevData.fechaInicio,
            fechaFin:
              normalizeDateInput(
                (dataToSet as { fecha_fin?: string | null })?.fecha_fin
              ) || prevData.fechaFin,
          };
        }
        // Si hay datos en el formulario, mantener los que está editando el usuario
        return prevData;
      });
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, projectId, initialStep, existingProject]);

  useEffect(() => {
    if (!isOpen) {
      lastLoadedProjectId.current = undefined;
    }
  }, [isOpen]);

  useEffect(() => {
    setIsProjectCreated(Boolean(currentProjectId));
  }, [currentProjectId]);

  // Funciones para generar contenido con IA
  const _handleGenerateTitulo = async () => {
    if (!(formData.planteamiento ?? '').trim()) {
      alert('Por favor completa la descripción primero para generar un título');
      return;
    }

    const content = await generateContent({
      type: 'titulo',
      prompt: `Eres un experto en educación. Genera un título académico y profesional para un proyecto educativo basado en esta descripción: "${formData.planteamiento}". El título debe ser claro, conciso y reflejar el tema principal. Solo responde con el título, sin comillas ni explicaciones.`,
    });

    if (content) {
      setFormData((prev) => ({ ...prev, titulo: content }));
    }
  };

  const handleRegenerateTitulo = async () => {
    if (!formData.titulo.trim()) {
      alert('Por favor escribe un título primero para regenerar variaciones');
      return;
    }

    await runGenerate('titulo', async () => {
      const content = await generateContent({
        type: 'titulo',
        prompt: `Basándote en este título: "${formData.titulo}", genera un título alternativo SOBRE EL MISMO TEMA pero redactado de forma más profesional, clara y atractiva. Mantén el tema principal y el contexto. Solo responde con el título mejorado, sin comillas ni explicaciones.`,
        existingText: formData.titulo,
        titulo: formData.titulo,
      });

      if (content) {
        setFormData((prev) => ({ ...prev, titulo: content }));
      }
    });
  };

  const handleGenerateDescripcion = async () => {
    if (!formData.titulo.trim()) {
      alert(
        'Por favor completa el título primero para generar una descripción'
      );
      return;
    }

    const content = await generateContent({
      type: 'descripcion',
      prompt: `Genera una descripción BREVE (120-150 palabras, un párrafo) para un proyecto estudiantil con el título: "${formData.titulo}". Describe desde la perspectiva del ESTUDIANTE: qué problema va a resolver, qué va a crear/desarrollar, qué habilidades aplicará, y quién se beneficiará. Usa lenguaje directo y motivador. Solo responde con la descripción, sin títulos.`,
      existingText: formData.description,
      titulo: formData.titulo,
      descripcion: formData.description,
    });

    if (content) {
      typeIntoField('description', content, (value) => {
        setFormData((prev) => ({ ...prev, description: value }));
      });
    }
  };

  const _handleGenerateJustificacion = async () => {
    if (!(formData.planteamiento ?? '').trim() && !formData.titulo.trim()) {
      alert('Por favor completa el título o descripción primero');
      return;
    }

    const prompt = `${formData.titulo} ${formData.planteamiento}`.trim();
    const content = await generateContent({
      type: 'justificacion',
      prompt,
      existingText: formData.justificacion,
      titulo: formData.titulo,
      descripcion: formData.description,
    });

    if (content) {
      typeIntoField('justificacion', content, (value) => {
        setFormData((prev) => ({ ...prev, justificacion: value }));
      });
    }
  };

  const _handleGenerateObjetivoGen = async () => {
    if (!(formData.planteamiento ?? '').trim() && !formData.titulo.trim()) {
      alert('Por favor completa el título o descripción primero');
      return;
    }

    const prompt = `${formData.titulo} ${formData.planteamiento}`.trim();
    const content = await generateContent({
      type: 'objetivoGen',
      prompt,
      existingText: formData.objetivoGen,
      titulo: formData.titulo,
      descripcion: formData.description,
    });

    if (content) {
      typeIntoField('objetivoGen', content, (value) => {
        setFormData((prev) => ({ ...prev, objetivoGen: value }));
      });
    }
  };

  // Manejar carga de multimedia a S3
  const handleMultimediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;

    try {
      for (const file of Array.from(files)) {
        // Validar tipo de archivo
        if (!file.type.startsWith('image') && !file.type.startsWith('video')) {
          alert('Solo se permiten imágenes y videos');
          continue;
        }

        // Crear FormData para presigned post
        const uploadRequest = {
          contentType: file.type,
          fileSize: file.size,
          fileName: file.name,
        };

        // Obtener presigned post del servidor
        const presignedResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(uploadRequest),
        });

        if (!presignedResponse.ok) {
          throw new Error('Error al obtener presigned post');
        }

        const presignedData = (await presignedResponse.json()) as {
          url: string;
          fields: Record<string, string>;
          key: string;
        };

        // Crear FormData con los datos de presigned post
        const formDataS3 = new FormData();
        Object.entries(presignedData.fields).forEach(([key, value]) => {
          formDataS3.append(key, value as string);
        });
        formDataS3.append('file', file);

        // Subir a S3 usando presigned post
        const s3Response = await fetch(presignedData.url, {
          method: 'POST',
          body: formDataS3,
        });

        if (!s3Response.ok) {
          throw new Error('Error al subir archivo a S3');
        }

        // Agregar archivo a la lista de multimedia
        const s3Url = `${presignedData.url}${presignedData.key}`;
        setFormData((prev) => ({
          ...prev,
          multimedia: [
            ...prev.multimedia,
            {
              name: file.name,
              url: s3Url,
              type: file.type,
              key: presignedData.key,
            },
          ],
        }));
      }
    } catch (error) {
      console.error('Error al subir multimedia:', error);
      alert('Error al subir los archivos. Intenta de nuevo.');
    }

    // Limpiar input
    e.target.value = '';
  };

  // Eliminar multimedia
  const handleRemoveMultimedia = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      multimedia: prev.multimedia.filter((_, i) => i !== index),
    }));
  };

  // Return condicional DESPUÉS de todos los hooks
  if (!isOpen) return null;

  const progress = (currentStep / steps.length) * 100;
  const normalizedTipoVisualizacion =
    tipoVisualizacion === 'horas' ? 'dias' : tipoVisualizacion;
  const selectedCategoryId =
    typeof formData.categoriaId === 'number'
      ? formData.categoriaId
      : typeof categoriaId === 'number'
        ? categoriaId
        : undefined;
  const selectedProjectType =
    formData.tipoProyecto?.trim() || tipoProyecto?.trim() || '';

  const handleNext = () => {
    if (isAutoSaving) return;
    if (currentStep < steps.length) {
      if (!isProjectCreated && currentStep === 1) return;
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (isAutoSaving) return;
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateProject = async () => {
    const title = formData.titulo.trim();
    const description = formData.description.trim();
    if (
      !title ||
      !description ||
      selectedCategoryId == null ||
      !selectedProjectType
    ) {
      setCreationError(
        'Completa título, descripción, categoría y tipo de proyecto para continuar.'
      );
      return;
    }

    setCreationError(null);

    try {
      const objetivosPayload = formData.objetivosEsp
        .filter((obj) => obj.title.trim() !== '')
        .map((obj) => ({ id: obj.id, title: obj.title.trim() }));

      const actividadesPayload = formData.objetivosEsp.flatMap(
        (obj, objIndex) =>
          obj.activities
            .filter((act) => act.title.trim() !== '')
            .map((act) => ({
              descripcion: act.title.trim(),
              meses: [],
              objetivoId: obj.id,
              objetivoIndex: objIndex,
              startDate: act.startDate || null,
              endDate: act.endDate || null,
            }))
      );

      const payload = {
        name: title,
        description: description, // Descripción general
        planteamiento: '', // Inicialmente vacío, se llena en paso 2
        requirements: JSON.stringify(formData.requirements), // Requisitos como JSON
        justificacion: formData.justificacion?.trim() ?? '',
        objetivo_general: formData.objetivoGen?.trim() ?? '',
        objetivos_especificos: objetivosPayload,
        actividades: actividadesPayload,
        type_project: selectedProjectType,
        projectTypeId: formData.projectTypeId,
        categoryId: selectedCategoryId,
        courseId: courseId,
        isPublic: formData.isPublic ?? false,
        needsCollaborators: formData.needsCollaborators ?? false,
        tipoVisualizacion: normalizedTipoVisualizacion,
        durationEstimate: formData.durationEstimate,
        durationUnit: formData.durationUnit,
        fechaInicio,
        fechaFin,
        multimedia: JSON.stringify(
          formData.multimedia.map((m) => ({
            name: m.name,
            url: m.url,
            type: m.type,
            key: m.key,
          }))
        ),
      };

      console.log('🟢 Enviando proyecto:', payload);
      const result = await createProject(payload);
      console.log('🟢 Respuesta del backend:', result);

      const createdId =
        typeof result?.id === 'number'
          ? result.id
          : Number((result as Record<string, unknown>)?.id) || undefined;

      console.log('🟢 ID extraído:', createdId);

      if (!createdId) {
        setCreationError(
          'Proyecto guardado pero no se recibió el ID. Recarga la página.'
        );
        return;
      }

      // Marcar como creado ANTES de cambiar de paso
      setCurrentProjectId(createdId);
      setIsProjectCreated(true);

      // Mantener los valores del formulario
      setFormData((prev) => ({
        ...prev,
        titulo: title,
        description: description,
        categoriaId: selectedCategoryId,
        tipoProyecto: selectedProjectType,
      }));

      // Avanzar al siguiente paso
      setCurrentStep(2);

      // Notificar al componente padre
      if (onProjectCreated) {
        onProjectCreated();
      }
    } catch (error) {
      console.error('❌ Error al crear el proyecto:', error);
      setCreationError('No se pudo crear el proyecto. Inténtalo nuevamente.');
    }
  };

  const isCreateStep = currentStep === 1 && !isProjectCreated;
  const isCreateReady =
    !!formData.titulo.trim() &&
    !!formData.description.trim() &&
    selectedCategoryId != null &&
    selectedProjectType.length > 0;
  const nextDisabled = isCreateStep
    ? isCreatingProject || !isCreateReady
    : currentStep === steps.length;

  const parseTimelineDate = (value?: string) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map((part) => Number(part));
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
    const objetivos = Array.isArray(formData.objetivosEsp)
      ? formData.objetivosEsp
      : [];

    const rows = objetivos.flatMap((objective, objIndex) => {
      const activities = Array.isArray(objective.activities)
        ? objective.activities
        : [];
      return activities.map((activity, actIndex) => {
        const activityId =
          existingProject?.objetivos_especificos?.[objIndex]?.actividades?.[
            actIndex
          ]?.id;
        const deliverableUrl =
          existingProject?.objetivos_especificos?.[objIndex]?.actividades?.[
            actIndex
          ]?.deliverableUrl ?? null;
        const startDate = parseTimelineDate(activity.startDate);
        const endDate = parseTimelineDate(activity.endDate);
        return {
          id: activityId,
          key: `${objIndex + 1}.${actIndex + 1}`,
          title: activity.title || 'Actividad sin título',
          startDate,
          endDate,
          deliverableUrl,
        };
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

  // Handler unificado para el botón principal
  const handleMainButtonClick = async () => {
    if (isAutoSaving) return;
    if (isCreateStep) {
      await handleCreateProject();
    } else {
      handleNext();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="mb-4 rounded-[16px] border border-[#22c4d34d] bg-[#22c4d31a] from-accent/10 via-primary/10 to-accent/10 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#22c4d333]">
                  <FaWandMagicSparkles className="h-5 w-5 text-[#22c4d3]" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      Asistente de IA
                    </h4>
                    <div className="inline-flex items-center rounded-full border border-[#22c4d34d] bg-[#22c4d333] px-2.5 py-0.5 text-xs font-semibold text-accent transition-colors hover:bg-primary/80 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none">
                      Nuevo
                    </div>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Deja que la IA genere una descripción completa basándose en
                    tu título manual. Puedes editar el resultado después.
                  </p>
                  <button
                    onClick={() =>
                      runGenerate('descripcion-card', handleGenerateDescripcion)
                    }
                    disabled={isGenerating}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-[14px] border border-[#22c4d3]/30 bg-[#22c4d3]/10 px-3 text-sm font-medium whitespace-nowrap text-accent ring-offset-background transition-colors hover:bg-[#22c4d3]/20 hover:text-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                  >
                    {isGeneratingFor('descripcion-card') ? (
                      <span className="ai-generate-loader" aria-hidden />
                    ) : (
                      <FaWandMagicSparkles className="mr-2 h-4 w-4" />
                    )}
                    <span
                      className={
                        isGeneratingFor('descripcion-card')
                          ? 'ai-generate-text-pulse'
                          : ''
                      }
                    >
                      {isGeneratingFor('descripcion-card')
                        ? 'Generando...'
                        : formData.description.trim()
                          ? 'Regenerar con IA'
                          : 'Generar con IA'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label
                className="mb-2 block text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="title"
              >
                Título del proyecto *
              </label>
              <div className="flex gap-2">
                <input
                  className="flex h-10 w-full flex-1 rounded-md border border-input bg-background/50 px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  id="title"
                  placeholder="Ej: Landing Page Responsiva"
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                />
                <button
                  onClick={handleRegenerateTitulo}
                  disabled={isGenerating || !formData.titulo.trim()}
                  type="button"
                  title="Generar títulos alternativos con IA basados en tu título"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-md border border-accent/30 bg-accent/10 text-sm font-medium whitespace-nowrap text-accent ring-offset-background transition-colors hover:bg-accent/20 hover:text-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                >
                  {isGeneratingFor('titulo') ? (
                    <RefreshCw className="h-4 w-4 animate-spin transition-transform" />
                  ) : (
                    <Pencil className="h-4 w-4 transition-transform" />
                  )}
                </button>
              </div>
              <div className="mt-2 flex items-start gap-2 rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">
                <Pencil className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>
                  Escribe tu título manualmente. Usa el botón 🔄 para generar
                  títulos alternativos sobre el mismo tema.
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor="description"
                >
                  Descripción *
                </label>
                <button
                  type="button"
                  onClick={() =>
                    runGenerate('descripcion-field', handleGenerateDescripcion)
                  }
                  disabled={!formData.titulo.trim()}
                  className="inline-flex h-7 items-center justify-center gap-2 rounded-md px-3 text-xs font-medium whitespace-nowrap text-primary ring-offset-background transition-colors hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                >
                  {isGeneratingFor('descripcion-field') ? (
                    <span className="ai-generate-loader" aria-hidden />
                  ) : (
                    <FaWandMagicSparkles className="h-3 w-3" />
                  )}
                  <span
                    className={
                      isGeneratingFor('descripcion-field')
                        ? 'ai-generate-text-pulse'
                        : ''
                    }
                  >
                    {formData.description.trim()
                      ? 'Regenerar con IA'
                      : 'Generar con IA'}
                  </span>
                </button>
              </div>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                id="description"
                placeholder="Escribe una idea básica y Artie te ayudará a completarla. Ej: Quiero crear una app para gestionar tareas..."
                value={formData.description}
                onChange={(e) => {
                  stopTyping('description');
                  setFormData({ ...formData, description: e.target.value });
                }}
              />
              {generationError && (
                <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">Error:</span>
                    <span>{generationError}</span>
                    <button
                      onClick={clearError}
                      className="ml-auto text-destructive hover:text-destructive/80"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
            {isCreateStep && creationError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {creationError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor="category"
                >
                  Categoría del Proyecto
                </label>
                <div className="mt-3">
                  <Select
                    value={(formData.categoriaId ?? '').toString()}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        categoriaId: value ? Number(value) : undefined,
                      });
                    }}
                  >
                    <SelectTrigger
                      id="category"
                      className="h-12 w-full text-base font-medium"
                    >
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent
                      className="mt-2 border-0 bg-[#061c3780]"
                      position="popper"
                    >
                      {categories.map((cat: { id: number; name: string }) => (
                        <SelectItem
                          key={cat.id}
                          value={cat.id.toString()}
                          className="cursor-pointer px-4 py-2 text-base text-white hover:bg-[#22c4d3] hover:text-black"
                        >
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor="projectType"
                >
                  Tipo de proyecto
                </label>
                <div className="mt-3">
                  <Select
                    value={formData.tipoProyecto}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        tipoProyecto: value,
                      })
                    }
                  >
                    <SelectTrigger
                      id="projectType"
                      className="h-12 w-full text-base font-medium"
                    >
                      <SelectValue placeholder="Seleccione un tipo de proyecto" />
                    </SelectTrigger>
                    <SelectContent
                      className="mt-2 border-0 bg-[#061c3780]"
                      position="popper"
                    >
                      <SelectItem
                        value="AI-Assistant"
                        className="cursor-pointer px-4 py-2 text-base text-white hover:bg-[#22c4d3] hover:text-black"
                      >
                        AI-Assistant
                      </SelectItem>
                      <SelectItem
                        value="Individual"
                        className="cursor-pointer px-4 py-2 text-base text-white hover:bg-[#22c4d3] hover:text-black"
                      >
                        Individual
                      </SelectItem>
                      <SelectItem
                        value="Grupal"
                        className="cursor-pointer px-4 py-2 text-base text-white hover:bg-[#22c4d3] hover:text-black"
                      >
                        Grupal
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Switches: Público y Colaboradores */}
            <div className="space-y-4 border-t border-border/50 pt-4">
              {/* Switch: ¿Proyecto Público? */}
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                    <Globe className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <label
                      htmlFor="isPublic"
                      className="cursor-pointer text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      ¿Deseas que el proyecto sea público?
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Otros usuarios podrán ver tu proyecto
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isPublic ?? false}
                  data-state={formData.isPublic ? 'checked' : 'unchecked'}
                  value="on"
                  className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                  id="isPublic"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      isPublic: !formData.isPublic,
                    })
                  }
                >
                  <span
                    data-state={formData.isPublic ? 'checked' : 'unchecked'}
                    className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
                  />
                </button>
              </div>

              {/* Switch: ¿Necesitas Colaboradores? */}
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                    <Users className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <label
                      htmlFor="needsCollaborators"
                      className="cursor-pointer text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      ¿Necesitas colaboradores?
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Buscar personas que te ayuden en el proyecto
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.needsCollaborators ?? false}
                  data-state={
                    formData.needsCollaborators ? 'checked' : 'unchecked'
                  }
                  value="on"
                  className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                  id="needsCollaborators"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      needsCollaborators: !formData.needsCollaborators,
                    })
                  }
                >
                  <span
                    data-state={
                      formData.needsCollaborators ? 'checked' : 'unchecked'
                    }
                    className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
                  />
                </button>
              </div>

              {/* Contenido Multimedia */}
              <div className="space-y-3 border-t border-border/50 pt-4">
                <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Contenido multimedia (opcional)
                </label>
                <div className="rounded-lg border-2 border-dashed border-border/50 p-6 text-center transition-colors hover:border-primary/50">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleMultimediaUpload}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Haz clic para subir archivos
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Imágenes y videos (PNG, JPG, MP4, etc.)
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
                {formData.multimedia &&
                  Array.isArray(formData.multimedia) &&
                  formData.multimedia.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {formData.multimedia.map((file, index) => (
                        <div key={index} className="group relative">
                          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-muted">
                            {file.type.startsWith('image') ? (
                              <Image
                                src={file.url}
                                alt={`multimedia-${index}`}
                                className="h-full w-full object-cover"
                                width={400}
                                height={225}
                              />
                            ) : (
                              <div className="flex h-full w-full flex-col items-center justify-center">
                                <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                                <span className="px-2 text-center text-xs text-muted-foreground">
                                  {file.name}
                                </span>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMultimedia(index)}
                            className="absolute top-2 right-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium">
                  Problema a Resolver *
                </label>
                <button
                  type="button"
                  onClick={() =>
                    runGenerate('problema', async () => {
                      try {
                        const context = buildProjectContext(
                          formData.titulo,
                          formData.description
                        );
                        if (!context) {
                          alert(
                            'Completa el título o la descripción del proyecto antes de generar con IA.'
                          );
                          return;
                        }

                        const prompt = (formData.planteamiento ?? '').trim()
                          ? `Mejora y reescribe el problema del proyecto manteniendo el significado. Contexto del proyecto: "${context}". Problema actual: "${formData.planteamiento}". Responde solo con el problema mejorado.`
                          : `Genera un problema claro y conciso para un proyecto educativo. Contexto del proyecto: "${context}". Responde solo con el problema.`;

                        const result = await generateContent({
                          type: 'problema',
                          prompt,
                          existingText: formData.planteamiento,
                          titulo: formData.titulo,
                          descripcion: formData.description,
                        });
                        if (result) {
                          typeIntoField('planteamiento', result, (value) => {
                            setFormData((prev) => ({
                              ...prev,
                              planteamiento: value,
                            }));
                          });
                        }
                      } catch (error) {
                        console.error('Error generando problema:', error);
                      }
                    })
                  }
                  className="inline-flex h-7 items-center justify-center gap-2 rounded-md px-3 text-xs font-medium whitespace-nowrap text-accent ring-offset-background transition-colors hover:bg-accent/10 hover:text-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                >
                  {isGeneratingFor('problema') ? (
                    <span className="ai-generate-loader" aria-hidden />
                  ) : (
                    <FaWandMagicSparkles className="mr-1.5 h-3 w-3" />
                  )}
                  <span
                    className={
                      isGeneratingFor('problema')
                        ? 'ai-generate-text-pulse text-xs'
                        : 'text-xs'
                    }
                  >
                    {formData.planteamiento?.trim()
                      ? 'Regenerar con IA'
                      : 'Generar con IA'}
                  </span>
                </button>
              </div>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.planteamiento}
                onChange={(e) => {
                  stopTyping('planteamiento');
                  setFormData({ ...formData, planteamiento: e.target.value });
                }}
                placeholder="Describe el problema que resolverá el proyecto..."
              />
              <div className="mt-2 flex items-start gap-2 rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">
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
                  className="h-3.5 w-3.5 shrink-0 text-amber-500"
                >
                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                </svg>
                <span>
                  Define claramente quién tiene el problema, cuál es el problema
                  y por qué es importante resolverlo.
                </span>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Objetivo General</h3>
              <button
                type="button"
                onClick={() =>
                  runGenerate('objetivoGen', async () => {
                    try {
                      const context = buildProjectContext(
                        formData.titulo,
                        formData.description
                      );
                      if (!context) {
                        alert(
                          'Completa el título o la descripción del proyecto antes de generar con IA.'
                        );
                        return;
                      }

                      const prompt = (formData.objetivoGen ?? '').trim()
                        ? `Mejora y reescribe el objetivo general manteniendo el significado. Contexto del proyecto: "${context}". Problema: "${formData.planteamiento || 'No especificado'}". Objetivo actual: "${formData.objetivoGen}". Responde solo con el objetivo general mejorado.`
                        : `Genera un objetivo general claro y alcanzable para un proyecto educativo. Contexto del proyecto: "${context}". Problema: "${formData.planteamiento || 'No especificado'}". Responde solo con el objetivo general.`;

                      const result = await generateContent({
                        type: 'objetivoGen',
                        prompt,
                        existingText: formData.objetivoGen,
                        titulo: formData.titulo,
                        descripcion: formData.description,
                      });
                      if (result) {
                        typeIntoField('objetivoGen', result, (value) => {
                          setFormData((prev) => ({
                            ...prev,
                            objetivoGen: value,
                          }));
                        });
                      }
                    } catch (error) {
                      console.error('Error generando objetivo:', error);
                    }
                  })
                }
                className="inline-flex h-7 items-center justify-center gap-2 rounded-md px-3 text-xs font-medium whitespace-nowrap text-accent ring-offset-background transition-colors hover:bg-accent/10 hover:text-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              >
                {isGeneratingFor('objetivoGen') ? (
                  <span className="ai-generate-loader" aria-hidden />
                ) : (
                  <FaWandMagicSparkles className="mr-1.5 h-3 w-3" />
                )}
                <span
                  className={
                    isGeneratingFor('objetivoGen')
                      ? 'ai-generate-text-pulse text-xs'
                      : 'text-xs'
                  }
                >
                  {formData.objetivoGen?.trim()
                    ? 'Regenerar con IA'
                    : 'Generar con IA'}
                </span>
              </button>
            </div>
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describa el objetivo general del proyecto..."
              value={formData.objetivoGen}
              onChange={(e) => {
                stopTyping('objetivoGen');
                setFormData({ ...formData, objetivoGen: e.target.value });
              }}
            />
            <div className="mt-2 flex items-start gap-2 rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">
              <Pencil className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span>
                El objetivo general debe ser claro, alcanzable y alineado con el
                problema que se busca resolver.
              </span>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Requisitos</h3>
              <button
                type="button"
                onClick={() =>
                  runGenerate('requisitos', async () => {
                    try {
                      const contextParts = [
                        formData.titulo?.trim()
                          ? `Titulo: ${formData.titulo.trim()}`
                          : '',
                        formData.description?.trim()
                          ? `Descripcion: ${formData.description.trim()}`
                          : '',
                        formData.planteamiento?.trim()
                          ? `Problema: ${formData.planteamiento.trim()}`
                          : '',
                        formData.justificacion?.trim()
                          ? `Justificacion: ${formData.justificacion.trim()}`
                          : '',
                        formData.objetivoGen?.trim()
                          ? `Objetivo general: ${formData.objetivoGen.trim()}`
                          : '',
                      ].filter(Boolean);
                      const context = contextParts.join('\n');
                      if (!context) {
                        alert(
                          'Completa al menos el titulo, descripcion, problema, justificacion u objetivo general antes de generar con IA.'
                        );
                        return;
                      }

                      const prompt =
                        formData.requirements &&
                        formData.requirements.length > 0
                          ? `Mejora y expande la lista de requisitos manteniendo el significado. Usa el contexto del proyecto.\n\n${context}\n\nRequisitos actuales: ${formData.requirements.join(', ')}\n\nResponde solo con la lista de requisitos mejorada, uno por linea.`
                          : `Genera una lista de requisitos tecnicos y funcionales para un proyecto educativo, basandote en el contexto.\n\n${context}\n\nResponde solo con la lista de requisitos, uno por linea.`;

                      const result = await generateContent({
                        type: 'requisitos',
                        prompt,
                        existingText: formData.requirements?.join('\n'),
                        titulo: formData.titulo,
                        descripcion: formData.description,
                      });
                      if (result) {
                        const requirements = dedupeRequirements(
                          result
                            .split('\n')
                            .map(normalizeRequirementLine)
                            .filter(Boolean)
                        );
                        setFormData((prev) => ({
                          ...prev,
                          requirements: requirements,
                        }));
                      }
                    } catch (error) {
                      console.error('Error generando requisitos:', error);
                    }
                  })
                }
                className="inline-flex h-7 items-center justify-center gap-2 rounded-md px-3 text-xs font-medium whitespace-nowrap text-accent ring-offset-background transition-colors hover:bg-accent/10 hover:text-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              >
                {isGeneratingFor('requisitos') ? (
                  <span className="ai-generate-loader" aria-hidden />
                ) : (
                  <FaWandMagicSparkles className="mr-1.5 h-3 w-3" />
                )}
                <span
                  className={
                    isGeneratingFor('requisitos')
                      ? 'ai-generate-text-pulse text-xs'
                      : 'text-xs'
                  }
                >
                  {formData.requirements && formData.requirements.length > 0
                    ? 'Regenerar con IA'
                    : 'Generar con IA'}
                </span>
              </button>
            </div>
            <div className="space-y-3">
              {formData.requirements && formData.requirements.length > 0 ? (
                formData.requirements.map((requisito, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/30 p-3"
                  >
                    <span className="text-sm text-muted-foreground">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      className="flex-1 bg-transparent text-sm outline-none"
                      placeholder="Describe el requisito..."
                      value={requisito}
                      onChange={(e) => {
                        const updated = [...formData.requirements];
                        updated[idx] = e.target.value;
                        setFormData({ ...formData, requirements: updated });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.requirements.filter(
                          (_, i) => i !== idx
                        );
                        setFormData({ ...formData, requirements: updated });
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border-2 border-dashed border-border/50 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No hay requisitos definidos aún.
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    requirements: [...(formData.requirements || []), ''],
                  });
                }}
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 text-sm font-medium text-accent ring-offset-background transition-colors hover:bg-accent/20 hover:text-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              >
                <Plus className="h-4 w-4" />
                Agregar requisito
              </button>
            </div>
            <div className="mt-2 flex items-start gap-2 rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">
              <Pencil className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span>
                Los requisitos deben ser específicos, medibles y alineados con
                los objetivos del proyecto.
              </span>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            {/* Card informativa */}
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <div className="flex items-start gap-3">
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
                  className="mt-0.5 h-5 w-5 text-accent"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <div>
                  <h4 className="mb-1 font-medium text-foreground">
                    Duración del proyecto
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Define el tiempo estimado y las fechas del proyecto.
                  </p>
                </div>
              </div>
            </div>

            {/* Tiempo estimado */}
            <div className="space-y-2">
              <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Tiempo estimado *
              </label>
              <div className="flex gap-3 pt-2">
                <input
                  type="number"
                  className="mt-1 flex h-10 w-24 rounded-md border border-input bg-background/50 px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  min="1"
                  placeholder="Cantidad"
                  value={formData.durationEstimate}
                  onChange={(e) =>
                    setFormData((prev) => {
                      const nextEstimate = Number(e.target.value);
                      const nextEnd = prev.fechaInicio
                        ? addDurationToDate(
                            prev.fechaInicio,
                            nextEstimate,
                            prev.durationUnit
                          )
                        : prev.fechaFin;
                      return {
                        ...prev,
                        durationEstimate: nextEstimate,
                        fechaFin: nextEnd,
                      };
                    })
                  }
                />
                <Select
                  value={formData.durationUnit}
                  onValueChange={(
                    value: 'dias' | 'semanas' | 'meses' | 'anos'
                  ) =>
                    setFormData((prev) => {
                      const nextEnd = prev.fechaInicio
                        ? addDurationToDate(
                            prev.fechaInicio,
                            prev.durationEstimate,
                            value
                          )
                        : prev.fechaFin;
                      return {
                        ...prev,
                        durationUnit: value,
                        fechaFin: nextEnd,
                      };
                    })
                  }
                >
                  <SelectTrigger className="flex-1 bg-background/50">
                    <SelectValue placeholder="Selecciona unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dias">Días</SelectItem>
                    <SelectItem value="semanas">Semanas</SelectItem>
                    <SelectItem value="meses">Meses</SelectItem>
                    <SelectItem value="anos">Años</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fechas de inicio y fin */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              <div className="mt-3 space-y-2">
                <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background/50 px-4 py-2 pr-10 text-left text-sm font-normal text-foreground ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none sm:pr-4 [&::-webkit-calendar-picker-indicator]:-translate-x-1 [&::-webkit-calendar-picker-indicator]:opacity-90 [&::-webkit-calendar-picker-indicator]:invert sm:[&::-webkit-calendar-picker-indicator]:translate-x-0"
                  value={formData.fechaInicio || ''}
                  onChange={(e) =>
                    setFormData((prev) => {
                      const nextStart = e.target.value;
                      const nextEnd = nextStart
                        ? addDurationToDate(
                            nextStart,
                            prev.durationEstimate,
                            prev.durationUnit
                          )
                        : prev.fechaFin;
                      return {
                        ...prev,
                        fechaInicio: nextStart,
                        fechaFin: nextEnd,
                      };
                    })
                  }
                />
              </div>
              <div className="mt-3 space-y-2">
                <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Fecha de fin
                </label>
                <input
                  type="date"
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background/50 px-4 py-2 pr-10 text-left text-sm font-normal text-foreground ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none sm:pr-4 [&::-webkit-calendar-picker-indicator]:-translate-x-1 [&::-webkit-calendar-picker-indicator]:opacity-90 [&::-webkit-calendar-picker-indicator]:invert sm:[&::-webkit-calendar-picker-indicator]:translate-x-0"
                  value={formData.fechaFin || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fechaFin: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Tip */}
            <div className="mt-2 flex items-start gap-2 rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">
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
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500"
              >
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
                <path d="M9 18h6"></path>
                <path d="M10 22h4"></path>
              </svg>
              <span>
                Considera el alcance del proyecto, los requisitos y los recursos
                disponibles para estimar el tiempo.
              </span>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Objetivos específicos y actividades *
              </label>
              <button
                type="button"
                onClick={() =>
                  runGenerate('objetivosEsp', async () => {
                    try {
                      const contextParts = [
                        formData.titulo?.trim()
                          ? `Titulo: ${formData.titulo.trim()}`
                          : '',
                        formData.description?.trim()
                          ? `Descripcion: ${formData.description.trim()}`
                          : '',
                        formData.planteamiento?.trim()
                          ? `Problema: ${formData.planteamiento.trim()}`
                          : '',
                        formData.objetivoGen?.trim()
                          ? `Objetivo general: ${formData.objetivoGen.trim()}`
                          : '',
                      ].filter(Boolean);
                      const context = contextParts.join('\n');
                      const scheduleParts = [
                        formData.fechaInicio?.trim()
                          ? `Fecha de inicio del proyecto: ${formData.fechaInicio}`
                          : '',
                        formData.fechaFin?.trim()
                          ? `Fecha de fin del proyecto: ${formData.fechaFin}`
                          : '',
                        typeof formData.durationEstimate === 'number' &&
                        formData.durationEstimate > 0
                          ? `Duración estimada: ${formData.durationEstimate} ${
                              formData.durationUnit ?? 'dias'
                            }`
                          : '',
                      ].filter(Boolean);
                      const scheduleContext =
                        scheduleParts.length > 0
                          ? `\nCronograma del proyecto:\n${scheduleParts.join(
                              '\n'
                            )}`
                          : '\nCronograma del proyecto:\nNo hay fechas definidas. Estima un cronograma razonable (6 a 8 semanas desde hoy).';
                      if (!context) {
                        alert(
                          'Completa el titulo, descripcion o el objetivo general antes de generar con IA.'
                        );
                        return;
                      }

                      const hasExisting =
                        formData.objetivosEsp &&
                        formData.objetivosEsp.length > 0;
                      const basePrompt = hasExisting
                        ? 'Mejora y reescribe los objetivos especificos y sus actividades manteniendo el significado.'
                        : 'Genera entre 3 y 5 objetivos especificos para este proyecto y, para cada objetivo, 2 a 3 actividades claras y medibles.';
                      const prompt = `${basePrompt}\n\n${context}${scheduleContext}\n\nDevuelve SOLO JSON válido con este formato:\n{"objetivos":[{"title":"Objetivo 1","activities":[{"title":"Actividad 1","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"}]}]}`;

                      const result = await generateContent({
                        type: 'objetivosEsp',
                        prompt,
                        existingText: (formData.objetivosEsp || [])
                          .map((obj, index) => {
                            const title = obj.title || `Objetivo ${index + 1}`;
                            const acts = (obj.activities || [])
                              .map((act) => {
                                const dateInfo = [
                                  act.startDate
                                    ? `Inicio: ${act.startDate}`
                                    : '',
                                  act.endDate ? `Fin: ${act.endDate}` : '',
                                ]
                                  .filter(Boolean)
                                  .join(', ');
                                const suffix = dateInfo ? ` (${dateInfo})` : '';
                                return `Actividad: ${act.title || ''}${suffix}`;
                              })
                              .filter(Boolean)
                              .join('\n');
                            return acts ? `${title}\n${acts}` : title;
                          })
                          .join('\n\n'),
                        titulo: formData.titulo,
                        descripcion: formData.description,
                        fechaInicio: formData.fechaInicio,
                        fechaFin: formData.fechaFin,
                        durationEstimate: formData.durationEstimate,
                        durationUnit: formData.durationUnit,
                      });
                      if (result) {
                        activitiesDirtyRef.current = true;
                        const parsed = parseObjectivesWithActivities(result, {
                          projectStart: formData.fechaInicio,
                          projectEnd: formData.fechaFin,
                          durationEstimate: formData.durationEstimate,
                          durationUnit: formData.durationUnit,
                        });
                        setFormData((prev) => ({
                          ...prev,
                          objetivosEsp: parsed,
                        }));
                      }
                    } catch (error) {
                      console.error('Error generando actividades:', error);
                    }
                  })
                }
                className="inline-flex h-7 items-center justify-center gap-2 rounded-md px-3 text-xs font-medium whitespace-nowrap text-accent ring-offset-background transition-colors hover:bg-accent/10 hover:text-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              >
                {isGeneratingFor('objetivosEsp') ? (
                  <span className="ai-generate-loader" aria-hidden />
                ) : (
                  <FaWandMagicSparkles className="mr-1.5 h-3 w-3" />
                )}
                <span
                  className={
                    isGeneratingFor('objetivosEsp')
                      ? 'ai-generate-text-pulse text-xs'
                      : 'text-xs'
                  }
                >
                  {formData.objetivosEsp && formData.objetivosEsp.length > 0
                    ? 'Regenerar con IA'
                    : 'Generar con IA'}
                </span>
              </button>
            </div>
            <div className="space-y-3">
              {formData.objetivosEsp && formData.objetivosEsp.length > 0
                ? formData.objetivosEsp.map((objetivo, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-border/50 bg-card/30 p-4"
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-accent" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Objetivo {idx + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            activitiesDirtyRef.current = true;
                            const updated = formData.objetivosEsp.filter(
                              (_, i) => i !== idx
                            );
                            setFormData({ ...formData, objetivosEsp: updated });
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        className="mb-3 flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        placeholder="Título del objetivo específico"
                        value={objetivo.title || ''}
                        onChange={(e) => {
                          activitiesDirtyRef.current = true;
                          const updated = [...formData.objetivosEsp];
                          updated[idx].title = e.target.value;
                          setFormData({ ...formData, objetivosEsp: updated });
                        }}
                      />
                      <div className="space-y-2 border-l-2 border-accent/30 pl-4">
                        <span className="text-xs text-muted-foreground">
                          Actividades:
                        </span>
                        {objetivo.activities && objetivo.activities.length > 0
                          ? objetivo.activities.map((activity, actIdx) => (
                              <div
                                key={actIdx}
                                className="flex items-start gap-2"
                              >
                                <span className="mt-2.5 text-xs text-muted-foreground">
                                  {actIdx + 1}.
                                </span>
                                <div className="flex-1 space-y-2">
                                  <input
                                    type="text"
                                    className="flex h-8 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                    placeholder="Título de la actividad"
                                    value={activity.title || ''}
                                    onChange={(e) => {
                                      activitiesDirtyRef.current = true;
                                      const updated = [
                                        ...formData.objetivosEsp,
                                      ];
                                      updated[idx].activities[actIdx].title =
                                        e.target.value;
                                      setFormData({
                                        ...formData,
                                        objetivosEsp: updated,
                                      });
                                    }}
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="date"
                                      className="flex h-8 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                      placeholder="Inicio"
                                      value={activity.startDate || ''}
                                      onChange={(e) => {
                                        activitiesDirtyRef.current = true;
                                        const updated = [
                                          ...formData.objetivosEsp,
                                        ];
                                        updated[idx].activities[
                                          actIdx
                                        ].startDate = e.target.value;
                                        setFormData({
                                          ...formData,
                                          objetivosEsp: updated,
                                        });
                                      }}
                                    />
                                    <input
                                      type="date"
                                      className="flex h-8 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                      placeholder="Fin"
                                      value={activity.endDate || ''}
                                      onChange={(e) => {
                                        activitiesDirtyRef.current = true;
                                        const updated = [
                                          ...formData.objetivosEsp,
                                        ];
                                        updated[idx].activities[
                                          actIdx
                                        ].endDate = e.target.value;
                                        setFormData({
                                          ...formData,
                                          objetivosEsp: updated,
                                        });
                                      }}
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    activitiesDirtyRef.current = true;
                                    const updated = [...formData.objetivosEsp];
                                    updated[idx].activities = updated[
                                      idx
                                    ].activities.filter((_, i) => i !== actIdx);
                                    setFormData({
                                      ...formData,
                                      objetivosEsp: updated,
                                    });
                                  }}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))
                          : null}
                        <button
                          type="button"
                          onClick={() => {
                            activitiesDirtyRef.current = true;
                            const updated = [...formData.objetivosEsp];
                            if (!updated[idx].activities) {
                              updated[idx].activities = [];
                            }
                            updated[idx].activities.push({
                              title: '',
                              startDate: '',
                              endDate: '',
                            });
                            setFormData({ ...formData, objetivosEsp: updated });
                          }}
                          className="inline-flex h-7 items-center justify-center gap-2 rounded-md px-3 text-xs font-medium whitespace-nowrap ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Agregar actividad
                        </button>
                      </div>
                    </div>
                  ))
                : null}
            </div>
            <button
              type="button"
              onClick={() => {
                activitiesDirtyRef.current = true;
                setFormData({
                  ...formData,
                  objetivosEsp: [
                    ...formData.objetivosEsp,
                    { id: Date.now().toString(), title: '', activities: [] },
                  ],
                });
              }}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium whitespace-nowrap ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar objetivo específico
            </button>
          </div>
        );
      case 7:
        return (() => {
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
          const labelColumnWidth = 208;
          const gridWidth = Math.max(columns.length * columnWidth, 1);
          const totalWidth = labelColumnWidth + gridWidth;
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
            if (!row.startDate || !row.endDate) return 'bg-muted-foreground/50';
            if (row.endDate < todayUTC) return 'bg-red-500';
            if (row.startDate <= todayUTC && row.endDate >= todayUTC) {
              return 'bg-accent';
            }
            return 'bg-muted-foreground/50';
          };

          return (
            <div className="rounded-xl border border-border/50 bg-card/50 p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
                    <Calendar className="h-4 w-4 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Cronograma
                  </h3>
                </div>
                <div className="ml-auto flex items-center gap-1 rounded-lg bg-muted/30 p-1">
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
              </div>

              {timelineRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Define fechas de inicio y fin en las actividades para ver el
                  cronograma.
                </p>
              ) : (
                <div className="scrollbar-thin w-full overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/50 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-track]:bg-transparent">
                  <div className="flex" style={{ minWidth: totalWidth }}>
                    <div
                      className="shrink-0 border-r border-border/30"
                      style={{ width: labelColumnWidth }}
                    >
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
                            if (!row.startDate || !row.endDate || !rangeStart) {
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
                                const offsetUnits = Math.floor(offsetDays / 7);
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
                              const offsetUnits = startIndex - rangeMonthIndex;
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
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border/50 pt-4">
                <span className="text-xs text-muted-foreground">Estado:</span>
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
            </div>
          );
        })();

      case 8: {
        const predefinedSections = Object.entries(localAddedSections).filter(
          ([sectionId]) => !sectionId.startsWith('custom-')
        );
        const customSections = Object.entries(localAddedSections).filter(
          ([sectionId]) => sectionId.startsWith('custom-')
        );
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Agrega y personaliza secciones. Se guardan automáticamente.
              </p>
              <AddSectionDropdown
                addedSections={Object.keys(localAddedSections)}
                onSectionSelect={handleAddSectionFromModal}
              />
            </div>
            <div className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">
                    Secciones predefinidas
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {predefinedSections.length}
                  </span>
                </div>
                {predefinedSections.length > 0 ? (
                  predefinedSections.map(([sectionId, section]) =>
                    renderSectionCard(sectionId, section)
                  )
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-border/50 p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No hay secciones predefinidas agregadas.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">
                    Secciones personalizadas
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {customSections.length}
                  </span>
                </div>
                {customSections.length > 0 ? (
                  customSections.map(([sectionId, section]) =>
                    renderSectionCard(sectionId, section)
                  )
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-border/50 p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No hay secciones personalizadas agregadas aún.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      className="absolute right-0 left-0 z-50 bg-black/80 p-2 sm:p-4"
      style={{ top: 0, height: modalMetrics.overlayHeight || '100%' }}
      onClick={handleOverlayClick}
    >
      <div
        role="dialog"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        className="absolute left-1/2 flex h-[82vh] max-h-[82vh] w-[96vw] max-w-[96vw] translate-x-[-50%] flex-col gap-0 overflow-hidden rounded-[12px] border bg-background p-0 shadow-lg duration-200 sm:h-[75vh] sm:max-h-[650px] sm:w-full sm:max-w-2xl sm:flex-row sm:gap-4 sm:rounded-[16px]"
        style={{ pointerEvents: 'auto', top: modalMetrics.modalTop }}
      >
        {/* Layout principal con sidebar y contenido */}
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          {/* Sidebar de navegación */}
          <div className="flex w-full shrink-0 flex-row items-center justify-between border-b border-border/50 bg-muted/30 px-3 py-2 sm:w-12 sm:flex-col sm:border-r sm:border-b-0 sm:px-0 sm:py-4">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1 || isAutoSaving}
              className="inline-flex h-8 w-8 shrink-0 transform items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap text-muted-foreground ring-offset-background transition-transform duration-150 hover:scale-110 hover:bg-transparent hover:text-[#1eaab7] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-30 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              title="Paso anterior"
            >
              <ChevronLeft className="h-4 w-4 sm:rotate-90" />
            </button>

            {/* Indicadores de pasos */}
            <div className="flex w-full flex-1 flex-row items-center justify-center gap-2 overflow-x-auto px-2 py-2 sm:w-auto sm:flex-col sm:overflow-visible sm:px-0 sm:py-4">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => {
                    if (!isAutoSaving && (isProjectCreated || step.id === 1)) {
                      setCurrentStep(step.id);
                    }
                  }}
                  disabled={
                    isAutoSaving || (!isProjectCreated && step.id !== 1)
                  }
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    step.id === currentStep
                      ? 'scale-125 bg-[#22c4d3]'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  title={step.title}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={
                currentStep === steps.length ||
                (!isProjectCreated && currentStep === 1) ||
                isAutoSaving
              }
              className="inline-flex h-8 w-8 shrink-0 transform items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap text-muted-foreground ring-offset-background transition-transform duration-150 hover:scale-110 hover:bg-transparent hover:text-[#1eaab7] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-30 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              title="Paso siguiente"
            >
              <ChevronRight className="h-4 w-4 sm:rotate-90" />
            </button>
          </div>

          {/* Área de contenido */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {/* Header del modal */}
            <div className="relative shrink-0 border-b border-border/50 p-4 pb-3 sm:p-6 sm:pb-4">
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <h2
                  id="modal-title"
                  className="flex items-center gap-2 text-lg leading-none font-semibold tracking-tight"
                >
                  <FileText className="h-5 w-5 text-accent" />
                  {steps[currentStep - 1].title}
                  <div className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none">
                    {currentStep}/{steps.length}
                  </div>
                  {/* Indicador de guardado */}
                  {isProjectCreated && (
                    <div className="absolute top-3 right-10 flex items-center sm:top-4 sm:right-12">
                      {isAutoSaving ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
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
                          className="h-4 w-4 text-green-500"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="m9 12 2 2 4-4"></path>
                        </svg>
                      )}
                    </div>
                  )}
                </h2>
                <p
                  id="modal-description"
                  className="text-sm text-muted-foreground"
                >
                  {steps[currentStep - 1].description}
                </p>
              </div>

              {/* Barra de progreso */}
              <div className="mt-4">
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#1A2333]"
                >
                  <div
                    className="h-full w-full flex-1 bg-primary transition-all"
                    style={{ transform: `translateX(-${100 - progress}%)` }}
                  />
                </div>
              </div>
            </div>

            {/* Contenido del paso actual */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {renderStepContent()}
            </div>

            {/* Footer con botones de navegación */}
            <div className="flex flex-row items-center justify-between gap-2 border-t border-border/50 bg-card/50 p-3 sm:p-4">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1 || isAutoSaving}
                className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#22c4d3] px-3 py-2 text-xs font-semibold whitespace-nowrap text-[#080c16] ring-offset-background transition-all hover:bg-[#1eaab7] hover:text-black focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-50 sm:h-10 sm:flex-none sm:rounded-[16px] sm:px-4 sm:text-sm [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="relative mr-1 mb-1">Anterior</span>
              </button>

              <div className="flex flex-1 items-center gap-2 sm:flex-none">
                <button
                  onClick={handleMainButtonClick}
                  disabled={nextDisabled || isAutoSaving}
                  className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#22c4d3] px-3 py-2 text-xs font-semibold whitespace-nowrap text-[#080c16] ring-offset-background transition-all hover:bg-[#1eaab7] hover:text-black focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-50 sm:h-10 sm:flex-none sm:rounded-[16px] sm:px-4 sm:text-sm [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                >
                  {isCreateStep ? (
                    <>
                      <span className="relative mb-1 ml-1">
                        Guardar Proyecto
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span className="relative mb-1 ml-1">Siguiente</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de cerrar */}
        <button
          type="button"
          onClick={onClose}
          disabled={isAutoSaving}
          className="absolute top-1 right-2 hidden rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:pointer-events-none disabled:opacity-40 data-[state=open]:bg-accent data-[state=open]:text-muted-foreground sm:top-4 sm:right-4 sm:inline-flex"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </button>
      </div>

      <AddCustomSectionModal
        isOpen={showAddCustomSectionModal}
        onClose={() => {
          setShowAddCustomSectionModal(false);
          setPendingSection(null);
        }}
        onAdd={handleAddCustomSectionFromModal}
        isLoading={isAddingCustomSection}
        initialName={pendingSection?.name ?? ''}
        nameLocked={Boolean(pendingSection && !pendingSection.isCustom)}
        onGenerateDescription={handleGenerateSectionDescription}
      />
    </div>
  );
};
export default ModalResumen;
