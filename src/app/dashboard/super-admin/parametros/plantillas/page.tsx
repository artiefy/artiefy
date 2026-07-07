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
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-6xl">
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
              <p>Cargando plantillas...</p>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        {/* Action buttons with consistent styling */}
        <div className="mb-6 flex flex-wrap gap-2">
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
              Crear Nueva Plantilla
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

        {/* Tabla de plantillas */}
        {templates.length === 0 ? (
          <div
            className="
              flex items-center justify-center rounded-xl border
              border-[#1a2a35] bg-[#0a0f14] p-12 text-gray-400
            "
          >
            <p>No hay plantillas creadas. ¡Crea una para empezar!</p>
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
                      Plantilla
                    </th>
                    <th
                      className="
                        p-3 text-left text-[10px] font-semibold
                        tracking-[0.12em] text-[#00BDD8] uppercase
                        sm:px-4
                      "
                    >
                      Porcentaje Total
                    </th>
                    <th
                      className="
                        p-3 text-left text-[10px] font-semibold
                        tracking-[0.12em] text-[#00BDD8] uppercase
                        sm:px-4
                      "
                    >
                      Parámetros incluidos
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
                  {templates.map((template) => (
                    <tr
                      key={template.id}
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
                          {template.name}
                        </div>
                        {template.description && (
                          <div className="mt-1 text-[11px] text-[#4a7080]">
                            {template.description}
                          </div>
                        )}
                      </td>
                      <td
                        className="
                          p-3
                          sm:p-4
                        "
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#00BDD8]">
                            {template.totalPercentage}%
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-32 rounded-full bg-[#0d1a22]">
                          <div
                            className="h-full rounded-full bg-[#00BDD8] transition-all"
                            style={{
                              width: `${Math.min(template.totalPercentage, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </td>
                      <td
                        className="
                          p-3
                          sm:p-4
                        "
                      >
                        {template.parametros.length === 0 ? (
                          <span className="text-xs text-gray-500">
                            Sin parámetros asignados
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {template.parametros.map((param) => (
                              <span
                                key={param.id}
                                className="
                                  inline-flex items-center rounded-full border
                                  border-[#00BDD8]/20 bg-[#0d2830] px-2 py-0.5
                                  text-[10px] text-[#00BDD8]
                                "
                              >
                                {param.name} · {param.porcentaje}%
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td
                        className="
                          p-3
                          sm:p-4
                        "
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenModal(template)}
                            className="
                              rounded-md p-1.5 text-gray-400 transition-colors
                              hover:bg-white/5 hover:text-primary
                            "
                            title="Editar"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="
                              rounded-md p-1.5 text-gray-400 transition-colors
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
              relative m-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto
              rounded-xl bg-[#01142B] p-4 text-white shadow-2xl
              md:p-8
            "
          >
            <div
              className="
                mb-6 flex items-center justify-between border-b
                border-white/10 pb-4
              "
            >
              <h2 className="text-2xl font-bold text-[#3AF4EF]">
                {modal.isEdit ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="
                  rounded-lg bg-white/5 p-2
                  hover:bg-white/10
                "
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Nombre de la Plantilla
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
                  placeholder="Ej: Plantilla de Evaluación Continua"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Descripción (Opcional)
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
                  placeholder="Describe esta plantilla..."
                  rows={2}
                />
              </div>

              {/* Buscador de parámetros */}
              <div className="rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm">
                <label className="block text-sm font-medium text-gray-300">
                  Agregar Parámetros
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="
                    mt-1 w-full rounded-md border border-gray-700
                    bg-gray-900/50 px-4 py-2 text-white
                    placeholder:text-gray-400
                    focus:border-primary focus:outline-none
                  "
                  placeholder="Buscar parámetros..."
                />
              </div>

              {/* Lista de parámetros disponibles */}
              <div
                className="
                  max-h-64 space-y-2 overflow-y-auto rounded-lg border
                  border-[#1a2a35] bg-[#0a0f14] p-4
                "
              >
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
                          `
                            flex items-center justify-between rounded-lg
                            border p-3 transition-colors
                          `,
                          isSelected
                            ? 'border-[#00BDD8]/30 bg-[#0d2830]'
                            : canAdd
                              ? `
                                border-[#1a2a35] bg-gray-900/40
                                hover:border-[#00BDD8]/20
                              `
                              : 'border-red-500/20 bg-red-500/5 opacity-60'
                        )}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[#e8f4f8]">
                            {param.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {param.description}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-[#00BDD8]">
                            {param.porcentaje}%
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleParametro(param.id)}
                            disabled={!canAdd && !isSelected}
                            className={cn(
                              `
                                rounded-md px-3 py-1 text-xs font-medium
                                transition-colors
                              `,
                              isSelected
                                ? `
                                  border border-red-500/30 bg-red-500/10
                                  text-red-400
                                  hover:bg-red-500/20
                                `
                                : canAdd
                                  ? `
                                    border border-white/20 bg-background
                                    text-primary
                                    hover:bg-primary/10
                                  `
                                  : `
                                    cursor-not-allowed border border-white/10
                                    text-gray-500
                                  `
                            )}
                          >
                            {isSelected ? 'Remover' : 'Agregar'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Resumen de parámetros seleccionados */}
              <div className="rounded-lg border border-[#00BDD8]/20 bg-[#0d2830] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#e8f4f8]">
                    Parámetros Seleccionados:{' '}
                    {formData.selectedParametros.length}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      getTotalPercentage() > 100
                        ? 'text-red-400'
                        : 'text-[#00BDD8]'
                    )}
                  >
                    {getTotalPercentage()}%
                  </span>
                </div>
                {getTotalPercentage() > 100 && (
                  <p className="text-xs text-red-400">
                    ⚠️ Excede el 100% permitido
                  </p>
                )}
                {getTotalPercentage() < 100 && getTotalPercentage() > 0 && (
                  <p className="text-xs text-[#ffab40]">
                    ⚠️ Porcentaje incompleto (falta {100 - getTotalPercentage()}
                    %)
                  </p>
                )}
                {getTotalPercentage() === 100 && (
                  <p className="text-xs text-[#00e676]">
                    ✓ Porcentaje completo (100%)
                  </p>
                )}
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
                  disabled={getTotalPercentage() !== 100}
                  className="
                    group/button relative flex-1 overflow-hidden rounded-md
                    border border-white/20 bg-background px-4 py-2 text-sm
                    text-primary transition-all
                    hover:bg-primary/10
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                >
                  <span className="relative z-10 font-medium">
                    {modal.isEdit ? 'Guardar Cambios' : 'Crear Plantilla'}
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

export default PlantillasPage;
