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

interface CertificationType {
    id: number;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default function CertificationTypesPage() {
    const [certifications, setCertifications] = useState<CertificationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isActive: true,
    });

    // Fetch certification types
    useEffect(() => {
        fetchCertifications();
    }, []);

    const fetchCertifications = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/super-admin/certification-types');
            const data = (await response.json()) as {
                success: boolean;
                data: CertificationType[];
            };

            if (data.success) {
                setCertifications(data.data);
            }
        } catch (error) {
            console.error('Error fetching certification types:', error);
            toast.error('Error al cargar los tipos de certificación');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const method = editingId ? 'PUT' : 'POST';
            const url = '/api/super-admin/certification-types';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    editingId ? { id: editingId, ...formData } : formData
                ),
            });

            const data = (await response.json()) as {
                success: boolean;
                message?: string;
                error?: string;
            };

            if (data.success) {
                toast.success(
                    (data.message ?? 'Operación completada exitosamente') as string
                );
                setIsOpen(false);
                resetForm();
                fetchCertifications();
            } else {
                toast.error((data.error ?? 'Ocurrió un error') as string);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Error al guardar el tipo de certificación');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este tipo de certificación?')) return;

        try {
            const response = await fetch('/api/super-admin/certification-types', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            const data = (await response.json()) as { success: boolean; error?: string };

            if (data.success) {
                toast.success('Tipo de certificación eliminado exitosamente');
                fetchCertifications();
            } else {
                toast.error((data.error ?? 'Ocurrió un error') as string);
            }
        } catch (error) {
            console.error('Error deleting certification type:', error);
            toast.error('Error al eliminar el tipo de certificación');
        }
    };

    const handleEdit = (certification: CertificationType) => {
        setEditingId(certification.id);
        setFormData({
            name: certification.name,
            description: certification.description ?? '',
            isActive: certification.isActive,
        });
        setIsOpen(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: '',
            description: '',
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
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Tipos de Certificación</h1>
                <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus size={18} />
                            Nuevo Tipo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingId
                                    ? 'Editar Tipo de Certificación'
                                    : 'Crear Nuevo Tipo de Certificación'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingId
                                    ? 'Actualiza los detalles del tipo de certificación'
                                    : 'Crea una nueva opción de tipo de certificación'}
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
                                    placeholder="Ej: Certificado de Finalización"
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
                            <TableHead>Descripción</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {certifications.map((cert) => (
                            <TableRow key={cert.id}>
                                <TableCell>
                                    <p className="font-medium">{cert.name}</p>
                                </TableCell>
                                <TableCell>
                                    {cert.description ? (
                                        <p className="text-sm text-gray-600">{cert.description}</p>
                                    ) : (
                                        <p className="text-sm text-gray-400">-</p>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span
                                        className={`px-2 py-1 rounded text-sm ${cert.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {cert.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEdit(cert)}
                                    >
                                        <Edit2 size={16} />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDelete(cert.id)}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {certifications.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No hay tipos de certificación registrados. Crea uno nuevo para comenzar.
                </div>
            )}
        </div>
    );
}
