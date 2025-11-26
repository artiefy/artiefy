import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

interface ModalObjetivoGenProps {
  isOpen: boolean;
  onClose: () => void;
  onAnterior: () => void;
  onConfirm: () => void;
  texto: string;
  setTexto: (value: string) => void;
}

const ModalObjetivoGen: React.FC<ModalObjetivoGenProps> = ({
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 transition-all duration-300 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative h-auto max-h-[95vh] w-full max-w-xs overflow-y-auto rounded-2xl bg-[#0F2940] p-3 shadow-2xl transition-all duration-300 sm:max-w-lg sm:p-6 md:max-w-2xl lg:max-w-4xl">
        {/* Botón de cierre */}
        {/* <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white z-10"
          aria-label="Cerrar"
        >
          X
        </button> */}
        <h2 className="mb-4 text-center text-2xl font-bold text-cyan-400 sm:text-3xl md:text-4xl">
          Objetivo General
        </h2>
        <div className="min-h-[120px] rounded-xl bg-[#e6f0fa] p-2 text-base shadow-inner sm:min-h-[200px] sm:p-4 sm:text-lg md:text-xl">
          <textarea
            name="Actividades"
            id="act"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="h-full min-h-[80px] w-full resize-none rounded-lg border border-cyan-200 bg-white p-3 text-sm text-gray-800 ring-cyan-300 transition-all duration-200 outline-none focus:ring-2 sm:min-h-[160px] sm:text-base"
            placeholder="Descripción del Objetivo General..."
          />
        </div>
        <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:gap-4">
          <button
            onClick={onAnterior}
            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-6 py-2 font-bold text-white shadow transition-all duration-200 hover:bg-cyan-700 hover:underline sm:w-auto"
          >
            <FaArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" />
            Justificación
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-red-600 px-6 py-2 font-bold text-white shadow transition-colors duration-200 hover:bg-red-700 hover:underline sm:w-auto"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-6 py-2 font-bold text-white shadow transition-all duration-200 hover:bg-cyan-700 hover:underline sm:w-auto"
          >
            Objetivos Específicos
            <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalObjetivoGen;
