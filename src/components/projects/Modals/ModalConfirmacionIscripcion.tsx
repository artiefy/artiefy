import Link from 'next/link';

interface ModalConfirmacionRegistroProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalConfirmacionRegistro: React.FC<ModalConfirmacionRegistroProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-[#0F2940] p-4 text-cyan-400 shadow-lg sm:p-6">
        <h2 className="mb-4 text-xl font-semibold sm:text-2xl">Confirmación</h2>
        <p className="text-sm sm:text-base">
          ¿Estás seguro de que deseas inscribirte a este proyecto?
        </p>
        <div className="mt-4 flex flex-col justify-end gap-3 sm:mt-6 sm:flex-row sm:gap-4">
          <button
            onClick={onClose}
            className="w-full rounded bg-gray-300 px-4 py-2 text-black hover:bg-gray-400 sm:w-auto"
          >
            <Link href="/proyectos/DetallesProyectos" passHref legacyBehavior>
              <button className="w-full rounded bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700 sm:w-auto">
                Confirmar
              </button>
            </Link>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacionRegistro;
