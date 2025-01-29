import { AlertCircle } from 'lucide-react';
import { MouseEventHandler } from 'react';

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 shadow-xl text-white">
        <div className="flex items-center space-x-2 text-blue-400 mb-4">
          <AlertCircle className="w-6 h-6" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        <p className="text-gray-300 mb-6">{message}</p>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
