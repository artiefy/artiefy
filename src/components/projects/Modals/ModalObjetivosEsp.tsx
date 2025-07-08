// ModalObjetivosEsp.tsx
'use client';

import { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

interface ModalObjetivosEspProps {
  isOpen: boolean;
  onClose: () => void;
  onAnterior: () => void;
  onConfirm: () => void;
  texto: string[];
  setTexto: (value: string[]) => void;
}

const ModalObjetivosEsp: React.FC<ModalObjetivosEspProps> = ({
  isOpen,
  onClose,
  onAnterior,
  onConfirm,
  texto,
  setTexto,
}) => {
  const [nuevoObjetivo, setNuevoObjetivo] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNuevoObjetivo('');
    }
  }, [isOpen]);

  const agregarObjetivo = () => {
    if (nuevoObjetivo.trim()) {
      setTexto([...texto, nuevoObjetivo.trim()]);
      setNuevoObjetivo('');
    }
  };

  const eliminarObjetivo = (index: number) => {
    const nuevos = texto.filter((_, i) => i !== index);
    setTexto(nuevos);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="h-[70%] w-[70%] rounded-lg bg-[#0F2940] p-6 text-white shadow-lg">
        <h2 className="mb-4 text-center text-2xl font-bold text-cyan-400">
          Objetivos Específicos
        </h2>

        <div className="mb-4 flex">
          <input
            type="text"
            value={nuevoObjetivo}
            onChange={(e) => setNuevoObjetivo(e.target.value)}
            placeholder="Nuevo objetivo..."
            className="flex-grow rounded-l p-2 text-white border border-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-[#1a3b5c]"
            //className="flex-grow rounded-l p-2 text-white "
          />
          <button
            onClick={agregarObjetivo}
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
                onClick={() => eliminarObjetivo(index)}
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
            Objetivo General
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
            Actividades
            <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalObjetivosEsp;
