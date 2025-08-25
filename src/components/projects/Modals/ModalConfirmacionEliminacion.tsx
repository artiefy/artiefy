import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

interface ModalConfirmacionEliminacionProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onProjectDeleted?: (projectId: number) => void;
}

const ModalConfirmacionEliminacion: React.FC<
  ModalConfirmacionEliminacionProps
> = ({ isOpen, onClose, projectId, onProjectDeleted }) => {
  const router = useRouter();

  // Estado para barra de progreso y texto
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  // Eliminar proyecto
  const handleEliminarProyecto = async () => {
    setIsDeleting(true);
    setProgress(10);
    setStatusText('Eliminando proyecto...');
    try {
      // Simula progreso
      setTimeout(() => setProgress(30), 100);
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      setProgress(70);
      if (response.ok) {
        setProgress(100);
        setStatusText('Proyecto eliminado correctamente.');
        setTimeout(() => {
          // Llamar al callback si existe
          if (onProjectDeleted) {
            onProjectDeleted(projectId);
          }
          onClose();
          // Si no hay callback, redirigir (comportamiento original)
          if (!onProjectDeleted) {
            router.push('/proyectos/MisProyectos');
          }
          setIsDeleting(false);
          setProgress(0);
          setStatusText('');
        }, 600);
      } else {
        setIsDeleting(false);
        setProgress(0);
        setStatusText('');
        alert('Error al eliminar el proyecto');
      }
    } catch (error) {
      setIsDeleting(false);
      setProgress(0);
      setStatusText('');
      console.error('Error:', error);
      alert('Error al eliminar el proyecto');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Barra de progreso de eliminación */}
      {isDeleting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="flex w-full max-w-md flex-col items-center rounded-lg bg-[#0F2940] p-6 shadow-lg">
            <div className="mb-4 w-full">
              <div className="h-6 w-full rounded-full bg-gray-200">
                <div
                  className="h-6 rounded-full bg-red-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 text-center font-semibold text-gray-500">
                {statusText
                  ? statusText
                  : progress < 100
                    ? `Eliminando... (${progress}%)`
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
        className={`w-full max-w-md rounded-lg bg-[#0F2940] p-4 text-cyan-400 shadow-lg sm:p-6 ${isDeleting ? 'pointer-events-none opacity-60 select-none' : ''}`}
      >
        <h2 className="mb-4 text-xl font-semibold sm:text-2xl">Confirmación</h2>
        <p className="text-sm sm:text-base">
          ¿Estás seguro de que deseas eliminar este proyecto?
        </p>
        <div className="mt-4 flex flex-col justify-end gap-3 sm:mt-6 sm:flex-row sm:gap-4">
          <button
            onClick={onClose}
            className="w-full rounded bg-gray-300 px-4 py-2 text-black hover:bg-gray-400 sm:w-auto"
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            onClick={handleEliminarProyecto}
            className="w-full rounded bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700 sm:w-auto"
            disabled={isDeleting}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacionEliminacion;
