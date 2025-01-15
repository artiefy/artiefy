import React, { useState } from 'react';
import { Button } from '~/components/admin/ui/button';
import { Input } from '~/components/admin/ui/input';
import { Label } from '~/components/admin/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/admin/ui/select';
import { Textarea } from '~/components/admin/ui/textarea';
import type { Course } from '~/types/course';

interface CourseFormProps {
    onSubmit: (course: Partial<Course>) => void;
    initialData?: Partial<Course>;
}

export function CourseForm({ onSubmit, initialData }: CourseFormProps) {
    const [course, setCourse] = useState<Partial<Course>>(
        initialData ?? {
            title: '',
            description: '',
            instructor: '',
            category: { id: 0, name: '' },
            modalidad: { name: '' },
            lessons: [],
        }
    );

    const [newLesson, setNewLesson] = useState({
        title: '',
        duration: 0,
        description: '',
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setCourse((prev) => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (value: string) => {
        setCourse((prev) => ({
            ...prev,
            category: { id: prev.category?.id ?? 0, name: value },
        }));
    };

    const handleModalidadChange = (value: string) => {
        setCourse((prev) => ({ ...prev, modalidad: { name: value } }));
    };

    const handleAddLesson = () => {
        setCourse((prev) => ({
            ...prev,
            lessons: [
                ...(prev.lessons ?? []),
                { ...newLesson, id: Date.now() },
            ],
        }));
        setNewLesson({ title: '', duration: 0, description: '' });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(course);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="title">Título del Curso</Label>
                <Input
                    id="title"
                    name="title"
                    value={course.title ?? ''}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                    id="description"
                    name="description"
                    value={course.description ?? ''}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <Label htmlFor="instructor">Instructor</Label>
                <Input
                    id="instructor"
                    name="instructor"
                    value={course.instructor ?? ''}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <Label htmlFor="category">Categoría</Label>
                <Select
                    onValueChange={handleCategoryChange}
                    defaultValue={course.category?.name}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="programming">
                            Programación
                        </SelectItem>
                        <SelectItem value="design">Diseño</SelectItem>
                        <SelectItem value="business">Negocios</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="modalidad">Modalidad</Label>
                <Select
                    onValueChange={handleModalidadChange}
                    defaultValue={course.modalidad?.name}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="presencial">Presencial</SelectItem>
                        <SelectItem value="hibrido">Híbrido</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label>Lecciones</Label>
                {course.lessons?.map((lesson, _index) => (
                    <div key={lesson.id} className="mb-2">
                        <Input value={lesson.title} readOnly />
                    </div>
                ))}
                <div className="flex space-x-2">
                    <Input
                        placeholder="Título de la lección"
                        value={newLesson.title}
                        onChange={(e) =>
                            setNewLesson({
                                ...newLesson,
                                title: e.target.value,
                            })
                        }
                    />
                    <Input
                        type="number"
                        placeholder="Duración (min)"
                        value={newLesson.duration}
                        onChange={(e) =>
                            setNewLesson({
                                ...newLesson,
                                duration: parseInt(e.target.value),
                            })
                        }
                    />
                    <Button type="button" onClick={handleAddLesson}>
                        Agregar Lección
                    </Button>
                </div>
            </div>
            <Button type="submit">
                {initialData ? 'Actualizar Curso' : 'Crear Curso'}
            </Button>
        </form>
    );
}
