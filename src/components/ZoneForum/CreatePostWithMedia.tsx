'use client';

import { useRef,useState } from 'react';

import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
// Update the import path below to the correct location of your Textarea component.
// For example, if the correct path is '~/components/ui/textarea', use:
import { Textarea } from '~/components/estudiantes/ui/textarea';

// Or, if you need to create the file, create 'src/components/ui/textarea.tsx' with your Textarea component.

interface CreatePostWithMediaProps {
  forumId: number;
  onPostCreated: () => void;
  isSubmitting?: boolean;
}

export function CreatePostWithMedia({
  forumId,
  onPostCreated,
  isSubmitting = false,
}: CreatePostWithMediaProps) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('El contenido es obligatorio');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('foroId', String(forumId));

      if (imageFile) {
        formData.append('image', imageFile);
        setUploadProgress(20);
      }
      if (audioFile) {
        formData.append('audio', audioFile);
        setUploadProgress(40);
      }
      if (videoFile) {
        formData.append('video', videoFile);
        setUploadProgress(60);
      }

      setUploadProgress(70);

      const response = await fetch('/api/forums/posts', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(90);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear el post');
      }

      setUploadProgress(100);
      toast.success('¡Post creado exitosamente!');

      // Limpiar formulario
      setContent('');
      setImageFile(null);
      setAudioFile(null);
      setVideoFile(null);
      setUploadProgress(0);

      onPostCreated();
    } catch (error) {
      console.error('Error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al crear el post'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-gray-700 bg-black/20 p-4"
    >
      <div>
        <label className="text-primary text-sm font-medium mb-2 block">
          ¿Qué tienes en mente?
        </label>
        <Textarea
          ref={textareaRef}
          placeholder="Escribe tu mensaje aquí..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-24 resize-none border-gray-600 bg-black/40 text-white placeholder:text-gray-500"
          disabled={isLoading}
        />
      </div>

      {/* Inputs para media */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Imagen */}
        <div>
          <label className="text-primary text-xs font-medium mb-1 block">
            Imagen (máx 5MB)
          </label>
          <label className="flex items-center justify-center rounded-md border border-dashed border-gray-600 bg-black/20 p-3 cursor-pointer hover:bg-black/30 transition">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="hidden"
              disabled={isLoading}
            />
            <span className="text-xs text-gray-400">
              {imageFile ? `✓ ${imageFile.name}` : '📷 Imagen'}
            </span>
          </label>
        </div>

        {/* Audio */}
        <div>
          <label className="text-primary text-xs font-medium mb-1 block">
            Audio (máx 50MB)
          </label>
          <label className="flex items-center justify-center rounded-md border border-dashed border-gray-600 bg-black/20 p-3 cursor-pointer hover:bg-black/30 transition">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
              className="hidden"
              disabled={isLoading}
            />
            <span className="text-xs text-gray-400">
              {audioFile ? `✓ ${audioFile.name}` : '🎵 Audio'}
            </span>
          </label>
        </div>

        {/* Video */}
        <div>
          <label className="text-primary text-xs font-medium mb-1 block">
            Video (máx 200MB)
          </label>
          <label className="flex items-center justify-center rounded-md border border-dashed border-gray-600 bg-black/20 p-3 cursor-pointer hover:bg-black/30 transition">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              className="hidden"
              disabled={isLoading}
            />
            <span className="text-xs text-gray-400">
              {videoFile ? `✓ ${videoFile.name}` : '🎬 Video'}
            </span>
          </label>
        </div>
      </div>

      {/* Progress bar */}
      {isLoading && uploadProgress > 0 && (
        <div className="space-y-1">
          <div className="h-2 w-full rounded-full bg-gray-700 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">{uploadProgress}% completado</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading || isSubmitting || !content.trim()}
        className="w-full bg-primary hover:bg-primary/90 text-black font-semibold"
      >
        {isLoading ? `Enviando... ${uploadProgress}%` : 'Publicar Post'}
      </Button>
    </form>
  );
}
