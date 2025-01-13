import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Button } from "~/components/ui/button"
import { Image } from 'lucide-react'
import type { Ticket } from '~/types/Tickets'

type TicketListProps = {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onDeleteTicket: (id: number) => void;
}

export function TicketList({ tickets, onSelectTicket, onDeleteTicket }: TicketListProps) {
  return (
    <Table className="bg-background text-foreground">
      <TableHeader>
        <TableRow>
          <TableHead className="text-foreground">ID</TableHead>
          <TableHead className="text-foreground">Estudiante</TableHead>
          <TableHead className="text-foreground">Asunto</TableHead>
          <TableHead className="text-foreground">Estado</TableHead>
          <TableHead className="text-foreground">Imagen</TableHead>
          <TableHead className="text-foreground">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.id}>
            <TableCell className="font-medium">{ticket.id}</TableCell>
            <TableCell>{ticket.estudiante}</TableCell>
            <TableCell>{ticket.asunto}</TableCell>
            <TableCell>{ticket.estado}</TableCell>
            <TableCell>{ticket.imagen ? <Image className="w-5 h-5" alt="Ticket Image" /> : null}</TableCell>
            <TableCell>
              <Button 
                onClick={() => onSelectTicket(ticket)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mr-2"
              >
                Ver Detalles
              </Button>
              <Button 
                onClick={() => onDeleteTicket(ticket.id)}
                variant="destructive"
              >
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

