import React from 'react';

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

  // Eliminar proyecto
  const handleEliminarProyecto = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Llamar al callback si existe
        if (onProjectDeleted) {
          onProjectDeleted(projectId);
        }

        onClose();

        // Si no hay callback, redirigir (comportamiento original)
        if (!onProjectDeleted) {
          router.push('/proyectos/MisProyectos');
        }
      } else {
        alert('Error al eliminar el proyecto');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el proyecto');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-[#0F2940] p-6 text-cyan-400 shadow-lg">
        <h2 className="mb-4 text-2xl font-semibold">Confirmación</h2>
        <p>¿Estás seguro de que deseas eliminar este proyecto?</p>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="rounded bg-gray-300 px-4 py-2 text-black hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={handleEliminarProyecto}
            className="rounded bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacionEliminacion;
