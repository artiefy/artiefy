'use client';

import { useCallback, useEffect, useState } from 'react';

import { ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/educators/ui/dialog';
import { Input } from '~/components/educators/ui/input';
import { Switch } from '~/components/educators/ui/switch';

interface LessonOption {
  id: number;
  title: string;
}

interface TypeOption {
  id: number;
  name: string;
}

interface ParametroOption {
  id: number;
  name: string;
  porcentaje: number;
}

// Igual que TypeActDropdown: solo estos 3 tipos son válidos para crear,
// renombrados a algo más claro para el usuario.
const ALLOWED_TYPES: Record<string, string> = {
  'Actividad de presentación de documentos': 'Subida de documento',
  'Distintos tipos de pregunta': 'Preguntas tipo ICFES',
  'Pregunta Abierta': 'Autocompletado',
};

interface ModalFormActivityQuickProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: number;
  // Si se omiten, el modal deja elegir el parámetro de evaluación (uso desde
  // la clase, sin un parámetro predeterminado).
  parametroId?: number;
  parametroName?: string;
  parametroPeso?: number;
  // Preselecciona la clase cuando el modal se abre desde el detalle de una
  // clase puntual.
  presetLessonId?: number;
  onSuccess: () => void;
}

const selectClass =
  'w-full rounded-md border border-cyan-500/30 bg-slate-800 p-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none disabled:opacity-50';

