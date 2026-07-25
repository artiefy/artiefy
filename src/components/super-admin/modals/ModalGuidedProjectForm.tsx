'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import { FiUploadCloud } from 'react-icons/fi';
import Select, { type MultiValue } from 'react-select';
import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/educators/ui/dialog';
import { Input } from '~/components/educators/ui/input';
import { uploadFileToS3 } from '~/lib/uploadFileToS3';

interface Option {
  id: number;
  name: string;
}
interface Educator {
  id: string;
  name: string;
}

interface GuidedProjectFormData {
  title: string;
  subtitle: string;
  description: string;
  categoryId: number;
  modalidadId: number;
  nivelId: number;
  courseTypeId: number | null;
  rating: number;
  instructors: string[];
  individualPrice: number;
  isActive: boolean;
  isTop: boolean;
  isFeatured: boolean;
  visibility: boolean;
  requiresProgram: boolean;
  coverImageKey: string;
  coverVideoKey: string;
  problemStatement: string;
  whatYouWillBuild: string;
  prerequisites: string;
  techStack: string;
  deliverablesDescription: string;
  studentsCount: number;
  contentHours: number;
}

interface ModalGuidedProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  projectId?: number | null; // si viene → modo editar
}

const EMPTY_FORM: GuidedProjectFormData = {
  title: '',
  subtitle: '',
  description: '',
  categoryId: 1,
  modalidadId: 1,
  nivelId: 1,
  courseTypeId: null,
  rating: 0,
  instructors: [],
  individualPrice: 0,
  isActive: true,
  isTop: false,
  isFeatured: false,
  visibility: true,
  requiresProgram: false,
  coverImageKey: '',
  coverVideoKey: '',
  problemStatement: '',
  whatYouWillBuild: '',
  prerequisites: '',
  techStack: '',
  deliverablesDescription: '',
  studentsCount: 0,
  contentHours: 0,
};

