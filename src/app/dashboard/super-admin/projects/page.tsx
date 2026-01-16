'use client';

import { useEffect, useState } from 'react';

import { Edit, Loader2, Plus, Trash2, X } from 'lucide-react';

interface ProjectType {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProjectPhase {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProjectTypePhase {
  id: number;
  projectTypeId: number;
  phaseId: number;
  phaseName: string;
  phaseDescription: string | null;
  order: number;
  isRequired: boolean;
}

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<'types' | 'phases' | 'mapping'>(
    'types'
  );

  // ======== Estados para Tipos ========
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [showCreateTypeForm, setShowCreateTypeForm] = useState(false);
  const [showEditTypeForm, setShowEditTypeForm] = useState(false);
  const [editingType, setEditingType] = useState<ProjectType | null>(null);
  const [typeFormData, setTypeFormData] = useState({
    name: '',
    description: '',
  });

  // ======== Estados para Fases ========
  const [projectPhases, setProjectPhases] = useState<ProjectPhase[]>([]);
  const [phasesLoading, setPhasesLoading] = useState(true);
  const [phasesError, setPhasesError] = useState<string | null>(null);
  const [showCreatePhaseForm, setShowCreatePhaseForm] = useState(false);
  const [showEditPhaseForm, setShowEditPhaseForm] = useState(false);
  const [editingPhase, setEditingPhase] = useState<ProjectPhase | null>(null);
  const [phaseFormData, setPhaseFormData] = useState({
    name: '',
    description: '',
  });

  // ======== Estados para Asignación (Type → Phases) ========
  const [selectedTypeForMapping, setSelectedTypeForMapping] = useState<
    number | null
  >(null);
  const [typePhases, setTypePhases] = useState<ProjectTypePhase[]>([]);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingError, setMappingError] = useState<string | null>(null);
  const [mappingFormData, setMappingFormData] = useState<
    Array<{ phaseId: number; order: number; isRequired: boolean }>
  >([]);
  const [showMappingConfirm, setShowMappingConfirm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'type' | 'phase';
    id: number;
    name: string;
  } | null>(null);

  // ======== Cargar datos iniciales ========
  useEffect(() => {
    loadProjectTypes();
    loadProjectPhases();
  }, []);

  // ======== Funciones para Tipos ========
  async function loadProjectTypes() {
    try {
      setTypesLoading(true);
      const res = await fetch('/api/super-admin/projects/types');
      if (!res.ok) throw new Error('Error al cargar tipos');
      const data = (await res.json()) as ProjectType[];
      setProjectTypes(data);
    } catch (error) {
      setTypesError(
        error instanceof Error ? error.message : 'Error desconocido'
      );
    } finally {
      setTypesLoading(false);
    }
  }

