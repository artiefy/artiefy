import { Dialog } from '@headlessui/react';
import { Button } from '~/components/projects/ui/button';
import { RotateCw } from 'lucide-react';

interface ModalPublicarProyectoProps {
  isOpen: boolean;
  onClose: () => void;
  comentario: string;
  setComentario: (v: string) => void;
  onConfirm: () => void;
  loading?: boolean; // Nuevo prop
}

export default function ModalPublicarProyecto({
  isOpen,
  onClose,
  comentario,
  setComentario,
  onConfirm,
  loading = false,
}: ModalPublicarProyectoProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
    >
      <div className="bg-opacity-50 fixed inset-0 bg-black/70" />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-slate-800 p-6 shadow-lg">
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
