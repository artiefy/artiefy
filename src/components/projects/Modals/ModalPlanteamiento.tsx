import { FaArrowRight } from 'react-icons/fa';

interface ModalPlanteamientoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // Nuevo prop
  texto: string;
  setTexto: (value: string) => void;
}

const ModalPlanteamiento: React.FC<ModalPlanteamientoProps> = ({
  isOpen,
  onClose,
  onConfirm,
  texto,
  setTexto,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="h-auto max-h-[95vh] w-full max-w-xs overflow-y-auto rounded-lg bg-[#0F2940] p-3 shadow-lg sm:max-w-lg sm:p-4 md:max-w-2xl lg:max-w-4xl">
        <h2 className="mb-4 text-center text-lg font-bold text-cyan-400 sm:text-xl md:text-2xl">
          Planteamiento del Problema
        </h2>
        <div className="min-h-[120px] rounded-lg bg-[#6c7883] p-2 text-base sm:min-h-[200px] sm:p-4 sm:text-lg md:text-xl">
          <textarea
            name="Planteamiento"
            id="plant"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="h-full min-h-[80px] w-full resize-none rounded-lg p-2 text-sm sm:min-h-[160px] sm:p-3 sm:text-base"
            placeholder="Descripción del Planteamiento..."
          />
        </div>
        <div className="mt-4 flex flex-col justify-between gap-3 sm:mt-6 sm:flex-row sm:gap-4">
          <button
            onClick={onClose}
            className="hidden rounded px-12 py-2 sm:block"
          />
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="w-full rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 sm:w-auto"
            >
              Cancelar
            </button>
          </div>
          <button
            className="group flex w-full items-center justify-center gap-2 rounded px-4 py-2 font-semibold text-cyan-300 hover:underline sm:w-auto"
            onClick={onConfirm}
          >
            Justificación
            <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPlanteamiento;
