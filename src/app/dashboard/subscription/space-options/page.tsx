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

interface SpaceOption {
    id: number;
    name: string;
    description: string | null;
    location: string | null;
    capacity: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default function SpaceOptionsPage() {
    const [spaces, setSpaces] = useState<SpaceOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        capacity: '',
        isActive: true,
    });

    // Fetch spaces
    useEffect(() => {
        fetchSpaces();
    }, []);

    const fetchSpaces = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/super-admin/space-options');
            const data = (await response.json()) as { success: boolean; data: SpaceOption[] };

            if (data.success) {
                setSpaces(data.data);
            }
        } catch (error) {
            console.error('Error fetching spaces:', error);
            toast.error('Failed to fetch spaces');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const method = editingId ? 'PUT' : 'POST';
            const url = '/api/super-admin/space-options';

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
                fetchSpaces();
            } else {
                toast.error((data.error ?? 'An error occurred') as string);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Failed to save space');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this space?')) return;

        try {
            const response = await fetch('/api/super-admin/space-options', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            const data = (await response.json()) as { success: boolean; error?: string };

            if (data.success) {
                toast.success('Space deleted successfully');
                fetchSpaces();
            } else {
                toast.error((data.error ?? 'An error occurred') as string);
            }
        } catch (error) {
            console.error('Error deleting space:', error);
            toast.error('Failed to delete space');
        }
    };

    const handleEdit = (space: SpaceOption) => {
        setEditingId(space.id);
        setFormData({
            name: space.name,
            description: space.description ?? '',
            location: space.location ?? '',
            capacity: space.capacity?.toString() ?? '',
            isActive: space.isActive,
        });
        setIsOpen(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: '',
            description: '',
            location: '',
            capacity: '',
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
                <h1 className="text-3xl font-bold">Opciones de Espacios</h1>
                <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus size={18} />
                            Nuevo Espacio
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingId ? 'Editar Espacio' : 'Crear Nuevo Espacio'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingId
                                    ? 'Actualiza los detalles del espacio'
                                    : 'Crea una nueva opción de espacio'}
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
                                    placeholder="Ej: Sede Centro"
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
                            <div>
                                <label className="text-sm font-medium">Ubicación</label>
                                <Input
                                    value={formData.location}
                                    onChange={(e) =>
                                        setFormData({ ...formData, location: e.target.value })
                                    }
                                    placeholder="Ej: Calle 10 # 5-50, Bogotá"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Capacidad</label>
                                <Input
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) =>
                                        setFormData({ ...formData, capacity: e.target.value })
                                    }
                                    placeholder="Cantidad de personas"
                                />
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
                            <TableHead>Ubicación</TableHead>
                            <TableHead>Capacidad</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {spaces.map((space) => (
                            <TableRow key={space.id}>
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{space.name}</p>
                                        {space.description && (
                                            <p className="text-sm text-gray-500">
                                                {space.description}
                                            </p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{space.location ?? '-'}</TableCell>
                                <TableCell>{space.capacity ? `${space.capacity} personas` : '-'}</TableCell>
                                <TableCell>
                                    <span
                                        className={`px-2 py-1 rounded text-sm ${space.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {space.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEdit(space)}
                                    >
                                        <Edit2 size={16} />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDelete(space.id)}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {spaces.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No hay espacios registrados. Crea uno nuevo para comenzar.
                </div>
            )}
        </div>
    );
}
