import { AlertCircle } from 'lucide-react';

interface InfoDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void; // Cierra el modal
}

/**
 * Muestra un diálogo de información (sin confirmación).
 */
export function InfoDialog({
  isOpen,
  title,
  message,
  onClose,
}: InfoDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-gray-900 p-6 text-white shadow-xl">
        <div className="mb-4 flex items-center space-x-2 text-blue-400">
          <AlertCircle className="h-6 w-6" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        <p className="mb-6 text-gray-300">{message}</p>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
