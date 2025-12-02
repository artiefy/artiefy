/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { type ChangeEvent, useEffect, useState } from 'react';

import Image from 'next/image';

import { Plus } from 'lucide-react';
import { FiUploadCloud } from 'react-icons/fi';
import { MdClose } from 'react-icons/md';
import Select, { type MultiValue } from 'react-select';
import { toast } from 'sonner';

import ActiveDropdown from '~/components/educators/layout/ActiveDropdown';
import CategoryDropdown from '~/components/educators/layout/CategoryDropdown';
import NivelDropdown from '~/components/educators/layout/NivelDropdown';
import { Button } from '~/components/educators/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/educators/ui/dialog';
import { Input } from '~/components/educators/ui/input';
import { Progress } from '~/components/educators/ui/progress';
import ModalidadDropdown from '~/components/super-admin/layout/ModalidadDropdown';

import '~/styles/toggler.css';

// Interfaz para los parámetros del formulario del course
interface CourseFormProps {
  onSubmitAction: (
    id: string,
    title: string,
    description: string,
    file: File | null,
    categoryid: number,
    modalidadesid: number[],
    nivelid: number,
    rating: number,
    addParametros: boolean,
    coverImageKey: string,
    fileName: string,
    subjects: { id: number }[], // ✅ Solo `id` y `courseId`
    programId: number, // ✅ También asegurarnos de enviarlo en la función
    isActive: boolean,
    courseTypeId: number[], // <-- ✅ agrega esto
    individualPrice: number | null,
    videoKey: string // ✅ <-- aquí lo agregas
  ) => Promise<void>;
  uploading: boolean;
  editingCourseId: number | null;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  categoryid: number;
  setCategoryid: (categoryid: number) => void;
  modalidadesid: number[];
  setModalidadesid: (modalidadesid: number[]) => void;
  nivelid: number;
  programId: number; // ✅ Agregar programId aquí
  setNivelid: (nivelid: number) => void;
  coverImageKey: string;
  setCoverImageKey: (coverImageKey: string) => void;
  parametros: {
    id: number;
    name: string;
    description: string;
    porcentaje: number;
  }[];
  setParametrosAction: (
    parametros: {
      id: number;
      name: string;
      description: string;
      porcentaje: number;
    }[]
  ) => void;
  isOpen: boolean;
  onCloseAction: () => void;
  rating: number;
  setRating: (rating: number) => void;
  subjects: { id: number }[];
  setSubjects: (subjects: { id: number }[]) => void;
  selectedCourseType: number[];
  setSelectedCourseType: (typeIds: number[]) => void;

  isActive: boolean;
  setIsActive: (isActive: boolean) => void;
  instructor: string;
  setInstructor: (instructor: string) => void;
  educators?: { id: string; name: string }[];
}

