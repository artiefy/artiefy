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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="h-[70%] w-[70%] rounded-lg bg-[#0F2940] p-6 shadow-lg">
        <h2 className="mb-4 text-center text-2xl font-bold text-cyan-400">
          Planteamiento del Problema
        </h2>
        <div className="flex h-[76%] items-center justify-center rounded-lg bg-[#6c7883] text-2xl">
          <textarea
            name="Planteamiento"
            id="plant"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="flex h-[95%] w-[98%] rounded-lg"
            placeholder="Descripción del Planteamiento..."
           />
        </div>
        <div className="mt-6 flex justify-between gap-4">
          <button onClick={onClose} className="rounded px-12 py-2" />
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
            >
              Cancelar
            </button>
          </div>
          <button
            className="group flex items-center gap-2 rounded px-4 py-2 font-semibold text-cyan-300 hover:underline"
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
