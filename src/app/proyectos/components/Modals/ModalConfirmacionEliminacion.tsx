interface ModalConfirmacionEliminacionProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalConfirmacionEliminacion: React.FC<ModalConfirmacionEliminacionProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0F2940] rounded-lg p-6 max-w-md w-full shadow-lg text-cyan-400">
        <h2 className="text-2xl font-semibold mb-4">Confirmación</h2>
        <p>¿Estás seguro de que deseas eliminar este proyecto?</p>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-black bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700">
            <a href="/proyectos">Confirmar</a>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacionEliminacion;
