'use client';

import { useState } from 'react';
import {
    TicketIcon,
    CheckCircleIcon,
    ClockIcon,
    MessageCircle,
} from 'lucide-react';
import { Button } from '~/components/admin/ui/button';
import { ConfirmationDialog } from '~/components/admin/ui/confirmationDialog';
import { DashboardMetrics } from '~/components/admin/ui/DashboardMetrics';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '~/components/admin/ui/dialog';
import { Input } from '~/components/admin/ui/input';
import { LiveChat } from '~/components/admin/ui/LiveChat';
import { NewTicketForm } from '~/components/admin/ui/NewTicketForm';
import { TicketDetail } from '~/components/admin/ui/TicketDetail';
import { TicketList } from '~/components/admin/ui/TicketList';
import { type Ticket } from '~/types/Tickets';

export default function Soporte() {
    const [tickets, setTickets] = useState<Ticket[]>([
        {
            id: 1,
            estudiante: 'Ana García',
            asunto: 'Problema con el acceso al curso',
            descripcion:
                'No puedo acceder al material del curso de Programación Avanzada',
            estado: 'Abierto',
            fechaCreacion: '2023-06-15',
        },
        {
            id: 2,
            estudiante: 'Carlos Rodríguez',
            asunto: 'Error en la subida de tareas',
            descripcion:
                'Al intentar subir mi tarea, recibo un error de "archivo no soportado"',
            estado: 'En Progreso',
            fechaCreacion: '2023-06-14',
        },
    ]);

    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const handleAddTicket = (
        newTicket: Omit<
            Ticket,
            'id' | 'fechaCreacion' | 'estado' | 'imagen'
        > & { imagen?: File }
    ) => {
        let imagenUrl = undefined;
        if (newTicket.imagen) {
            // Aquí iría la lógica para subir la imagen a un servidor
            // Por ahora, simularemos esto con una URL local
            imagenUrl = URL.createObjectURL(newTicket.imagen);
        }

        const ticket: Ticket = {
            ...newTicket,
            id: tickets.length + 1,
            fechaCreacion: new Date().toISOString().split('T')[0],
            estado: 'Abierto',
            imagen: imagenUrl ?? '',
        };
        setTickets([...tickets, ticket]);
    };

    const handleUpdateTicket = (updatedTicket: Ticket, newImage?: File) => {
        let imagenUrl = updatedTicket.imagen;
        if (newImage) {
            // Aquí iría la lógica para subir la nueva imagen a un servidor
            // Por ahora, simularemos esto con una URL local
            imagenUrl = URL.createObjectURL(newImage);
        }

        const finalUpdatedTicket = {
            ...updatedTicket,
            imagen: imagenUrl,
        };

        setTickets(
            tickets.map((ticket) =>
                ticket.id === finalUpdatedTicket.id
                    ? finalUpdatedTicket
                    : ticket
            )
        );
        if (finalUpdatedTicket.estado === 'Resuelto') {
            setIsDeleteDialogOpen(true);
        } else {
            setSelectedTicket(null);
        }
    };

    const handleDeleteTicket = (id: number) => {
        setTickets(tickets.filter((ticket) => ticket.id !== id));
        setSelectedTicket(null);
        setIsDeleteDialogOpen(false);
    };

    return (
        <div className="min-h-screen space-y-6 bg-background p-6 text-foreground">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Soporte a Estudiantes
            </h2>

            <DashboardMetrics
                metrics={[
                    {
                        title: 'Tickets Abiertos',
                        value: tickets
                            .filter((t) => t.estado === 'Abierto')
                            .length.toString(),
                        icon: TicketIcon,
                        href: '/soporte',
                    },
                    {
                        title: 'Tickets Resueltos',
                        value: tickets
                            .filter((t) => t.estado === 'Resuelto')
                            .length.toString(),
                        icon: CheckCircleIcon,
                        href: '/soporte',
                    },
                    {
                        title: 'Tiempo Promedio de Resolución',
                        value: '2 días',
                        icon: ClockIcon,
                        href: '/soporte',
                    },
                ]}
            />

            <div className="mb-6 flex items-center justify-between">
                <Input
                    placeholder="Buscar tickets..."
                    className="max-w-sm border-input bg-background text-foreground"
                />
                <div className="space-x-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                                Nuevo Ticket
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-background text-foreground">
                            <DialogHeader>
                                <DialogTitle className="text-foreground">
                                    Crear Nuevo Ticket
                                </DialogTitle>
                            </DialogHeader>
                            <NewTicketForm onSubmit={handleAddTicket} />
                        </DialogContent>
                    </Dialog>
                    <Button
                        onClick={() => setIsChatOpen(true)}
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    >
                        <MessageCircle className="mr-2 size-4" /> Chat en Vivo
                    </Button>
                </div>
            </div>

            <div className="flex space-x-6">
                <div
                    className={`grow transition-all duration-300 ${selectedTicket || isChatOpen ? 'w-2/3' : 'w-full'}`}
                >
                    <TicketList
                        tickets={tickets}
                        onSelectTicket={setSelectedTicket}
                        onDeleteTicket={handleDeleteTicket}
                    />
                </div>
                {selectedTicket && !isChatOpen && (
                    <div className="w-1/3 transition-all duration-300">
                        <TicketDetail
                            ticket={selectedTicket}
                            onUpdateTicket={handleUpdateTicket}
                            onDeleteTicket={() => setIsDeleteDialogOpen(true)}
                        />
                    </div>
                )}
                {isChatOpen && (
                    <div className="w-1/3 transition-all duration-300">
                        <LiveChat />
                        <Button
                            onClick={() => setIsChatOpen(false)}
                            className="mt-4 w-full"
                        >
                            Cerrar Chat
                        </Button>
                    </div>
                )}
            </div>

            <ConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={() =>
                    selectedTicket && handleDeleteTicket(selectedTicket.id)
                }
                title="Eliminar Ticket"
                description="¿Estás seguro de que quieres eliminar este ticket? Esta acción no se puede deshacer."
            />
        </div>
    );
}
