'use client';

import { useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { FiEdit2, FiPlus, FiTrash2, FiX } from 'react-icons/fi';

import { cn } from '~/lib/utils';

interface Parametro {
  id: number;
  name: string;
  description: string;
  porcentaje: number;
  numberOfActivities: number;
  courseId: number | null;
}

interface TemplateParametro {
  id: number;
  name: string;
  description: string;
  porcentaje: number;
  numberOfActivities: number;
}

interface Template {
  id: number;
  name: string;
  description: string | null;
  totalPercentage: number;
  parametros: TemplateParametro[];
  courseId: number | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

interface ModalState {
  isOpen: boolean;
  isEdit: boolean;
  template: Template | null;
}

const PlantillasPage = () => {
  const { user } = useUser();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    isEdit: false,
    template: null,
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedParametros: [] as number[],
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Fetch templates y parámetros
  const fetchData = async () => {
    try {
      setLoading(true);

      const [templatesRes, parametrosRes] = await Promise.all([
        fetch('/api/educadores/templates'),
        fetch('/api/educadores/parametros'),
      ]);

      if (!templatesRes.ok || !parametrosRes.ok)
        throw new Error('Error al cargar datos');

      const templatesData = (await templatesRes.json()) || [];
      const parametrosData = (await parametrosRes.json()) || [];

      setTemplates(templatesData);
      setParametros(parametrosData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (template?: Template) => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        selectedParametros: template.parametros.map((p) => p.id),
      });
      setModal({ isOpen: true, isEdit: true, template });
    } else {
      setFormData({
        name: '',
        description: '',
        selectedParametros: [],
      });
      setModal({ isOpen: true, isEdit: false, template: null });
    }
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false, isEdit: false, template: null });
    setFormData({
      name: '',
      description: '',
      selectedParametros: [],
    });
    setSearchQuery('');
  };

  const getTotalPercentage = () => {
    return formData.selectedParametros.reduce((total, paramId) => {
      const param = parametros.find((p) => p.id === paramId);
      return total + (param?.porcentaje || 0);
    }, 0);
  };

  const canAddParametro = (parametroId: number) => {
    const param = parametros.find((p) => p.id === parametroId);
    const currentTotal = getTotalPercentage();
    return currentTotal + (param?.porcentaje || 0) <= 100;
  };

  const toggleParametro = (parametroId: number) => {
    if (formData.selectedParametros.includes(parametroId)) {
      setFormData({
        ...formData,
        selectedParametros: formData.selectedParametros.filter(
          (p) => p !== parametroId
        ),
      });
    } else {
      if (canAddParametro(parametroId)) {
        setFormData({
          ...formData,
          selectedParametros: [...formData.selectedParametros, parametroId],
        });
      } else {
        setError('Excede el 100% permitido');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const filteredParametros = parametros.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!user?.id) {
        setError('Usuario no identificado');
        return;
      }

      const totalPercentage = getTotalPercentage();
      if (totalPercentage === 0) {
        setError('Debes agregar al menos un parámetro');
        return;
      }

      // Crear o actualizar plantilla
      const templatePayload = {
        name: formData.name,
        description: formData.description,
        creatorId: user.id,
      };

      let templateId: number;

      if (modal.isEdit && modal.template) {
        const res = await fetch('/api/educadores/templates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: modal.template.id,
            ...templatePayload,
          }),
        });
        if (!res.ok) throw new Error('Error al actualizar plantilla');
        templateId = modal.template.id;

        // Eliminar parámetros actuales
        for (const param of modal.template.parametros) {
          await fetch(
            `/api/educadores/templates/parametros?templateId=${templateId}&parametroId=${param.id}`,
            { method: 'DELETE' }
          );
        }
      } else {
        const res = await fetch('/api/educadores/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templatePayload),
        });
        if (!res.ok) throw new Error('Error al crear plantilla');
        const data = await res.json();
        templateId = data.id;
      }

      // Agregar parámetros a la plantilla
      for (let i = 0; i < formData.selectedParametros.length; i++) {
        const res = await fetch('/api/educadores/templates/parametros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId,
            parametroId: formData.selectedParametros[i],
            order: i,
          }),
        });
        if (!res.ok) throw new Error('Error al agregar parámetro a plantilla');
      }

      await fetchData();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta plantilla?'))
      return;

    try {
      const res = await fetch(`/api/educadores/templates?templateId=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar plantilla');

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="loader mb-4 size-12 rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-gray-600">Cargando plantillas...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        {/* Encabezado */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plantillas</h1>
            <p className="mt-2 text-gray-600">
              Organiza parámetros en plantillas reutilizables
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-[#01142B] transition-colors hover:bg-primary/90"
          >
            <FiPlus size={18} />
            Crear Nueva Plantilla
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Grid de plantillas */}
        {templates.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-500">
              No hay plantillas creadas. ¡Crea una para empezar!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {template.name}
                    </h3>
                    {template.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-2 flex gap-2">
                    <button
                      onClick={() => handleOpenModal(template)}
                      className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                      title="Editar"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                      title="Eliminar"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-4 rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">
                      Porcentaje Total
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {template.totalPercentage}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(template.totalPercentage, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">
                    Parámetros incluidos:
                  </p>
                  {template.parametros.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      Sin parámetros asignados
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {template.parametros.map((param) => (
                        <div
                          key={param.id}
                          className="flex items-center justify-between rounded-md bg-blue-50 px-2 py-1"
                        >
                          <span className="text-xs font-medium text-gray-700">
                            {param.name}
                          </span>
                          <span className="text-xs font-semibold text-blue-600">
                            {param.porcentaje}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {modal.isEdit ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre de la Plantilla
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-primary focus:outline-none"
                  placeholder="Ej: Plantilla de Evaluación Continua"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-primary focus:outline-none"
                  placeholder="Describe esta plantilla..."
                  rows={2}
                />
              </div>

              {/* Buscador de parámetros */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Agregar Parámetros
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-primary focus:outline-none"
                  placeholder="Buscar parámetros..."
                />
              </div>

              {/* Lista de parámetros disponibles */}
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
                {filteredParametros.length === 0 ? (
                  <p className="text-center text-sm text-gray-500">
                    No hay parámetros disponibles
                  </p>
                ) : (
                  filteredParametros.map((param) => {
                    const isSelected = formData.selectedParametros.includes(
                      param.id
                    );
                    const canAdd = isSelected || canAddParametro(param.id);

                    return (
                      <div
                        key={param.id}
                        className={cn(
                          'flex items-center justify-between rounded-lg p-3 transition-colors',
                          isSelected
                            ? 'bg-blue-100'
                            : canAdd
                              ? 'bg-white hover:bg-gray-50'
                              : 'bg-red-50 opacity-60'
                        )}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {param.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {param.description}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-700">
                            {param.porcentaje}%
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleParametro(param.id)}
                            disabled={!canAdd && !isSelected}
                            className={cn(
                              'rounded-lg px-3 py-1 text-sm font-medium transition-colors',
                              isSelected
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : canAdd
                                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
                            )}
                          >
                            {isSelected ? 'Removido' : 'Agregar'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Resumen de parámetros seleccionados */}
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-gray-900">
                    Parámetros Seleccionados:{' '}
                    {formData.selectedParametros.length}
                  </span>
                  <span
                    className={cn(
                      'font-bold',
                      getTotalPercentage() > 100
                        ? 'text-red-600'
                        : 'text-gray-900'
                    )}
                  >
                    {getTotalPercentage()}%
                  </span>
                </div>
                {getTotalPercentage() > 100 && (
                  <p className="text-sm text-red-600">
                    ⚠️ Excede el 100% permitido
                  </p>
                )}
                {getTotalPercentage() < 100 && getTotalPercentage() > 0 && (
                  <p className="text-sm text-yellow-600">
                    ⚠️ Porcentaje incompleto (falta {100 - getTotalPercentage()}
                    %)
                  </p>
                )}
                {getTotalPercentage() === 100 && (
                  <p className="text-sm text-green-600">
                    ✓ Porcentaje completo (100%)
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={getTotalPercentage() !== 100}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-[#01142B] hover:bg-primary/90 disabled:opacity-50"
                >
                  {modal.isEdit ? 'Guardar Cambios' : 'Crear Plantilla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantillasPage;
