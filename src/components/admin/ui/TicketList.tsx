import { Image } from 'lucide-react';
import { Button } from '~/components/admin/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/admin/ui/table';
import type { Ticket } from '~/types/Tickets';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onDeleteTicket: (id: number) => void;
}

export function TicketList({
  tickets,
  onSelectTicket,
  onDeleteTicket,
}: TicketListProps) {
  return (
    <Table className="bg-background text-foreground border-foreground ">
      <TableHeader>
        <TableRow>
          <TableHead className="text-foreground">ID</TableHead>
          <TableHead className="text-foreground">Estudiante</TableHead>
          <TableHead className="text-foreground">Asunto</TableHead>
          <TableHead className="text-foreground">Estado</TableHead>
          <TableHead className="text-foreground">Imagen</TableHead>
          <TableHead className="text-foreground">Fecha de Creación</TableHead>
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
            <TableCell>
              {ticket.imagen ? (
                <Image className="size-5" aria-label="Ticket Image" />
              ) : null}
            </TableCell>
            <TableCell>{ticket.fechaCreacion ? ticket.fechaCreacion.toString() : 'N/A'}</TableCell>
            <TableCell>
              <Button
                onClick={() => onSelectTicket(ticket)}
                className="mr-2 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground/90 text-white"
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
  );
}
