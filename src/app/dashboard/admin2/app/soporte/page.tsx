'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogTitle } from '~/components/admin/ui/dialog';

const CreateTicketForm = dynamic(() => import('~/components/admin/ui/CreateTicketForm'), { ssr: false });

interface CreateTicketFormProps {
  onClose: () => void;
  onSubmit: (newTicket: NewTicket) => void;
}

interface NewTicket {
  title: string;
  status: string;
  assignedTo: string;
  priority: string;
}

const SupportTicketSystem = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState([
    { id: 'TKT-001', title: 'Server Down', status: 'critical', assignedTo: 'John Doe', priority: 'High', date: '2024-01-20' },
    { id: 'TKT-002', title: 'Email Client Issue', status: 'pending', assignedTo: 'Jane Smith', priority: 'Medium', date: '2024-01-19' },
  ]);

  interface Ticket {
    id: string;
    title: string;
    status: string;
    assignedTo: string;
    priority: string;
    date: string;
  }

  const addTicket = (newTicket: NewTicket) => {
    setTickets([...tickets, { id: `TKT-${tickets.length + 1}`, ...newTicket, date: new Date().toISOString().split('T')[0] }]);
    setIsCreating(false);
  };

  const exportTickets = () => {
    const csvContent = [
      ['Ticket ID', 'Title', 'Status', 'Assigned To', 'Priority', 'Date'],
      ...tickets.map(ticket => [ticket.id, ticket.title, ticket.status, ticket.assignedTo, ticket.priority, ticket.date])
    ].map(e => e.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'tickets.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">Gestión de Tickets</h1>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-gray-800 rounded-lg bg-white text-black">
          <p className="text-xl font-bold bg">Total de Tickets</p>
          <p className="text-3xl">{tickets.length}</p>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg bg-white text-black">
          <p className="text-xl font-bold">Tickets Pendientes</p>
          <p className="text-3xl">{tickets.filter(t => t.status === 'pending').length}</p>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg bg-white text-black">
          <p className="text-xl font-bold">Tickets Críticos</p>
          <p className="text-3xl">{tickets.filter(t => t.status === 'critical').length}</p>
        </div>
      </div>
      <div className="flex space-x-2 mb-4 justify-end">
        <button onClick={() => setIsCreating(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ">Crear Ticket</button>
        <button onClick={exportTickets} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ">Exportar</button>
      </div>
      <div className=" p-4 rounded-lg mb-4 flex items-center">
        <input type="text" placeholder="Buscar tickets..." className="w-full p-2 rounded text-black" />
      </div>
      <div className="mt-4">
        {tickets.map(ticket => (
          <div key={ticket.id} className="bg-gray-800 p-4 rounded-lg mb-2 cursor-pointer text-white " onClick={() => setSelectedTicket(ticket)}>
            <p className="text-lg font-bold text-white">{ticket.title}</p>
            <p className="text-sm text-white">Asignado a: {ticket.assignedTo}</p>
            <p className={`px-2 inline-block rounded ${ticket.status === 'critical' ? 'bg-red-500' : 'bg-yellow-500'}`}>{ticket.status}</p>
          </div>
        ))}
      </div>
      {isCreating && <CreateTicketForm onClose={() => setIsCreating(false)} onSubmit={addTicket} />}
      {selectedTicket && (
        <Dialog open={true} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent>
            <DialogTitle>{selectedTicket.title}</DialogTitle>
            <p><strong>Asignado a:</strong> {selectedTicket.assignedTo}</p>
            <p><strong>Prioridad:</strong> {selectedTicket.priority}</p>
            <p><strong>Estado:</strong> {selectedTicket.status}</p>
            <p><strong>Fecha:</strong> {selectedTicket.date}</p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SupportTicketSystem;
