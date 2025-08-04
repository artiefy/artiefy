import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

interface ModalJustificacionProps {
  isOpen: boolean;
  onClose: () => void;
  onAnterior: () => void;
  onConfirm: () => void;
  texto: string;
  setTexto: (value: string) => void;
}

const ModalJustificacion: React.FC<ModalJustificacionProps> = ({
  isOpen,
  onClose,
  onAnterior,
  onConfirm,
  texto,
  setTexto,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="h-auto max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-[#0F2940] p-4 shadow-lg sm:p-6">
        <h2 className="mb-4 text-center text-xl font-bold text-cyan-400 sm:text-2xl">
          Justificación
        </h2>
        <div className="min-h-[200px] rounded-lg bg-[#6c7883] p-2 text-lg sm:min-h-[300px] sm:p-4 sm:text-xl md:text-2xl">
          <textarea
            name="Justificacion"
            id="just"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="h-full min-h-[160px] w-full resize-none rounded-lg p-2 text-sm sm:min-h-[260px] sm:p-3 sm:text-base"
            placeholder="Descripción de la Justificación..."
          />
        </div>
        <div className="mt-4 flex flex-col justify-between gap-3 sm:mt-6 sm:flex-row sm:gap-4">
          <button
            onClick={onAnterior}
            className="group flex w-full items-center justify-center gap-2 rounded px-4 py-2 font-semibold text-cyan-300 hover:underline sm:w-auto"
          >
            <FaArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" />
            Planteamiento
          </button>
          <button
            onClick={onClose}
            className="w-full rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 sm:w-auto"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="group flex w-full items-center justify-center gap-2 rounded px-4 py-2 font-semibold text-cyan-300 hover:underline sm:w-auto"
          >
            Objetivo General
            <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalJustificacion;
