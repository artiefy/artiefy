'use client';

import { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

interface ModalActividadesProps {
  isOpen: boolean;
  onClose: () => void;
  onAnterior: () => void;
  onConfirm: () => void;
  texto: string[];
  setTexto: (value: string[]) => void;
}

const ModalActividades: React.FC<ModalActividadesProps> = ({
  isOpen,
  onClose,
  onAnterior,
  onConfirm,
  texto,
  setTexto,
}) => {
  const [nuevaActividad, setNuevaActividad] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNuevaActividad('');
    }
  }, [isOpen]);

  const agregarActividad = () => {
    if (nuevaActividad.trim()) {
      setTexto([...texto, nuevaActividad.trim()]);
      setNuevaActividad('');
    }
  };

  const eliminarActividad = (index: number) => {
    const nuevas = texto.filter((_, i) => i !== index);
    setTexto(nuevas);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="h-[70%] w-[70%] rounded-lg bg-[#0F2940] p-6 text-white shadow-lg">
        <h2 className="mb-4 text-center text-2xl font-bold text-cyan-400">
          Actividades
        </h2>

        <div className="mb-4 flex">
          <input
            type="text"
            value={nuevaActividad}
            onChange={(e) => setNuevaActividad(e.target.value)}
            placeholder="Nueva actividad..."
            className="flex-grow rounded-l p-2 text-white border border-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-[#1a3b5c]"
          />
          <button
            onClick={agregarActividad}
            className="rounded-r bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Agregar
          </button>
        </div>

        <ul className="mb-4 max-h-40 overflow-y-auto">
          {texto.map((item, index) => (
            <li
              key={index}
              className="mb-1 flex justify-between rounded bg-gray-300 p-2 text-black"
            >
              {item}
              <button
                onClick={() => eliminarActividad(index)}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex justify-between gap-4">
          <button
            onClick={onAnterior}
            className="group flex items-center gap-2 rounded px-4 py-2 font-semibold text-cyan-300 hover:underline"
          >
            <FaArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" />
            Objetivos Específicos
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
            Resumen
            <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalActividades;
