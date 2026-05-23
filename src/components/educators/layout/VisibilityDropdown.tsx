'use client';

interface VisibilityDropdownProps {
  visibility: boolean | null;
  setVisibility: (value: boolean) => void;
}

const VisibilityDropdown: React.FC<VisibilityDropdownProps> = ({
  visibility,
  setVisibility,
}) => {
  return (
    <select
      className="mt-2 rounded border border-primary bg-background p-2 text-white outline-none"
      value={visibility !== null ? String(visibility) : ''}
      onChange={(e) => setVisibility(e.target.value === 'true')}
    >
      <option value="">Selecciona visibilidad</option>
      <option value="true">Visible</option>
      <option value="false">Oculto</option>
    </select>
  );
};

export default VisibilityDropdown;
