import React, { useEffect, useState } from "react";

import { Modal } from "~/components/shared/Modal";

interface EditTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: {
    id?: string;
    email: string;
    description: string;
    comments: string;
    estado: string;
    tipo: string;
    assignedToId: string;
    assignedToName?: string;
  } | null;
}

const EditTicketModal = ({ isOpen, onClose, ticket }: EditTicketModalProps) => {
  const [formData, setFormData] = useState({
    email: ticket?.email ?? "",
    description: ticket?.description ?? "",
    comments: ticket?.comments ?? "",
    estado: ticket?.estado ?? "",
    tipo: ticket?.tipo ?? "",
    assignedToId: ticket?.assignedToId ?? "",
  });

  useEffect(() => {
    if (ticket) {
      setFormData({
        email: ticket.email,
        description: ticket.description,
        comments: ticket.comments,
        estado: ticket.estado,
        tipo: ticket.tipo,
        assignedToId: ticket.assignedToId,
      });
    }
  }, [ticket]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/tickets", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: ticket?.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update ticket");
      }

      const updatedTicket: unknown = await response.json(); // Corregido para evitar `any`
      console.log("Ticket actualizado:", updatedTicket);

      // You can add a success notification here
      onClose();
    } catch (error) {
      console.error("Error updating ticket:", error);
      // You can add an error notification here
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Ticket">
      <form onSubmit={handleSubmit}>
        <div className="col-span-1 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-200">
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 text-white"
              />
            </label>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-200">
              Description
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 text-white"
              />
            </label>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-200">
              Estado
              <select
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 text-white"
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completado</option>
              </select>
            </label>
          </div>
        </div>

        <div className="col-span-1 mt-4 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-200">
              Tipo
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 text-white"
              >
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
                <option value="logs">Logs</option>
              </select>
            </label>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-200">
              Comments
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 text-white"
              />
            </label>
          </div>

          {/* Asignar a */}
          <div>
            <label className="block text-sm font-medium text-gray-200">
              Asignar a
              <select
                name="assignedToId"
                value={formData.assignedToId}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 text-white"
              >
                <option value={ticket?.assignedToId}>
                  {ticket?.assignedToName ?? "Select User"}
                </option>
                {/* Aquí puedes agregar más opciones dinámicamente */}
              </select>
            </label>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="col-span-2 mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit" // YA correcto
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditTicketModal;
