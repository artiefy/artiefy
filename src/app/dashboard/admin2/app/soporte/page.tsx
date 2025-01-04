'use client'

import { useState } from 'react'
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import { DashboardMetrics } from '~/components/ui/DashboardMetrics'
import { HelpCircle, Clock, CheckCircle } from 'lucide-react'
import { TicketForm } from '~/components/ui/TicketForm'

type Ticket = {
  id: number;
  asunto: string;
  estudiante: string;
  estado: 'Abierto' | 'En Progreso' | 'Resuelto';
  prioridad: 'Baja' | 'Media' | 'Alta';
  fechaCreacion: string;
}

export default function Soporte() {
  const [tickets, setTickets] = useState<Ticket[]>([
    { 
      id: 1, 
      asunto: 'No puedo acceder al curso', 
      estudiante: 'Juan Pérez',
      estado: 'Abierto',
      prioridad: 'Alta',
      fechaCreacion: '2023-06-15'
    },
    { 
      id: 2, 
      asunto: 'Error en la descarga de material', 
      estudiante: 'María García',
      estado: 'En Progreso',
      prioridad: 'Media',
      fechaCreacion: '2023-06-14'
    },
  ])

  const handleAddTicket = (nuevoTicket: Omit<Ticket, 'id' | 'fechaCreacion'>) => {
    setTickets([...tickets, { 
      ...nuevoTicket, 
      id: tickets.length + 1, 
      fechaCreacion: new Date().toISOString().split('T')[0] || '' 
    }])
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Coordinación de Soporte Técnico</h2>

      <DashboardMetrics
        metrics={[
          { title: "Tickets Abiertos", value: tickets.filter(t => t.estado === 'Abierto').length.toString(), icon: HelpCircle, href: "/soporte" },
          { title: "Tiempo Promedio de Resolución", value: "2h 30m", icon: Clock, href: "/analisis" },
          { title: "Tickets Resueltos (Hoy)", value: "15", icon: CheckCircle, href: "/soporte" },
        ]}
      />

      <div className="flex justify-between items-center">
        <Input
          placeholder="Buscar tickets..."
          className="max-w-sm"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button>Crear Ticket</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Ticket</DialogTitle>
            </DialogHeader>
            <TicketForm onSubmit={handleAddTicket} />
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Asunto</TableHead>
            <TableHead>Estudiante</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Fecha de Creación</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>{ticket.id}</TableCell>
              <TableCell>{ticket.asunto}</TableCell>
              <TableCell>{ticket.estudiante}</TableCell>
              <TableCell>{ticket.estado}</TableCell>
              <TableCell>{ticket.prioridad}</TableCell>
              <TableCell>{ticket.fechaCreacion}</TableCell>
              <TableCell>
                <Button variant="outline" className="mr-2">Ver Detalles</Button>
                <Button variant="outline">Asignar</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

