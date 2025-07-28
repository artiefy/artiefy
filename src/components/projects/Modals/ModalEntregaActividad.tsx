import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/projects/ui/dialog';
import { Button } from '~/components/projects/ui/button';
import {
  Loader2,
  UploadCloud,
  FileText,
  Image,
  Video,
  Archive,
  File,
} from 'lucide-react';

interface ModalEntregaActividadProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    documentFile: File | null,
    imageFile: File | null,
    videoFile: File | null,
    compressedFile: File | null,
    comentario: string
  ) => Promise<void>;
  loading?: boolean;
}

export const ModalEntregaActividad: React.FC<ModalEntregaActividadProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [comentario, setComentario] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Función para determinar el tipo de archivo
  const getFileType = (
    file: File
  ): 'document' | 'image' | 'video' | 'compressed' => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    // Documentos
    if (
      [
        'pdf',
        'doc',
        'docx',
        'txt',
        'rtf',
        'odt',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
      ].includes(extension)
    ) {
      return 'document';
    }

    // Imágenes
    if (
      ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(
        extension
      )
    ) {
      return 'image';
    }

    // Videos
    if (
      ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v'].includes(
        extension
      )
    ) {
      return 'video';
    }

    // Archivos comprimidos
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(extension)) {
      return 'compressed';
    }

    // Por defecto, considerar como documento
    return 'document';
  };

  // Función para obtener el ícono según el tipo de archivo
  const getFileIcon = (file: File) => {
    const type = getFileType(file);
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4 text-blue-400" />;
      case 'image':
        return <Image className="h-4 w-4 text-green-400" />;
      case 'video':
        return <Video className="h-4 w-4 text-purple-400" />;
      case 'compressed':
        return <Archive className="h-4 w-4 text-orange-400" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  // Funciones para drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (loading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      alert('Por favor selecciona al menos un archivo para entregar');
      return;
    }

    if (loading) return;

    try {
      // Clasificar archivos por tipo
      let documentFile: File | null = null;
      let imageFile: File | null = null;
      let videoFile: File | null = null;
      let compressedFile: File | null = null;

      selectedFiles.forEach((file) => {
        const type = getFileType(file);
        switch (type) {
          case 'document':
            if (!documentFile) documentFile = file;
            break;
          case 'image':
            if (!imageFile) imageFile = file;
            break;
          case 'video':
            if (!videoFile) videoFile = file;
            break;
          case 'compressed':
            if (!compressedFile) compressedFile = file;
            break;
        }
      });

      console.log('Iniciando proceso de entrega...');
      console.log('Archivos clasificados:', {
        tieneDocumento: !!documentFile,
        tieneImagen: !!imageFile,
        tieneVideo: !!videoFile,
        tieneComprimido: !!compressedFile,
        tieneComentario: !!comentario,
      });

      console.log(
        'Total de archivos a enviar:',
        (documentFile ? 1 : 0) +
          (imageFile ? 1 : 0) +
          (videoFile ? 1 : 0) +
          (compressedFile ? 1 : 0)
      );

      console.log('Llamando a onSubmit con los archivos clasificados...');

      // Esperar a que se complete la función onSubmit
      await onSubmit(
        documentFile,
        imageFile,
        videoFile,
        compressedFile,
        comentario
      );

      console.log('onSubmit completado exitosamente');

      // Solo limpiar después de éxito
      setSelectedFiles([]);
      setComentario('');

      // NO cerrar automáticamente para debug
      alert(
        'Entrega realizada exitosamente. Revisa la consola para más detalles.'
      );
      // onClose();
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      alert('Error al realizar la entrega. Por favor intenta nuevamente.');
      // No limpiar el formulario si hay error
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-teal-400">
            <UploadCloud className="h-5 w-5" />
            Entregar Actividad
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-200">
              Seleccionar archivos
            </label>

            <div className="flex w-full items-center justify-center">
              <label
                className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200 ${
                  isDragOver
                    ? 'scale-105 border-teal-400 bg-teal-900/30'
                    : 'border-slate-600 bg-slate-700 hover:bg-slate-600'
                } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud
                    className={`mb-3 h-8 w-8 transition-colors ${
                      isDragOver ? 'text-teal-300' : 'text-teal-400'
                    }`}
                  />
                  <p className="mb-2 text-sm text-gray-300">
                    {isDragOver ? (
                      <span className="font-semibold text-teal-300">
                        Suelta los archivos aquí
                      </span>
                    ) : (
                      <>
                        <span className="font-semibold">
                          Haz clic para subir
                        </span>{' '}
                        o arrastra archivos
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    Documentos, imágenes, videos, archivos comprimidos
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>

            {/* Lista de archivos seleccionados */}
            {selectedFiles.length > 0 && (
              <div className="max-h-40 space-y-2 overflow-y-auto">
                <p className="text-sm font-medium text-gray-300">
                  Archivos seleccionados ({selectedFiles.length}):
                </p>
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="animate-fadeIn flex items-center justify-between rounded border border-slate-600 bg-slate-700 p-2"
                  >
                    <div className="flex flex-1 items-center gap-2">
                      {getFileIcon(file)}
                      <span className="max-w-[200px] truncate text-sm text-gray-300">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="p-1 text-red-400 hover:text-red-300"
                      disabled={loading}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-200">
              Comentario (opcional)
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full rounded border border-slate-600 bg-slate-700 p-2 text-white transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500"
              rows={3}
              placeholder="Agrega un comentario sobre tu entrega..."
              disabled={loading}
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="border border-slate-600"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-teal-600 to-teal-400 font-bold text-white hover:from-teal-700 hover:to-teal-500"
              disabled={loading || selectedFiles.length === 0}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                </span>
              ) : (
                'Entregar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModalEntregaActividad;
