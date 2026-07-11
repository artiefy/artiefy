'use client';

import { useEffect, useState } from 'react';

import {
  FiEdit2,
  FiFileText,
  FiPlus,
  FiSliders,
  FiTrash2,
} from 'react-icons/fi';

import { cn, normalizeSearch } from '~/lib/utils';

import PlantillasPage from './plantillas/page';

interface Parametro {
  id: number;
  name: string;
  description: string;
  porcentaje: number;
  numberOfActivities: number;
  courseId: number | null;
}

interface ModalState {
  isOpen: boolean;
  isEdit: boolean;
  parametro: Parametro | null;
}

const ParametrosListView = () => {
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    isEdit: false,
    parametro: null,
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    porcentaje: '',
    numberOfActivities: '',
  });

  // Filtro de búsqueda
  const [search, setSearch] = useState('');
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch parámetros
  const fetchParametros = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/educadores/parametros');
      if (!res.ok) throw new Error('Error al cargar parámetros');
      const data = await res.json();
      setParametros(data);
      setError(null);
      setCurrentPage(1); // Reiniciar página al cargar
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParametros();
  }, []);

  const handleOpenModal = (parametro?: Parametro) => {
    if (parametro) {
      setFormData({
        name: parametro.name,
        description: parametro.description,
        porcentaje: parametro.porcentaje.toString(),
        numberOfActivities: parametro.numberOfActivities.toString(),
      });
      setModal({ isOpen: true, isEdit: true, parametro });
    } else {
      setFormData({
        name: '',
        description: '',
        porcentaje: '',
        numberOfActivities: '',
      });
      setModal({ isOpen: true, isEdit: false, parametro: null });
    }
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false, isEdit: false, parametro: null });
    setFormData({
      name: '',
      description: '',
      porcentaje: '',
      numberOfActivities: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validación básica
      if (!formData.name.trim()) {
        setError('El título es requerido');
        return;
      }

      if (!formData.description.trim()) {
        setError('La descripción es requerida');
        return;
      }

      if (!formData.porcentaje || parseInt(formData.porcentaje) <= 0) {
        setError('El porcentaje debe ser mayor a 0');
        return;
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        porcentaje: parseInt(formData.porcentaje),
        numberOfActivities: formData.numberOfActivities
          ? parseInt(formData.numberOfActivities)
          : 0,
      };

      const url = modal.isEdit
        ? `/api/educadores/parametros/${modal.parametro?.id}`
        : '/api/educadores/parametros';

      const method = modal.isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar parámetro');
      }

      await fetchParametros();
      handleCloseModal();
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      console.error('Error al guardar parámetro:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este parámetro?'))
      return;

    try {
      const res = await fetch(`/api/educadores/parametros/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al eliminar parámetro');
      }

      await fetchParametros();
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      console.error('Error al eliminar parámetro:', err);
    }
  };

  if (loading)
    return (
      <div
        className="
          flex items-center justify-center rounded-xl border
          border-[#1a2a35] bg-[#0a0f14] p-12 text-gray-400
        "
      >
        <div className="text-center">
          <div
            className="
              loader mb-4 size-12 rounded-full border-4 border-primary
              border-t-transparent
            "
          ></div>
          <p>Cargando parámetros...</p>
        </div>
      </div>
    );

  return (
    <div>
      <div className="mx-auto max-w-6xl">
        {/* Barra de búsqueda y creación */}
        <div
          className="
            mb-6 flex flex-col gap-4
            md:flex-row md:items-center md:justify-end
          "
        >
          <div
            className="
              flex flex-col gap-2
              md:flex-row md:items-center
            "
          >
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="
                rounded-md border border-gray-700 bg-gray-900/50 px-3 py-2
                text-sm text-white placeholder:text-gray-400
                focus:border-primary focus:outline-none
              "
            />
            <button
              onClick={() => handleOpenModal()}
              className="
                group/button relative inline-flex items-center justify-center
                gap-1 overflow-hidden rounded-md border border-white/20
                bg-background px-2 py-1.5 text-xs text-primary transition-all
                hover:bg-primary/10
                sm:gap-2 sm:px-4 sm:py-2 sm:text-sm
              "
            >
              <span className="relative z-10 font-medium">
                Crear Nuevo Parámetro
              </span>
              <FiPlus
                className="
                  relative z-10 size-3.5
                  sm:size-4
                "
              />
              <div
                className="
                  absolute inset-0 z-0 bg-gradient-to-r from-transparent
                  via-white/10 to-transparent opacity-0 transition-all
                  duration-500
                  group-hover/button:[transform:translateX(100%)]
                  group-hover/button:opacity-100
                "
              />
            </button>
          </div>
        </div>

        {error && (
          <div
            className="
              mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4
              text-sm text-red-400
            "
          >
            {error}
          </div>
        )}

        {/* Tabla de parámetros con filtro y paginación */}
        {parametros.length === 0 ? (
          <div
            className="
              flex items-center justify-center rounded-xl border
              border-[#1a2a35] bg-[#0a0f14] p-12 text-gray-400
            "
          >
            <p>No hay parámetros creados aún. ¡Crea uno para empezar!</p>
          </div>
        ) : (
          <div
            className="
              overflow-hidden rounded-lg bg-gray-800/50 shadow-xl
              backdrop-blur-sm
            "
          >
            <div className="overflow-x-auto">
              <table
                className="
                  min-w-full table-auto border-collapse overflow-hidden
                  rounded-xl border border-[#1a2a35] bg-[#0a0f14]
                "
              >
                <thead>
                  <tr className="border-b border-[#00BDD8] bg-[#0d1a22]">
                    <th
                      className="
                        p-3 text-left text-[10px] font-semibold
                        tracking-[0.12em] text-[#00BDD8] uppercase
                        sm:px-4
                      "
                    >
                      Nombre
                    </th>
                    <th
                      className="
                        p-3 text-left text-[10px] font-semibold
                        tracking-[0.12em] text-[#00BDD8] uppercase
                        sm:px-4
                      "
                    >
                      Descripción
                    </th>
                    <th
                      className="
                        p-3 text-left text-[10px] font-semibold
                        tracking-[0.12em] text-[#00BDD8] uppercase
                        sm:px-4
                      "
                    >
                      Porcentaje
                    </th>
                    <th
                      className="
                        p-3 text-left text-[10px] font-semibold
                        tracking-[0.12em] text-[#00BDD8] uppercase
                        sm:px-4
                      "
                    >
                      Número de Actividades
                    </th>
                    <th
                      className="
                        p-3 text-right text-[10px] font-semibold
                        tracking-[0.12em] text-[#00BDD8] uppercase
                        sm:px-4
                      "
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parametros
                    .filter(
                      (param) =>
                        normalizeSearch(param.name).includes(
                          normalizeSearch(search)
                        ) ||
                        normalizeSearch(param.description).includes(
                          normalizeSearch(search)
                        )
                    )
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((param) => (
                      <tr
                        key={param.id}
                        className="
                          border-b border-[#111c24] transition-colors
                          last:border-0
                          hover:bg-[#0d1e28]
                        "
                      >
                        <td
                          className="
                            p-3
                            sm:p-4
                          "
                        >
                          <div
                            className="
                              text-xs font-medium text-[#e8f4f8]
                              sm:text-sm
                            "
                          >
                            {param.name}
                          </div>
                        </td>
                        <td
                          className="
                            p-3 text-xs text-[#4a7080]
                            sm:p-4 sm:text-sm
                          "
                        >
                          {param.description}
                        </td>
                        <td
                          className="
                            p-3
                            sm:p-4
                          "
                        >
                          <span className="text-sm font-bold text-[#00BDD8]">
                            {param.porcentaje}%
                          </span>
                        </td>
                        <td
                          className="
                            p-3 text-xs text-[#4a7080]
                            sm:p-4 sm:text-sm
                          "
                        >
                          {param.numberOfActivities}
                        </td>
                        <td
                          className="
                            p-3
                            sm:p-4
                          "
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenModal(param)}
                              className="
                                rounded-md p-1.5 text-gray-400
                                transition-colors
                                hover:bg-white/5 hover:text-primary
                              "
                              title="Editar"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(param.id)}
                              className="
                                rounded-md p-1.5 text-gray-400
                                transition-colors
                                hover:bg-white/5 hover:text-red-400
                              "
                              title="Eliminar"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {/* Paginación */}
            <div className="flex items-center justify-between px-3 py-4 sm:px-4">
              <span className="text-xs text-gray-400 sm:text-sm">
                Página {currentPage} de{' '}
                {Math.max(
                  1,
                  Math.ceil(
                    parametros.filter(
                      (param) =>
                        param.name
                          .toLowerCase()
                          .includes(search.toLowerCase()) ||
                        param.description
                          .toLowerCase()
                          .includes(search.toLowerCase())
                    ).length / itemsPerPage
                  )
                )}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="
                    rounded-md border border-white/20 px-3 py-1 text-xs
                    text-gray-300
                    hover:bg-white/5
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={
                    currentPage >=
                    Math.ceil(
                      parametros.filter(
                        (param) =>
                          param.name
                            .toLowerCase()
                            .includes(search.toLowerCase()) ||
                          param.description
                            .toLowerCase()
                            .includes(search.toLowerCase())
                      ).length / itemsPerPage
                    )
                  }
                  className="
                    rounded-md border border-white/20 px-3 py-1 text-xs
                    text-gray-300
                    hover:bg-white/5
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.isOpen && (
        <div
          className="
            fixed inset-0 z-[9999] flex items-center justify-center
            bg-black/50
          "
        >
          <div
            className="
              relative m-4 w-full max-w-md rounded-xl bg-[#01142B] p-4
              text-white shadow-2xl
              md:p-8
            "
          >
            <h2 className="mb-6 border-b border-white/10 pb-4 text-2xl font-bold text-[#3AF4EF]">
              {modal.isEdit ? 'Editar Parámetro' : 'Crear Nuevo Parámetro'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="
                    mt-1 w-full rounded-md border border-gray-700
                    bg-gray-900/50 px-4 py-2 text-white
                    placeholder:text-gray-400
                    focus:border-primary focus:outline-none
                  "
                  placeholder="Ej: Participación en clase"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="
                    mt-1 w-full rounded-md border border-gray-700
                    bg-gray-900/50 px-4 py-2 text-white
                    placeholder:text-gray-400
                    focus:border-primary focus:outline-none
                  "
                  placeholder="Describe este parámetro..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Porcentaje (%)
                </label>
                <input
                  type="number"
                  value={formData.porcentaje}
                  onChange={(e) =>
                    setFormData({ ...formData, porcentaje: e.target.value })
                  }
                  className="
                    mt-1 w-full rounded-md border border-gray-700
                    bg-gray-900/50 px-4 py-2 text-white
                    placeholder:text-gray-400
                    focus:border-primary focus:outline-none
                  "
                  placeholder="Ej: 30"
                  min="0"
                  max="100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Número de Actividades
                </label>
                <input
                  type="number"
                  value={formData.numberOfActivities}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numberOfActivities: e.target.value,
                    })
                  }
                  className="
                    mt-1 w-full rounded-md border border-gray-700
                    bg-gray-900/50 px-4 py-2 text-white
                    placeholder:text-gray-400
                    focus:border-primary focus:outline-none
                  "
                  placeholder="Ej: 4"
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-400">
                  El porcentaje se dividirá equitativamente entre las
                  actividades
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="
                    group/button relative flex-1 overflow-hidden rounded-md
                    border border-white/20 bg-background px-4 py-2 text-sm
                    text-primary transition-all
                    hover:bg-primary/10
                  "
                >
                  <span className="relative z-10 font-medium">Cancelar</span>
                  <div
                    className="
                      absolute inset-0 z-0 bg-gradient-to-r from-transparent
                      via-white/10 to-transparent opacity-0 transition-all
                      duration-500
                      group-hover/button:[transform:translateX(100%)]
                      group-hover/button:opacity-100
                    "
                  />
                </button>
                <button
                  type="submit"
                  className="
                    group/button relative flex-1 overflow-hidden rounded-md
                    border border-white/20 bg-background px-4 py-2 text-sm
                    text-primary transition-all
                    hover:bg-primary/10
                  "
                >
                  <span className="relative z-10 font-medium">
                    {modal.isEdit ? 'Guardar Cambios' : 'Crear Parámetro'}
                  </span>
                  <div
                    className="
                      absolute inset-0 z-0 bg-gradient-to-r from-transparent
                      via-white/10 to-transparent opacity-0 transition-all
                      duration-500
                      group-hover/button:[transform:translateX(100%)]
                      group-hover/button:opacity-100
                    "
                  />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TABS = [
  {
    id: 'parametros',
    label: 'Parámetros',
    icon: FiSliders,
    Component: ParametrosListView,
  },
  {
    id: 'plantillas',
    label: 'Plantillas',
    icon: FiFileText,
    Component: PlantillasPage,
  },
] as const;

export default function ParametrosPage() {
  const [activeTab, setActiveTab] =
    useState<(typeof TABS)[number]['id']>('parametros');

  const ActiveComponent =
    TABS.find((tab) => tab.id === activeTab)?.Component ?? TABS[0].Component;

  return (
    <div
      className="
        p-4
        sm:p-6
      "
    >
      <div>
        <h1
          className="
            text-2xl font-bold text-white
            sm:text-3xl
          "
        >
          Parámetros
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Gestiona los parámetros y plantillas de los cursos.
        </p>
      </div>

      <div
        className="
          mt-6 flex flex-wrap gap-2 rounded-2xl border border-white/10
          bg-gray-900/30 p-2
        "
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-black'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <ActiveComponent />
      </div>
    </div>
  );
}
