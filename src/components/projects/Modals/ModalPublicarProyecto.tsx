import { Dialog } from '@headlessui/react';
import { RotateCw } from 'lucide-react';

import { Button } from '~/components/projects/ui/button';

interface ModalPublicarProyectoProps {
  isOpen: boolean;
  onClose: () => void;
  comentario: string;
  setComentario: (v: string) => void;
  onConfirm: () => void;
  loading?: boolean; // Nuevo prop
  progress?: number; // Nuevo prop opcional para barra de progreso
  statusText?: string; // Nuevo prop opcional para texto de estado
}

export default function ModalPublicarProyecto({
  isOpen,
  onClose,
  comentario,
  setComentario,
  onConfirm,
  loading = false,
  progress = 0,
  statusText = '',
}: ModalPublicarProyectoProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
    >
      <div className="bg-opacity-50 fixed inset-0 bg-black/70" />
      {/* Barra de progreso de publicación */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="flex w-full max-w-md flex-col items-center rounded-lg bg-[#0F2940] p-6 shadow-lg">
            <div className="mb-4 w-full">
              <div className="h-6 w-full rounded-full bg-gray-200">
                <div
                  className="h-6 rounded-full bg-green-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 text-center font-semibold text-gray-500">
                {statusText
                  ? statusText
                  : progress < 100
                    ? `Publicando... (${progress}%)`
                    : '¡Completado!'}
              </div>
            </div>
            <div className="text-sm text-gray-300">
              Por favor, espera a que termine el proceso.
            </div>
          </div>
        </div>
      )}
      <div
        className={`relative z-10 w-full max-w-md rounded-lg bg-slate-800 p-6 shadow-lg ${loading ? 'pointer-events-none opacity-60 select-none' : ''}`}
      >
        <Dialog.Title className="mb-2 text-lg font-bold text-teal-300">
          Publicar Proyecto
        </Dialog.Title>
        <div className="mb-4 text-sm text-gray-300">
          Ingresa un comentario para el publico del proyecto. Este comentario
          será visible para todos los usuarios.
        </div>
        <textarea
          className="mb-4 w-full rounded border border-slate-600 bg-slate-900 p-2 text-sm text-white"
          rows={4}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Comentario público al publicar..."
          disabled={loading}
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="bg-slate-700 text-gray-300 hover:bg-slate-600"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <RotateCw className="h-4 w-4 animate-spin" />
                Publicando...
              </>
            ) : (
              'Publicar'
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
