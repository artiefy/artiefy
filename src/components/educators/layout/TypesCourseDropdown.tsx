import { useEffect } from 'react';

import Select from 'react-select';

import { useCourseTypes } from '~/hooks/useCourseTypes';

// Props que recibe el componente
interface TypesCourseDropdownProps {
  courseTypeId: number[]; // Now expects an array of numbers
  setCourseTypeId: (typeIds: number[]) => void; // Now expects an array of numbers
  errors?: {
    type?: boolean;
  };
}

interface SelectOption {
  value: number;
  label: string;
}

const TypesCourseDropdown: React.FC<TypesCourseDropdownProps> = ({
  courseTypeId,
  setCourseTypeId,
}) => {
  // Usar el hook con caché
  const { types, isLoading } = useCourseTypes();

  // Log para debug
  useEffect(() => {
    console.log('[TypesCourseDropdown] 📊 Estado actual:', {
      courseTypeId,
      typesCount: types.length,
      isLoading,
      types: types.map((t) => ({ id: t.id, name: t.name })),
      validIds: courseTypeId.filter((id) => id !== null && id !== undefined),
    });
  }, [courseTypeId, types, isLoading]);

  // Construir options
  const options: SelectOption[] = types.map((type) => ({
    value: type.id,
    label: type.name,
  }));

  // Filtrar IDs válidos
  const validIds = courseTypeId.filter(
    (id): id is number => id !== null && id !== undefined
  );

  // Construir value - MEJORADO: mapear directamente desde los IDs válidos
  const selectedValue: SelectOption[] = validIds
    .map((id) => {
      // Buscar primero en options para mayor compatibilidad
      const found = options.find((opt) => opt.value === id);
      if (found) {
        console.log(`[TypesCourseDropdown] ✅ ID ${id} mapeado a:`, {
          value: found.value,
          label: found.label,
        });
        return { value: found.value, label: found.label };
      } else {
        // Si no está en options, buscar en types
        const foundType = types.find((t) => t.id === id);
        if (foundType) {
          console.log(
            `[TypesCourseDropdown] ✅ ID ${id} encontrado en types:`,
            {
              value: foundType.id,
              label: foundType.name,
            }
          );
          return { value: foundType.id, label: foundType.name };
        } else {
          console.warn(
            `[TypesCourseDropdown] ⚠️ ID ${id} NO encontrado en tipos disponibles. Options: ${options.map((o) => o.value).join(',')}`
          );
          return null;
        }
      }
    })
    .filter((v): v is SelectOption => v !== null);

  console.log('[TypesCourseDropdown] 📝 RESULTADO FINAL - Valor para Select:', {
    selectedValue,
    totalSelected: selectedValue.length,
    validIds,
    courseTypeId,
    availableOptions: options.length,
  });

  const handleChange = (selectedOptions: unknown) => {
    const options = selectedOptions as SelectOption[] | null;
    const selectedIds = (options ?? [])
      .filter((option): option is SelectOption => option !== null)
      .map((option) => option.value);
    console.log(
      '[TypesCourseDropdown] 📤 onChange - Nuevos tipos seleccionados:',
      selectedIds
    );
    setCourseTypeId(selectedIds);
  };

  return (
    <div className="flex flex-col gap-2">
      {isLoading ? (
        <p className="text-primary">Cargando tipos de curso...</p>
      ) : (
        <>
          {options.length === 0 && (
            <p className="text-sm text-yellow-600">
              No hay tipos de curso disponibles
            </p>
          )}
          <Select
            isMulti
            name="courseTypes"
            options={options}
            value={selectedValue}
            onChange={handleChange}
            classNamePrefix="react-select"
            className="mt-2 w-full"
            placeholder="Selecciona los tipos de curso..."
            noOptionsMessage={() => 'No hay más opciones disponibles'}
            isDisabled={options.length === 0}
          />
          <p className="mt-1 text-xs text-slate-500">
            {validIds.length > 0
              ? `${validIds.length} tipo(s) seleccionado(s)`
              : 'Sin tipos seleccionados'}
          </p>
        </>
      )}
    </div>
  );
};

export default TypesCourseDropdown;
