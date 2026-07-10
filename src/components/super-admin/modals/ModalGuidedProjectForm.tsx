'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import { FiUploadCloud } from 'react-icons/fi';
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
  instructor: string;
  individualPrice: number;
  isActive: boolean;
  isTop: boolean;
  isFeatured: boolean;
  visibility: boolean;
  requiresProgram: boolean;
  coverImageKey: string;
  coverVideoKey: string;
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
  instructor: '',
  individualPrice: 0,
  isActive: true,
  isTop: false,
  isFeatured: false,
  visibility: true,
  requiresProgram: false,
  coverImageKey: '',
  coverVideoKey: '',
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

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [needsVideo, setNeedsVideo] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof GuidedProjectFormData, value: unknown) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  // Cargar opciones de selects al abrir
  useEffect(() => {
    if (!open) return;

    const fetchOptions = async () => {
      try {
        const [edRes, catRes, modRes, nivRes] = await Promise.all([
          fetch('/api/educators'),
          fetch('/api/educadores/categories'),
          fetch('/api/educadores/modalidades'),
          fetch('/api/educadores/nivel'),
        ]);
        const [ed, cat, mod, niv] = await Promise.all([
          edRes.json(),
          catRes.json(),
          modRes.json(),
          nivRes.json(),
        ]);
        setEducators(ed);
        setCategories(cat);
        setModalidades(mod);
        setNiveles(niv);
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
      setImagePreview(null);
      setVideoPreview(null);
      setNeedsVideo(false);
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
          instructor: data.instructor ?? '',
          individualPrice: data.individualPrice ?? 0,
          isActive: data.isActive ?? true,
          isTop: data.isTop ?? false,
          isFeatured: data.isFeatured ?? false,
          visibility: data.visibility ?? true,
          requiresProgram: data.requiresProgram ?? false,
          coverImageKey: data.coverImageKey ?? '',
          coverVideoKey: data.coverVideoKey ?? '',
        });
        if (data.coverImageKey) {
          setImagePreview(
            `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${data.coverImageKey}`
          );
        }
        if (data.coverVideoKey && data.coverVideoKey !== 'none') {
          setNeedsVideo(true);
          setVideoPreview(
            `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${data.coverVideoKey}`
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

  // Upload imagen
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);

    try {
      // 1. Pedir presigned POST
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

      // 2. Subir con FormData (presigned POST requiere fields)
      const formDataUpload = new FormData();
      Object.entries(fields as Record<string, string>).forEach(([k, v]) => {
        formDataUpload.append(k, v);
      });
      formDataUpload.append('file', file);

      const s3Res = await fetch(url, {
        method: 'POST',
        body: formDataUpload,
      });
      if (!s3Res.ok) throw new Error('Error al subir a S3');

      set('coverImageKey', key);
      toast.success('Imagen subida');
    } catch (err) {
      console.error(err);
      toast.error('Error al subir imagen');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  // Upload video
  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoPreview(URL.createObjectURL(file));
    setUploadingVideo(true);

    try {
      const { key } = await uploadFileToS3(file);
      set('coverVideoKey', key);
      toast.success('Video subido');
    } catch (err) {
      console.error(err);
      toast.error('Error al subir video');
      setVideoPreview(null);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.instructor) {
      toast.error('Título e instructor son requeridos');
      return;
    }
    setLoading(true);
    try {
      const url = isEditing
        ? `/api/guided-projects?id=${projectId}`
        : '/api/guided-projects';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        coverVideoKey: needsVideo ? formData.coverVideoKey : 'none',
      };

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
            {/* Imagen */}
            <div className="space-y-2">
              <label className={labelClass}>Imagen de portada</label>
              <div
                onClick={() => imageInputRef.current?.click()}
                className="relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-600 bg-gray-800 transition hover:border-primary"
              >
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <FiUploadCloud className="size-8" />
                    <span className="text-sm">
                      {uploadingImage
                        ? 'Subiendo...'
                        : 'Clic para subir imagen'}
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {/* Video */}
            <div className="space-y-2">
              <label className={checkLabel}>
                <input
                  type="checkbox"
                  checked={needsVideo}
                  onChange={(e) => setNeedsVideo(e.target.checked)}
                  className="size-4 accent-primary"
                />
                ¿Este proyecto necesita video?
              </label>

              {needsVideo && (
                <>
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    className="relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-600 bg-gray-800 transition hover:border-primary"
                  >
                    {videoPreview ? (
                      <video
                        src={videoPreview}
                        controls
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <FiUploadCloud className="size-8" />
                        <span className="text-sm">
                          {uploadingVideo
                            ? 'Subiendo...'
                            : 'Clic para subir video'}
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4"
                    className="hidden"
                    onChange={handleVideoChange}
                  />
                </>
              )}
            </div>

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

            {/* Instructor */}
            <div className="space-y-2">
              <label className={labelClass}>Instructor *</label>
              <select
                value={formData.instructor}
                onChange={(e) => set('instructor', e.target.value)}
                className={inputClass}
              >
                <option value="">Selecciona un instructor</option>
                {educators.map((ed) => (
                  <option key={ed.id} value={ed.id}>
                    {ed.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Precio */}
            <div className="space-y-2">
              <label className={labelClass}>Precio individual</label>
              <Input
                type="number"
                value={formData.individualPrice}
                onChange={(e) => set('individualPrice', Number(e.target.value))}
                placeholder="0"
                className="border-gray-600 bg-gray-900 text-white placeholder-gray-500"
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(
                [
                  ['isActive', 'Activo'],
                  ['isTop', 'Top'],
                  ['isFeatured', 'Destacado'],
                  ['visibility', 'Visible'],
                  ['requiresProgram', 'Requiere programa'],
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
                disabled={loading || uploadingImage || uploadingVideo}
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
