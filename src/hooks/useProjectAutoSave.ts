import { useEffect, useRef, useState } from 'react';

import { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';

interface ProjectData {
  // Campos de info básica (sección 1)
  name?: string;
  description?: string;
  categoryId?: number;
  type_project?: string;
  isPublic?: boolean;
  needsCollaborators?: boolean;
  // Campos de otras secciones
  planteamiento?: string;
  justificacion?: string;
  objetivo_general?: string;
  requirements?: string;
  durationEstimate?: number;
  durationUnit?: 'dias' | 'semanas' | 'meses' | 'anos';
  fechaInicio?: string;
  fechaFin?: string;
  objetivos_especificos?: { id: string; title: string }[] | string[];
  actividades?: {
    descripcion: string;
    meses: number[];
    objetivoId?: string;
    objetivoIndex?: number;
    startDate?: string | null;
    endDate?: string | null;
  }[];
  [key: string]: unknown;
}

interface UseProjectAutoSaveOptions {
  projectId: number | undefined;
  enabled?: boolean;
  debounceMs?: number;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

async function updateProject(
  url: string,
  { arg }: { arg: ProjectData }
): Promise<unknown> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Error' }));
    throw new Error(errorData.message || 'Error al guardar el proyecto');
  }

  return res.json();
}

export function useProjectAutoSave({
  projectId,
  enabled = true,
  debounceMs = 1500,
  onSaveSuccess,
  onSaveError,
}: UseProjectAutoSaveOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { mutate } = useSWRConfig();

  const { trigger, isMutating } = useSWRMutation(
    projectId ? `/api/projects/${projectId}` : null,
    updateProject,
    {
      optimisticData: undefined, // Desactivar optimistic updates para evitar datos stale
      revalidate: true, // Revalidar después de guardar
      populateCache: true, // Actualizar el caché de SWR
      onSuccess: () => {
        setLastSaved(new Date());
        setIsSaving(false);
        // Revalidar los datos del proyecto en SWR
        if (projectId) {
          // Usar revalidate: true para que SWR refetch automáticamente
          void mutate(`/api/projects/${projectId}?details=true`);
        }
        onSaveSuccess?.();
      },
      onError: (error) => {
        setIsSaving(false);
        onSaveError?.(error as Error);
      },
    }
  );

  const saveProject = (data: ProjectData) => {
    if (!projectId || !enabled) return;

    setIsSaving(true);

    // Cancelar el timer anterior si existe
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Crear nuevo timer con debounce
    debounceTimer.current = setTimeout(() => {
      trigger(data);
    }, debounceMs);
  };

  // Limpiar el timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    saveProject,
    isSaving: isSaving || isMutating,
    lastSaved,
  };
}
