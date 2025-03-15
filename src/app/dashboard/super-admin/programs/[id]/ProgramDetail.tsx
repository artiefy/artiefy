'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { StarIcon, ArrowRightCircleIcon } from '@heroicons/react/24/solid';
import LoadingPrograms from '~/components/super-admin/LoadingPrograms';
import ModalFormProgram from '~/components/super-admin/ModalFormProgram';
import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Badge } from '~/components/estudiantes/ui/badge';
import { Button } from '~/components/estudiantes/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardFooter,
    CardTitle,
} from '~/components/estudiantes/ui/card';
import { Label } from '~/components/estudiantes/ui/label';

// Definir la interfaz del programa
interface Program {
    id: number;
    title: string;
    description: string;
    categoryid: string;
    nivelid: string;
    modalidadesid: string;
    instructor: string;
    coverImageKey: string;
    creatorId: string;
    createdAt: string;
    updatedAt: string;
    rating: number;
}

// Definir la interfaz de las propiedades del componente
interface ProgramDetailProps {
    programId: number;
}

// Definir la interfaz de los parámetros
export interface Parametros {
    id: number;
    name: string;
    description: string;
    porcentaje: number;
    programId: number;
}

// Función para obtener el contraste de un color
const getContrastYIQ = (hexcolor: string) => {
    if (hexcolor === '#FFFFFF') return 'black'; // Manejar el caso del color blanco
    hexcolor = hexcolor.replace('#', '');
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? 'black' : 'white';
};

