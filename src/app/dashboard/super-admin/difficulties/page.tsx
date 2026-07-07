'use client';

import { useEffect, useState } from 'react';

import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

interface Nivel {
  id: number;
  name: string;
  description: string;
}

export default function NivelesPage() {
  const [nivel, setNivel] = useState<Nivel[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingNivel, setEditingNivel] = useState<Nivel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    void fetchNivel();
  }, []);

  async function fetchNivel() {
    try {
      setLoading(true);
      const res = await fetch('/api/super-admin/niveles');
      if (!res.ok) throw new Error('Error al cargar niveles');
      const data = (await res.json()) as Nivel[];
      setNivel(data);
    } catch {
      setError('Error al obtener niveles.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      await fetch('/api/super-admin/niveles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      setName('');
      setDescription('');
      void fetchNivel();
      setShowCreateForm(false);
    } catch {
      setError('Error al guardar nivel.');
    }
  }

  async function handleEdit() {
    if (!editingNivel) return;
    try {
      await fetch('/api/super-admin/niveles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingNivel.id, name, description }),
      });
      setEditingNivel(null);
      setName('');
      setDescription('');
      void fetchNivel();
      setShowEditForm(false);
    } catch {
      setError('Error al actualizar nivel.');
    }
  }

  async function handleDelete(id: number) {
    try {
      await fetch('/api/super-admin/niveles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      void fetchNivel();
      setShowConfirmDelete(null);
    } catch {
      setError('Error al eliminar nivel.');
    }
  }

  const totalPages = Math.ceil(nivel.length / itemsPerPage);
  const paginatedNiveles = nivel.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <div className="p-6">
        {/* Action buttons with consistent styling */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setShowCreateForm(true);
              setName('');
              setDescription('');
            }}
            className="
              group/button relative inline-flex items-center justify-center
              gap-1 overflow-hidden rounded-md border border-white/20
              bg-background px-2 py-1.5 text-xs text-primary transition-all
              hover:bg-primary/10
              sm:gap-2 sm:px-4 sm:py-2 sm:text-sm
            "
          >
            <span className="relative z-10 font-medium">Crear Nivel</span>
            <Plus
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

        {showCreateForm && (
          <ModalForm
            title="Nuevo Nivel"
            onClose={() => setShowCreateForm(false)}
            onSubmit={handleCreate}
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
          />
        )}

        {showEditForm && editingNivel && (
          <ModalForm
            title="Editar Nivel"
            onClose={() => setShowEditForm(false)}
            onSubmit={handleEdit}
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
          />
        )}

        {showConfirmDelete && (
          <ConfirmDeleteModal
            item={showConfirmDelete}
            onClose={() => setShowConfirmDelete(null)}
            onConfirm={() => handleDelete(showConfirmDelete.id)}
          />
        )}

        {loading ? (
          <LoaderComponent />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <>
            <TableComponent
              data={paginatedNiveles}
              onEdit={(item: Nivel) => {
                setEditingNivel(item);
                setName(item.name);
                setDescription(item.description);
                setShowEditForm(true);
              }}
              onDelete={setShowConfirmDelete}
            />
            {/* 🔹 Controles de paginación */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </>
  );
}

interface ModalFormProps {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
}

const ModalForm = ({
  title,
  onClose,
  onSubmit,
  name,
  setName,
  description,
  setDescription,
}: ModalFormProps) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
    <div
      className="
        relative m-4 w-full max-w-lg rounded-xl bg-[#01142B] p-4 text-white
        shadow-2xl
        md:p-8
      "
    >
      <div
        className="
          mb-6 flex items-center justify-between border-b border-white/10
          pb-4
        "
      >
        <h2 className="text-2xl font-bold text-[#3AF4EF]">{title}</h2>
        <button
          onClick={onClose}
          className="
            rounded-lg bg-white/5 p-2
            hover:bg-white/10
          "
        >
          <X className="size-5" />
        </button>
      </div>
      <input
        type="text"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="
          w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2
          text-white
          placeholder:text-gray-400
        "
      />
      <input
        type="text"
        placeholder="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="
          mt-3 w-full rounded-md border border-gray-700 bg-gray-900/50 px-4
          py-2 text-white
          placeholder:text-gray-400
        "
      />
      <button
        onClick={onSubmit}
        className="
          group/button relative mt-6 inline-flex w-full items-center
          justify-center gap-2 overflow-hidden rounded-md border
          border-white/20 bg-background px-4 py-2 text-sm text-primary
          transition-all
          hover:bg-primary/10
        "
      >
        <span className="relative z-10 font-medium">Guardar</span>
        <div
          className="
            absolute inset-0 z-0 bg-gradient-to-r from-transparent
            via-white/10 to-transparent opacity-0 transition-all duration-500
            group-hover/button:[transform:translateX(100%)]
            group-hover/button:opacity-100
          "
        />
      </button>
    </div>
  </div>
);
// ✅ Modal Confirmación de Eliminación
const ConfirmDeleteModal = ({
  item,
  onClose,
  onConfirm,
}: {
  item: { id: number; name: string };
  onClose: () => void;
  onConfirm: () => void;
}) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
    <div
      className="
        relative m-4 w-full max-w-md rounded-xl bg-[#01142B] p-4 text-white
        shadow-2xl
        md:p-8
      "
    >
      <div
        className="
          mb-6 flex items-center justify-between border-b border-white/10
          pb-4
        "
      >
        <h2 className="text-2xl font-bold text-[#3AF4EF]">
          ¿Eliminar &quot;{item.name}&quot;?
        </h2>
        <button
          onClick={onClose}
          className="
            rounded-lg bg-white/5 p-2
            hover:bg-white/10
          "
        >
          <X className="size-5" />
        </button>
      </div>
      <p className="text-sm text-gray-300">Esta acción no se puede deshacer.</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="
            group/button relative inline-flex items-center justify-center
            gap-2 overflow-hidden rounded-md border border-white/20
            bg-background px-4 py-2 text-sm text-primary transition-all
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
          onClick={onConfirm}
          className="
            rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2
            text-sm text-red-400
            hover:bg-red-500/20
          "
        >
          Eliminar
        </button>
      </div>
    </div>
  </div>
);

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) => (
  <div className="mt-4 flex items-center justify-center gap-4">
    <button
      disabled={currentPage === 1}
      onClick={() => onPageChange(currentPage - 1)}
      className="
        rounded-md border border-white/20 bg-background p-2 text-primary
        transition-all
        hover:bg-primary/10
        disabled:cursor-not-allowed disabled:opacity-50
      "
    >
      <ChevronLeft size={20} />
    </button>
    <span className="text-sm text-white">
      {currentPage} de {totalPages || 1}
    </span>
    <button
      disabled={currentPage === totalPages || totalPages === 0}
      onClick={() => onPageChange(currentPage + 1)}
      className="
        rounded-md border border-white/20 bg-background p-2 text-primary
        transition-all
        hover:bg-primary/10
        disabled:cursor-not-allowed disabled:opacity-50
      "
    >
      <ChevronRight size={20} />
    </button>
  </div>
);

