interface ModalRamaInvestigacionProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalRamaInvestigacion: React.FC<ModalRamaInvestigacionProps> = ({
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
      <div />
      <div className="bg-[#0F2940] rounded-lg p-6 w-[60%] h-[50%] shadow-lg">
        <div className="text-cyan-400">
           <h1 className="text-4xl text-center font-semibold mb-4">Rama de Investigación</h1>
        </div>
        <div className="flex justify-center items-center text-2xl bg-[#6c7883] rounded-lg h-[80%]">
          <h1>Decripcion</h1>
        </div>
      </div>
    </div>
  );
};

export default ModalRamaInvestigacion;