export function ModalFormActivityQuick({
  open,
  onOpenChange,
  courseId,
  parametroId,
  parametroName,
  parametroPeso,
  presetLessonId,
  onSuccess,
}: ModalFormActivityQuickProps) {
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

  const [typeOptions, setTypeOptions] = useState<TypeOption[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  const [parametroOptions, setParametroOptions] = useState<ParametroOption[]>(
    []
  );
  const [loadingParametros, setLoadingParametros] = useState(false);
  const [selectedParametroId, setSelectedParametroId] = useState<number | null>(
    null
  );
  const effectiveParametroId = parametroId ?? selectedParametroId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [typeId, setTypeId] = useState<number | null>(null);
  const [porcentaje, setPorcentaje] = useState<number>(0);
  // Disponible real = 100 - lo que ya suman las actividades de este parámetro.
  const [porcentajeDisponible, setPorcentajeDisponible] = useState<
    number | null
  >(null);
  // Sugerido = el disponible repartido entre las actividades que le falten
  // al parámetro (solo si tiene un número de actividades configurado).
  const [porcentajeSugerido, setPorcentajeSugerido] = useState<number | null>(
    null
  );
  const [previewActividades, setPreviewActividades] = useState<
    Array<{ id: number | string; name: string; porcentaje: number }>
  >([]);
  const [loadingDisponible, setLoadingDisponible] = useState(false);
  const [hasDueDate, setHasDueDate] = useState(false);
  const [fechaMaximaEntrega, setFechaMaximaEntrega] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Solo para el tipo "Subida de documento" (id 1): archivo de ayuda y
  // recurso complementario que se guardan junto con la actividad.
  const [docArchivo, setDocArchivo] = useState<File | null>(null);
  const [docImagen, setDocImagen] = useState<File | null>(null);

  const resetForm = useCallback(() => {
    setSelectedLessonId(presetLessonId ?? null);
    setName('');
    setDescription('');
    setTypeId(null);
    setSelectedParametroId(parametroId ?? null);
    setPorcentaje(0);
    setPorcentajeDisponible(null);
    setPorcentajeSugerido(null);
    setHasDueDate(false);
    setFechaMaximaEntrega('');
    setDocArchivo(null);
    setDocImagen(null);
  }, [presetLessonId, parametroId]);

  const loadDisponibleFor = useCallback(
    async (paramId: number) => {
      setLoadingDisponible(true);
      try {
        // Disponible real del parámetro (100 - lo ya asignado). porcentaje:0
        // es un "no-op" solo para leer el total actual sin validar una suma.
        const [disponibleRes, sugeridoRes, actividadesRes] = await Promise.all([
          fetch('/api/educadores/actividades/actividadesByLesson', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parametroId: paramId, porcentaje: 0 }),
          }),
          fetch(`/api/educadores/actividades/sugerido?parametroId=${paramId}`),
          fetch(
            `/api/educadores/actividades?courseId=${courseId}&parametroId=${paramId}`
          ),
        ]);

        if (disponibleRes.ok) {
          const disponibleData = (await disponibleRes.json()) as {
            disponible: number;
          };
          setPorcentajeDisponible(disponibleData.disponible);
        } else {
          setPorcentajeDisponible(null);
        }

        let suggestedValue: number | null = null;
        if (sugeridoRes.ok) {
          const sugeridoData = (await sugeridoRes.json()) as {
            porcentajeSugerido: number | null;
          };
          suggestedValue = sugeridoData.porcentajeSugerido;
          setPorcentajeSugerido(sugeridoData.porcentajeSugerido);
        } else {
          setPorcentajeSugerido(null);
        }

        let actividadesDeParametro: Array<{ id: number; name: string }> = [];
        if (actividadesRes.ok) {
          actividadesDeParametro = (await actividadesRes.json()) as Array<{
            id: number;
            name: string;
          }>;
        }

        const totalConNueva = actividadesDeParametro.length + 1;
        const porcentajeBase =
          totalConNueva > 0 ? Number((100 / totalConNueva).toFixed(2)) : 100;

        const preview = [
          ...actividadesDeParametro.map((actividad) => ({
            id: actividad.id,
            name: actividad.name,
            porcentaje: porcentajeBase,
          })),
          {
            id: 'nueva-actividad',
            name: 'Nueva actividad',
            porcentaje: porcentajeBase,
          },
        ];

        setPreviewActividades(preview);

        const valueToUse = suggestedValue ?? porcentajeBase;
        setPorcentaje(valueToUse);
      } catch {
        setPorcentajeDisponible(null);
        setPreviewActividades([]);
      } finally {
        setLoadingDisponible(false);
      }
    },
    [courseId]
  );

  const uploadFileToS3 = async (file: File): Promise<string> => {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentType: file.type,
        fileSize: file.size,
        fileName: file.name,
      }),
    });
    if (!res.ok) throw new Error('Error al generar la URL de subida');
    const { url, fields, key } = (await res.json()) as {
      url: string;
      fields: Record<string, string>;
      key: string;
    };
    const uploadForm = new FormData();
    Object.entries(fields).forEach(([k, v]) => uploadForm.append(k, v));
    uploadForm.append('file', file);
    const uploadRes = await fetch(url, { method: 'POST', body: uploadForm });
    if (!uploadRes.ok) throw new Error('Error al subir el archivo');
    return key;
  };

  useEffect(() => {
    if (!open) return;
    resetForm();

    const fetchLessons = async () => {
      setLoadingLessons(true);
      try {
        const res = await fetch(
          `/api/super-admin/courses/lessonsCourse?courseId=${courseId}`
        );
        if (!res.ok) throw new Error();
        const data = (await res.json()) as {
          lessons: { id: number; title: string }[];
        };
        setLessons(data.lessons.map((l) => ({ id: l.id, title: l.title })));
      } catch {
        toast.error('No se pudieron cargar las clases del curso');
      } finally {
        setLoadingLessons(false);
      }
    };

    const fetchTypes = async () => {
      setLoadingTypes(true);
      try {
        const res = await fetch('/api/educadores/typeAct');
        if (!res.ok) throw new Error();
        const data = (await res.json()) as {
          id: number;
          name: string;
        }[];
        setTypeOptions(
          data
            .filter((type) => type.name in ALLOWED_TYPES)
            .map((type) => ({
              id: type.id,
              name: ALLOWED_TYPES[type.name] ?? type.name,
            }))
        );
      } catch {
        toast.error('No se pudieron cargar los tipos de actividad');
      } finally {
        setLoadingTypes(false);
      }
    };

    const fetchParametros = async () => {
      if (parametroId) return; // ya viene fijo desde el parámetro seleccionado
      setLoadingParametros(true);
      try {
        const res = await fetch(
          `/api/educadores/parametros?courseId=${courseId}`
        );
        if (!res.ok) throw new Error();
        const data = (await res.json()) as {
          id: number;
          name: string;
          porcentaje: number;
        }[];
        setParametroOptions(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            porcentaje: p.porcentaje,
          }))
        );
      } catch {
        toast.error('No se pudieron cargar los parámetros de evaluación');
      } finally {
        setLoadingParametros(false);
      }
    };

    void fetchLessons();
    void fetchTypes();
    void fetchParametros();
    if (parametroId) void loadDisponibleFor(parametroId);
  }, [open, courseId, parametroId, loadDisponibleFor, resetForm]);

  useEffect(() => {
    if (!open || parametroId || !selectedParametroId) return;
    void loadDisponibleFor(selectedParametroId);
  }, [open, parametroId, selectedParametroId, loadDisponibleFor]);

  const handleSubmit = async () => {
    if (!selectedLessonId) {
      toast.error('Selecciona la clase a la que pertenece esta actividad');
      return;
    }
    if (!name.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    if (!description.trim()) {
      toast.error('La descripción es obligatoria');
      return;
    }
    if (!typeId) {
      toast.error('Selecciona el tipo de actividad');
      return;
    }
    if (!effectiveParametroId) {
      toast.error('Selecciona el parámetro de evaluación');
      return;
    }
    if (!porcentaje || porcentaje <= 0) {
      toast.error('El peso de la actividad debe ser mayor a 0');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/educadores/actividades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          typeid: typeId,
          lessonsId: selectedLessonId,
          courseId,
          revisada: true,
          parametroId: effectiveParametroId,
          porcentaje,
          fechaMaximaEntrega:
            hasDueDate && fechaMaximaEntrega
              ? new Date(fechaMaximaEntrega).toISOString()
              : null,
        }),
      });
      if (!res.ok) {
        const errorBody = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(errorBody?.error ?? 'Error al crear la actividad');
      }

      const { id: activityId } = (await res.json()) as { id: number };

      if (typeId === 1 && (docArchivo ?? docImagen)) {
        try {
          const archivoKey = docArchivo ? await uploadFileToS3(docArchivo) : '';
          const portadaKey = docImagen ? await uploadFileToS3(docImagen) : '';

          await fetch('/api/educadores/question/archivos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              activityId,
              questionsFilesSubida: {
                id: crypto.randomUUID(),
                text: '',
                parametros: '',
                pesoPregunta: 0,
                archivoKey,
                portadaKey,
              },
            }),
          });
        } catch {
          toast.error(
            'La actividad se creó, pero hubo un error subiendo el documento'
          );
        }
      }

      toast.success('Actividad creada correctamente');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear la actividad'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-xl overflow-y-auto border border-cyan-500/30 bg-slate-900">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              <ClipboardList className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-white">Crear actividad</DialogTitle>
              {parametroName && (
                <p className="text-sm text-gray-400">
                  Para el parámetro{' '}
                  <span className="font-semibold text-cyan-400">
                    {parametroName} ({parametroPeso}%)
                  </span>
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Clase *</label>
              {loadingLessons ? (
                <p className="text-sm text-gray-400">Cargando clases...</p>
              ) : lessons.length === 0 ? (
                <p className="text-sm text-red-400">
                  Este curso aún no tiene clases creadas.
                </p>
              ) : (
                <select
                  value={selectedLessonId ?? ''}
                  onChange={(e) => setSelectedLessonId(Number(e.target.value))}
                  className={selectClass}
                >
                  <option value="">Selecciona una clase</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Tipo de actividad *
              </label>
              {loadingTypes ? (
                <p className="text-sm text-gray-400">Cargando tipos...</p>
              ) : (
                <select
                  value={typeId ?? ''}
                  onChange={(e) => setTypeId(Number(e.target.value))}
                  className={selectClass}
                >
                  <option value="">Selecciona un tipo</option>
                  {typeOptions.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Título *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Taller práctico"
              className="border-cyan-500/30 bg-slate-800 text-white placeholder-gray-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Descripción *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe la actividad"
              rows={3}
              className="w-full rounded-md border border-cyan-500/30 bg-slate-800 p-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          {!parametroId && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Parámetro de evaluación *
              </label>
              {loadingParametros ? (
                <p className="text-sm text-gray-400">Cargando parámetros...</p>
              ) : parametroOptions.length === 0 ? (
                <p className="text-sm text-red-400">
                  Este curso aún no tiene parámetros de evaluación.
                </p>
              ) : (
                <select
                  value={selectedParametroId ?? ''}
                  onChange={(e) =>
                    setSelectedParametroId(Number(e.target.value))
                  }
                  className={selectClass}
                >
                  <option value="">Selecciona un parámetro</option>
                  {parametroOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.porcentaje}%)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {typeId === 1 && (
            <div className="space-y-6 rounded-2xl border border-[#22C4D3]/40 bg-[#01142B] p-6 shadow-2xl">
              <h3 className="bg-gradient-to-r from-[#22C4D3] to-[#00BDD8] bg-clip-text text-center text-xl font-extrabold tracking-tight text-transparent">
                Documento a subir
              </h3>

              <div className="space-y-2">
                <label className="block font-bold text-[#22C4D3]">
                  Archivo de ayuda
                </label>
                <div className="relative flex items-center justify-between rounded-lg border border-[#1d283a]/40 bg-[#1e2939] px-4 py-2 shadow transition-all duration-200 focus-within:border-[#22C4D3] focus-within:shadow-[0_0_0_2px_rgba(34,196,211,0.15)]">
                  <span className="truncate text-sm text-[#00BDD8]">
                    {docArchivo?.name ??
                      'Selecciona un archivo de ayuda (PDF, Word, video...)'}
                  </span>
                  <label className="cursor-pointer rounded-md bg-[#00BDD8] px-3 py-1 text-sm font-bold text-[#01142B] transition-all duration-150 hover:bg-[#00A5C0]">
                    Seleccionar
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,video/*,application/*"
                      onChange={(e) =>
                        setDocArchivo(e.target.files?.[0] ?? null)
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-[#22C4D3]">
                  Recurso complementario (imagen)
                </label>
                <div className="relative flex items-center justify-between rounded-lg border border-[#1d283a]/40 bg-[#1e2939] px-4 py-2 shadow transition-all duration-200 focus-within:border-[#22C4D3] focus-within:shadow-[0_0_0_2px_rgba(34,196,211,0.15)]">
                  <span className="truncate text-sm text-[#00BDD8]">
                    {docImagen?.name ?? 'Selecciona una imagen complementaria'}
                  </span>
                  <label className="cursor-pointer rounded-md bg-[#22C4D3] px-3 py-1 text-sm font-bold text-[#01142B] transition-all duration-150 hover:bg-[#00A5C0]">
                    Seleccionar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setDocImagen(e.target.files?.[0] ?? null)
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-cyan-500/20 bg-slate-800/50 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Peso automático del parámetro (%)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  readOnly
                  value={porcentaje}
                  className="border-cyan-500/30 bg-slate-800 text-white placeholder-gray-500 opacity-90"
                />
                {loadingDisponible ? (
                  <p className="text-xs text-gray-400">Calculando reparto...</p>
                ) : !effectiveParametroId ? (
                  <p className="text-xs text-gray-500">
                    Selecciona un parámetro para ver el reparto.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-cyan-400">
                      Disponible en el parámetro:{' '}
                      <span className="font-semibold">
                        {porcentajeDisponible ?? 0}%
                      </span>
                    </p>
                    {porcentajeSugerido !== null && (
                      <p className="text-xs text-gray-400">
                        Este nuevo peso quedará en{' '}
                        <span className="font-semibold text-gray-300">
                          {porcentajeSugerido}%
                        </span>
                      </p>
                    )}
                    {previewActividades.length > 0 && (
                      <div className="rounded-md border border-cyan-500/20 bg-slate-900/60 p-2">
                        <p className="mb-1 text-[10px] font-semibold tracking-wide text-cyan-300 uppercase">
                          Reparto si creas esta actividad
                        </p>
                        <div className="space-y-1 text-xs text-gray-300">
                          {previewActividades.map((actividad) => (
                            <div
                              key={String(actividad.id)}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="truncate">{actividad.name}</span>
                              <span className="font-semibold text-cyan-300">
                                {actividad.porcentaje}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">
                      Si el parámetro tiene 1 actividad, vale 100%. Si agregas
                      otra, se reparte 50% y 50%. Con 3 actividades, cada una
                      queda en 33.33% y así sucesivamente.
                    </p>
                    {(porcentajeDisponible ?? 0) <= 0 && (
                      <p className="text-xs text-red-400">
                        Este parámetro ya no tiene porcentaje disponible.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 pt-2 sm:pt-7">
                  <Switch
                    id="has-due-date"
                    checked={hasDueDate}
                    onChange={(e) => setHasDueDate(e.target.checked)}
                  />
                  <label
                    htmlFor="has-due-date"
                    className="text-sm font-medium text-white"
                  >
                    Fecha máxima de entrega
                  </label>
                </div>
                {hasDueDate && (
                  <Input
                    type="datetime-local"
                    value={fechaMaximaEntrega}
                    onChange={(e) => setFechaMaximaEntrega(e.target.value)}
                    className="border-cyan-500/30 bg-slate-800 text-white"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50"
            >
              {submitting ? 'Creando...' : 'Crear actividad'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
