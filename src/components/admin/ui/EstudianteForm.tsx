import { useState } from 'react';
import { Button } from '~/components/admin/ui/button';
import { Input } from '~/components/admin/ui/input';
import { Label } from '~/components/admin/ui/label';

interface EstudianteFormProps {
    onSubmit: (estudiante: {
        id: number;
        nombre: string;
        email: string;
        fechaNacimiento: string;
    }) => void;
    estudiante?: {
        id: number;
        nombre: string;
        email: string;
        fechaNacimiento: string;
    };
}

export function EstudianteForm({ onSubmit, estudiante }: EstudianteFormProps) {
    const [formData, setFormData] = useState({
        id: estudiante?.id ?? 0,
        nombre: estudiante?.nombre ?? '',
        email: estudiante?.email ?? '',
        fechaNacimiento: estudiante?.fechaNacimiento ?? '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(estudiante ? { ...formData, id: estudiante.id } : formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                <Input
                    id="fechaNacimiento"
                    name="fechaNacimiento"
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                    required
                />
            </div>
            <Button type="submit">
                {estudiante ? 'Actualizar' : 'Agregar'} Estudiante
            </Button>
        </form>
    );
}