  async function handleCreateType() {
    try {
      const res = await fetch('/api/super-admin/projects/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: typeFormData.name,
          description: typeFormData.description || null,
          isActive: true,
        }),
      });
      if (!res.ok) throw new Error('Error al crear tipo');
      await loadProjectTypes();
      setTypeFormData({ name: '', description: '' });
      setShowCreateTypeForm(false);
    } catch (error) {
      setTypesError(
        error instanceof Error ? error.message : 'Error desconocido'
      );
    }
  }

  async function handleUpdateType() {
    if (!editingType) return;
    try {
      const res = await fetch('/api/super-admin/projects/types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingType.id,
          name: typeFormData.name,
          description: typeFormData.description || null,
        }),
      });
      if (!res.ok) throw new Error('Error al actualizar tipo');
      await loadProjectTypes();
      setTypeFormData({ name: '', description: '' });
      setEditingType(null);
      setShowEditTypeForm(false);
    } catch (error) {
      setTypesError(
        error instanceof Error ? error.message : 'Error desconocido'
      );
    }
  }

  async function handleDeleteType(id: number) {
    try {
      const res = await fetch('/api/super-admin/projects/types', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Error al eliminar tipo');
      await loadProjectTypes();
      setConfirmDelete(null);
    } catch (error) {
      setTypesError(
        error instanceof Error ? error.message : 'Error desconocido'
      );
    }
  }

  // ======== Funciones para Fases ========
  async function loadProjectPhases() {
    try {
      setPhasesLoading(true);
      const res = await fetch('/api/super-admin/projects/phases');
      if (!res.ok) throw new Error('Error al cargar fases');
      const data = (await res.json()) as ProjectPhase[];
      setProjectPhases(data);
    } catch (error) {
      setPhasesError(
        error instanceof Error ? error.message : 'Error desconocido'
      );
    } finally {
      setPhasesLoading(false);
    }
  }

  async function handleCreatePhase() {
    try {
      const res = await fetch('/api/super-admin/projects/phases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: phaseFormData.name,
          description: phaseFormData.description || null,
          isActive: true,
        }),
      });
      if (!res.ok) throw new Error('Error al crear fase');
      await loadProjectPhases();
      setPhaseFormData({ name: '', description: '' });
      setShowCreatePhaseForm(false);
    } catch (error) {
      setPhasesError(
        error instanceof Error ? error.message : 'Error desconocido'
      );
    }
  }

  async function handleUpdatePhase() {
    if (!editingPhase) return;
    try {
      const res = await fetch('/api/super-admin/projects/phases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPhase.id,
          name: phaseFormData.name,
          description: phaseFormData.description || null,
        }),
      });
      if (!res.ok) throw new Error('Error al actualizar fase');
      await loadProjectPhases();
      setPhaseFormData({ name: '', description: '' });
      setEditingPhase(null);
      setShowEditPhaseForm(false);
    } catch (error) {
      setPhasesError(
        error instanceof Error ? error.message : 'Error desconocido'
      );
    }
  }

  async function handleDeletePhase(id: number) {
    try {
      const res = await fetch('/api/super-admin/projects/phases', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Error al eliminar fase');
      await loadProjectPhases();
      setConfirmDelete(null);
    } catch (error) {
      setPhasesError(
        error instanceof Error ? error.message : 'Error desconocido'
      );
    }
  }

  // ======== Funciones para Asignación ========
  async function loadTypePhases(typeId: number) {
    try {
      setMappingLoading(true);
      const res = await fetch(
        `/api/super-admin/projects/type-phases?projectTypeId=${typeId}`
      );
      if (!res.ok) throw new Error('Error al cargar fases del tipo');
      const data = (await res.json()) as ProjectTypePhase[];
      setTypePhases(data);
      setMappingFormData(
        data.map((tp) => ({
          phaseId: tp.phaseId,
          order: tp.order,
          isRequired: tp.isRequired,
        }))
      );
    } catch (error) {
      setMappingError(
        error instanceof Error ? error.message : 'Error desconocido'
      );
    } finally {
      setMappingLoading(false);
    }
  }

  async function handleSaveMapping() {
    if (selectedTypeForMapping === null) return;
    try {
      setMappingLoading(true);
      const res = await fetch('/api/super-admin/projects/type-phases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTypeId: selectedTypeForMapping,
          phases: mappingFormData,
        }),
      });
      if (!res.ok) throw new Error('Error al guardar asignación');
      await loadTypePhases(selectedTypeForMapping);
      setShowMappingConfirm(false);
    } catch (error) {
      setMappingError(
        error instanceof Error ? error.message : 'Error desconocido'
      );
    } finally {
      setMappingLoading(false);
    }
  }

  function addPhaseToMapping(phaseId: number) {
    const maxOrder = Math.max(...mappingFormData.map((f) => f.order), 0);
    setMappingFormData([
      ...mappingFormData,
      { phaseId, order: maxOrder + 1, isRequired: true },
    ]);
  }

  function removePhaseFromMapping(phaseId: number) {
    setMappingFormData(mappingFormData.filter((f) => f.phaseId !== phaseId));
  }

  function movePhaseUp(index: number) {
    if (index === 0) return;
    const newData = [...mappingFormData];
    [newData[index - 1], newData[index]] = [newData[index], newData[index - 1]];
    // Actualizar órdenes
    newData.forEach((item, i) => {
      item.order = i + 1;
    });
    setMappingFormData(newData);
  }

  function movePhaseDown(index: number) {
    if (index === mappingFormData.length - 1) return;
    const newData = [...mappingFormData];
    [newData[index], newData[index + 1]] = [newData[index + 1], newData[index]];
    // Actualizar órdenes
    newData.forEach((item, i) => {
      item.order = i + 1;
    });
    setMappingFormData(newData);
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Encabezado */}
      <div className="mb-8">
        <header className="flex items-center justify-between rounded-lg bg-[#00BDD8] p-6 shadow-md">
          <h1 className="text-3xl font-bold text-[#01142B]">
            Gestión de Proyectos
          </h1>
        </header>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab('types');
            setTypesError(null);
          }}
          className={`px-4 py-3 font-semibold transition-all ${
            activeTab === 'types'
              ? 'border-b-2 border-[#00BDD8] text-[#00BDD8]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Tipos de Proyecto
        </button>
        <button
          onClick={() => {
            setActiveTab('phases');
            setPhasesError(null);
          }}
          className={`px-4 py-3 font-semibold transition-all ${
            activeTab === 'phases'
              ? 'border-b-2 border-[#00BDD8] text-[#00BDD8]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Fases
        </button>
        <button
          onClick={() => {
            setActiveTab('mapping');
            setMappingError(null);
          }}
          className={`px-4 py-3 font-semibold transition-all ${
            activeTab === 'mapping'
              ? 'border-b-2 border-[#00BDD8] text-[#00BDD8]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Asignación de Fases
        </button>
      </div>

      {/* Contenido por Tab */}
      {activeTab === 'types' && (
        <TabTypes
          projectTypes={projectTypes}
          typesLoading={typesLoading}
          typesError={typesError}
          showCreateForm={showCreateTypeForm}
          setShowCreateForm={setShowCreateTypeForm}
          showEditForm={showEditTypeForm}
          setShowEditForm={setShowEditTypeForm}
          editingType={editingType}
          setEditingType={setEditingType}
          typeFormData={typeFormData}
          setTypeFormData={setTypeFormData}
          onCreate={handleCreateType}
          onUpdate={handleUpdateType}
          onDelete={handleDeleteType}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
        />
      )}

      {activeTab === 'phases' && (
        <TabPhases
          projectPhases={projectPhases}
          phasesLoading={phasesLoading}
          phasesError={phasesError}
          showCreateForm={showCreatePhaseForm}
          setShowCreateForm={setShowCreatePhaseForm}
          showEditForm={showEditPhaseForm}
          setShowEditForm={setShowEditPhaseForm}
          editingPhase={editingPhase}
          setEditingPhase={setEditingPhase}
          phaseFormData={phaseFormData}
          setPhaseFormData={setPhaseFormData}
          onCreate={handleCreatePhase}
          onUpdate={handleUpdatePhase}
          onDelete={handleDeletePhase}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
        />
      )}

      {activeTab === 'mapping' && (
        <TabMapping
          projectTypes={projectTypes}
          projectPhases={projectPhases}
          selectedTypeForMapping={selectedTypeForMapping}
          setSelectedTypeForMapping={setSelectedTypeForMapping}
          typePhases={typePhases}
          mappingLoading={mappingLoading}
          mappingError={mappingError}
          mappingFormData={mappingFormData}
          setMappingFormData={setMappingFormData}
          showMappingConfirm={showMappingConfirm}
          setShowMappingConfirm={setShowMappingConfirm}
          onLoadTypePhases={loadTypePhases}
          onSaveMapping={handleSaveMapping}
          onAddPhase={addPhaseToMapping}
          onRemovePhase={removePhaseFromMapping}
          onMoveUp={movePhaseUp}
          onMoveDown={movePhaseDown}
        />
      )}

      {/* Modales de confirmación */}
      {confirmDelete && (
        <ConfirmDeleteModal
          type={confirmDelete.type}
          name={confirmDelete.name}
          onConfirm={() => {
            if (confirmDelete.type === 'type') {
              handleDeleteType(confirmDelete.id);
            } else {
              handleDeletePhase(confirmDelete.id);
            }
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ==================== COMPONENTES AUXILIARES ====================

interface TabTypesProps {
  projectTypes: ProjectType[];
  typesLoading: boolean;
  typesError: string | null;
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
  showEditForm: boolean;
  setShowEditForm: (show: boolean) => void;
  editingType: ProjectType | null;
  setEditingType: (type: ProjectType | null) => void;
  typeFormData: { name: string; description: string };
  setTypeFormData: (data: { name: string; description: string }) => void;
  onCreate: () => void;
  onUpdate: () => void;
  onDelete: (id: number) => void;
  confirmDelete: { type: 'type' | 'phase'; id: number; name: string } | null;
  setConfirmDelete: (
    data: { type: 'type' | 'phase'; id: number; name: string } | null
  ) => void;
}

function TabTypes({
  projectTypes,
  typesLoading,
  typesError,
  showCreateForm,
  setShowCreateForm,
  showEditForm,
  setShowEditForm,
  editingType,
  setEditingType,
  typeFormData,
  setTypeFormData,
  onCreate,
  onUpdate,
  onDelete,
  confirmDelete,
  setConfirmDelete,
}: TabTypesProps) {
  return (
    <div>
      {typesError && (
        <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
          {typesError}
        </div>
      )}

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            setShowCreateForm(true);
            setTypeFormData({ name: '', description: '' });
            setEditingType(null);
          }}
          className="flex items-center gap-2 rounded-lg bg-[#00BDD8] px-4 py-2 font-semibold text-[#01142B] hover:bg-[#00A5C0]"
        >
          <Plus size={18} /> Crear Tipo
        </button>
      </div>

      {typesLoading ? (
        <div className="flex justify-center">
          <Loader2 className="animate-spin text-[#00BDD8]" size={32} />
        </div>
      ) : (
        <div className="space-y-3">
          {projectTypes.map((type) => (
            <div
              key={type.id}
              className="flex items-center justify-between rounded-lg border border-gray-300 bg-white p-4 shadow-sm"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-[#01142B]">{type.name}</h3>
                {type.description && (
                  <p className="text-sm text-gray-600">{type.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    type.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {type.isActive ? 'Activo' : 'Inactivo'}
                </span>
                <button
                  onClick={() => {
                    setEditingType(type);
                    setTypeFormData({
                      name: type.name,
                      description: type.description || '',
                    });
                    setShowEditForm(true);
                  }}
                  className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                  title="Editar"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() =>
                    setConfirmDelete({
                      type: 'type',
                      id: type.id,
                      name: type.name,
                    })
                  }
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {projectTypes.length === 0 && (
            <p className="text-center text-gray-500">
              No hay tipos de proyecto creados
            </p>
          )}
        </div>
      )}

      {/* Modal crear/editar */}
      {(showCreateForm || showEditForm) && (
        <Modal
          title={editingType ? 'Editar Tipo' : 'Crear Tipo'}
          onClose={() => {
            setShowCreateForm(false);
            setShowEditForm(false);
            setEditingType(null);
            setTypeFormData({ name: '', description: '' });
          }}
          onSubmit={editingType ? onUpdate : onCreate}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Nombre *
              </label>
              <input
                type="text"
                value={typeFormData.name}
                onChange={(e) =>
                  setTypeFormData({ ...typeFormData, name: e.target.value })
                }
                placeholder="Ej: Capstone"
                className="mt-2 w-full text-black rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00BDD8]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Descripción
              </label>
              <textarea
                value={typeFormData.description}
                onChange={(e) =>
                  setTypeFormData({
                    ...typeFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Opcional"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00BDD8]"
                rows={3}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

interface TabPhasesProps {
  projectPhases: ProjectPhase[];
  phasesLoading: boolean;
  phasesError: string | null;
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
  showEditForm: boolean;
  setShowEditForm: (show: boolean) => void;
  editingPhase: ProjectPhase | null;
  setEditingPhase: (phase: ProjectPhase | null) => void;
  phaseFormData: { name: string; description: string };
  setPhaseFormData: (data: { name: string; description: string }) => void;
  onCreate: () => void;
  onUpdate: () => void;
  onDelete: (id: number) => void;
  confirmDelete: { type: 'type' | 'phase'; id: number; name: string } | null;
  setConfirmDelete: (
    data: { type: 'type' | 'phase'; id: number; name: string } | null
  ) => void;
}

function TabPhases({
  projectPhases,
  phasesLoading,
  phasesError,
  showCreateForm,
  setShowCreateForm,
  showEditForm,
  setShowEditForm,
  editingPhase,
  setEditingPhase,
  phaseFormData,
  setPhaseFormData,
  onCreate,
  onUpdate,
  onDelete,
  confirmDelete,
  setConfirmDelete,
}: TabPhasesProps) {
  return (
    <div>
      {phasesError && (
        <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
          {phasesError}
        </div>
      )}

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            setShowCreateForm(true);
            setPhaseFormData({ name: '', description: '' });
            setEditingPhase(null);
          }}
          className="flex items-center gap-2 rounded-lg bg-[#00BDD8] px-4 py-2 font-semibold text-[#01142B] hover:bg-[#00A5C0]"
        >
          <Plus size={18} /> Crear Fase
        </button>
      </div>

      {phasesLoading ? (
        <div className="flex justify-center">
          <Loader2 className="animate-spin text-[#00BDD8]" size={32} />
        </div>
      ) : (
        <div className="space-y-3">
          {projectPhases.map((phase) => (
            <div
              key={phase.id}
              className="flex items-center justify-between rounded-lg border border-gray-300 bg-white p-4 shadow-sm"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-[#01142B]">{phase.name}</h3>
                {phase.description && (
                  <p className="text-sm text-gray-600">{phase.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    phase.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {phase.isActive ? 'Activo' : 'Inactivo'}
                </span>
                <button
                  onClick={() => {
                    setEditingPhase(phase);
                    setPhaseFormData({
                      name: phase.name,
                      description: phase.description || '',
                    });
                    setShowEditForm(true);
                  }}
                  className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                  title="Editar"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() =>
                    setConfirmDelete({
                      type: 'phase',
                      id: phase.id,
                      name: phase.name,
                    })
                  }
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {projectPhases.length === 0 && (
            <p className="text-center text-gray-500">No hay fases creadas</p>
          )}
        </div>
      )}

      {/* Modal crear/editar */}
      {(showCreateForm || showEditForm) && (
        <Modal
          title={editingPhase ? 'Editar Fase' : 'Crear Fase'}
          onClose={() => {
            setShowCreateForm(false);
            setShowEditForm(false);
            setEditingPhase(null);
            setPhaseFormData({ name: '', description: '' });
          }}
          onSubmit={editingPhase ? onUpdate : onCreate}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Nombre *
              </label>
              <input
                type="text"
                value={phaseFormData.name}
                onChange={(e) =>
                  setPhaseFormData({ ...phaseFormData, name: e.target.value })
                }
                placeholder="Ej: Planificación"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00BDD8]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Descripción
              </label>
              <textarea
                value={phaseFormData.description}
                onChange={(e) =>
                  setPhaseFormData({
                    ...phaseFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Opcional"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00BDD8]"
                rows={3}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

interface TabMappingProps {
  projectTypes: ProjectType[];
  projectPhases: ProjectPhase[];
  selectedTypeForMapping: number | null;
  setSelectedTypeForMapping: (id: number | null) => void;
  typePhases: ProjectTypePhase[];
  mappingLoading: boolean;
  mappingError: string | null;
  mappingFormData: Array<{
    phaseId: number;
    order: number;
    isRequired: boolean;
  }>;
  setMappingFormData: (
    data: Array<{ phaseId: number; order: number; isRequired: boolean }>
  ) => void;
  showMappingConfirm: boolean;
  setShowMappingConfirm: (show: boolean) => void;
  onLoadTypePhases: (typeId: number) => void;
  onSaveMapping: () => void;
  onAddPhase: (phaseId: number) => void;
  onRemovePhase: (phaseId: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

function TabMapping({
  projectTypes,
  projectPhases,
  selectedTypeForMapping,
  setSelectedTypeForMapping,
  typePhases,
  mappingLoading,
  mappingError,
  mappingFormData,
  setMappingFormData,
  showMappingConfirm,
  setShowMappingConfirm,
  onLoadTypePhases,
  onSaveMapping,
  onAddPhase,
  onRemovePhase,
  onMoveUp,
  onMoveDown,
}: TabMappingProps) {
  return (
    <div>
      {mappingError && (
        <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
          {mappingError}
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Selecciona un Tipo de Proyecto
          </label>
          <select
            value={selectedTypeForMapping || ''}
            onChange={(e) => {
              const typeId = parseInt(e.target.value);
              setSelectedTypeForMapping(typeId);
              onLoadTypePhases(typeId);
            }}
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00BDD8]"
          >
            <option value="">-- Selecciona --</option>
            {projectTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedTypeForMapping && (
        <div className="space-y-6">
          {mappingLoading ? (
            <div className="flex justify-center">
              <Loader2 className="animate-spin text-[#00BDD8]" size={32} />
            </div>
          ) : (
            <>
              {/* Fases disponibles para agregar */}
              {mappingFormData.length < projectPhases.length && (
                <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
                  <h3 className="mb-3 font-semibold text-gray-700">
                    Agregar Fase
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {projectPhases
                      .filter(
                        (phase) =>
                          !mappingFormData.some((f) => f.phaseId === phase.id)
                      )
                      .map((phase) => (
                        <button
                          key={phase.id}
                          onClick={() => onAddPhase(phase.id)}
                          className="rounded-lg bg-[#00BDD8] px-3 py-2 text-sm font-semibold text-[#01142B] hover:bg-[#00A5C0]"
                        >
                          + {phase.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Fases asignadas */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700">Fases Asignadas</h3>
                {mappingFormData.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay fases asignadas
                  </p>
                ) : (
                  mappingFormData.map((item, index) => {
                    const phase = projectPhases.find(
                      (p) => p.id === item.phaseId
                    );
                    return (
                      <div
                        key={item.phaseId}
                        className="flex items-center justify-between rounded-lg border border-gray-300 bg-white p-4"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-[#01142B]">
                            {index + 1}. {phase?.name}
                          </div>
                          {phase?.description && (
                            <p className="text-sm text-gray-600">
                              {phase.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={item.isRequired}
                              onChange={(e) => {
                                const newData = [...mappingFormData];
                                newData[index].isRequired = e.target.checked;
                                setMappingFormData(newData);
                              }}
                              className="rounded"
                            />
                            <span>Obligatoria</span>
                          </label>
                          <button
                            onClick={() => onMoveUp(index)}
                            disabled={index === 0}
                            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                            title="Subir"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => onMoveDown(index)}
                            disabled={index === mappingFormData.length - 1}
                            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                            title="Bajar"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => onRemovePhase(item.phaseId)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Botón guardar */}
              {mappingFormData.length > 0 && (
                <button
                  onClick={() => setShowMappingConfirm(true)}
                  className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
                >
                  Guardar Asignación
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal confirmación guardar */}
      {showMappingConfirm && (
        <Modal
          title="Confirmar Guardado"
          onClose={() => setShowMappingConfirm(false)}
          onSubmit={onSaveMapping}
        >
          <p className="text-gray-700">
            ¿Deseas guardar esta asignación de fases?
          </p>
        </Modal>
      )}
    </div>
  );
}

// ==================== MODALES ====================

interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}

function Modal({ title, onClose, onSubmit, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#01142B]">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mb-6">{children}</div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            className="rounded-lg bg-[#00BDD8] px-4 py-2 font-semibold text-[#01142B] hover:bg-[#00A5C0]"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmDeleteModalProps {
  type: 'type' | 'phase';
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteModal({
  type,
  name,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const typeLabel = type === 'type' ? 'tipo de proyecto' : 'fase';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-[#01142B]">
          Confirmar Eliminación
        </h2>
        <p className="mb-6 text-gray-700">
          ¿Estás seguro de que deseas eliminar el {typeLabel} &quot;
          <strong>{name}</strong>&quot;?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
