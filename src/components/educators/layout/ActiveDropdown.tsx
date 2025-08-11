"use client";
import { useEffect, useState } from "react";

interface ActiveDropdownProps {
  isActive: boolean | null;
  setIsActive: (value: boolean) => void;
}

const ActiveDropdown: React.FC<ActiveDropdownProps> = ({
  isActive,
  setIsActive,
}) => {
  const [activeOptions, setActiveOptions] = useState<
    { id: boolean; name: string }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/educadores/CourseActive");
        const data = (await response.json()) as { id: boolean; name: string }[];
        setActiveOptions(data);
      } catch (error) {
        console.error("Error al obtener estados activos:", error);
      }
    };
    void fetchData();
  }, []);

  return (
    <select
      className="mt-2 rounded border border-primary bg-background p-2 text-white outline-none"
      value={isActive !== null ? String(isActive) : ""}
      onChange={(e) => setIsActive(e.target.value === "true")}
    >
      <option value="">Selecciona estado</option>
      {activeOptions.map((option) => (
        <option key={option.id.toString()} value={option.id.toString()}>
          {option.name}
        </option>
      ))}
    </select>
  );
};

export default ActiveDropdown;
