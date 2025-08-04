import { Category } from '~/types';

interface ModalRamaInvestigacionProps {
  isOpen: boolean;
  onClose: () => void;
  categoria?: Category | null;
}

const ModalCategoria: React.FC<ModalRamaInvestigacionProps> = ({
  isOpen,
  onClose,
  categoria,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div />
      <div className="h-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-[#0F2940] p-4 shadow-lg sm:p-6">
        <div className="text-cyan-400">
          <h1 className="mb-4 text-center text-2xl font-semibold sm:text-3xl md:text-4xl">
            Categoria {categoria?.name ?? 'Sin categoría'}
          </h1>
        </div>
        <div className="flex min-h-[200px] items-center justify-center rounded-lg bg-[#6c7883] p-4 text-lg sm:text-xl md:text-2xl">
          <span className="text-center">
            {categoria?.description ?? 'Sin descripción disponible'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ModalCategoria;