// Componente ModalFormCourse
const ModalFormCourse: React.FC<CourseFormProps> = ({
  programId,
  onSubmitAction,
  uploading,
  editingCourseId,
  title,
  setTitle,
  description,
  setDescription,
  rating,
  setRating,
  categoryid,
  setCategoryid,
  nivelid,
  setNivelid,
  coverImageKey,
  parametros = [],
  setParametrosAction,
  isOpen,
  onCloseAction,
  subjects,
  setSubjects,
  selectedCourseType, // 👈 Agregado
  setSelectedCourseType, // 👈 Agregado
  isActive,
  setIsActive,
  setInstructor,
  educators = [],
  instructor,
}) => {
  const [file, setFile] = useState<File | null>(null); // Estado para el archivo
  const [frameImageFile, setFrameImageFile] = useState<File | null>(null); // frame capturado
  const [fileName, setFileName] = useState<string | null>(null); // Estado para el nombre del archivo
  const [fileSize, setFileSize] = useState<number | null>(null); // Estado para el tamaño del archivo
  const [progress, setProgress] = useState(0); // Estado para el progreso
  const [isEditing, setIsEditing] = useState(false); // Estado para la edición
  const [isDragging, setIsDragging] = useState(false); // Estado para el arrastre
  const [errors, setErrors] = useState({
    title: false,
    description: false,
    categoryid: false,
    category: false,
    modalidadesid: false,
    rating: false, // Añadir esta línea
    nivelid: false,
    file: false,
    nivel: false,
    modalidad: false,
    courseTypeId: false,
  }); // Estado para los errores
  const [uploadProgress, setUploadProgress] = useState(0); // Estado para el progreso de subida
  const [isUploading, setIsUploading] = useState(false); // Estado para la subida
  const [individualPrice, setIndividualPrice] = useState<number | null>(null); // Precio individual

  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set()); // Estado para los campos modificados
  void modifiedFields;
  const [currentCoverImageKey] = useState(coverImageKey); // Estado para la imagen de portada
  const [uploadController, setUploadController] =
    useState<AbortController | null>(null); // Estado para el controlador de subida
  const [coverImage, setCoverImage] = useState<string | null>(null); // Estado para la imagen de portada
  const [addParametros, setAddParametros] = useState(false); // Estado para los parámetros
  const [modalidadesid, setModalidadesid] = useState<number[]>([]); // ✅ Ensure it's an array
  // const newCourseId = responseData.id;
  const [allSubjects, setAllSubjects] = useState<
    { id: number; title: string }[]
  >([]); // Estado para todas las materias

  // Función para manejar el cambio de archivo
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      setFile(files[0]);
      setFileName(files[0].name);
      setFileSize(files[0].size);
      setErrors((prev) => ({ ...prev, file: false }));
    } else {
      setFile(null);
      setFileName(null);
      setFileSize(null);
      setErrors((prev) => ({ ...prev, file: true }));
    }
    console.log('coverImageKey', coverImage); // Registro de depuración
  };

  // Función para manejar el arrastre de archivos
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Función para manejar el arrastre de salida
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Función para manejar el arrastre de soltar
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      setFile(files[0]);
      setFileName(files[0].name);
      setFileSize(files[0].size);
      setErrors((prev) => ({ ...prev, file: false }));
    } else {
      setFile(null);
      setFileName(null);
      setFileSize(null);
      setErrors((prev) => ({ ...prev, file: true }));
    }
  };

  // Función para manejar la adición o creacion de parámetros
  const handleAddParametro = () => {
    if (parametros.length < 10) {
      setParametrosAction([
        ...parametros,
        {
          id: 0,
          name: '',
          description: '',
          porcentaje: 0,
        },
      ]);
    }
  };

  const safeCourseTypeId = selectedCourseType ?? [];

  const [courseTypes, setCourseTypes] = useState<
    { id: number; name: string }[]
  >([]);

  useEffect(() => {
    const fetchCourseTypes = async () => {
      try {
        const response = await fetch('/api/educadores/courses/courseTypes');
        const data = (await response.json()) as { id: number; name: string }[];
        setCourseTypes(data);
      } catch (error) {
        console.error('Error fetching course types:', error);
      }
    };

    if (isOpen) {
      void fetchCourseTypes();
    }
  }, [isOpen]);

  // Función para manejar el cambio de parámetros
  const handleParametroChange = (
    index: number,
    field: 'name' | 'description' | 'porcentaje',
    value: string | number
  ) => {
    const updatedParametros = [...parametros];
    updatedParametros[index] = {
      ...updatedParametros[index],
      [field]: value,
    };

    // Validar que la suma de los porcentajes no supere el 100%
    const sumaPorcentajes = updatedParametros.reduce(
      (acc, parametro) => acc + parametro.porcentaje,
      0
    );
    if (sumaPorcentajes > 100) {
      toast('Error', {
        description: 'La suma de los porcentajes no puede superar el 100%',
      });
      return;
    }

    setParametrosAction(updatedParametros);
  };

  // Función para manejar la eliminación de parámetros
  const handleRemoveParametro = async (index: number) => {
    const parametroAEliminar = parametros[index];

    // Si tiene ID, es un parámetro guardado → eliminarlo de la base de datos
    if (parametroAEliminar.id) {
      try {
        const response = await fetch('/api/educadores/parametros', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: parametroAEliminar.id }),
        });

        if (!response.ok) {
          throw new Error('Error al eliminar el parámetro de la base de datos');
        }
      } catch (error) {
        console.error('❌ Error al eliminar parámetro:', error);
        toast.error('Error al eliminar el parámetro');
        return;
      }
    }

    // Actualiza el estado local (independientemente de si tenía id o no)
    const updatedParametros = parametros.filter((_, i) => i !== index);
    setParametrosAction(updatedParametros);
  };

  // Función para obtener los archivos de subida y enviarselo al componente padre donde se hace el metodo POST
  const handleSubmit = async () => {
    const controller = new AbortController();

    setUploadController(controller);

    const newErrors = {
      title: !editingCourseId && !title,
      description: !editingCourseId && !description,
      categoryid: !editingCourseId && !categoryid,
      modalidadesid: !editingCourseId && !modalidadesid,
      nivelid: !editingCourseId && !nivelid,
      rating: !editingCourseId && !rating,
      file: !editingCourseId && !file && !currentCoverImageKey,
      courseTypeId:
        !editingCourseId &&
        (!selectedCourseType || selectedCourseType.length === 0),
    };

    if (Object.values(newErrors).some((value) => value)) {
      console.log('Validation errors:', newErrors);
      return;
    }

    if (Object.values(newErrors).some((value) => value)) {
      console.log('Validation errors:', newErrors);

      // Crear mensaje de errores
      const missingFields: string[] = [];
      if (newErrors.title) missingFields.push('Título');
      if (newErrors.description) missingFields.push('Descripción');
      if (newErrors.categoryid) missingFields.push('Categoría');
      if (newErrors.modalidadesid) missingFields.push('Modalidad');
      if (newErrors.nivelid) missingFields.push('Nivel');
      if (newErrors.rating) missingFields.push('Rating');
      if (newErrors.file) missingFields.push('Archivo de portada');
      if (newErrors.courseTypeId) missingFields.push('Tipo de Curso'); // 👈 NUEVO

      const message = `Por favor completa: ${missingFields.join(', ')}.`;
      toast.error('Faltan campos obligatorios', { description: message });

      return;
    }

    setIsEditing(true);
    setIsUploading(true);

    try {
      let coverImageKey = currentCoverImageKey ?? '';
      let uploadedFileName = fileName ?? '';

      if (file) {
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: file.type,
            fileSize: file.size,
            fileName: file.name,
          }),
        });

        if (!uploadResponse.ok) {
          throw new Error(
            `Error during file upload: ${uploadResponse.statusText}`
          );
        }

        const uploadData = (await uploadResponse.json()) as {
          key: string;
          fileName: string;
          fields: Record<string, string>;
          url: string;
        };
        coverImageKey = uploadData.key;
        uploadedFileName = uploadData.fileName;

        const formData = new FormData();
        Object.entries(uploadData.fields).forEach(([key, value]) => {
          formData.append(key, value);
        });
        formData.append('file', file);

        const uploadFileResponse = await fetch(uploadData.url, {
          method: 'POST',
          body: formData,
        });

        // Si es un video y hay frame seleccionado, subimos el frame
        if (file.type.startsWith('video/') && frameImageFile) {
          const baseName = uploadedFileName.split('.').slice(0, -1).join('.');
          const frameFileName = `${baseName}-frame.jpg`;

          const frameUploadResp = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contentType: frameImageFile.type,
              fileSize: frameImageFile.size,
              fileName: frameFileName,
            }),
          });

          if (!frameUploadResp.ok) {
            throw new Error('Error al generar URL para subir el frame');
          }

          const frameUploadData = (await frameUploadResp.json()) as {
            fields: Record<string, string>;
            url: string;
            key: string;
          };

          const frameFormData = new FormData();
          Object.entries(frameUploadData.fields).forEach(([key, value]) => {
            frameFormData.append(key, value);
          });

          frameFormData.append('file', frameImageFile);

          const frameUploadResult = await fetch(frameUploadData.url, {
            method: 'POST',
            body: frameFormData,
          });

          if (!frameUploadResult.ok) {
            throw new Error('Error al subir frame del video');
          }

          coverImageKey = frameUploadData.key;
        }

        if (!uploadFileResponse.ok) {
          throw new Error('Failed to upload file.');
        }
      }

      const selectedSubjects = subjects.map((subject) => ({
        id: subject.id, // Solo enviamos el ID de la materia
      }));

      // Validar que haya al menos una materia seleccionada
      if (selectedSubjects?.length === 0) {
        toast('Error', {
          description: 'Debe seleccionar al menos una materia.',
        });
        return;
      }

      const payload = {
        title,
        description,
        coverImageKey,
        categoryid,
        modalidadesid: Array.isArray(modalidadesid)
          ? modalidadesid
          : [modalidadesid],
        nivelid,
        rating,
        instructor, // Ensure instructor ID is included here
        subjects: selectedSubjects,
        fileName: uploadedFileName,
        courseTypeId: selectedCourseType,
        isActive,
        individualPrice,
      };

      console.log('Payload to send:', payload);
      let videoKey = '';

      if (file?.type.startsWith('video/')) {
        videoKey = coverImageKey; // o uploadData.key si separas la lógica
      }

      await onSubmitAction(
        editingCourseId ? editingCourseId.toString() : '',
        title,
        description,
        file,
        categoryid,
        modalidadesid,
        nivelid,
        rating,
        addParametros,
        coverImageKey,
        fileName ?? '', // Ensure fileName is a string
        selectedSubjects,
        programId,
        isActive,
        selectedCourseType,
        individualPrice,
        videoKey
      );

      if (controller.signal.aborted) {
        console.log('Upload cancelled');
      }

      setIsUploading(false);
    } catch (error) {
      console.error('Error during the submission process:', error);
      setIsUploading(false);
    }
  };

  // Función para cancelar la carga
  const handleCancel = () => {
    if (uploadController) {
      uploadController.abort();
    }
    onCloseAction();
  };

  // Función para manejar el cambio de campo
  const handleFieldChange = (
    field: string,
    value: string | number | File | null
  ) => {
    setModifiedFields((prev) => new Set(prev).add(field));
    switch (field) {
      case 'title':
        setTitle(value as string);
        break;
      case 'description':
        setDescription(value as string);
        break;
      case 'categoryid':
        setCategoryid(value as number);
        break;
      case 'modalidadesid':
        if (Array.isArray(value)) {
          // Asumiendo que el value es del tipo { value: string; label: string }[]
          const ids = (value as { value: string }[]).map((item) =>
            parseInt(item.value)
          );
          setModalidadesid(ids);
        } else {
          // En caso de que se reciba un solo valor y no un array
          setModalidadesid([parseInt(value as string)]);
        }
        break;

      case 'rating':
        setRating(value as number);
        break;
      case 'nivelid':
        setNivelid(value as number);
        break;
      case 'file':
        setFile(value as File);
        break;
    }
  };

  // Efecto para manejar el progreso de carga
  useEffect(() => {
    if (uploading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 1;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [uploading]);

  // Efecto para manejar el progreso de carga al 100%
  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => {
        setProgress(0);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [progress]);

  // Efecto para manejar la carga de archivos
  useEffect(() => {
    if (!uploading && isEditing) {
      setIsEditing(false);
    }
  }, [uploading, isEditing]);

  // Efecto para manejar la carga de archivos
  useEffect(() => {
    if (isUploading) {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10; // Incrementar de 10 en 10
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [isUploading]);

  // Efecto para manejar la carga de los inputs
  useEffect(() => {
    if (editingCourseId) {
      setTitle(title);
      setDescription(description);
      setCategoryid(categoryid);
      setRating(rating); // Añadir esta línea
      setModalidadesid([...modalidadesid]);
      setNivelid(nivelid);
      setCoverImage(coverImageKey);
      setIndividualPrice(individualPrice);
    }
  }, [editingCourseId]);

  // Efecto para manejar la creacion o edicion de parametros
  const handleToggleParametro = () => {
    setAddParametros((prevAddParametro) => !prevAddParametro);
  };

  // Efecto para manejar la creacion o edicion del curso
  useEffect(() => {
    if (isOpen && !editingCourseId) {
      setTitle('');
      setDescription('');
      setCategoryid(0);
      setModalidadesid([]);
      setNivelid(0);
      setCoverImage('');
      setRating(0);
      setParametrosAction([]);
      setIndividualPrice(null);
    }
  }, [isOpen, editingCourseId]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        if (typeof programId !== 'number') {
          console.error('programId is not defined');
          return;
        }

        const response = await fetch(
          `/api/super-admin/programs?programId=${programId}`
        );
        const data = (await response.json()) as { id: number; title: string }[];

        if (Array.isArray(data)) {
          // Filtrar materias duplicadas basándonos en el id
          const uniqueSubjects = data.filter(
            (subject, index, self) =>
              index === self.findIndex((s) => s.title === subject.title)
          );
          setAllSubjects(uniqueSubjects);
        } else {
          console.error('La respuesta no es un arreglo:', data);
          setAllSubjects([]);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setAllSubjects([]);
      }
    };

    // 👇 Solo cuando el modal se abre o el programId cambia
    if (isOpen) {
      void fetchSubjects();
    }
  }, [isOpen, programId]);

  // Function to handle selecting subjects
  const handleSelectSubjects = (
    newValue: MultiValue<{ value: string; label: string }>
  ) => {
    const selectedSubjects = newValue.map((option) => ({
      id: Number(option.value), // Solo necesitamos el ID de la materia
    }));
    setSubjects(selectedSubjects);
    console.log('Subjects after selection:', selectedSubjects);
  };

  // Render la vista
  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="max-h-[90vh] max-w-full overflow-y-auto">
        <DialogHeader className="mt-4">
          <DialogTitle className="text-4xl">
            {editingCourseId ? 'Editar Curso 2' : 'Crear Curso'}
          </DialogTitle>
          <DialogDescription className="text-xl text-white">
            {editingCourseId
              ? 'Edita los detalles del curso'
              : 'Llena los detalles para crear un nuevo curso'}
          </DialogDescription>
        </DialogHeader>
        <div className="bg-background rounded-lg px-6 text-black shadow-md">
          <label htmlFor="title" className="text-primary text-lg font-medium">
            Título
          </label>
          <input
            type="text"
            placeholder="Título"
            value={title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className={`mb-4 w-full rounded border p-2 text-white outline-none ${errors.title ? 'border-red-500' : 'border-primary'}`}
          />
          {errors.title && (
            <p className="text-sm text-red-500">Este campo es obligatorio.</p>
          )}
          <label
            htmlFor="description"
            className="text-primary text-lg font-medium"
          >
            Descripción
          </label>
          <textarea
            placeholder="Descripción"
            value={description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className={`mb-3 h-auto w-full rounded border p-2 text-white outline-none ${errors.description ? 'border-red-500' : 'border-primary'}`}
          />
          {errors.description && (
            <p className="text-sm text-red-500">Este campo es obligatorio.</p>
          )}

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
            {/* Nivel */}
            <div className="mx-auto flex w-10/12 flex-col gap-2">
              <label
                htmlFor="nivelid"
                className="text-primary text-left text-lg font-medium"
              >
                Nivel
              </label>
              <NivelDropdown
                nivel={nivelid}
                setNivel={setNivelid}
                errors={errors}
              />
              {errors.nivelid && (
                <p className="text-left text-sm text-red-500">
                  Este campo es obligatorio.
                </p>
              )}
            </div>

            {/* Categoría */}
            <div className="mx-auto flex w-10/12 flex-col gap-2">
              <label
                htmlFor="categoryid"
                className="text-primary text-left text-lg font-medium"
              >
                Categoría
              </label>
              <CategoryDropdown
                category={categoryid}
                setCategory={setCategoryid}
                errors={errors}
              />
              {errors.categoryid && (
                <p className="text-left text-sm text-red-500">
                  Este campo es obligatorio.
                </p>
              )}
            </div>

            {/* Modalidad */}
            <div className="mx-auto flex w-10/12 flex-col gap-2">
              <label
                htmlFor="modalidadesid"
                className="text-primary text-left text-lg font-medium"
              >
                Modalidad
              </label>
              <ModalidadDropdown
                modalidad={modalidadesid}
                setModalidad={setModalidadesid}
                errors={errors}
              />
              {errors.modalidadesid && (
                <p className="text-left text-sm text-red-500">
                  Este campo es obligatorio.
                </p>
              )}
            </div>

            {/* Course type */}
            <div className="mx-auto flex w-10/12 flex-col gap-2">
              <label
                htmlFor="courseTypes"
                className="text-primary text-left text-lg font-medium"
              >
                Tipo de curso
              </label>
              <label
                htmlFor="courseTypes"
                className="text-primary text-left text-lg font-medium"
              >
                Selecciona el tipo del curso
              </label>
              <Select
                options={courseTypes.map((type) => ({
                  value: type.id.toString(),
                  label: type.name,
                }))}
                onChange={(selectedOptions) => {
                  setSelectedCourseType(
                    selectedOptions.map((opt) => Number(opt.value))
                  );
                  setErrors((prev) => ({ ...prev, courseTypeId: false }));
                }}
                isMulti // ✅ permite selección múltiple
                classNamePrefix="react-select"
                className="mt-1 w-full"
              />
            </div>
            {errors.courseTypeId && (
              <p className="text-left text-sm text-red-500">
                Este campo es obligatorio.
              </p>
            )}
            {safeCourseTypeId.includes(4) && (
              <div className="mx-auto flex w-10/12 flex-col gap-2">
                <label
                  htmlFor="individualPrice"
                  className="text-primary text-left text-lg font-medium"
                >
                  Precio Individual
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Ingrese el precio"
                  value={individualPrice ?? ''}
                  onChange={(e) => setIndividualPrice(Number(e.target.value))}
                  className="border-primary mt-1 w-full rounded border p-2 text-white outline-none focus:no-underline"
                />
              </div>
            )}

            <div className="mx-auto flex w-10/12 flex-col gap-2">
              <label
                htmlFor="courseTypes"
                className="text-primary text-left text-lg font-medium"
              >
                Esta activo?
              </label>
              <ActiveDropdown isActive={isActive} setIsActive={setIsActive} />
            </div>
          </div>

          <div>
            <label
              htmlFor="rating"
              className="text-primary text-lg font-medium"
            >
              Rating
            </label>
            <Input
              type="number"
              min="0"
              max="5"
              step="0.1"
              placeholder="0-5"
              className="border-primary mt-1 w-full rounded border p-2 text-white outline-none focus:no-underline"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="instructor"
              className="text-primary text-lg font-medium"
            >
              Instructor
            </label>
            <select
              id="instructor"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              className="border-primary bg-background w-full rounded border p-2 text-white outline-none"
            >
              <option value="">Seleccionar instructor</option>
              {educators.map((educator) => (
                <option key={educator.id} value={educator.id}>
                  {educator.name}
                </option>
              ))}
            </select>
          </div>
          <label htmlFor="file" className="text-primary text-lg font-medium">
            Imagen de portada
          </label>
          <div
            className={`border-primary mx-auto mt-5 w-80 rounded-lg border-2 border-dashed p-8 lg:w-1/2 ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : errors.file
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 bg-gray-50'
            } transition-all duration-300 ease-in-out`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              {!file ? (
                <>
                  <FiUploadCloud
                    className={`mx-auto size-12 ${errors.file ? 'text-red-500' : 'text-primary'} `}
                  />
                  <h2 className="mt-4 text-xl font-medium text-gray-700">
                    Arrastra y suelta tu imagen aquí
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    o haz clic para seleccionar un archivo desde tu computadora
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Soporta: Imágenes (JPG, PNG, GIF) y Videos (MP4, MOV, WEBM)
                    — Tamaño máx: 100MB
                  </p>

                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileChange}
                    id="file-upload"
                  />

                  <label
                    htmlFor="file-upload"
                    className={`mt-4 inline-flex cursor-pointer items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${errors.file ? 'bg-red-500' : 'bg-primary'}`}
                  >
                    Seleccionar Archivo
                  </label>
                </>
              ) : (
                <div className="relative overflow-hidden rounded-lg bg-gray-100">
                  {file.type.startsWith('video/') ? (
                    <div className="flex flex-col">
                      <video
                        id="video-player"
                        src={URL.createObjectURL(file)}
                        controls
                        className="h-48 w-full object-cover"
                      />

                      <div className="mt-4 flex flex-col items-start gap-2">
                        <label className="text-sm font-medium text-gray-700">
                          Capturar frame del video como imagen de portada
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const video = document.getElementById(
                              'video-player'
                            ) as HTMLVideoElement | null;
                            if (!video) return;
                            const canvas = document.createElement('canvas');
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.drawImage(
                                video,
                                0,
                                0,
                                canvas.width,
                                canvas.height
                              );
                              canvas.toBlob((blob) => {
                                if (blob) {
                                  const captured = new File(
                                    [blob],
                                    'frame.jpg',
                                    { type: 'image/jpeg' }
                                  );
                                  setFrameImageFile(captured);
                                  toast.success(
                                    'Frame capturado como imagen de portada'
                                  );
                                }
                              }, 'image/jpeg');
                            }
                          }}
                          className="mt-2 rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                        >
                          Capturar Frame
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      width={500}
                      height={200}
                      className="h-48 w-full object-cover"
                    />
                  )}

                  <button
                    onClick={() => {
                      setFile(null);
                      setFileName(null);
                      setFileSize(null);
                      setErrors((prev) => ({ ...prev, file: true }));
                    }}
                    className="absolute top-2 right-2 z-20 rounded-full bg-red-500 p-1 text-white hover:opacity-70"
                  >
                    <MdClose className="z-20 size-5" />
                  </button>
                  <div className="flex justify-between p-2">
                    <p className="truncate text-sm text-gray-500">{fileName}</p>
                    <p className="text-sm text-gray-500">
                      {((fileSize ?? 0) / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              )}
              {errors.file && (
                <p className="text-sm text-red-500">
                  Este campo es obligatorio.
                </p>
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-col text-white">
            <p>
              ¿Es calificable? {editingCourseId ? 'actualizar' : 'agregar'}{' '}
              parametros
            </p>
            <div className="toggler">
              <input
                type="checkbox"
                id="toggle"
                checked={addParametros}
                onChange={handleToggleParametro}
                name="toggle"
                value="1"
              />
              <label htmlFor="toggle">
                <svg
                  className="toggler-on"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 130.2 130.2"
                >
                  <polyline
                    className="path check"
                    points="100.2,40.2 51.5,88.8 29.8,67.5"
                  />
                </svg>
                <svg
                  className="toggler-off"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 130.2 130.2"
                >
                  <line
                    className="path line"
                    x1="34.4"
                    y1="34.4"
                    x2="95.8"
                    y2="95.8"
                  />
                  <line
                    className="path line"
                    x1="95.8"
                    y1="34.4"
                    x2="34.4"
                    y2="95.8"
                  />
                </svg>
              </label>
              <span className="mt-1 ml-2 text-sm text-gray-400">
                {addParametros ? 'Si' : 'No'}
              </span>
            </div>
          </div>
          {addParametros && (
            <div className="my-4 flex flex-col">
              <label
                htmlFor="totalParametros"
                className="text-primary text-lg font-medium"
              >
                Parametros de evaluación
              </label>
              <Button
                onClick={handleAddParametro}
                disabled={parametros.length >= 10} // Verifica que parametros no sea undefined
                className="bg-primary mt-2 w-10/12 text-white lg:w-1/2"
              >
                {editingCourseId ? 'Editar o agregar' : 'Agregar'} nuevo
                parametro
                <Plus />
              </Button>
              {parametros.map((parametro, index) => (
                <div key={index} className="mt-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-primary text-lg font-medium">
                      Parámetro {index + 1}
                    </h3>
                    <Button
                      variant="destructive"
                      onClick={() => handleRemoveParametro(index)}
                    >
                      Eliminar
                    </Button>
                  </div>
                  <label className="text-primary mt-2 text-lg font-medium">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={parametro.name}
                    onChange={(e) =>
                      handleParametroChange(index, 'name', e.target.value)
                    }
                    className="mt-1 w-full rounded border p-2 text-white outline-none"
                  />
                  <label className="text-primary mt-2 text-lg font-medium">
                    Descripción
                  </label>
                  <textarea
                    value={parametro.description}
                    onChange={(e) =>
                      handleParametroChange(
                        index,
                        'description',
                        e.target.value
                      )
                    }
                    className="mt-1 w-full rounded border p-2 text-white outline-none"
                  />
                  <label className="text-primary mt-2 text-lg font-medium">
                    Porcentaje %
                  </label>
                  <input
                    type="number"
                    value={parametro.porcentaje}
                    onChange={(e) =>
                      handleParametroChange(
                        index,
                        'porcentaje',
                        Math.max(1, Math.min(100, parseFloat(e.target.value)))
                      )
                    }
                    className="mt-1 w-full rounded border p-2 text-white outline-none"
                  />
                </div>
              ))}
            </div>
          )}
          {isOpen && (
            <div className="my-4 flex flex-col">
              <label
                htmlFor="subjects"
                className="text-primary text-lg font-medium"
              >
                Asignar Materias
              </label>
              <Select
                isMulti
                options={Array.from(
                  new Map(
                    allSubjects.map((subject) => [
                      subject.id,
                      {
                        value: subject.id.toString(),
                        label: subject.title,
                      },
                    ])
                  ).values()
                )}
                onChange={handleSelectSubjects}
                classNamePrefix="react-select"
                className="mt-2 w-10/12 lg:w-1/2"
              />
            </div>
          )}
          {(uploading || isUploading) && (
            <div className="mt-4">
              <Progress
                value={uploading ? progress : uploadProgress}
                className="w-full"
              />
              <p className="mt-2 text-center text-sm text-gray-500">
                {uploading ? progress : uploadProgress}% Completado
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="mt-4 grid grid-cols-2 gap-4">
          <Button
            onClick={handleCancel}
            className="mr-2 w-full border-transparent bg-gray-600 p-3 text-white hover:bg-gray-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-green-400 text-white hover:bg-green-400/70"
            disabled={uploading}
          >
            {uploading
              ? 'Subiendo...'
              : editingCourseId
                ? isEditing
                  ? 'Editando...'
                  : 'Editar'
                : 'Crear Curso'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalFormCourse;
