import { Category } from '~/types';

interface ModalRamaInvestigacionProps {
  isOpen: boolean;
  onClose: () => void;
  categoria?: Category | null;
}

const ModalRamaInvestigacion: React.FC<ModalRamaInvestigacionProps> = ({
  isOpen,
  onClose,
  categoria,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div />
      <div className="h-[50%] w-[60%] rounded-lg bg-[#0F2940] p-6 shadow-lg">
        <div className="text-cyan-400">
          <h1 className="mb-4 text-center text-4xl font-semibold">
            Categoria {categoria?.name ?? 'Sin categoría'}
          </h1>
        </div>
        <div className="flex h-[80%] items-center justify-center rounded-lg bg-[#6c7883] text-2xl">
          <span>{categoria?.description ?? 'Sin descripción disponible'}</span>
        </div>
      </div>
    </div>
  );
};

export default ModalRamaInvestigacion;