const LoaderComponent = () => (
  <div
    className="
      flex items-center justify-center rounded-xl border border-[#1a2a35]
      bg-[#0a0f14] p-12 text-gray-400
    "
  >
    <Loader2 className="size-6 animate-spin text-primary" />
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div
    className="
      flex items-center justify-center rounded-xl border border-[#1a2a35]
      bg-[#0a0f14] p-12 text-red-400
    "
  >
    {message}
  </div>
);

const TableComponent = ({
  data,
  onEdit,
  onDelete,
}: {
  data: Nivel[];
  onEdit: (item: Nivel) => void;
  onDelete: (item: Nivel) => void;
}) => (
  <div className="overflow-x-auto">
    <table
      className="
        min-w-full table-auto border-collapse overflow-hidden rounded-xl
        border border-[#1a2a35] bg-[#0a0f14]
      "
    >
      <thead>
        <tr className="border-b border-[#00BDD8] bg-[#0d1a22]">
          <th
            className="
              p-3 text-left text-[10px] font-semibold tracking-[0.12em]
              text-[#00BDD8] uppercase
              sm:px-4
            "
          >
            Nombre
          </th>
          <th
            className="
              p-3 text-left text-[10px] font-semibold tracking-[0.12em]
              text-[#00BDD8] uppercase
              sm:px-4
            "
          >
            Descripción
          </th>
          <th
            className="
              p-3 text-right text-[10px] font-semibold tracking-[0.12em]
              text-[#00BDD8] uppercase
              sm:px-4
            "
          >
            Acciones
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr
            key={item.id}
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
              <span className="text-xs font-medium text-[#e8f4f8] sm:text-sm">
                {item.name}
              </span>
            </td>
            <td
              className="
                p-3
                sm:p-4
              "
            >
              <span className="text-[11px] text-[#4a7080] sm:text-xs">
                {item.description}
              </span>
            </td>
            <td
              className="
                p-3
                sm:p-4
              "
            >
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => onEdit(item)}
                  className="
                    rounded-md p-1.5 text-gray-400 transition-colors
                    hover:bg-white/5 hover:text-primary
                  "
                  title="Editar"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => onDelete(item)}
                  className="
                    rounded-md p-1.5 text-gray-400 transition-colors
                    hover:bg-white/5 hover:text-red-400
                  "
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
