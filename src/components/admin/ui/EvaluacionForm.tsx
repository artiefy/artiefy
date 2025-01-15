import { useState } from 'react';
import { Button } from '~/components/admin/ui/button';
import { Input } from '~/components/admin/ui/input';
import { Label } from '~/components/admin/ui/label';
import { Textarea } from '~/components/admin/ui/textarea';

interface EvaluacionFormProps {
    onSubmit: (evaluacion: {
        id: number;
        nombre: string;
        curso: string;
        tipoPreguntas: string;
        duracion: string;
        puntajeMaximo: number;
    }) => void;
    evaluacion?: {
        id: number;
        nombre: string;
        curso: string;
        tipoPreguntas: string;
        duracion: string;
        puntajeMaximo: number;
    };
}

export function EvaluacionForm({ onSubmit, evaluacion }: EvaluacionFormProps) {
    const [formData, setFormData] = useState({
        id: evaluacion?.id ?? 0,
        nombre: evaluacion?.nombre ?? '',
        curso: evaluacion?.curso ?? '',
        tipoPreguntas: evaluacion?.tipoPreguntas ?? '',
        duracion: evaluacion?.duracion ?? '',
        puntajeMaximo: evaluacion?.puntajeMaximo ?? 0,
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (_e: React.FormEvent) => {
        onSubmit(formData);
        onSubmit(evaluacion ? { ...formData, id: evaluacion.id } : formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="nombre">Nombre de la Evaluación</Label>
                <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <Label htmlFor="curso">Curso</Label>
                <Input
                    id="curso"
                    name="curso"
                    value={formData.curso}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <Label htmlFor="tipoPreguntas">Tipos de Preguntas</Label>
                <Textarea
                    id="tipoPreguntas"
                    name="tipoPreguntas"
                    value={formData.tipoPreguntas}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <Label htmlFor="duracion">Duración</Label>
                <Input
                    id="duracion"
                    name="duracion"
                    value={formData.duracion}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <Label htmlFor="puntajeMaximo">Puntaje Máximo</Label>
                <Input
                    id="puntajeMaximo"
                    name="puntajeMaximo"
                    type="number"
                    value={formData.puntajeMaximo}
                    onChange={handleChange}
                    required
                />
            </div>
            <Button type="submit">
                {evaluacion ? 'Actualizar' : 'Crear'} Evaluación
            </Button>
        </form>
    );
}
