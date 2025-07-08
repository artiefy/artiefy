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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="h-[70%] w-[70%] rounded-lg bg-[#0F2940] p-6 shadow-lg">
        <h2 className="mb-4 text-center text-2xl font-bold text-cyan-400">
          Justificacion
        </h2>
        <div className="flex h-[76%] items-center justify-center rounded-lg bg-[#6c7883] text-2xl">
          <textarea
            name="Justificacion"
            id="just"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="flex h-[95%] w-[98%] rounded-lg"
            placeholder="Descripción de la Justificacion..."
           />
        </div>
        <div className="mt-6 flex justify-between gap-4">
          <button
            onClick={onAnterior}
            className="group flex items-center gap-2 rounded px-4 py-2 font-semibold text-cyan-300 hover:underline"
          >
            <FaArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" />
            Planteamiento
          </button>
          <button
            onClick={onClose}
            className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="group flex items-center gap-2 rounded px-4 py-2 font-semibold text-cyan-300 hover:underline"
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
