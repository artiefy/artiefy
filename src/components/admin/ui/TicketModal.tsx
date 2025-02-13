import React from "react";

interface Ticket {
  id: string;
  title: string;
  status: string;
  assignedTo: string;
  category: string;
  priority: string;
  description: string;
  submissionDate: string;
  attachments: string[];
  history: { action: string; timestamp: string }[];
}

interface TicketModalProps {
  ticket: Ticket;
  onClose: () => void;
}

const TicketModal: React.FC<TicketModalProps> = ({ ticket, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 ">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{ticket.title}</h2>
        <p className="text-gray-700 dark:text-gray-300 mt-2">
          <strong>ID:</strong> {ticket.id}
        </p>
        <p className="text-gray-700 dark:text-gray-300 mt-2 ">
          <strong>Status:</strong> {ticket.status}
        </p>
        <p className="text-gray-700 dark:text-gray-300 mt-2">
          <strong>Asignado a:</strong> {ticket.assignedTo}
        </p>
        <p className="text-gray-700 dark:text-gray-300 mt-2">
          <strong>Categoría:</strong> {ticket.category}
        </p>
        <p className="text-gray-700 dark:text-gray-300 mt-2">
          <strong>Prioridad:</strong> {ticket.priority}
        </p>
        <p className="text-gray-700 dark:text-gray-300 mt-4">{ticket.description}</p>
        <h3 className="text-lg font-semibold mt-4 text-gray-900 dark:text-white ">Historial</h3>
        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
          {ticket.history.map((entry, index) => (
            <li key={index}>
              {entry.action} - {entry.timestamp}
            </li>
          ))}
        </ul>
        <button
          onClick={onClose}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 "
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default TicketModal;