const ProgramDetail: React.FC<ProgramDetailProps> = () => {
    const router = useRouter(); // Obtener el router
    const params = useParams(); // Obtener los parámetros
    const programIdUrl = params?.id; // Obtener el id del programa desde params
    const [program, setProgram] = useState<Program | null>(null); // Nuevo estado para el programa
    const [parametros, setParametros] = useState<Parametros[]>([]); // Nuevo estado para los parámetros
    const [isModalOpen, setIsModalOpen] = useState(false); // Nuevo estado para el modal de edición
    const [editTitle, setEditTitle] = useState(''); // Nuevo estado para el título del programa a editar
    const [editDescription, setEditDescription] = useState(''); // Nuevo estado para la descripción del programa
    const [editCategory, setEditCategory] = useState(0); // Nuevo estado para la categoría del programa
    const [editModalidad, setEditModalidad] = useState(0); // Nuevo estado para la modalidad del programa
    const [editNivel, setEditNivel] = useState(0); // Nuevo estado para la nivel del programa
    const [editCoverImageKey, setEditCoverImageKey] = useState(''); // Nuevo estado para la imagen del programa
    const [loading, setLoading] = useState(true); // Nuevo estado para el estado de carga de la página
    const [error, setError] = useState<string | null>(null); // Nuevo estado para los errores
    const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF'); // Color predeterminado blanco
    const predefinedColors = ['#000000', '#FFFFFF', '#1f2937']; // Colores específicos
    const [editParametros, setEditParametros] = useState<
        {
            id: number;
            name: string;
            description: string;
            porcentaje: number;
        }[]
    >([]); // Nuevo estado para los parámetros
    const [editRating, setEditRating] = useState(0); // Añadir esta línea

    const programIdString = Array.isArray(programIdUrl)
        ? programIdUrl[0]
        : programIdUrl; // Obtener el id del programa como string
    const programIdString2 = programIdString ?? ''; // Verificar si el id del programa es nulo
    const programIdNumber = parseInt(programIdString2); // Convertir el id del programa a número

    // Función para obtener el programa y los parámetros
    const fetchProgram = useCallback(async () => {
        if (programIdNumber !== null) {
            try {
                const response = await fetch(`/api/super-admin/programs/${programIdNumber}`);
                if (!response.ok) {
                    throw new Error('Error fetching program');
                }
                const data = (await response.json()) as Program;
                setProgram(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching program:', error);
                setError('Error fetching program');
                setLoading(false);
            }
        }
    }, [programIdNumber]);

    // Obtener el programa y los parámetros al cargar la página
    useEffect(() => {
        fetchProgram().catch((error) =>
            console.error('Error fetching program:', error)
        );
    }, [fetchProgram]);

    // Obtener el color seleccionado al cargar la página
    useEffect(() => {
        const savedColor = localStorage.getItem(`selectedColor_${programIdNumber}`);
        if (savedColor) {
            setSelectedColor(savedColor);
        }
    }, [programIdNumber]);

    // Manejo de actualizar
    const handleUpdateProgram = async (
        id: string,
        title: string,
        description: string,
        file: File | null,
        categoryid: number,
        modalidadesid: number,
        nivelid: number,
        addParametros: boolean,
        coverImageKey: string,
        fileName: string,
        rating: number
    ) => {
        try {
            const coverImageKey = program?.coverImageKey ?? '';
            const uploadedFileName = fileName ?? '';

            if (file) {
                // Handle file upload
            }

            // Actualizar el programa
            const response = await fetch(
                `/api/super-admin/programs/${programIdNumber}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        description,
                        coverImageKey,
                        fileName: uploadedFileName,
                        categoryid,
                        modalidadesid,
                        nivelid,
                        instructor: program?.instructor,
                        rating,
                    }),
                }
            );

            // añadir parametros a la actualización si es true
            if (addParametros) {
                // Handle adding parameters
            }

            if (!response.ok) {
                throw new Error('Error updating program');
            }

            const updatedProgram = (await response.json()) as Program;
            setProgram(updatedProgram);

            setIsModalOpen(false);
            toast('Programa Actualizado', {
                description: 'El Programa Se Ha Actualizado Con Éxito.',
            });
            if (addParametros) {
                // Handle adding parameters
            }
        } catch (error) {
            console.error('Error:', error);
            toast('Error', {
                description:
                    error instanceof Error ? error.message : 'Error Desconocido',
            });
        }
    };

    // Función para manejar la edición del programa
    const handleEditProgram = () => {
        if (!program) return; // Verificación adicional
        setEditTitle(program.title);
        setEditDescription(program.description);
        setEditCategory(parseInt(program.categoryid));
        setEditModalidad(parseInt(program.modalidadesid));
        setEditNivel(parseInt(program.nivelid));
        setEditCoverImageKey(program.coverImageKey);
        setEditParametros(
            parametros.map((parametro) => ({
                id: parametro.id,
                name: parametro.name,
                description: parametro.description,
                porcentaje: parametro.porcentaje,
            }))
        );
        setEditRating(program.rating); // Añadir esta línea
        setIsModalOpen(true);
    };

    // Verificar si se está cargando
    if (loading) {
        return (
            <main className="flex h-screen flex-col items-center justify-center">
                <div className="size-32 animate-spin rounded-full border-y-2 border-primary">
                    <span className="sr-only"></span>
                </div>
                <span className="text-primary">Cargando...</span>
            </main>
        );
    }

    // Verificar si hay un error o hay programa
    if (!program) return <div>No Se Encontró El Programa.</div>;

    // Función para manejar la eliminación del programa
    const handleDelete = async (id: number) => {
        try {
            const response = await fetch(`/api/super-admin/programs/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Error Deleting Program');
            }
            router.push('/dashboard/super-admin/programs');
        } catch (error) {
            console.error('Error Deleting Program:', error);
            toast('Error', {
                description:
                    error instanceof Error ? error.message : 'Error Desconocido',
            });
        }
    };

    // Verificar si hay un error
    if (error) {
        return (
            <div className="flex h-screen flex-col items-center justify-center">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    // Función para manejar el cambio de color predefinido
    const handlePredefinedColorChange = (color: string) => {
        setSelectedColor(color);
        localStorage.setItem(`selectedColor_${programIdNumber}`, color);
    };

    // Renderizar el componente
    return (
        <div className="h-auto w-full rounded-lg bg-background">
            <div className="group relative h-auto w-full">
                <div className="animate-gradient absolute -inset-0.5 rounded-xl bg-linear-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur-sm transition duration-500 group-hover:opacity-100"></div>
                <Card
                    className={`relative mt-3 h-auto overflow-hidden border-none bg-black p-6 text-white transition-transform duration-300 ease-in-out zoom-in`}
                    style={{
                        backgroundColor: selectedColor,
                        color: getContrastYIQ(selectedColor),
                    }}
                >
                    <CardHeader className="grid w-full grid-cols-2 justify-evenly md:gap-32 lg:gap-60">
                        <CardTitle className={`text-xl font-bold text-primary capitalize`}>
                            Programa: {program.title}
                        </CardTitle>
                        <div className="ml-9 flex flex-col">
                            <Label
                                className={
                                    selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
                                }
                            >
                                Seleccione El Color Deseado
                            </Label>
                            <div className="mt-2 flex space-x-2">
                                {predefinedColors.map((color) => (
                                    <Button
                                        key={color}
                                        style={{ backgroundColor: color }}
                                        className={`size-8 border ${selectedColor === '#FFFFFF' ? 'border-black' : 'border-white'} `}
                                        onClick={() => handlePredefinedColorChange(color)}
                                    />
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <div className={`grid gap-6 md:grid-cols-2`}>
                        {/* Columna izquierda - Imagen */}
                        <div className="flex w-full flex-col">
                            <div className="relative aspect-video w-full">
                                <Image
                                    src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${program.coverImageKey}`}
                                    alt={program.title}
                                    width={800}
                                    height={600}
                                    className="mx-auto rounded-lg object-contain"
                                    priority
                                    quality={75}
                                />
                            </div>
                            <div className="mt-8 grid grid-cols-4 gap-5">
                                
                            </div>
                        </div>
                        {/* Columna derecha - Información */}
                        <div className="pb-6">
                            <h2 className={`text-xl font-bold text-primary capitalize`}>
                                Información Del Programa
                            </h2>
                            <br />
                            <div className="grid grid-cols-2">
                                <div className="flex flex-col">
                                    <h2
                                        className={`text-base font-semibold capitalize ${
                                            selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
                                        }`}
                                    >
                                        Programa:
                                    </h2>
                                    <h1 className={`mb-4 text-xl font-bold text-primary capitalize`}>
                                        {program.title}
                                    </h1>
                                </div>
                                <div className="flex flex-col">
                                    <h2
                                        className={`text-base font-semibold capitalize ${
                                            selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
                                        }`}
                                    >
                                        Categoría:
                                    </h2>
                                    <Badge
                                        variant="outline"
                                        className="ml-1 w-fit border-primary bg-background text-primary hover:bg-black/70 capitalize"
                                    >
                                        {program.categoryid}
                                    </Badge>
                                </div>
                            </div>
                            <div className="mb-4">
                                <h2
                                    className={`text-base font-semibold capitalize ${
                                        selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
                                    }`}
                                >
                                    Descripción:
                                </h2>
                                <p
                                    className={`text-justify text-sm capitalize ${selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'}`}
                                >
                                    {program.description}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
            <ModalFormProgram
                isOpen={isModalOpen}
                onSubmitAction={(
                    id: string,
                    title: string,
                    description: string,
                    file: File | null,
                    categoryid: number,
                    modalidadesid: number,
                    nivelid: number,
                    rating: number,
                    addParametros: boolean,
                    coverImageKey: string,
                    fileName: string
                ) =>
                    handleUpdateProgram(
                        id,
                        title,
                        description,
                        file,
                        categoryid,
                        modalidadesid,
                        nivelid,
                        addParametros,
                        coverImageKey,
                        fileName,
                        rating
                    )
                }
                editingProgramId={program.id}
                title={editTitle}
                description={editDescription}
                categoryid={editCategory}
                modalidadesid={editModalidad}
                nivelid={editNivel}
                coverImageKey={editCoverImageKey}
                parametros={editParametros}
                rating={editRating}
                setTitle={setEditTitle}
                setDescription={setEditDescription}
                setModalidadesid={setEditModalidad}
                setCategoryid={setEditCategory}
                setNivelid={setEditNivel}
                setCoverImageKey={setEditCoverImageKey}
                setParametrosAction={(
                    parametros: {
                        id: number;
                        name: string;
                        description: string;
                        porcentaje: number;
                    }[]
                ) => setEditParametros(parametros)}
                setRating={setEditRating}
                onCloseAction={() => setIsModalOpen(false)}
                uploading={false}
            />
        </div>
    );
};

export default ProgramDetail;