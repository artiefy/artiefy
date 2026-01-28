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
    videoKey: string, // ✅ <-- aquí lo agregas
    horario: number | null,
    espacios: number | null,
    certificationTypeId: number | null
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
  instructors: string[]; // Array de IDs de instructores
  setInstructors: (instructors: string[]) => void;
  educators?: { id: string; name: string }[];
  horario: number | null;
  setHorario: (horario: number | null) => void;
  espacios: number | null;
  setEspacios: (espacios: number | null) => void;
  certificationTypeId: number | null;
  setCertificationTypeId: (id: number | null) => void;
  certificationTypes?: {
    id: number;
    name: string;
    description: string | null;
  }[];
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
  setInstructors,
  educators = [],
  instructors,
  horario,
  setHorario,
  espacios,
  setEspacios,
  certificationTypeId,
  setCertificationTypeId,
  certificationTypes = [],
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
  const [_localCertificationTypes, setLocalCertificationTypes] =
    useState<{ id: number; name: string; description: string | null }[]>(
      certificationTypes
    );
  const [isLoadingCertifications, setIsLoadingCertifications] = useState(true);
  void isLoadingCertifications;
  const [_localCertificationTypeId, setLocalCertificationTypeId] = useState<
    number | null
  >(certificationTypeId);
  // const newCourseId = responseData.id;
  const [allSubjects, setAllSubjects] = useState<
    { id: number; title: string }[]
  >([]); // Estado para todas las materias
  const [scheduleOptions, setScheduleOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [spaceOptions, setSpaceOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [_isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [_isLoadingSpaces, setIsLoadingSpaces] = useState(false);

  // Interfaces para los datos dinámicos
  interface Nivel {
    id: number;
    name: string;
    description: string;
  }

  interface Category {
    id: number;
    name: string;
    description: string;
  }

  interface Modalidad {
    id: number;
    name: string;
    description: string;
  }

  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [isLoadingNiveles, setIsLoadingNiveles] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingModalidades, setIsLoadingModalidades] = useState(false);

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

  const _safeCourseTypeId = selectedCourseType ?? [];

  // Opciones para horarios y espacios
  const _horariosOptions = ['Sábado Mañana', 'Sábado Tarde', 'Lunes y Martes'];

  const _espaciosOptions = ['Florencia', 'Cali', 'Virtual'];

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

  // ✅ Fetch certification types
  useEffect(() => {
    const fetchCertifications = async () => {
      setIsLoadingCertifications(true);
      try {
        const response = await fetch('/api/super-admin/certification-types', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(
            `Error al obtener los tipos de certificación: ${await response.text()}`
          );
        }

        const data = (await response.json()) as {
          success: boolean;
          data: { id: number; name: string; description: string | null }[];
        };
        console.log('✅ Tipos de certificación cargados:', data.data);
        setLocalCertificationTypes(data.data ?? []);
      } catch (error) {
        console.error('Error al cargar certificaciones:', error);
        // Si el API falla, usa el prop como fallback
        if (certificationTypes && certificationTypes.length > 0) {
          console.log(
            '📦 Usando tipos de certificación del prop:',
            certificationTypes
          );
          setLocalCertificationTypes(certificationTypes);
        }
      } finally {
        setIsLoadingCertifications(false);
      }
    };

    void fetchCertifications();
  }, [certificationTypes]);

  // ✅ Fetch schedule options
  useEffect(() => {
    const fetchSchedules = async () => {
      setIsLoadingSchedules(true);
      try {
        const response = await fetch('/api/super-admin/schedule-options', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(
            `Error al obtener los horarios: ${await response.text()}`
          );
        }

        const data = (await response.json()) as {
          data: { id: number; name: string }[];
        };
        setScheduleOptions(data.data ?? []);
      } catch (error) {
        console.error('Error al cargar horarios:', error);
      } finally {
        setIsLoadingSchedules(false);
      }
    };

    if (isOpen) {
      void fetchSchedules();
    }
  }, [isOpen]);

  // ✅ Fetch space options
  useEffect(() => {
    const fetchSpaces = async () => {
      setIsLoadingSpaces(true);
      try {
        const response = await fetch('/api/super-admin/space-options', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(
            `Error al obtener los espacios: ${await response.text()}`
          );
        }

        const data = (await response.json()) as {
          data: { id: number; name: string }[];
        };
        setSpaceOptions(data.data ?? []);
      } catch (error) {
        console.error('Error al cargar espacios:', error);
      } finally {
        setIsLoadingSpaces(false);
      }
    };

    if (isOpen) {
      void fetchSpaces();
    }
  }, [isOpen]);

  // ✅ Cargar niveles
  useEffect(() => {
    const fetchNiveles = async () => {
      setIsLoadingNiveles(true);
      try {
        const response = await fetch('/api/educadores/nivel', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`Error: ${await response.text()}`);
        const data = (await response.json()) as Nivel[];
        setNiveles(data);
      } catch (error) {
        console.error('Error al cargar niveles:', error);
      } finally {
        setIsLoadingNiveles(false);
      }
    };
    void fetchNiveles();
  }, []);

  // ✅ Cargar categorías
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await fetch('/api/educadores/categories', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`Error: ${await response.text()}`);
        const data = (await response.json()) as Category[];
        setCategories(data);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    void fetchCategories();
  }, []);

  // ✅ Cargar modalidades
  useEffect(() => {
    const fetchModalidades = async () => {
      setIsLoadingModalidades(true);
      try {
        const response = await fetch('/api/educadores/modalidades', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`Error: ${await response.text()}`);
        const data = (await response.json()) as Modalidad[];
        setModalidades(data);
      } catch (error) {
        console.error('Error al cargar modalidades:', error);
      } finally {
        setIsLoadingModalidades(false);
      }
    };
    void fetchModalidades();
  }, []);

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
        instructors, // Array de IDs de instructores (many-to-many)
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
        videoKey,
        horario,
        espacios,
        certificationTypeId
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
      setHorario(null);
      setEspacios(null);
      setCertificationTypeId(null);
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
  const _handleSelectSubjects = (
    newValue: MultiValue<{ value: string; label: string }>
  ) => {
    const selectedSubjects = newValue.map((option) => ({
      id: Number(option.value), // Solo necesitamos el ID de la materia
    }));
    setSubjects(selectedSubjects);
    console.log('Subjects after selection:', selectedSubjects);
  };

  // ✅ Efecto para sincronizar el certificationTypeId local
  useEffect(() => {
    if (editingCourseId && certificationTypeId) {
      console.log(
        '📋 Sincronizando certificationTypeId en program:',
        certificationTypeId
      );
      setLocalCertificationTypeId(certificationTypeId);
    }
  }, [editingCourseId, certificationTypeId]);

  // Render la vista
  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto p-3 md:p-6">
        <DialogHeader className="mt-2 md:mt-4">
          <DialogTitle className="text-xl md:text-4xl">
            {editingCourseId ? 'Editar Curso' : 'Crear Curso'}
          </DialogTitle>
          <DialogDescription className="text-sm text-white md:text-xl">
            {editingCourseId
              ? 'Edita los detalles del curso'
              : 'Llena los detalles para crear un nuevo curso'}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-background px-2 py-3 text-black shadow-md md:px-6 md:py-4">
          <div className="space-y-3 md:space-y-4">
            <div>
              <label
                htmlFor="title"
                className="text-sm font-medium text-primary md:text-lg"
              >
                Título
              </label>
              <input
                type="text"
                placeholder="Título"
                value={title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className={`mt-1 w-full rounded border p-2 text-sm text-white outline-none md:text-base ${errors.title ? 'border-red-500' : 'border-primary'}`}
              />
              {errors.title && (
                <p className="text-xs text-red-500 md:text-sm">
                  Este campo es obligatorio.
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="description"
                className="text-sm font-medium text-primary md:text-lg"
              >
                Descripción
              </label>
              <textarea
                placeholder="Descripción"
                value={description}
                onChange={(e) =>
                  handleFieldChange('description', e.target.value)
                }
                className={`mt-1 w-full rounded border p-2 text-sm text-white outline-none md:text-base ${errors.description ? 'border-red-500' : 'border-primary'}`}
                rows={4}
              />
              {errors.description && (
                <p className="text-xs text-red-500 md:text-sm">
                  Este campo es obligatorio.
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="w-full">
                <label className="text-sm font-medium text-primary md:text-lg">
                  Nivel
                </label>
                <select
                  className="mt-1 w-full rounded border bg-background p-2 text-sm text-white md:text-base"
                  value={nivelid}
                  onChange={(e) => setNivelid(Number(e.target.value))}
                  disabled={isLoadingNiveles}
                >
                  <option value="">Seleccionar nivel</option>
                  {isLoadingNiveles ? (
                    <option value="">Cargando...</option>
                  ) : (
                    niveles.map((nivel) => (
                      <option key={nivel.id} value={nivel.id}>
                        {nivel.name}
                      </option>
                    ))
                  )}
                </select>
                {errors.nivelid && (
                  <p className="text-xs text-red-500 md:text-sm">
                    Este campo es obligatorio.
                  </p>
                )}
              </div>
              <div className="w-full">
                <label className="text-sm font-medium text-primary md:text-lg">
                  Categoría
                </label>
                <select
                  className="mt-1 w-full rounded border bg-background p-2 text-sm text-white md:text-base"
                  value={categoryid}
                  onChange={(e) => setCategoryid(Number(e.target.value))}
                  disabled={isLoadingCategories}
                >
                  <option value="">Seleccionar categoría</option>
                  {isLoadingCategories ? (
                    <option value="">Cargando...</option>
                  ) : (
                    categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  )}
                </select>
                {errors.categoryid && (
                  <p className="text-xs text-red-500 md:text-sm">
                    Este campo es obligatorio.
                  </p>
                )}
              </div>
              <div className="w-full">
                <label className="text-sm font-medium text-primary md:text-lg">
                  Modalidad
                </label>
                <select
                  className="mt-1 w-full rounded border bg-background p-2 text-sm text-white md:text-base"
                  value={
                    Array.isArray(modalidadesid)
                      ? (modalidadesid[0] ?? '')
                      : (modalidadesid ?? '')
                  }
                  onChange={(e) => setModalidadesid([Number(e.target.value)])}
                  disabled={isLoadingModalidades}
                >
                  <option value="">Seleccionar modalidad</option>
                  {isLoadingModalidades ? (
                    <option value="">Cargando...</option>
                  ) : (
                    modalidades.map((modalidad) => (
                      <option key={modalidad.id} value={modalidad.id}>
                        {modalidad.name}
                      </option>
                    ))
                  )}
                </select>
                {errors.modalidadesid && (
                  <p className="text-xs text-red-500 md:text-sm">
                    Este campo es obligatorio.
                  </p>
                )}
              </div>
              <div className="w-full">
                <label className="text-sm font-medium text-primary md:text-lg">
                  Horario
                </label>
                <select
                  className="mt-1 w-full rounded border bg-background p-2 text-sm text-white md:text-base"
                  value={horario ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                      ? Number(e.target.value)
                      : null;
                    setHorario(value);
                  }}
                >
                  <option value="">Seleccionar horario</option>
                  {scheduleOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full">
                <label className="text-sm font-medium text-primary md:text-lg">
                  Espacios
                </label>
                <select
                  className="mt-1 w-full rounded border bg-background p-2 text-sm text-white md:text-base"
                  value={espacios ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                      ? Number(e.target.value)
                      : null;
                    setEspacios(value);
                  }}
                >
                  <option value="">Seleccionar espacio</option>
                  {spaceOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full">
                <label className="text-sm font-medium text-primary md:text-lg">
                  Tipo de Certificación
                </label>
                <select
                  className="mt-1 w-full rounded border bg-background p-2 text-sm text-white md:text-base"
                  value={certificationTypeId ?? ''}
                  onChange={(e) => {
                    const newValue = e.target.value
                      ? Number(e.target.value)
                      : null;
                    setCertificationTypeId(newValue);
                  }}
                  disabled={isLoadingCertifications}
                >
                  <option value="">
                    {isLoadingCertifications
                      ? 'Cargando...'
                      : 'Seleccionar tipo de certificación'}
                  </option>
                  {Array.isArray(_localCertificationTypes)
                    ? _localCertificationTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))
                    : null}
                </select>
              </div>
              <div className="w-full">
                <label className="text-sm font-medium text-primary md:text-lg">
                  Tipo de Curso
                </label>
                <Select
                  isMulti
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
                  classNamePrefix="react-select"
                  className="mt-1 w-full"
                  value={courseTypes
                    .filter((type) => selectedCourseType.includes(type.id))
                    .map((type) => ({
                      value: type.id.toString(),
                      label: type.name,
                    }))}
                />
              </div>
              {errors.courseTypeId && (
                <p className="text-xs text-red-500 md:text-sm">
                  Este campo es obligatorio.
                </p>
              )}
              {selectedCourseType.includes(4) && (
                <div className="w-full">
                  <label className="text-sm font-medium text-primary md:text-lg">
                    Precio Individual
                  </label>
                  <input
                    type="number"
                    placeholder="Ingrese el precio"
                    value={individualPrice ?? ''}
                    onChange={(e) => setIndividualPrice(Number(e.target.value))}
                    className="mt-1 w-full rounded border border-primary p-2 text-sm text-white md:text-base"
                  />
                </div>
              )}
              <div className="w-full">
                <label className="text-sm font-medium text-primary md:text-lg">
                  Estado del Curso
                </label>
                <ActiveDropdown isActive={isActive} setIsActive={setIsActive} />
              </div>
            </div>
            <div>
              <label
                htmlFor="rating"
                className="text-sm font-medium text-primary md:text-lg"
              >
                Rating
              </label>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.1"
                placeholder="0-5"
                className="mt-1 w-full rounded border border-primary p-2 text-sm text-white outline-none focus:no-underline md:text-base"
                value={isNaN(rating) ? '' : rating}
                onChange={(e) => setRating(Number(e.target.value))}
              />
            </div>
            <div>
              <label
                htmlFor="instructors"
                className="text-sm font-medium text-primary md:text-lg"
              >
                Instructores (Múltiples)
              </label>
              <Select
                id="instructors"
                isMulti
                value={educators
                  .filter((e) => instructors.includes(e.id))
                  .map((e) => ({ value: e.id, label: e.name }))}
                onChange={(
                  selectedOptions: MultiValue<{ value: string; label: string }>
                ) => {
                  const selectedIds = selectedOptions.map((opt) => opt.value);
                  setInstructors(selectedIds);
                }}
                options={educators.map((educator) => ({
                  value: educator.id,
                  label: educator.name,
                }))}
                placeholder="Seleccionar instructores..."
                className="mt-1"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: '#0a1628',
                    borderColor: 'hsl(var(--primary))',
                    color: 'white',
                    minHeight: '42px',
                  }),
                  input: (base) => ({
                    ...base,
                    color: 'white',
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: 'hsl(var(--muted-foreground))',
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: 'white',
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: '#0a1628',
                    border: '1px solid hsl(var(--primary))',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                  }),
                  menuList: (base) => ({
                    ...base,
                    backgroundColor: '#0a1628',
                    padding: 0,
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused
                      ? 'hsl(var(--primary) / 0.2)'
                      : state.isSelected
                        ? 'hsl(var(--primary) / 0.4)'
                        : '#0a1628',
                    color: 'white',
                    cursor: 'pointer',
                    ':active': {
                      backgroundColor: 'hsl(var(--primary) / 0.3)',
                    },
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: 'hsl(var(--primary) / 0.3)',
                    borderRadius: '4px',
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: 'white',
                    padding: '2px 6px',
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: 'white',
                    ':hover': {
                      backgroundColor: 'hsl(var(--destructive))',
                      color: 'white',
                    },
                  }),
                }}
              />
            </div>
            <div className="w-full">
              <label
                htmlFor="file"
                className="text-sm font-medium text-primary md:text-lg"
              >
                Imagen de portada
              </label>
              <div
                className={`relative mt-3 rounded-lg border-2 border-dashed p-6 transition-colors md:p-8 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : errors.file
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-primary/30 bg-primary/5'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {!file ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-6">
                    <FiUploadCloud
                      className={`size-8 md:size-10 ${errors.file ? 'text-red-500' : 'text-primary'}`}
                    />
                    <p className="text-center text-sm text-white md:text-base">
                      Arrastra tu archivo aquí o haz clic para seleccionar
                    </p>
                    <p className="text-center text-xs text-gray-400 md:text-sm">
                      Soporta: Imágenes (JPG, PNG, GIF) y Videos (MP4, MOV,
                      WEBM) — Máx: 100MB
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const fileInput = document.getElementById(
                          'file-upload-educator'
                        ) as HTMLInputElement;
                        fileInput?.click();
                      }}
                      className="mt-2 text-xs text-primary hover:underline md:text-sm"
                    >
                      Seleccionar archivo
                    </button>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      id="file-upload-educator"
                      className="hidden"
                    />
                  </div>
                ) : file.type.startsWith('video') ? (
                  <div className="relative flex flex-col items-center justify-center gap-3 md:gap-4">
                    <div className="relative h-40 w-full md:h-48">
                      <video
                        id="video-player"
                        controls
                        className="h-full w-full object-cover"
                        src={URL.createObjectURL(file)}
                      />
                    </div>
                    <div className="flex w-full flex-col items-start gap-2">
                      <label className="text-xs font-medium text-gray-400 md:text-sm">
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
                                const captured = new File([blob], 'frame.jpg', {
                                  type: 'image/jpeg',
                                });
                                setFrameImageFile(captured);
                                toast.success(
                                  'Frame capturado como imagen de portada'
                                );
                              }
                            }, 'image/jpeg');
                          }
                        }}
                        className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 md:px-3 md:text-sm"
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
                    className="h-40 w-full object-cover md:h-48"
                  />
                )}
                {file && (
                  <>
                    <button
                      onClick={() => {
                        setFile(null);
                        setFileName(null);
                        setFileSize(null);
                        setErrors((prev) => ({ ...prev, file: true }));
                      }}
                      className="absolute top-2 right-2 z-20 rounded-full bg-red-500 p-1 text-white hover:opacity-70"
                    >
                      <MdClose className="z-20 size-4 md:size-5" />
                    </button>
                    <div className="mt-2 flex justify-between text-xs text-gray-400 md:text-sm">
                      <p className="truncate">{fileName}</p>
                      <p>{((fileSize ?? 0) / 1024).toFixed(2)} KB</p>
                    </div>
                  </>
                )}
              </div>
              {errors.file && (
                <p className="text-xs text-red-500 md:text-sm">
                  Este campo es obligatorio.
                </p>
              )}
            </div>
            <div className="mt-6 flex flex-col gap-4 text-white md:mt-8">
              <div className="flex items-center justify-between">
                <p className="text-sm md:text-base">
                  ¿Es calificable? {editingCourseId ? 'Actualizar' : 'Agregar'}{' '}
                  parámetros
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
                </div>
              </div>
              {addParametros && (
                <div className="my-4 flex flex-col">
                  <label className="text-sm font-medium text-primary md:text-lg">
                    Parámetros de evaluación
                  </label>
                  <Button
                    onClick={handleAddParametro}
                    disabled={parametros.length >= 10}
                    className="mt-2 w-full bg-primary text-white hover:opacity-90 md:w-auto"
                  >
                    {editingCourseId ? 'Editar o agregar' : 'Agregar'} nuevo
                    parámetro
                    <Plus className="ml-2 size-4" />
                  </Button>
                  {parametros.map((parametro, index) => (
                    <div
                      key={index}
                      className="mt-4 rounded-lg border border-primary/30 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-primary md:text-base">
                          Parámetro {index + 1}
                        </h3>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveParametro(index)}
                          className="h-8 px-2 text-xs md:text-sm"
                        >
                          Eliminar
                        </Button>
                      </div>
                      <label className="mt-3 block text-xs font-medium text-primary md:text-sm">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={parametro.name}
                        onChange={(e) =>
                          handleParametroChange(index, 'name', e.target.value)
                        }
                        className="mt-1 w-full rounded border border-primary/30 bg-background p-2 text-xs text-white outline-none md:text-sm"
                      />
                      <label className="mt-3 block text-xs font-medium text-primary md:text-sm">
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
                        className="mt-1 w-full rounded border border-primary/30 bg-background p-2 text-xs text-white outline-none md:text-sm"
                        rows={3}
                      />
                      <label className="mt-3 block text-xs font-medium text-primary md:text-sm">
                        Porcentaje %
                      </label>
                      <input
                        type="number"
                        value={parametro.porcentaje}
                        onChange={(e) =>
                          handleParametroChange(
                            index,
                            'porcentaje',
                            Math.max(
                              1,
                              Math.min(100, parseFloat(e.target.value))
                            )
                          )
                        }
                        className="mt-1 w-full rounded border border-primary/30 bg-background p-2 text-xs text-white outline-none md:text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            {isOpen && (
              <div className="my-4 flex flex-col">
                <label
                  htmlFor="subjects"
                  className="text-sm font-medium text-primary md:text-lg"
                >
                  Asignar Materias
                </label>
                <Select
                  isMulti
                  value={Array.from(
                    new Map(
                      allSubjects
                        .filter((subject) =>
                          subjects.some((s) => s.id === subject.id)
                        )
                        .map((subject) => [subject.title, subject])
                    ).values()
                  ).map((subject) => ({
                    value: subject.id.toString(),
                    label: subject.title,
                  }))}
                  options={Array.from(
                    new Map(
                      allSubjects.map((subject) => [subject.title, subject])
                    ).values()
                  ).map((subject) => ({
                    value: subject.id.toString(),
                    label: subject.title,
                  }))}
                  onChange={(
                    newValue: MultiValue<{ value: string; label: string }>
                  ) => {
                    const selectedSubjects = newValue.map((option) => ({
                      id: Number(option.value),
                    }));
                    setSubjects(selectedSubjects);
                  }}
                  classNamePrefix="react-select"
                  className="mt-2 w-full md:w-3/4"
                />
              </div>
            )}
            {(uploading || isUploading) && (
              <div className="mt-4 md:mt-6">
                <Progress
                  value={uploading ? progress : uploadProgress}
                  className="w-full"
                />
                <p className="mt-2 text-center text-xs text-gray-400 md:text-sm">
                  {uploading ? progress : uploadProgress}% Completado
                </p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="mt-4 grid grid-cols-2 gap-2 md:mt-6 md:gap-4">
          <Button
            onClick={handleCancel}
            className="w-full border-transparent bg-gray-600 p-2 text-xs hover:bg-gray-700 md:p-3 md:text-base"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="w-full bg-green-400 text-xs text-gray-900 hover:bg-green-500 md:text-base"
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