export function ModalGuidedProjectForm({
  open,
  onOpenChange,
  onSuccess,
  projectId,
}: ModalGuidedProjectFormProps) {
  const isEditing = !!projectId;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [formData, setFormData] = useState<GuidedProjectFormData>(EMPTY_FORM);

  const [educators, setEducators] = useState<Educator[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [modalidades, setModalidades] = useState<Option[]>([]);
  const [niveles, setNiveles] = useState<Option[]>([]);
  const [courseTypes, setCourseTypes] = useState<Option[]>([]);

  const [coverKind, setCoverKind] = useState<'image' | 'video' | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const coverVideoRef = useRef<HTMLVideoElement>(null);

  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [posterProgress, setPosterProgress] = useState(0);
  const posterInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof GuidedProjectFormData, value: unknown) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  // Cargar opciones de selects al abrir
  useEffect(() => {
    if (!open) return;

    const fetchOptions = async () => {
      try {
        const [edRes, catRes, modRes, nivRes, ctRes] = await Promise.all([
          fetch('/api/super-admin/changeEducators'),
          fetch('/api/educadores/categories'),
          fetch('/api/educadores/modalidades'),
          fetch('/api/educadores/nivel'),
          fetch('/api/educadores/typesCourse'),
        ]);
        const [ed, cat, mod, niv, ct] = await Promise.all([
          edRes.json(),
          catRes.json(),
          modRes.json(),
          nivRes.json(),
          ctRes.json(),
        ]);
        setEducators(ed);
        setCategories(cat);
        setModalidades(mod);
        setNiveles(niv);
        setCourseTypes(Array.isArray(ct) ? ct : []);
      } catch {
        toast.error('Error al cargar opciones');
      }
    };

    void fetchOptions();
  }, [open]);

  // Precargar datos si estamos editando
  useEffect(() => {
    if (!open || !projectId) {
      setFormData(EMPTY_FORM);
      setCoverKind(null);
      setCoverPreview(null);
      setPosterPreview(null);
      return;
    }

    const fetchProject = async () => {
      setLoadingData(true);
      try {
        const res = await fetch(`/api/guided-projects?id=${projectId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFormData({
          title: data.title ?? '',
          subtitle: data.subtitle ?? '',
          description: data.description ?? '',
          categoryId: data.categoryId ?? 1,
          modalidadId: data.modalidadId ?? 1,
          nivelId: data.nivelId ?? 1,
          courseTypeId: data.courseTypeId ?? null,
          rating: data.rating ?? 0,
          instructors:
            data.instructors ?? (data.instructor ? [data.instructor] : []),
          individualPrice: data.individualPrice ?? 0,
          isActive: data.isActive ?? true,
          isTop: data.isTop ?? false,
          isFeatured: data.isFeatured ?? false,
          visibility: data.visibility ?? true,
          requiresProgram: data.requiresProgram ?? false,
          coverImageKey: data.coverImageKey ?? '',
          coverVideoKey: data.coverVideoKey ?? '',
          problemStatement: data.problemStatement ?? '',
          whatYouWillBuild: data.whatYouWillBuild ?? '',
          prerequisites: data.prerequisites ?? '',
          techStack: data.techStack ?? '',
          deliverablesDescription: data.deliverablesDescription ?? '',
          studentsCount: data.studentsCount ?? 0,
          contentHours: data.contentHours ?? 0,
        });
        if (data.coverVideoKey && data.coverVideoKey !== 'none') {
          setCoverKind('video');
          setCoverPreview(
            `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${data.coverVideoKey}`
          );
          if (data.coverImageKey) {
            setPosterPreview(
              `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${data.coverImageKey}`
            );
          }
        } else if (data.coverImageKey) {
          setCoverKind('image');
          setCoverPreview(
            `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${data.coverImageKey}`
          );
        }
      } catch {
        toast.error('Error al cargar el proyecto');
      } finally {
        setLoadingData(false);
      }
    };

    void fetchProject();
  }, [open, projectId]);

  // Sube una imagen al bucket vía presigned POST y devuelve la key
  const uploadImageFile = async (
    file: File,
    onProgress?: (percent: number) => void
  ) => {
    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      }),
    });
    if (!uploadRes.ok) throw new Error('Error al obtener URL de subida');
    const { url, fields, key } = await uploadRes.json();

    const formDataUpload = new FormData();
    Object.entries(fields as Record<string, string>).forEach(([k, v]) => {
      formDataUpload.append(k, v);
    });
    formDataUpload.append('file', file);

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress?.(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error('Error al subir a S3'));
      };
      xhr.onerror = () => reject(new Error('Error al subir a S3'));
      xhr.open('POST', url);
      xhr.send(formDataUpload);
    });

    return key as string;
  };

  // Portada: una imagen o un video (igual que en cursos)
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    setCoverKind(isVideo ? 'video' : 'image');
    setCoverPreview(URL.createObjectURL(file));
    setPosterPreview(null);
    setUploadingCover(true);
    setCoverProgress(0);

    try {
      if (isVideo) {
        const { key } = await uploadFileToS3(file, (pct) =>
          setCoverProgress(pct)
        );
        set('coverVideoKey', key);
        set('coverImageKey', '');
        toast.success('Video subido');
      } else {
        const key = await uploadImageFile(file, (pct) => setCoverProgress(pct));
        set('coverImageKey', key);
        set('coverVideoKey', 'none');
        toast.success('Imagen subida');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al subir la portada');
      setCoverKind(null);
      setCoverPreview(null);
    } finally {
      setUploadingCover(false);
    }
  };

  // Miniatura del video (se usa como coverImageKey para las cards)
  const handlePosterChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPosterPreview(URL.createObjectURL(file));
    setUploadingPoster(true);
    setPosterProgress(0);

    try {
      const key = await uploadImageFile(file, (pct) => setPosterProgress(pct));
      set('coverImageKey', key);
      toast.success('Miniatura subida');
    } catch (err) {
      console.error(err);
      toast.error('Error al subir la miniatura');
      setPosterPreview(null);
    } finally {
      setUploadingPoster(false);
    }
  };

  // Captura el frame actual del video como miniatura
  const handleCaptureFrame = async () => {
    const video = coverVideoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo capturar el frame de este video');
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error('No se pudo capturar el frame');
          return;
        }
        void (async () => {
          const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
          setPosterPreview(URL.createObjectURL(file));
          setUploadingPoster(true);
          setPosterProgress(0);
          try {
            const key = await uploadImageFile(file, (pct) =>
              setPosterProgress(pct)
            );
            set('coverImageKey', key);
            toast.success('Frame capturado y subido');
          } catch (err) {
            console.error(err);
            toast.error('Error al subir el frame capturado');
            setPosterPreview(null);
          } finally {
            setUploadingPoster(false);
          }
        })();
      },
      'image/jpeg',
      0.9
    );
  };

  const handleSubmit = async () => {
    if (!formData.title || formData.instructors.length === 0) {
      toast.error('Título e instructor son requeridos');
      return;
    }
    if (coverKind === 'video' && !formData.coverImageKey) {
      toast.error('Sube una miniatura para el video de portada');
      return;
    }
    setLoading(true);
    try {
      const url = isEditing
        ? `/api/guided-projects?id=${projectId}`
        : '/api/guided-projects';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = { ...formData };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();

      toast.success(isEditing ? 'Proyecto actualizado' : 'Proyecto creado');
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error('Error al guardar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-md border border-gray-600 bg-gray-900 p-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none';
  const labelClass = 'text-sm font-medium text-white';
  const checkLabel =
    'flex items-center gap-2 text-sm text-white cursor-pointer';

  const renderUploadLoader = (percent: number) => {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex size-24 items-center justify-center">
          <svg viewBox="0 0 100 100" className="size-24 -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - percent / 100)}
              className="text-primary transition-all duration-200 ease-out"
            />
          </svg>
          <span className="absolute text-lg font-bold text-white">
            {percent}%
          </span>
        </div>
        <span className="text-sm text-gray-300">Subiendo...</span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Editar Proyecto Guiado' : 'Nuevo Proyecto Guiado'}
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex justify-center py-12">
            <div className="size-10 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Portada: imagen o video */}
            <div className="space-y-2">
              <label className={labelClass}>Portada (imagen o video) *</label>
              <div
                onClick={() =>
                  !uploadingCover && coverInputRef.current?.click()
                }
                className="relative flex h-48 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-600 bg-gray-800 transition hover:border-primary"
              >
                {uploadingCover ? (
                  renderUploadLoader(coverProgress)
                ) : coverPreview ? (
                  coverKind === 'video' ? (
                    <video
                      ref={coverVideoRef}
                      src={coverPreview}
                      controls
                      crossOrigin="anonymous"
                      className="size-full object-cover"
                    />
                  ) : (
                    <Image
                      src={coverPreview}
                      alt="preview"
                      fill
                      className="object-cover"
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <FiUploadCloud className="size-8" />
                    <span className="text-sm">Sube una imagen o video</span>
                    <span className="text-xs">
                      Formatos soportados: JPG, PNG, MP4, MOV
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleCoverChange}
              />
            </div>

            {/* Miniatura del video (obligatoria si la portada es un video) */}
            {coverKind === 'video' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>
                    Imagen de portada del video *
                  </label>
                  <button
                    type="button"
                    onClick={handleCaptureFrame}
                    disabled={uploadingPoster}
                    className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    Capturar frame del video
                  </button>
                </div>
                <div
                  onClick={() =>
                    !uploadingPoster && posterInputRef.current?.click()
                  }
                  className="relative flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-600 bg-gray-800 transition hover:border-primary"
                >
                  {uploadingPoster ? (
                    renderUploadLoader(posterProgress)
                  ) : posterPreview ? (
                    <Image
                      src={posterPreview}
                      alt="miniatura del video"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <FiUploadCloud className="size-6" />
                      <span className="text-sm">
                        Sube una miniatura o captura un frame del video
                      </span>
                    </div>
                  )}
                </div>
                <input
                  ref={posterInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePosterChange}
                />
              </div>
            )}

            {/* Título */}
            <div className="space-y-2">
              <label className={labelClass}>Título *</label>
              <Input
                value={formData.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Título del proyecto"
                className="border-gray-600 bg-gray-900 text-white placeholder-gray-500"
              />
            </div>

            {/* Subtítulo */}
            <div className="space-y-2">
              <label className={labelClass}>Subtítulo</label>
              <Input
                value={formData.subtitle}
                onChange={(e) => set('subtitle', e.target.value)}
                placeholder="Subtítulo corto"
                className="border-gray-600 bg-gray-900 text-white placeholder-gray-500"
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label className={labelClass}>Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Describe el proyecto"
                rows={3}
                className={inputClass}
              />
            </div>

            {/* Selects: categoría, modalidad, nivel */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className={labelClass}>Categoría</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => set('categoryId', Number(e.target.value))}
                  className={inputClass}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Modalidad</label>
                <select
                  value={formData.modalidadId}
                  onChange={(e) => set('modalidadId', Number(e.target.value))}
                  className={inputClass}
                >
                  {modalidades.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Nivel</label>
                <select
                  value={formData.nivelId}
                  onChange={(e) => set('nivelId', Number(e.target.value))}
                  className={inputClass}
                >
                  {niveles.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tipo de Curso */}
            <div className="space-y-2">
              <label className={labelClass}>Tipo de Curso</label>
              <select
                value={formData.courseTypeId ?? ''}
                onChange={(e) =>
                  set(
                    'courseTypeId',
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className={inputClass}
              >
                <option value="">Selecciona un tipo</option>
                {courseTypes.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Instructores (Múltiples) */}
            <div className="space-y-2">
              <label htmlFor="instructors" className={labelClass}>
                Instructores (Múltiples) *
              </label>
              <Select
                id="instructors"
                isMulti
                value={educators
                  .filter((e) => formData.instructors.includes(e.id))
                  .map((e) => ({ value: e.id, label: e.name }))}
                onChange={(
                  selectedOptions: MultiValue<{
                    value: string;
                    label: string;
                  }>
                ) => {
                  set(
                    'instructors',
                    selectedOptions.map((opt) => opt.value)
                  );
                }}
                options={educators.map((educator) => ({
                  value: educator.id,
                  label: educator.name,
                }))}
                placeholder="Seleccionar instructores..."
                className="mt-1"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: '#0a1628',
                    borderColor: 'hsl(var(--primary))',
                    color: 'white',
                    minHeight: '42px',
                  }),
                  input: (base) => ({
                    ...base,
                    color: 'white',
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: 'hsl(var(--muted-foreground))',
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: 'white',
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: '#0a1628',
                    border: '1px solid hsl(var(--primary))',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                  }),
                  menuList: (base) => ({
                    ...base,
                    backgroundColor: '#0a1628',
                    padding: 0,
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused
                      ? 'hsl(var(--primary) / 0.2)'
                      : state.isSelected
                        ? 'hsl(var(--primary) / 0.4)'
                        : '#0a1628',
                    color: 'white',
                    cursor: 'pointer',
                    ':active': {
                      backgroundColor: 'hsl(var(--primary) / 0.3)',
                    },
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: 'hsl(var(--primary) / 0.3)',
                    borderRadius: '4px',
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: 'white',
                    padding: '2px 6px',
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: 'white',
                    ':hover': {
                      backgroundColor: 'hsl(var(--destructive))',
                      color: 'white',
                    },
                  }),
                }}
              />
            </div>

            {/* Precio y rating */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className={labelClass}>Precio individual</label>
                <Input
                  type="number"
                  value={formData.individualPrice}
                  onChange={(e) =>
                    set('individualPrice', Number(e.target.value))
                  }
                  placeholder="0"
                  className="border-gray-600 bg-gray-900 text-white placeholder-gray-500"
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Rating</label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => set('rating', Number(e.target.value))}
                  placeholder="0-5"
                  className="border-gray-600 bg-gray-900 text-white placeholder-gray-500"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(
                [
                  ['isActive', 'Activo'],
                  ['isFeatured', 'Destacado'],
                  ['visibility', 'Visible'],
                ] as [keyof GuidedProjectFormData, string][]
              ).map(([key, label]) => (
                <label key={key} className={checkLabel}>
                  <input
                    type="checkbox"
                    checked={formData[key] as boolean}
                    onChange={(e) => set(key, e.target.checked)}
                    className="size-4 accent-primary"
                  />
                  {label}
                </label>
              ))}
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || uploadingCover || uploadingPoster}
                className="bg-primary text-black hover:bg-primary/90 disabled:opacity-50"
              >
                {loading
                  ? isEditing
                    ? 'Guardando...'
                    : 'Creando...'
                  : isEditing
                    ? 'Guardar cambios'
                    : 'Crear Proyecto'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
