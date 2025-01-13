'use client';

import { useState } from 'react';
import { Button } from '~/components/estudiantes/ui/button';
import { Input } from '~/components/estudiantes/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '~/components/estudiantes/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '~/components/estudiantes/ui/dialog';
import { DashboardMetrics } from '~/components/estudiantes/ui/DashboardMetrics';
import { Users, BookOpen, Star, Search, Plus } from 'lucide-react';
import TutorForm from '~/components/estudiantes/ui/TutorForm';
import TutorDetalle from '~/components/estudiantes/ui/TutorDetalle';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '~/components/estudiantes/ui/card';
import type { Tutor } from '~/types/tutor';

export default function Tutores() {
    const [tutores, setTutores] = useState<Tutor[]>([
        {
            id: 1,
            nombre: 'Dr. Juan Pérez',
            email: 'juan.perez@universidad.edu',
            especialidad: 'Ciencias de la Computación',
            cursos: ['Introducción a la Programación', 'Estructuras de Datos'],
            estudiantes: 45,
            calificacion: 4.8,
            name: '',
            subject: '',
            rating: 0,
            experience: 0,
        },
        {
            id: 2,
            nombre: 'Dra. María Rodríguez',
            email: 'maria.rodriguez@universidad.edu',
            especialidad: 'Inteligencia Artificial',
            cursos: ['Machine Learning', 'Redes Neuronales'],
            estudiantes: 38,
            calificacion: 4.9,
            name: '',
            subject: '',
            rating: 0,
            experience: 0,
        },
    ]);

    const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleAddTutor = (
        nuevoTutor: Omit<Tutor, 'id' | 'estudiantes' | 'calificacion'>
    ) => {
        setTutores([
            ...tutores,
            {
                ...nuevoTutor,
                id: tutores.length + 1,
                estudiantes: 0,
                calificacion: 0,
            },
        ]);
    };

    const handleEditTutor = (
        tutorEditado: Omit<Tutor, 'id' | 'estudiantes' | 'calificacion'>
    ) => {
        setTutores(
            tutores.map((tutor) =>
                tutor.id === selectedTutor?.id
                    ? {
                          ...tutor,
                          ...tutorEditado,
                          estudiantes: tutor.estudiantes,
                          calificacion: tutor.calificacion,
                      }
                    : tutor
            )
        );
        setSelectedTutor(null);
    };

    const filteredTutores = tutores.filter(
        (tutor) =>
            tutor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tutor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tutor.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 bg-background p-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Gestión de Tutores
            </h2>

            <DashboardMetrics
                metrics={[
                    {
                        title: 'Total Tutores',
                        value: tutores.length.toString(),
                        icon: Users,
                        href: '/tutores',
                    },
                    {
                        title: 'Cursos Impartidos',
                        value: tutores
                            .reduce(
                                (acc, tutor) => acc + tutor.cursos.length,
                                0
                            )
                            .toString(),
                        icon: BookOpen,
                        href: '/cursos',
                    },
                    {
                        title: 'Calificación Promedio',
                        value: (
                            tutores.reduce(
                                (acc, tutor) => acc + tutor.calificacion,
                                0
                            ) / tutores.length
                        ).toFixed(1),
                        icon: Star,
                        href: '/analisis',
                    },
                ]}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Buscar y Agregar Tutores</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 transform" />
                        <Input
                            placeholder="Buscar tutores..."
                            value={searchTerm}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                            ) => setSearchTerm(e.target.value)}
                            className="w-full pl-8"
                        />
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Agregar Tutor
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Agregar Nuevo Tutor</DialogTitle>
                            </DialogHeader>
                            <TutorForm onSubmit={handleAddTutor} />
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Tutores</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Especialidad</TableHead>
                                <TableHead>Estudiantes</TableHead>
                                <TableHead>Calificación</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTutores.map((tutor) => (
                                <TableRow key={tutor.id}>
                                    <TableCell className="font-medium">
                                        {tutor.nombre}
                                    </TableCell>
                                    <TableCell>{tutor.email}</TableCell>
                                    <TableCell>{tutor.especialidad}</TableCell>
                                    <TableCell>{tutor.estudiantes}</TableCell>
                                    <TableCell>
                                        {tutor.calificacion.toFixed(1)}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mr-2"
                                            onClick={() =>
                                                setSelectedTutor(tutor)
                                            }
                                        >
                                            Ver Detalles
                                        </Button>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Editar
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Editar Tutor
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <TutorForm
                                                    onSubmit={handleEditTutor}
                                                    tutor={tutor}
                                                />
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {selectedTutor && (
                <Dialog
                    open={!!selectedTutor}
                    onOpenChange={() => setSelectedTutor(null)}
                >
                    <DialogContent className="sm:max-w-[625px]">
                        <DialogHeader>
                            <DialogTitle>Detalles del Tutor</DialogTitle>
                        </DialogHeader>
                        <TutorDetalle tutor={selectedTutor} />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
