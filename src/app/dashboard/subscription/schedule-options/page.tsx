'use client';

import { useEffect, useState } from 'react';

import { Edit2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '~/components/estudiantes/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '~/components/estudiantes/ui/dialog';
import { Input } from '~/components/estudiantes/ui/input';
import { Textarea } from '~/components/estudiantes/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '~/components/projects/ui/table';

interface ScheduleOption {
    id: number;
    name: string;
    description: string | null;
    startTime: string | null;
    endTime: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default function ScheduleOptionsPage() {
    const [schedules, setSchedules] = useState<ScheduleOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startTime: '',
        endTime: '',
        isActive: true,
    });

    // Fetch schedules
    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/super-admin/schedule-options');
            const data = (await response.json()) as { success: boolean; data: ScheduleOption[] };

            if (data.success) {
                setSchedules(data.data);
            }
        } catch (error) {
            console.error('Error fetching schedules:', error);
            toast.error('Failed to fetch schedules');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const method = editingId ? 'PUT' : 'POST';
            const url = '/api/super-admin/schedule-options';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    editingId ? { id: editingId, ...formData } : formData
                ),
            });

            const data = (await response.json()) as { success: boolean; message?: string; error?: string };

            if (data.success) {
                toast.success((data.message ?? 'Operation completed successfully') as string);
                setIsOpen(false);
                resetForm();
                fetchSchedules();
            } else {
                toast.error((data.error ?? 'An error occurred') as string);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Failed to save schedule');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;

        try {
            const response = await fetch('/api/super-admin/schedule-options', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            const data = (await response.json()) as { success: boolean; error?: string };

            if (data.success) {
                toast.success('Schedule deleted successfully');
                fetchSchedules();
            } else {
                toast.error((data.error ?? 'An error occurred') as string);
            }
        } catch (error) {
            console.error('Error deleting schedule:', error);
            toast.error('Failed to delete schedule');
        }
    };

    const handleEdit = (schedule: ScheduleOption) => {
        setEditingId(schedule.id);
        setFormData({
            name: schedule.name,
            description: schedule.description ?? '',
            startTime: schedule.startTime ?? '',
            endTime: schedule.endTime ?? '',
            isActive: schedule.isActive,
        });
        setIsOpen(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: '',
            description: '',
            startTime: '',
            endTime: '',
            isActive: true,
        });
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            resetForm();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Opciones de Horarios</h1>
                <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus size={18} />
                            Nuevo Horario
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingId ? 'Editar Horario' : 'Crear Nuevo Horario'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingId
                                    ? 'Actualiza los detalles del horario'
                                    : 'Crea una nueva opción de horario'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Nombre</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="Ej: Mañana (8:00 - 12:00)"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Descripción</label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    placeholder="Descripción opcional"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Hora Inicio</label>
                                    <Input
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) =>
                                            setFormData({ ...formData, startTime: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Hora Fin</label>
                                    <Input
                                        type="time"
                                        value={formData.endTime}
                                        onChange={(e) =>
                                            setFormData({ ...formData, endTime: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) =>
                                        setFormData({ ...formData, isActive: e.target.checked })
                                    }
                                    className="w-4 h-4"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium">
                                    Activo
                                </label>
                            </div>
                            <Button type="submit" className="w-full">
                                {editingId ? 'Actualizar' : 'Crear'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Hora Inicio</TableHead>
                            <TableHead>Hora Fin</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {schedules.map((schedule) => (
                            <TableRow key={schedule.id}>
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{schedule.name}</p>
                                        {schedule.description && (
                                            <p className="text-sm text-gray-500">
                                                {schedule.description}
                                            </p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{schedule.startTime ?? '-'}</TableCell>
                                <TableCell>{schedule.endTime ?? '-'}</TableCell>
                                <TableCell>
                                    <span
                                        className={`px-2 py-1 rounded text-sm ${schedule.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {schedule.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEdit(schedule)}
                                    >
                                        <Edit2 size={16} />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDelete(schedule.id)}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {schedules.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No hay horarios registrados. Crea uno nuevo para comenzar.
                </div>
            )}
        </div>
    );
}
