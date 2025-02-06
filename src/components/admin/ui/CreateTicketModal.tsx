import React, { useState } from 'react';
import { Ticket } from '~/types/Tickets';

interface CreateTicketModalProps {
  onCreate: (ticket: Ticket) => void;
  onClose: () => void;
}

export default function CreateTicketModal({ onCreate, onClose }: CreateTicketModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Baja' | 'Media' | 'Alta' | 'Crítico'>('Media');
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setAttachments(Array.from(event.target.files));
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      alert('Título y descripción son obligatorios.');
      return;
    }

    const newTicket: Ticket = {
      id: Date.now(), // Ensure id is a number
      title,
      description,
      status: 'abierto',
      assignedTechnician: null,
      priority,
      history: [],
      attachments,
      estudiante: '', // Add appropriate value
      asunto: title,
      descripcion: description,
      prioridad: priority,
      estado: 'Abierto', // Add appropriate value
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreate(newTicket);
    onClose();
  };

// Removed local Ticket and ExtendedLocalTicket interfaces

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 ">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 space-y-4 z-10 relative">
        <h2 className="text-xl font-bold mb-4 ">Crear Nuevo Ticket</h2>
        <input
          type="text"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded mb-2 "
        />
        <textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value as 'Baja' | 'Media' | 'Alta' | 'Crítico')} className="w-full p-2 border rounded mb-2">
          <option value="Baja">Baja</option>
          <option value="Media">Media</option>
          <option value="Alta">Alta</option>
          <option value="Crítico">Crítico</option>
        </select>
        <input type="file" multiple onChange={handleFileChange} className="mb-2" />
        <div className="flex justify-end space-x-2 ">
          <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded ">Cancelar</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 text-white rounded">Crear</button>
        </div>
      </div>
    </div>
  );
}
