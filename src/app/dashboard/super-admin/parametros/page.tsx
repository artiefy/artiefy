'use client';

import { useEffect, useState } from 'react';

import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';

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

const ParametrosPage = () => {
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
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div
            className="
              loader mb-4 size-12 rounded-full border-4 border-primary
              border-t-transparent
            "
          ></div>
          <p className="text-gray-600">Cargando parámetros...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        {/* Encabezado */}
        <div
          className="
            mb-8 flex flex-col gap-4
            md:flex-row md:items-center md:justify-between
          "
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Parámetros de Evaluación
            </h1>
            <p className="mt-2 text-gray-600">
              Gestiona criterios de evaluación reutilizables
            </p>
          </div>
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
                rounded-lg border border-gray-300 px-3 py-2 text-sm
                focus:border-primary focus:outline-none
              "
            />
            <button
              onClick={() => handleOpenModal()}
              className="
                flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm
                font-medium text-[#01142B] transition-colors
                hover:bg-primary/90
              "
            >
              <FiPlus size={18} />
              Crear Nuevo Parámetro
            </button>
          </div>
        </div>

        {error && (
          <div
            className="
              mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700
            "
          >
            {error}
          </div>
        )}

        {/* Tabla de parámetros con filtro y paginación */}
        {parametros.length === 0 ? (
          <div
            className="
              rounded-lg border border-gray-200 bg-white p-8 text-center
            "
          >
            <p className="text-gray-500">
              No hay parámetros creados aún. ¡Crea uno para empezar!
            </p>
          </div>
        ) : (
          <div
            className="
              overflow-x-auto rounded-lg border border-gray-200 bg-white
            "
          >
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th
                    className="
                      px-6 py-3 text-left text-xs font-semibold text-gray-700
                    "
                  >
                    Nombre
                  </th>
                  <th
                    className="
                      px-6 py-3 text-left text-xs font-semibold text-gray-700
                    "
                  >
                    Descripción
                  </th>
                  <th
                    className="
                      px-6 py-3 text-left text-xs font-semibold text-gray-700
                    "
                  >
                    Porcentaje
                  </th>
                  <th
                    className="
                      px-6 py-3 text-left text-xs font-semibold text-gray-700
                    "
                  >
                    Número de Actividades
                  </th>
                  <th
                    className="
                      px-6 py-3 text-left text-xs font-semibold text-gray-700
                    "
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parametros
                  .filter(
                    (param) =>
                      param.name.toLowerCase().includes(search.toLowerCase()) ||
                      param.description
                        .toLowerCase()
                        .includes(search.toLowerCase())
                  )
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  )
                  .map((param) => (
                    <tr key={param.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {param.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {param.description}
                      </td>
                      <td
                        className="
                          px-6 py-4 text-sm font-semibold text-gray-900
                        "
                      >
                        {param.porcentaje}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {param.numberOfActivities}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(param)}
                            className="
                              rounded-lg bg-blue-50 p-2 text-blue-600
                              hover:bg-blue-100
                            "
                            title="Editar"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(param.id)}
                            className="
                              rounded-lg bg-red-50 p-2 text-red-600
                              hover:bg-red-100
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
            {/* Paginación */}
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-sm text-gray-600">
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
                    rounded border px-3 py-1 text-sm
                    disabled:opacity-50
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
                    rounded border px-3 py-1 text-sm
                    disabled:opacity-50
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
            fixed inset-0 z-50 flex items-center justify-center bg-black/50
          "
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              {modal.isEdit ? 'Editar Parámetro' : 'Crear Nuevo Parámetro'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="
                    mt-1 w-full rounded-lg border border-gray-300 px-4 py-2
                    text-gray-900 placeholder-gray-500
                    focus:border-primary focus:outline-none
                  "
                  placeholder="Ej: Participación en clase"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="
                    mt-1 w-full rounded-lg border border-gray-300 px-4 py-2
                    text-gray-900 placeholder-gray-500
                    focus:border-primary focus:outline-none
                  "
                  placeholder="Describe este parámetro..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Porcentaje (%)
                </label>
                <input
                  type="number"
                  value={formData.porcentaje}
                  onChange={(e) =>
                    setFormData({ ...formData, porcentaje: e.target.value })
                  }
                  className="
                    mt-1 w-full rounded-lg border border-gray-300 px-4 py-2
                    text-gray-900 placeholder-gray-500
                    focus:border-primary focus:outline-none
                  "
                  placeholder="Ej: 30"
                  min="0"
                  max="100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
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
                    mt-1 w-full rounded-lg border border-gray-300 px-4 py-2
                    text-gray-900 placeholder-gray-500
                    focus:border-primary focus:outline-none
                  "
                  placeholder="Ej: 4"
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  El porcentaje se dividirá equitativamente entre las
                  actividades
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="
                    flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm
                    font-medium text-gray-700
                    hover:bg-gray-50
                  "
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="
                    flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium
                    text-[#01142B]
                    hover:bg-primary/90
                  "
                >
                  {modal.isEdit ? 'Guardar Cambios' : 'Crear Parámetro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParametrosPage;
