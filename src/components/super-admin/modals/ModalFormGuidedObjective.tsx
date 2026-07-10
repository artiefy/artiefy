'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import { toast } from 'sonner';

import FileUpload from '~/components/educators/layout/FilesUpload';
import { Button } from '~/components/educators/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/educators/ui/dialog';
import { Input } from '~/components/educators/ui/input';
import { Switch } from '~/components/educators/ui/switch';
import { uploadFileToS3 } from '~/lib/uploadFileToS3';

interface ModalFormGuidedObjectiveProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | number;
  objectiveId?: number | null; // si viene → modo editar
  orderIndex?: number;
  onSuccess?: () => void;
}

const EMPTY_DATA = {
  title: '',
  description: '',
  duration: 60,
  coverImageKey: '',
  coverVideoKey: '',
};

export function ModalFormGuidedObjective({
  open,
  onOpenChange,
  projectId,
  objectiveId,
  orderIndex = 0,
  onSuccess,
}: ModalFormGuidedObjectiveProps) {
  const isEditing = !!objectiveId;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [formData, setFormData] = useState(EMPTY_DATA);

  const [needsVideo, setNeedsVideo] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | undefined>();
  const [coverVideoFile, setCoverVideoFile] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Precargar datos si estamos editando
  useEffect(() => {
    if (!open) return;

    if (!objectiveId) {
      setFormData({ ...EMPTY_DATA });
      setNeedsVideo(false);
      setCoverImageFile(undefined);
      setCoverVideoFile(undefined);
      setImagePreview(null);
      setVideoPreview(null);
      return;
    }

    const fetchObjective = async () => {
      setLoadingData(true);
      try {
        const res = await fetch(
          `/api/guided-projects/${projectId}/objectives?id=${objectiveId}`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFormData({
          title: data.title ?? '',
          description: data.description ?? '',
          duration: data.duration ?? 60,
          coverImageKey: data.coverImageKey ?? '',
          coverVideoKey: data.coverVideoKey ?? '',
        });
        setCoverImageFile(undefined);
        setCoverVideoFile(undefined);
        setImagePreview(
          data.coverImageKey
            ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${data.coverImageKey}`
            : null
        );
        if (data.coverVideoKey && data.coverVideoKey !== 'none') {
          setNeedsVideo(true);
          setVideoPreview(
            `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${data.coverVideoKey}`
          );
        } else {
          setNeedsVideo(false);
          setVideoPreview(null);
        }
      } catch {
        toast.error('Error al cargar la sesión');
      } finally {
        setLoadingData(false);
      }
    };

    void fetchObjective();
  }, [open, objectiveId, projectId]);

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration / 60);
      };
      video.onerror = () => reject(new Error('Error al cargar el video'));
      video.src = URL.createObjectURL(file);
    });
  };

  const handleImageFileChange = (file: File | File[] | null | undefined) => {
    const selected = Array.isArray(file) ? file[0] : file;
    if (!selected) return;
    setCoverImageFile(selected);
    setImagePreview(URL.createObjectURL(selected));
  };

  const handleVideoFileChange = (file: File | File[] | null | undefined) => {
    const selected = Array.isArray(file) ? file[0] : file;
    if (!selected) return;
    setCoverVideoFile(selected);
    setVideoPreview(URL.createObjectURL(selected));
    getVideoDuration(selected)
      .then((duration) => {
        setFormData((prev) => ({ ...prev, duration: Math.round(duration) }));
      })
      .catch((error) => console.error('Error al leer duración:', error));
  };

  // Captura el frame actual del video y lo usa como imagen de portada
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'coverimage.png', { type: 'image/png' });
      setCoverImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      toast.success('Frame capturado como imagen de portada');
    }, 'image/png');
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast.error('El título es requerido');
      return;
    }
    setLoading(true);
    setUploading(true);
    try {
      let coverImageKey = formData.coverImageKey;
      let coverVideoKey = formData.coverVideoKey;

      if (coverImageFile) {
        const result = await uploadFileToS3(coverImageFile);
        coverImageKey = result.key;
      }

      if (!needsVideo) {
        coverVideoKey = 'none';
      } else if (coverVideoFile) {
        const result = await uploadFileToS3(coverVideoFile);
        coverVideoKey = result.key;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        duration: formData.duration,
        coverImageKey,
        coverVideoKey,
        ...(isEditing ? {} : { orderIndex }),
      };

      const url = isEditing
        ? `/api/guided-projects/${projectId}/objectives?id=${objectiveId}`
        : `/api/guided-projects/${projectId}/objectives`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();

      toast.success(
        isEditing ? 'Sesión actualizada' : 'Sesión creada correctamente'
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar la sesión');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const labelClass = 'text-sm font-medium text-white';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-cyan-500/30 bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Editar sesión' : 'Nueva sesión'}
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex justify-center py-12">
            <div className="size-10 animate-spin rounded-full border-b-2 border-cyan-500" />
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <label className={labelClass}>Título *</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Título de la sesión"
                className="border-cyan-500/30 bg-slate-800 text-white placeholder-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe la sesión"
                rows={3}
                className="w-full rounded-md border border-cyan-500/30 bg-slate-800 p-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="max-w-[200px] space-y-2">
              <label className={labelClass}>Duración (minutos)</label>
              <Input
                type="number"
                min={0}
                value={formData.duration}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    duration: parseInt(e.target.value) || 0,
                  }))
                }
                className="border-cyan-500/30 bg-slate-800 text-white placeholder-gray-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="needs-video"
                checked={needsVideo}
                onChange={(e) => setNeedsVideo(e.target.checked)}
              />
              <label htmlFor="needs-video" className={labelClass}>
                ¿Esta sesión necesita video?
              </label>
            </div>

            {isEditing && (imagePreview ?? videoPreview) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {imagePreview && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                      Imagen actual
                    </label>
                    <Image
                      src={imagePreview}
                      alt="Imagen actual"
                      width={400}
                      height={128}
                      className="h-32 w-full rounded-lg object-cover"
                      unoptimized={imagePreview.startsWith('blob:')}
                    />
                  </div>
                )}
                {videoPreview && needsVideo && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                      Video actual
                    </label>
                    <video
                      src={videoPreview}
                      controls
                      className="h-32 w-full rounded-lg object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FileUpload
                key="coverimage"
                type="image"
                label="Imagen de portada"
                accept="image/*"
                maxSize={50}
                tipo="Imagen"
                onFileChange={handleImageFileChange}
                file={coverImageFile}
              />
              {needsVideo && (
                <FileUpload
                  key="covervideo"
                  type="video"
                  label="Video de la sesión"
                  accept="video/mp4"
                  maxSize={16000}
                  tipo="Video"
                  onFileChange={handleVideoFileChange}
                  file={coverVideoFile}
                />
              )}
            </div>

            {coverVideoFile && (
              <div className="space-y-3">
                <video
                  ref={videoRef}
                  controls
                  className="mx-auto w-full max-w-sm rounded-lg"
                >
                  <source
                    src={URL.createObjectURL(coverVideoFile)}
                    type="video/mp4"
                  />
                </video>
                <div className="mx-auto w-fit">
                  <Button
                    type="button"
                    onClick={captureFrame}
                    className="bg-cyan-500 text-white hover:bg-cyan-600"
                  >
                    Capturar frame como imagen de portada
                  </Button>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>
            )}

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
                disabled={loading || uploading}
                className="bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50"
              >
                {loading
                  ? isEditing
                    ? 'Guardando...'
                    : 'Creando...'
                  : isEditing
                    ? 'Guardar cambios'
                    : 'Crear sesión'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
