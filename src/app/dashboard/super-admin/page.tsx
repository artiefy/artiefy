'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

import {
  Check,
  Edit,
  Eye,
  Loader2,
  Paperclip,
  Trash2,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import SunEditor from 'suneditor-react';

import AnuncioPreview from '~/app/dashboard/super-admin/anuncios/AnuncioPreview';
import EditUserModal from '~/app/dashboard/super-admin/users/EditUserModal'; // Ajusta la ruta según la ubicación de tu componente
import CourseCarousel from '~/components/super-admin/CourseCarousel';
import { deleteUser, setRoleWrapper } from '~/server/queries/queries';

import BulkUploadUsers from './components/BulkUploadUsers'; // Ajusta la ruta según la ubicación de tu componente
import { ConfirmDialog } from './components/ConfirmDialog';
import { InfoDialog } from './components/InfoDialog';

import 'suneditor/dist/css/suneditor.min.css';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  phone?: string;             // 👈 nuevo
  selected?: boolean;
  isNew?: boolean;
  permissions?: string[]; // 👈 AGREGA ESTO
  subscriptionEndDate?: string | null;
}

interface Course {
  id: string;
  title: string;
}

type ConfirmationState = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
} | null;

interface Materia {
  id: string;
  courseId: string;
  programaId: string;
}

interface ViewUserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string; // Opcional si viene de Clerk
  createdAt?: string; // Fecha de creación opcional
  role: string;
  status: string;
  password?: string; // Puede estar presente en algunos casos
  courses?: Course[]; // Puede incluir cursos
}

interface UserData {
  id: string;
  firstName?: string; // Puede ser opcional si a veces solo tienes `name`
  lastName?: string;
  name?: string; // En algunos casos puede venir como `name`
  email: string;
  profileImage?: string;
  createdAt?: string;
  role?: string;
  status?: string;
  password?: string;
  permissions?: string[]; // Asegurar que siempre sea un array
  subscriptionEndDate?: string;
}

interface Course {
  id: string;
  title: string;
  coverImageKey: string | null; // Añadimos la propiedad coverImageKey
  coverImage?: string;
  instructor: string;
  modalidad?: { name: string };
  rating?: number;
}

interface CoursesData {
  courses: Course[];
}

interface EmailResult {
  userId: string;
  status: string;
  message?: string;
}

interface EmailResponse {
  results: EmailResult[];
}

interface WhatsAppTemplate {
  name: string;
  label: string;
  language: 'es' | 'en';
  body: string;
  example?: string[];
  status?: string; // 👈 simple y sin warning
  langCode?: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  // 🔍 Estados de búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState(''); // Búsqueda por nombre o correo
  const [roleFilter, setRoleFilter] = useState(''); // Filtro por rol
  const [statusFilter, setStatusFilter] = useState(''); // Filtro por estado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  void loading;
  void error;
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(
    null as string | null
  );
  if (typeof updatingUserId === 'string' && updatingUserId) {
    // Variable utilizada para evitar warnings, no afecta la lógica
  }

  const [confirmation, setConfirmation] = useState<ConfirmationState>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [programs, setPrograms] = useState<{ id: string; title: string }[]>([]);

  const [editValues, setEditValues] = useState<{
    firstName: string;
    lastName: string;
  }>({
    firstName: '',
    lastName: '',
  });
  void editValues;
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoDialogTitle, setInfoDialogTitle] = useState('');
  const [infoDialogMessage, setInfoDialogMessage] = useState('');
  interface Anuncio {
    id: string;
    title: string;
  }

  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  if (typeof anuncios === 'string' && anuncios) {
    // Variable utilizada para evitar warnings, no afecta la lógica
  }
  const WA_TEXT_ONLY = '__TEXT_ONLY__';

  const [showAnuncioModal, setShowAnuncioModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false); // ✅ Nuevo estado para mostrar el modal de correos
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]); // ✅ Para almacenar los emails seleccionados
  const [customEmails, setCustomEmails] = useState(''); // ✅ Para agregar emails manualmente
  const [subject, setSubject] = useState(''); // ✅ Asunto del correo
  const [message, setMessage] = useState(''); // ✅ Mensaje del correo
  const [loadingEmail, setLoadingEmail] = useState(false); // ✅ Estado de carga para el envío de correos
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [numerosLocales, setNumerosLocales] = useState('');
  const [codigoPais, setCodigoPais] = useState('+57');
  const [waSelectedTemplate, setWaSelectedTemplate] =
    useState<string>(WA_TEXT_ONLY);
  const [waVariables, setWaVariables] = useState<string[]>([]);

  const [previewAttachments, setPreviewAttachments] = useState<string[]>([]);
  const [usersPerPage, setUsersPerPage] = useState<number>(10);

  const [newAnuncio, setNewAnuncio] = useState({
    titulo: '',
    descripcion: '',
    imagen: null as File | null,
    previewImagen: null as string | null,
    tipo_destinatario: 'todos' as 'todos' | 'cursos' | 'programas' | 'custom',
    cursoId: null as number | null,
  });

  const searchParams = useSearchParams();
  const query = searchParams?.get('search') ?? '';
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'estudiante',
  });
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [creatingUser, setCreatingUser] = useState(false);
  const [viewUser, setViewUser] = useState<ViewUserResponse | null>(null);
  const [waTemplates, setWaTemplates] = useState<WhatsAppTemplate[]>([]);
  const [waLoading, setWaLoading] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  if (typeof showPassword === 'string' && showPassword) {
    // Variable utilizada para evitar warnings, no afecta la lógica
  }

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const handleUserSelection = useCallback((userId: string, email: string) => {
    const u = users.find((x) => x.id === userId);
    console.log('[UI] toggle selección', {
      userId,
      email,
      phone: u?.phone ?? null,
    });
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );

    setSelectedEmails((prevEmails) => {
      if (prevEmails.includes(email)) {
        return prevEmails.filter((e) => e !== email);
      } else {
        return [...prevEmails, email];
      }
    });
  }, []);

  // 👉 Helper para descargar un archivo desde base64
  const downloadBase64File = (
    base64: string,
    mime: string,
    filename: string
  ) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 👉 Handler que usarás cuando tu upload masivo termine y recibas la respuesta JSON del servidor
  // 👉 Handler que usarás cuando tu upload masivo termine y recibas la respuesta JSON del servidor
  interface FinishedFiles {
    jsonBase64?: string;
    jsonMime?: string;
    jsonFilename?: string;
    excelBase64?: string;
    excelMime?: string;
    excelFilename?: string;
  }

  interface FinishedSummary {
    guardados?: number;
    yaExiste?: number;
    errores?: number;
  }

  interface FinishedPayload {
    users?: User[];
    files?: FinishedFiles;
    summary?: FinishedSummary;
  }

  const handleUsersMasiveFinished = (res: unknown) => {
    if (!res || typeof res !== 'object') return;
    const data = res as FinishedPayload;

    // Si ya tenías algo como handleMassUserUpload(newUsers) úsalo aquí también si viene en data.users
    if (Array.isArray(data.users) && data.users.length > 0) {
      // handleMassUserUpload(data.users);
    }

    // Descarga de archivos si el backend incluyó 'files'
    const f = data.files;
    const hasJson =
      f && typeof f.jsonBase64 === 'string' && f.jsonBase64.length > 0;

    const hasExcel =
      f && typeof f.excelBase64 === 'string' && f.excelBase64.length > 0;

    if (hasJson) {
      const jsonMime =
        typeof f!.jsonMime === 'string' ? f!.jsonMime : 'application/json';
      const jsonFilename =
        typeof f!.jsonFilename === 'string'
          ? f!.jsonFilename
          : 'resultado.json';
      downloadBase64File(f!.jsonBase64!, jsonMime, jsonFilename);
    }

    if (hasExcel) {
      const excelMime =
        typeof f!.excelMime === 'string'
          ? f!.excelMime
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const excelFilename =
        typeof f!.excelFilename === 'string'
          ? f!.excelFilename
          : 'resultado.xlsx';
      downloadBase64File(f!.excelBase64!, excelMime, excelFilename);
    }

    // Notificación rápida
    const s = data.summary;
    if (s && typeof s === 'object') {
      const guardados = Number(s.guardados ?? 0);
      const yaExiste = Number(s.yaExiste ?? 0);
      const errores = Number(s.errores ?? 0);
      showNotification?.(
        `Carga masiva: ${guardados} guardados, ${yaExiste} ya existen, ${errores} errores.`,
        'success'
      );
    }
  };

  interface Program {
    id: string;
    title: string;
  }

  interface Course {
    id: string;
    title: string;
  }
  const isValidProgramArray = useCallback(
    (data: unknown): data is Program[] => {
      return (
        Array.isArray(data) &&
        data.every(
          (item) =>
            typeof item === 'object' &&
            item !== null &&
            'id' in item &&
            'title' in item &&
            (typeof (item as { id: unknown }).id === 'string' ||
              typeof (item as { id: unknown }).id === 'number') &&
            typeof (item as { title: unknown }).title === 'string'
        )
      );
    },
    []
  );

  const fetchAllPrograms = useCallback(async () => {
    try {
      const res = await fetch('/api/super-admin/programs');
      if (!res.ok) throw new Error('Error al obtener programas');
      const rawData: unknown = await res.json();
      if (!isValidProgramArray(rawData)) throw new Error('Datos inválidos');
      const data = Array.from(
        new Map(
          rawData.map((p) => [p.id, { id: String(p.id), title: p.title }])
        ).values()
      );
      setPrograms(data);
      setAllPrograms(data);
    } catch (error) {
      console.error('Error cargando programas:', error);
      setPrograms([]);
    }
  }, [setPrograms, setAllPrograms, isValidProgramArray]);

  const isValidCourseArray = useCallback((data: unknown): data is Course[] => {
    return (
      Array.isArray(data) &&
      data.every(
        (item) =>
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          'title' in item &&
          (typeof (item as { id: unknown }).id === 'string' ||
            typeof (item as { id: unknown }).id === 'number') &&
          typeof (item as { title: unknown }).title === 'string'
      )
    );
  }, []);

  const [allCourses, setAllCourses] = useState<Course[]>([]);
  useEffect(() => {
    if (!showEmailModal) return;

    // limpia a dígitos
    const onlyDigits = (s: string) => s.replace(/\D/g, '');

    // quita el código del país seleccionado para dejarlo "local"
    const countryDigits = codigoPais.replace('+', '');
    const toLocal = (p: string) => {
      const d = onlyDigits(p);
      return d.startsWith(countryDigits) ? d.slice(countryDigits.length) : d;
    };

    // teléfonos de los usuarios seleccionados que tengan phone
    const phones = users
      .filter(u => selectedUsers.includes(u.id) && u.phone)
      .map(u => toLocal(u.phone!))
      .filter(Boolean);

    // mezcla con lo que ya haya escrito el admin (sin duplicados)
    const current = numerosLocales
      ? numerosLocales.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const unique = Array.from(new Set([...current, ...phones]));
    setNumerosLocales(unique.join(','));
  }, [showEmailModal, selectedUsers, users, codigoPais]);


  // Cargar plantillas al abrir el modal de Email (no sólo cuando marcas el check)
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        if (!showEmailModal) return;
        setWaLoading(true);
        setWaError(null);


        interface WaGetOk {
          templates?: WhatsAppTemplate[];
        }
        interface WaGetErr {
          error?: string;
          details?: unknown;
        }

        const res = await fetch('/api/super-admin/whatsapp', { method: 'GET' });
        const raw: unknown = await res.json();

        if (!res.ok) {
          const msg =
            (raw as WaGetErr)?.error ?? 'No se pudieron cargar las plantillas';
          setWaTemplates([]);
          setWaError(msg); // 👈 ahora es string, sin “unsafe argument”
          return;
        }

        const templates = (raw as WaGetOk)?.templates ?? [];
        setWaTemplates(templates); // 👈 ahora es WhatsAppTemplate[], sin “unsafe argument”
      } catch {
        setWaTemplates([]);
        setWaError('Error de red cargando plantillas'); // 👈 sin usar la var del catch
      } finally {
        setWaLoading(false);
      }
    };
    void loadTemplates();
  }, [showEmailModal]);

  const selectedWaTemplate = useMemo(
    () => waTemplates.find((t) => t.name === waSelectedTemplate) ?? null,
    [waSelectedTemplate, waTemplates]
  );

  useEffect(() => {
    const fetchMaterias = async () => {
      try {
        const res = await fetch('/api/super-admin/materias');
        const rawData: unknown = await res.json();
        if (
          !Array.isArray(rawData) ||
          !rawData.every(
            (item) =>
              typeof item === 'object' &&
              item !== null &&
              'id' in item &&
              'courseId' in item &&
              'programaId' in item
          )
        ) {
          throw new Error('Invalid data format for Materias');
        }
        const data: Materia[] = rawData as Materia[];
        setMaterias(data);
      } catch (error) {
        console.error('Error al cargar materias:', error);
      }
    };

    void fetchMaterias();
  }, []);

  useEffect(() => {
    if (!selectedCourse) {
      setPrograms(allPrograms); // Mostrar todos los programas si no hay curso seleccionado
      return;
    }

    const programIds = materias
      .filter((m) => m.courseId === selectedCourse)
      .map((m) => m.programaId);

    const uniqueProgramIds = [...new Set(programIds)]; // Eliminar duplicados

    const relatedPrograms = allPrograms.filter((p) =>
      uniqueProgramIds.includes(p.id)
    );

    setPrograms(relatedPrograms);
  }, [selectedCourse, materias, allPrograms, isValidProgramArray]); // ✅ añadimos

  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedProgram) {
      setCourses(allCourses); // Mostrar todos los cursos si no hay programa seleccionado
      return;
    }

    const courseIds = materias
      .filter((m) => m.programaId === selectedProgram)
      .map((m) => m.courseId);

    const uniqueCourseIds = [...new Set(courseIds)]; // Eliminar duplicados

    const relatedCourses = allCourses.filter((c) =>
      uniqueCourseIds.includes(c.id)
    );

    setCourses(relatedCourses);
  }, [selectedProgram, materias, allCourses]);

  useEffect(() => {
    void fetchAllPrograms();
  }, [fetchAllPrograms]); // ✅ lo añadimos

  const fetchAllCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/super-admin/courses');
      if (!res.ok) throw new Error('Error al obtener cursos');

      const rawData: unknown = await res.json();

      if (!isValidCourseArray(rawData)) {
        throw new Error('Datos inválidos para cursos');
      }

      const data = rawData.map((c) => ({
        id: String(c.id),
        title: c.title,
      }));

      setCourses(data);
      setAllCourses(data);
    } catch (error) {
      console.error('Error cargando todos los cursos:', error);
      setCourses([]);
    }
  }, [isValidCourseArray]);

  // 1️⃣ Filtrar usuarios
  const filteredUsers = users.filter(
    (user) =>
      (searchQuery === '' ||
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (roleFilter ? user.role === roleFilter : true) &&
      (statusFilter ? user.status === statusFilter : true)
  );
  const [sendingEmails, setSendingEmails] = useState(false);

  const fetchPrograms = useCallback(async () => {
    try {
      const res = await fetch(
        'server/actions/estudiantes/programs/getAllPrograms'
      ); // Actualizar la ruta correcta
      if (!res.ok) throw new Error('Error al obtener programas');

      const rawData: unknown = await res.json();
      if (
        !Array.isArray(rawData) ||
        !rawData.every(
          (item) =>
            typeof item === 'object' &&
            item !== null &&
            'id' in item &&
            'title' in item &&
            typeof (item as { id: unknown }).id === 'string' &&
            typeof (item as { title: unknown }).title === 'string'
        )
      ) {
        throw new Error('Datos inválidos recibidos');
      }

      const data = rawData as { id: string; title: string }[];
      setPrograms(data);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setPrograms([]); // Asegurarse de que programs siempre tenga un valor válido
    }
  }, []);

  const fetchProgramsForAssign = useCallback(async () => {
    try {
      const res = await fetch('/api/super-admin/programs/enrollInProgram');
      if (!res.ok) throw new Error('Error al obtener programas');

      const data = (await res.json()) as { id: string; title: string }[];
      console.log('✅ Programas para asignación cargados:', data);
      setPrograms(data);
    } catch (error) {
      console.error('Error al cargar programas:', error);
    }
  }, []);

  useEffect(() => {
    void fetchProgramsForAssign();
  }, [fetchProgramsForAssign]);

  useEffect(() => {
    void fetchPrograms();
  }, [fetchPrograms]);

  // 2️⃣ Definir la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers =
    usersPerPage === -1
      ? filteredUsers
      : filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const handleSelectStudent = (userId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/educadores/courses');
      if (!res.ok) throw new Error('Error al cargar cursos');
      const rawData: unknown = await res.json();
      if (!Array.isArray(rawData)) throw new Error('Invalid data received');
      const data: { id: string; title: string }[] = rawData.filter(
        (item): item is { id: string; title: string } =>
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          'title' in item
      );
      setCourses(data);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  }, []);
  const fetchAnuncios = async (userId: string) => {
    try {
      const res = await fetch('/api/super-admin/anuncios/view-anuncio', {
        headers: { 'x-user-id': userId },
      });
      if (!res.ok) throw new Error('Error al obtener anuncios');

      const data = (await res.json()) as { id: string; title: string }[];
      setAnuncios(data);
    } catch (error) {
      console.error('❌ Error al obtener anuncios:', error);
    }
  };

  const sendEmail = async () => {
    console.log('📩 Enviando correo...');
    if (
      !subject ||
      !message ||
      (selectedEmails.length === 0 &&
        !customEmails.trim() &&
        (!numerosLocales.trim() || !sendWhatsapp))
    ) {
      setNotification({
        message: 'Todos los campos son obligatorios',
        type: 'error',
      });
      console.error('❌ Error: Faltan datos obligatorios');
      return;
    }

    setLoadingEmail(true);

    const emails = Array.from(
      new Set([
        ...selectedEmails,
        ...customEmails
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
      ])
    );

    // ⚡ procesar los números para whatsapp
    let whatsappNumbers: string[] = [];
    if (sendWhatsapp && numerosLocales.trim()) {
      const onlyDigits = (s: string) => s.replace(/\D/g, '');
      const countryDigits = codigoPais.replace('+', '');

      whatsappNumbers = Array.from(new Set(
        numerosLocales
          .split(',')
          .map(n => n.trim())
          .filter(Boolean)
          .map((n) => {
            const d = onlyDigits(n);
            // si ya viene con el código de país, lo dejamos tal cual
            if (d.startsWith(countryDigits)) return d;
            // si no, lo prefijamos con el país seleccionado
            return countryDigits + d;
          })
          .filter(d => d.length >= 10) // naive sanity check
      ));
    }


    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('message', message);
      emails.forEach((email) => formData.append('emails[]', email));
      attachments.forEach((file) => formData.append('attachments', file));

      const response = await fetch('/api/super-admin/emails', {
        method: 'POST',
        body: formData,
      });

      if (sendWhatsapp) {
        // función helper para limpiar HTML del mensaje
        const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '').trim();

        for (const number of whatsappNumbers) {
          const to = number.replace('+', '');
          const textOnly = waSelectedTemplate === WA_TEXT_ONLY;
          const useTemplate = Boolean(waSelectedTemplate) && !textOnly;

          const textMessage = `${subject}\n\n${stripHtml(message)}`;

          // LOGS: qué se enviará
          console.log('📲 [WA][FRONT] Preparando envío', {
            to,
            mode: useTemplate
              ? 'template'
              : textOnly
                ? 'text_only'
                : 'text_with_session',
            chosenTemplate: useTemplate ? waSelectedTemplate : null,
            languageCode: selectedWaTemplate?.langCode ?? 'en_US',

            variables: useTemplate ? waVariables : [],
            textPreview: textMessage,
            ensureSession: !useTemplate && !textOnly, // solo si es "texto + abrir sesión"
            sessionTemplate: 'hello_world',
            sessionLanguage: 'en_US',
          });

          const body = useTemplate
            ? {
              // ➜ SOLO PLANTILLA
              to,
              forceTemplate: true,
              templateName: waSelectedTemplate,
              languageCode:
                selectedWaTemplate?.language === 'es' ? 'es' : 'en_US',
              variables: waVariables,
            }
            : textOnly
              ? {
                // ➜ SOLO TEXTO (ya existe sesión abierta de 24h)
                to,
                text: textMessage,
              }
              : {
                // ➜ TEXTO + abrir sesión con plantilla de sesión (hello_world)
                to,
                text: textMessage,
                ensureSession: true,
                sessionTemplate: 'hello_world',
                sessionLanguage: 'en_US',
              };

          const resp = await fetch('/api/super-admin/whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          const json = await resp.json().catch(() => ({}));
          console.log('📗 [WA][FRONT] Respuesta backend:', {
            status: resp.status,
            ok: resp.ok,
            json,
          });

          if (!resp.ok) {
            console.error('❌ [WA][FRONT] Error enviando WhatsApp:', json);
          }
        }
      }

      if (!response.ok) throw new Error('Error al enviar el correo');

      console.log('✅ Correo enviado con éxito');
      setNotification({
        message: 'Correo enviado correctamente',
        type: 'success',
      });

      setSubject('');
      setMessage('');
      setSelectedEmails([]);
      setCustomEmails('');
      setAttachments([]);
      setPreviewAttachments([]);
      setNumerosLocales('');
      setCodigoPais('+57');
      setSendWhatsapp(false);
      setShowEmailModal(false);
    } catch (error) {
      console.error('❌ Error al enviar el correo:', error);
      setNotification({ message: 'Error al enviar el correo', type: 'error' });
    } finally {
      setLoadingEmail(false);
    }
  };

  // Llamar la función cuando el componente se monta si hay un usuario autenticado
  useEffect(() => {
    const currentUser = users.find((u) => selectedUsers.includes(u.id));
    if (currentUser?.id) {
      void fetchAnuncios(currentUser.id);
    }
  }, [users, selectedUsers]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      const file = event.target.files[0];
      setNewAnuncio((prev) => ({
        ...prev,
        imagen: file,
        previewImagen: URL.createObjectURL(file),
      }));
    }
  };
  const handleAttachmentChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files?.length) {
      const files = Array.from(event.target.files);
      setAttachments((prev) => [...prev, ...files]);

      // Generar previsualizaciones
      const filePreviews = files.map((file) => URL.createObjectURL(file));
      setPreviewAttachments((prev) => [...prev, ...filePreviews]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setPreviewAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleManualEmailAdd = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter' && customEmails.trim()) {
      event.preventDefault(); // Evita que el `Enter` haga un submit del formulario

      const emails = customEmails
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email !== '');

      // Agregar solo correos válidos y evitar duplicados
      setSelectedEmails((prev) => [...new Set([...prev, ...emails])]);
      setCustomEmails('');
    }
  };

  const handleCreateAnuncio = async () => {
    if (
      !newAnuncio.titulo.trim() ||
      !newAnuncio.descripcion.trim() ||
      !newAnuncio.imagen
    ) {
      alert('Todos los campos son obligatorios.');
      return;
    }

    try {
      // 🔹 Subir la imagen primero a S3
      const uploadRequest = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: newAnuncio.imagen.type,
          fileSize: newAnuncio.imagen.size,
        }),
      });

      if (!uploadRequest.ok) throw new Error('Error al obtener la URL firmada');

      const uploadData = (await uploadRequest.json()) as {
        url: string;
        fields: Record<string, string>;
        key: string;
      };
      const { url, fields, key } = uploadData;

      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) =>
        formData.append(key, value)
      );
      formData.append('file', newAnuncio.imagen);

      const s3UploadResponse = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!s3UploadResponse.ok) throw new Error('Error al subir la imagen');

      const imageUrl = `${key}`;

      // 🔹 Guardar el anuncio con los destinatarios seleccionados
      const destinatarios: string[] =
        newAnuncio.tipo_destinatario === 'cursos'
          ? (selectedCourses ?? [])
          : newAnuncio.tipo_destinatario === 'programas'
            ? (selectedPrograms ?? [])
            : newAnuncio.tipo_destinatario === 'custom'
              ? (selectedUsers ?? [])
              : [];

      console.log('📌 Destinatarios enviados:', destinatarios);

      const response = await fetch('/api/super-admin/anuncios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: newAnuncio.titulo,
          descripcion: newAnuncio.descripcion,
          imagenUrl: imageUrl,
          tipo_destinatario: newAnuncio.tipo_destinatario,
          courseIds:
            newAnuncio.tipo_destinatario === 'cursos' ? selectedCourses : [],
          programaIds:
            newAnuncio.tipo_destinatario === 'programas'
              ? selectedPrograms
              : [],
          userIds:
            newAnuncio.tipo_destinatario === 'custom' ? selectedUsers : [],
        }),
      });

      if (!response.ok) throw new Error('Error al guardar el anuncio');

      alert('Anuncio guardado correctamente');
      setShowAnuncioModal(false);
    } catch (error) {
      console.error('❌ Error al guardar anuncio:', error);
      alert('Error al guardar el anuncio.');
    }
  };

  const [selectedPlanType, setSelectedPlanType] = useState<
    'Pro' | 'Premium' | 'Enterprise'
  >('Premium');

  const handleAssignStudents = async () => {
    if (selectedStudents.length === 0) return;

    try {
      const payload: {
        userIds: string[];
        planType: 'Pro' | 'Premium' | 'Enterprise';
        courseId?: string;
        programId?: string;
      } = {
        userIds: selectedStudents,
        planType: selectedPlanType,
      };

      if (selectedCourse) {
        payload.courseId = selectedCourse;
      }

      if (selectedProgram) {
        payload.programId = selectedProgram;
      }

      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Error during enrollment');

      const rawResult: unknown = await response.json();

      if (
        typeof rawResult === 'object' &&
        rawResult !== null &&
        'success' in rawResult &&
        typeof (rawResult as { success: unknown }).success === 'boolean' &&
        'message' in rawResult &&
        typeof (rawResult as { message: unknown }).message === 'string'
      ) {
        const result: { success: boolean; message: string } = rawResult as {
          success: boolean;
          message: string;
        };

        console.log('Enrollment successful:', result);
        setShowAssignModal(false);
        setSelectedStudents([]);
        setSelectedCourse(null);
        setSelectedProgram(null);

        // Show success message
        const courseName = selectedCourse
          ? courses.find((course) => course.id === selectedCourse)?.title
          : null;
        const programName = selectedProgram
          ? programs.find((program) => program.id === selectedProgram)?.title
          : null;

        let successMessage = `Se matricularon ${selectedStudents.length} estudiantes`;
        if (courseName && programName) {
          successMessage += ` al curso "${courseName}" y al programa "${programName}".`;
        } else if (courseName) {
          successMessage += ` al curso "${courseName}".`;
        } else if (programName) {
          successMessage += ` al programa "${programName}".`;
        }

        alert(successMessage);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error assigning students:', error);
    }
  };

  const handleViewUser = async (user: User): Promise<void> => {
    try {
      // Obtener información básica del usuario
      const userRes = await fetch(`/api/super-admin/infoUser?id=${user.id}`);
      if (!userRes.ok) throw new Error('Error al obtener datos del usuario');

      const userData: UserData = (await userRes.json()) as UserData;

      // Validar que los datos sean correctos
      if (!userData?.name || !userData?.email || !userData?.id) {
        throw new Error('Datos del usuario inválidos');
      }

      // Extraer el primer y segundo nombre de `name` (en caso de que tenga más de un nombre)
      const [firstName, lastName] = userData.name.split(' ');

      const validUserData: ViewUserResponse = {
        id: String(userData.id),
        firstName: firstName || 'Nombre no disponible',
        lastName: lastName || 'Apellido no disponible',
        email: String(userData.email),
        profileImage: userData.profileImage ?? '/default-avatar.png',
        createdAt: userData.createdAt ?? 'Fecha no disponible',
        role: userData.role ?? 'Sin rol',
        status: userData.status ?? 'Activo',
        password: userData.password ?? 'No disponible',
        courses: [], // Esto se completará con los cursos más tarde
      };

      // Guardar el usuario con los cursos en el estado
      setViewUser(validUserData);

      // Obtener los cursos
      const coursesRes = await fetch(
        `/api/super-admin/userCourses?userId=${user.id}`
      );
      if (!coursesRes.ok) throw new Error('Error al obtener los cursos');

      const coursesData = (await coursesRes.json()) as CoursesData;

      // Validar que los cursos sean correctos
      if (!coursesData || !Array.isArray(coursesData.courses)) {
        throw new Error('Error en los datos de los cursos');
      }

      // Mapear los cursos
      console.log(
        '📌 Cursos obtenidos en `handleViewUser`:',
        coursesData.courses
      );
      const courses = coursesData.courses.map((course) => ({
        id: course.id,
        title: course.title || 'Sin título',
        coverImageKey: course.coverImageKey ?? null,
        coverImage: course.coverImage ?? '/default-course.jpg',
        instructor: course.instructor || 'Instructor no disponible',
      }));

      // Actualizar el estado con los cursos
      setViewUser({
        ...validUserData,
        courses,
      });

      setShowPassword(false);
    } catch (error) {
      console.error('Error al obtener usuario o cursos:', error);
    }
  };

  useEffect(() => {
    void fetchCourses();
  }, [fetchCourses]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Error al cargar usuarios');

      const rawData: unknown = await res.json();
      if (!Array.isArray(rawData)) throw new Error('Datos inválidos recibidos');

      const data: User[] = (rawData as any[]).map((item) => {
        // intenta varias claves comunes
        const rawPhone =
          (typeof item.phone === 'string' && item.phone) ||
          (typeof item.phoneNumber === 'string' && item.phoneNumber) ||
          (item?.primaryPhoneNumber?.phoneNumber as string | undefined) ||
          (typeof item.telefono === 'string' && item.telefono) ||
          '';

        return {
          id: String(item.id),
          firstName: String(item.firstName ?? item.first_name ?? ''),
          lastName: String(item.lastName ?? item.last_name ?? ''),
          email: String(item.email),
          role: String(item.role ?? 'sin-role'),
          status: String(item.status ?? 'activo'),
          phone: rawPhone || null, // 👈 conservar
          permissions: Array.isArray(item.permissions) ? item.permissions : [],
        };
      });
      console.table(
        data.map((u) => ({
          id: u.id,
          email: u.email,
          phone: u.phone,
        })),
      );
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  // ✅ Ahora, `useEffect` ya no mostrará advertencias
  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const showNotification = useCallback(
    (message: string, type: 'success' | 'error') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
    },
    []
  );

  interface CreateUserResponse {
    user: {
      id: string;
      username: string;
    };
    generatedPassword: string;
  }

  const handleCreateUser = async () => {
    if (
      !newUser.firstName.trim() ||
      !newUser.lastName.trim() ||
      !newUser.email.trim()
    ) {
      showNotification('Todos los campos son obligatorios.', 'error');
      return;
    }

    try {
      setCreatingUser(true);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
        }),
      });

      if (!res.ok) {
        throw new Error('No se pudo crear el usuario');
      }

      const rawData: unknown = await res.json();
      if (
        typeof rawData !== 'object' ||
        rawData === null ||
        !('user' in rawData) ||
        !('generatedPassword' in rawData)
      ) {
        throw new Error('Respuesta de la API en formato incorrecto');
      }

      const { user: safeUser, generatedPassword } =
        rawData as CreateUserResponse;
      if (
        !safeUser ||
        typeof safeUser !== 'object' ||
        !('id' in safeUser) ||
        !('username' in safeUser)
      ) {
        throw new Error('Usuario inválido en la respuesta de la API');
      }

      const username = safeUser.username;
      setUsers([
        {
          id: safeUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          status: 'activo',
          isNew: true, // 🔹 Marcar como usuario nuevo
        },
        ...users,
      ]);

      setInfoDialogTitle('Usuario Creado');
      setInfoDialogMessage(
        `Se ha creado el usuario "${username}" con la contraseña: ${generatedPassword}`
      );
      setInfoDialogOpen(true);

      // ✅ Cerrar el modal después de crear el usuario
      setShowCreateForm(false);

      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        role: 'estudiante',
      });
    } catch {
      showNotification('Error al crear el usuario.', 'error');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleMassUpdateStatus = async (newStatus: string) => {
    if (selectedUsers.length === 0) {
      showNotification('No has seleccionado usuarios.', 'error');
      return;
    }

    try {
      await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateMultipleStatus',
          userIds: selectedUsers,
          status: newStatus,
        }),
      });

      setUsers(
        users.map((user) =>
          selectedUsers.includes(user.id)
            ? { ...user, status: newStatus }
            : user
        )
      );
      setSelectedUsers([]);
      showNotification(`Usuarios actualizados a ${newStatus}.`, 'success');
    } catch {
      showNotification('Error al actualizar usuarios.', 'error');
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setConfirmation({
      isOpen: true,
      title: 'Actualizar Rol',
      message: `¿Estás seguro de que quieres cambiar el rol de este usuario a ${newRole}?`,
      onConfirm: () => {
        void (async () => {
          try {
            setUpdatingUserId(userId);
            await setRoleWrapper({ id: userId, role: newRole });

            setUsers(
              users.map((user) =>
                user.id === userId ? { ...user, role: newRole } : user
              )
            );

            showNotification('Rol actualizado con éxito.', 'success');
          } catch {
            showNotification('Error al actualizar el rol.', 'error');
          } finally {
            setUpdatingUserId(null);
          }
        })(); // Llamamos la función inmediatamente
      },
    });
  };

  const handleMassRemoveRole = () => {
    if (selectedUsers.length === 0) {
      showNotification('No has seleccionado usuarios.', 'error');
      return;
    }

    setConfirmation({
      isOpen: true,
      title: 'Eliminar Roles',
      message:
        '¿Estás seguro de que quieres eliminar el rol de los usuarios seleccionados?',
      onConfirm: () => {
        void (async () => {
          try {
            await fetch('/api/users', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'removeRole',
                userIds: selectedUsers,
              }),
            });

            // Actualizar los usuarios en el estado local
            setUsers(
              users.map((user) =>
                selectedUsers.includes(user.id)
                  ? { ...user, role: 'sin-role' }
                  : user
              )
            );

            setSelectedUsers([]); // Limpiar selección
            showNotification('Roles eliminados con éxito.', 'success');
          } catch {
            showNotification('Error al eliminar roles.', 'error');
          } finally {
            setConfirmation(null);
          }
        })(); // ✅ Ejecutamos la función inmediatamente
      },
    });
  };

  const handleDeleteUser = (userId: string) => {
    setConfirmation({
      isOpen: true,
      title: 'Eliminar Usuario',
      message:
        '¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.',
      onConfirm: () => {
        void (async () => {
          try {
            setUpdatingUserId(userId);
            await deleteUser(userId);

            setUsers(users.filter((user) => user.id !== userId));
            showNotification('Usuario eliminado correctamente.', 'success');
          } catch {
            showNotification('Error al eliminar el usuario.', 'error');
          } finally {
            setUpdatingUserId(null);
            setConfirmation(null);
          }
        })(); // ✅ Ejecutamos la función inmediatamente
      },
    });
  };

  const [modalIsOpen, setModalIsOpen] = useState(false); // ✅ Asegurar que está definido
  const [programsCollapsed, setProgramsCollapsed] = useState(true);
  const [coursesCollapsed, setCoursesCollapsed] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');

  const handleMassUserUpload = useCallback(
    (newUsers: User[]) => {
      if (!newUsers || newUsers.length === 0) return;

      // 🔹 Mantener `isNew: true` sin afectar los usuarios previos
      setUsers((prevUsers) => [
        ...newUsers.map((user) => ({ ...user, isNew: true })), // Nuevos usuarios en azul
        ...prevUsers, // Mantener los usuarios anteriores
      ]);

      // ✅ Mostrar notificación de éxito
      showNotification(
        `Se crearon ${newUsers.length} nuevos usuarios`,
        'success'
      );

      // ✅ Cerrar el modal sin recargar la página

      if (modalIsOpen) {
        setModalIsOpen(false);
      }
    },
    [showNotification, modalIsOpen]
  );

  const handleEditUser = async (user: User) => {
    try {
      // 🔹 Obtener los datos del usuario desde Clerk
      const res = await fetch(`/api/super-admin/infoUserUpdate?id=${user.id}`);
      if (!res.ok) throw new Error('Error al obtener datos del usuario');

      const userData: UserData = (await res.json()) as UserData;

      // ✅ Extraer correctamente `firstName` y `lastName`
      const firstName = userData.firstName ?? user.firstName; // Usa `firstName` desde Clerk si existe
      const lastName = userData.lastName ?? user.lastName; // Usa `lastName` desde Clerk si existe

      // 🔹 Asegurar que los permisos sean un array
      const userWithPermissions = {
        ...userData,
        firstName, // ✅ Ahora `firstName` se almacena correctamente
        lastName, // ✅ Ahora `lastName` se almacena correctamente
        permissions: Array.isArray(userData.permissions)
          ? userData.permissions
          : [],
      };

      console.log('📌 Usuario con permisos:', userWithPermissions);

      // ✅ Guardar el usuario en el estado para abrir el modal con la info actualizada
      setEditingUser({
        ...userData,
        firstName,
        lastName,
        permissions: Array.isArray(userData.permissions)
          ? userData.permissions
          : [],
        subscriptionEndDate: userData.subscriptionEndDate ?? null,
        role: userData.role ?? 'sin-role',
        status: userData.status ?? 'sin-status',
      });

      // ✅ Asegurar que los campos de edición se actualicen con `firstName` y `lastName`
      setEditValues({
        firstName,
        lastName,
      });
    } catch (error) {
      console.error('❌ Error al obtener usuario:', error);
    }
  };

  useEffect(() => {
    const fetchProgramsFromCourse = async () => {
      if (!selectedCourse) {
        setPrograms(allPrograms); // Use cached programs if no course is selected
        return;
      }

      try {
        const res = await fetch(
          `/api/super-admin/programs/fromCourse?courseId=${selectedCourse}`
        );
        if (!res.ok) throw new Error('Error al obtener programas desde curso');

        const rawData: unknown = await res.json();

        if (!isValidProgramArray(rawData)) {
          throw new Error('Datos inválidos al obtener programas desde curso');
        }

        const data = Array.from(
          new Map(
            rawData.map((p) => [p.id, { id: String(p.id), title: p.title }])
          ).values()
        );

        setPrograms(data);
      } catch (error) {
        console.error('Error cargando programas desde curso:', error);
        setPrograms([]);
      }
    };
    void fetchProgramsFromCourse();
  }, [selectedCourse, allPrograms, isValidProgramArray]);

  useEffect(() => {
    const fetchCoursesFromProgram = async () => {
      try {
        const res = await fetch(
          `/api/super-admin/courses/fromProgram?programId=${selectedProgram}`
        );
        if (!res.ok) throw new Error('Error al obtener cursos desde programa');

        const rawData: unknown = await res.json();

        if (!isValidCourseArray(rawData)) {
          throw new Error('Datos inválidos al obtener cursos desde programa');
        }

        const data: Program[] = rawData as Program[];
        setCourses(data);
      } catch (error) {
        console.error('Error cargando cursos desde programa:', error);
        setCourses([]);
      }
    };

    if (selectedProgram) {
      void fetchCoursesFromProgram();
    } else {
      void fetchAllCourses(); // 🔁 Si se deselecciona, mostrar todos
    }
  }, [
    selectedCourse,
    allPrograms,
    isValidProgramArray,
    fetchAllCourses,
    isValidCourseArray,
    selectedProgram,
  ]); // ✅ para programas

  useEffect(() => {
    if (!selectedProgram) {
      setCourses([...new Set(allCourses)]); // Eliminar duplicados en cursos
      return;
    }

    const loadCourses = async () => {
      try {
        const res = await fetch(
          `/api/super-admin/courses/fromProgram?programId=${selectedProgram}`
        );
        if (!res.ok) throw new Error('Error al obtener cursos');

        const rawData: unknown = await res.json();
        if (
          !Array.isArray(rawData) ||
          !rawData.every(
            (item) =>
              typeof item === 'object' &&
              item !== null &&
              'id' in item &&
              'title' in item
          )
        ) {
          throw new Error('Datos inválidos recibidos');
        }

        const data: { id: string; title: string }[] = rawData as {
          id: string;
          title: string;
        }[];

        setCourses([...new Set(data)]); // Eliminar duplicados en cursos
      } catch (err) {
        console.error('Error al cargar cursos desde programa:', err);
      }
    };

    void loadCourses();
  }, [selectedProgram, allCourses, isValidCourseArray]); // ✅ para cursos

  useEffect(() => {
    if (!selectedCourse) {
      setPrograms([...new Set(allPrograms)]); // Eliminar duplicados en programas
      return;
    }

    const loadPrograms = async () => {
      try {
        const res = await fetch(
          `/api/super-admin/programs/fromCourse?courseId=${selectedCourse}`
        );
        if (!res.ok) throw new Error('Error al obtener programas');

        const rawData: unknown = await res.json();
        if (
          !Array.isArray(rawData) ||
          !rawData.every(
            (item) =>
              typeof item === 'object' &&
              item !== null &&
              'id' in item &&
              'title' in item
          )
        ) {
          throw new Error('Datos inválidos recibidos');
        }

        const data: { id: string; title: string }[] = rawData as {
          id: string;
          title: string;
        }[];

        setPrograms([...new Set(data)]); // Eliminar duplicados en programas
      } catch (err) {
        console.error('Error al cargar programas desde curso:', err);
      }
    };

    void loadPrograms();
  }, [selectedCourse, allPrograms]);

  // Add search filters for courses and programs
  const [courseSearch, setCourseSearch] = useState('');
  const [programSearch, setProgramSearch] = useState('');

  const filteredCourses = Array.from(
    new Map(courses.map((course) => [course.title, course])).values()
  ).filter((course) =>
    course.title.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredPrograms = Array.from(
    new Map(programs.map((program) => [program.title, program])).values()
  ).filter((program) =>
    program.title.toLowerCase().includes(programSearch.toLowerCase())
  );

  return (
    <>
      <div className="p-4 sm:p-6">
        {/* Header with gradient effect */}
        <header className="group relative overflow-hidden rounded-lg p-[1px]">
          <div className="animate-gradient absolute -inset-0.5 bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-75 blur transition duration-500" />
          <div className="relative flex flex-col items-start justify-between rounded-lg bg-gray-800 p-4 text-white shadow-lg transition-all duration-300 group-hover:bg-gray-800/95 sm:flex-row sm:items-center sm:p-6">
            <h1 className="text-primary flex items-center gap-3 text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl">
              Administrador de usuarios
            </h1>
          </div>
        </header>
        <br />

        {/* Action buttons with consistent styling */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="group/button bg-background text-primary hover:bg-primary/10 relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-md border border-white/20 px-2 py-1.5 text-xs transition-all sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className="relative z-10 font-medium">Crear Usuario</span>
            <UserPlus className="relative z-10 size-3.5 sm:size-4" />
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
          </button>
          <button
            onClick={() => handleMassUpdateStatus('activo')}
            className={`group/button relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-md px-2 py-1.5 text-xs transition-all sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${selectedUsers.length === 0
              ? 'cursor-not-allowed border border-gray-600 text-gray-500'
              : 'border border-green-500/20 bg-green-500/10 text-green-500 hover:bg-green-500/20'
              }`}
            disabled={selectedUsers.length === 0}
          >
            <span className="relative z-10 font-medium">Activar</span>
            <Check className="relative z-10 size-3.5 sm:size-4" />
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
          </button>
          <button
            onClick={() => handleMassUpdateStatus('inactivo')}
            className={`group/button relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-md px-2 py-1.5 text-xs transition-all sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${selectedUsers.length === 0
              ? 'cursor-not-allowed border border-gray-600 text-gray-500'
              : 'border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20'
              }`}
            disabled={selectedUsers.length === 0}
          >
            <span className="relative z-10 font-medium">Desactivar</span>
            <XCircle className="relative z-10 size-3.5 sm:size-4" />
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
          </button>
          <button
            onClick={handleMassRemoveRole}
            className={`group/button relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-md px-2 py-1.5 text-xs transition-all sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${selectedUsers.length === 0
              ? 'cursor-not-allowed border border-gray-600 text-gray-500'
              : 'border border-yellow-500/20 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
              }`}
            disabled={selectedUsers.length === 0}
          >
            <span className="relative z-10 font-medium">Quitar Rol</span>
            <XCircle className="relative z-10 size-3.5 sm:size-4" />
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
          </button>

          <button
            onClick={async () => {
              try {
                if (selectedUsers.length === 0) {
                  showNotification('No hay usuarios seleccionados', 'error');
                  return;
                }

                setSendingEmails(true);
                showNotification(
                  `Enviando ${selectedUsers.length} correos...`,
                  'success'
                );

                const response = await fetch('/api/users/emailsUsers', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userIds: selectedUsers,
                  }),
                });

                if (!response.ok) {
                  throw new Error('Error al enviar las credenciales');
                }

                const rawResult: unknown = await response.json();

                if (
                  !rawResult ||
                  typeof rawResult !== 'object' ||
                  !('results' in rawResult) ||
                  !Array.isArray((rawResult as { results: unknown }).results)
                ) {
                  throw new Error('Invalid email response');
                }

                const result = rawResult as EmailResponse;

                const successCount = result.results.filter(
                  (r) => r.status === 'success'
                ).length;

                showNotification(
                  `Credenciales enviadas a ${successCount} usuarios`,
                  'success'
                );
              } catch (error) {
                console.error('Error:', error);
                showNotification('Error al enviar las credenciales', 'error');
              } finally {
                setSendingEmails(false);
              }
            }}
            className={`group/button relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-md px-2 py-1.5 text-xs transition-all sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${selectedUsers.length === 0
              ? 'cursor-not-allowed border border-gray-600 text-gray-500'
              : 'border border-blue-500/20 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
              }`}
            disabled={selectedUsers.length === 0 || sendingEmails}
          >
            <span className="relative z-10 font-medium">
              {sendingEmails ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4" />
                  Enviando...
                </div>
              ) : (
                'Reenviar Credenciales'
              )}
            </span>
            {!sendingEmails && (
              <Paperclip className="relative z-10 size-3.5 sm:size-4" />
            )}
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="group/button bg-background text-primary hover:bg-primary/10 relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-md border border-white/20 px-2 py-1.5 text-xs transition-all sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className="relative z-10 font-medium">
              Asignar a Curso o Programa
            </span>
            <UserPlus className="relative z-10 size-3.5 sm:size-4" />
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
          </button>
          <button
            onClick={() => setShowAnuncioModal(true)}
            className="group/button bg-background text-primary hover:bg-primary/10 relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-md border border-white/20 px-2 py-1.5 text-xs transition-all sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className="relative z-10 font-medium">Crear Anuncio</span>
            <UserPlus className="relative z-10 size-3.5 sm:size-4" />
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            className="group/button bg-background text-primary hover:bg-primary/10 relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-md border border-white/20 px-2 py-1.5 text-xs transition-all sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className="relative z-10 font-medium">Enviar Correo</span>
            <Paperclip className="relative z-10 size-3.5 sm:size-4" />
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
          </button>
          <BulkUploadUsers
            onUsersUploaded={handleMassUserUpload}
            onFinished={handleUsersMasiveFinished}
          />
        </div>

        <div className="mt-6">
          {/* Search and filters with consistent card styling */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm">
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white placeholder:text-gray-400"
              />
            </div>

            {/* Role filter */}
            <div className="rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm">
              <select
                className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">Todos los Roles</option>
                <option value="admin">Admin</option>
                <option value="super-admin">super-admin</option>
                <option value="educador">Educador</option>
                <option value="estudiante">Estudiante</option>
                <option value="sin-role">Sin Rol</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm">
              <select
                className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos los Estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
          </div>

          {/* Users table with improved styling */}
          <div className="mt-6 overflow-hidden rounded-lg bg-gray-800/50 shadow-xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <div className="mb-4 flex items-center gap-2 text-sm text-white">
                <span>Mostrar:</span>
                <select
                  value={usersPerPage}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setUsersPerPage(value);
                    setCurrentPage(1); // volver a página 1
                  }}
                  className="rounded bg-gray-700 px-2 py-1 text-sm text-white"
                >
                  <option value={10}>10</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={-1}>Todos</option>
                </select>
                <span>usuarios</span>
              </div>

              <table className="min-w-full table-auto border-collapse">
                <thead>
                  <tr className="border-b border-gray-700 bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] text-white">
                    <th className="w-12 px-2 py-3 sm:px-4 sm:py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length}
                        onChange={(e) =>
                          setSelectedUsers(
                            e.target.checked
                              ? filteredUsers.map((user) => user.id)
                              : []
                          )
                        }
                        className="rounded border-white/20"
                      />
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium whitespace-nowrap sm:px-4 sm:py-4 sm:text-sm">
                      Usuario
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium whitespace-nowrap sm:px-4 sm:py-4 sm:text-sm">
                      Rol
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium whitespace-nowrap sm:px-4 sm:py-4 sm:text-sm">
                      Estado
                    </th>
                    <th className="px-2 py-3 text-right text-xs font-medium whitespace-nowrap sm:px-4 sm:py-4 sm:text-sm">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {currentUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="group transition-colors hover:bg-gray-700/50"
                    >
                      <td className="px-2 py-3 sm:px-4 sm:py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() =>
                            handleUserSelection(user.id, user.email)
                          }
                          className="rounded border-gray-600"
                        />
                      </td>
                      <td className="px-2 py-3 sm:px-4 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="bg-primary/10 size-8 rounded-full p-1 sm:size-10 sm:p-2">
                            <span className="text-primary flex h-full w-full items-center justify-center text-xs font-semibold sm:text-sm">
                              {user.firstName[0]}
                              {user.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-white sm:text-sm">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-xs text-gray-400 sm:text-sm">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 sm:px-4 sm:py-4">
                        <select
                          value={user.role || 'sin-role'}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value)
                          }
                          className="w-full rounded-md border border-gray-600 bg-gray-700/50 px-2 py-1 text-xs text-white transition-colors hover:bg-gray-700 sm:px-3 sm:text-sm"
                        >
                          <option value="sin-role">Sin Rol</option>
                          <option value="admin">Admin</option>
                          <option value="super-admin">super-admin</option>
                          <option value="educador">Educador</option>
                          <option value="estudiante">Estudiante</option>
                        </select>
                      </td>
                      <td className="px-2 py-3 sm:px-4 sm:py-4">
                        <div
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.status === 'activo'
                            ? 'bg-green-500/10 text-green-500'
                            : user.status === 'inactivo'
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-yellow-500/10 text-yellow-500'
                            }`}
                        >
                          <div
                            className={`mr-1 size-1.5 rounded-full sm:size-2 ${user.status === 'activo'
                              ? 'bg-green-500'
                              : user.status === 'inactivo'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                              }`}
                          />
                          <span className="hidden sm:inline">
                            {user.status}
                          </span>
                          <span className="inline sm:hidden">
                            {user.status === 'activo'
                              ? 'A'
                              : user.status === 'inactivo'
                                ? 'I'
                                : 'S'}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3 sm:px-4 sm:py-4">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="rounded-md p-1 hover:bg-gray-700"
                            title="Ver detalles"
                          >
                            <Eye className="size-3.5 sm:size-4" />
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="rounded-md p-1 hover:bg-gray-700"
                            title="Editar"
                          >
                            <Edit className="size-3.5 sm:size-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="rounded-md p-1 hover:bg-red-500/10 hover:text-red-500"
                            title="Eliminar"
                          >
                            <Trash2 className="size-3.5 sm:size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination - Keep existing pagination code */}
          <div className="mt-6 flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row">
            <p className="text-sm text-gray-300">
              Mostrando {currentUsers.length} de {filteredUsers.length} usuarios
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded bg-gray-700 px-3 py-1 text-sm text-white hover:bg-gray-600 disabled:opacity-50"
              >
                Anterior
              </button>

              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="rounded-md bg-gray-700 px-2 py-1 text-sm text-white"
              >
                {Array.from(
                  { length: Math.ceil(filteredUsers.length / usersPerPage) },
                  (_, i) => i + 1
                ).map((page) => (
                  <option key={page} value={page}>
                    Página {page}
                  </option>
                ))}
              </select>

              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    prev < Math.ceil(filteredUsers.length / usersPerPage)
                      ? prev + 1
                      : prev
                  )
                }
                disabled={
                  currentPage === Math.ceil(filteredUsers.length / usersPerPage)
                }
                className="rounded bg-gray-700 px-3 py-1 text-sm text-white hover:bg-gray-600 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* ...existing modals and dialogs... */}
      {showCreateForm && (
        <div className="bg-opacity-30 fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="relative z-50 w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-2xl">
            {/* Header del formulario con botón de cierre */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                Crear Nuevo Usuario
              </h2>
              <button onClick={() => setShowCreateForm(false)}>
                <X className="size-6 text-gray-300 hover:text-white" />
              </button>
            </div>

            {/* Formulario de creación */}
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                value={newUser.firstName}
                onChange={(e) => {
                  // Eliminar espacios y tomar solo la primera palabra
                  const singleName = e.target.value.trim().split(' ')[0];
                  setNewUser({ ...newUser, firstName: singleName });
                }}
                onKeyDown={(e) => {
                  // Prevenir el espacio
                  if (e.key === ' ') {
                    e.preventDefault();
                  }
                }}
                maxLength={30} // Opcional: limitar la longitud máxima
              />
              <input
                type="text"
                placeholder="Apellido"
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                value={newUser.lastName}
                onChange={(e) =>
                  setNewUser({ ...newUser, lastName: e.target.value })
                }
              />
              <input
                type="email"
                placeholder="Correo electrónico"
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />
              <select
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
              >
                <option value="admin">Admin</option>
                <option value="super-admin">super-admin</option>
                <option value="educador">Educador</option>
                <option value="estudiante">Estudiante</option>
              </select>
            </div>

            {/* Botón para crear usuario */}
            <button
              onClick={handleCreateUser}
              className="bg-primary hover:bg-secondary mt-4 flex w-full justify-center rounded-md px-4 py-2 font-bold text-white"
              disabled={creatingUser}
            >
              {creatingUser ? <Loader2 className="size-5" /> : 'Crear Usuario'}
            </button>
          </div>
        </div>
      )}
      {viewUser && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-black/80"
          onClick={() => setViewUser(null)}
        >
          <div
            className="relative m-4 w-full max-w-5xl rounded-xl bg-[#01142B] p-6 text-white shadow-2xl md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-2xl font-bold text-[#3AF4EF]">
                Detalles del Usuario
              </h2>
              <button
                onClick={() => setViewUser(null)}
                className="rounded-lg bg-white/5 p-2 hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Content */}
            <div className="grid gap-8 md:grid-cols-[300px_1fr]">
              {/* Sidebar - Info básica */}
              <div className="space-y-6">
                {/* Avatar */}
                <div className="relative mx-auto h-64 w-64 overflow-hidden rounded-xl border-2 border-[#3AF4EF] shadow-lg">
                  {viewUser.profileImage ? (
                    <Image
                      src={viewUser.profileImage}
                      alt={`Foto de ${viewUser.firstName}`}
                      fill
                      className="object-cover transition duration-200 hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#012A5C] to-[#01142B] text-6xl font-bold text-white">
                      {viewUser.firstName?.[0]}
                    </div>
                  )}
                </div>

                {/* Información básica */}
                <div className="rounded-lg bg-white/5 p-4">
                  <h3 className="mb-4 text-xl font-bold text-white">
                    {viewUser.firstName} {viewUser.lastName}
                  </h3>
                  <div className="space-y-3 text-sm">
                    <p className="flex items-center gap-2 text-gray-300">
                      <span>Email:</span>
                      <span className="font-medium text-white">
                        {viewUser.email}
                      </span>
                    </p>
                    <p className="flex items-center gap-2 text-gray-300">
                      <span>Creado:</span>
                      <span className="font-medium text-white">
                        {viewUser.createdAt}
                      </span>
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${viewUser.status === 'activo'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                        }`}
                    >
                      <span
                        className={`size-2 rounded-full ${viewUser.status === 'activo'
                          ? 'bg-green-400'
                          : 'bg-red-400'
                          }`}
                      />
                      {viewUser.status}
                    </span>
                    <span className="inline-flex items-center rounded-lg bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-400">
                      {viewUser.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="space-y-8">
                {/* Información de la cuenta */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-[#3AF4EF]">
                    Información adicional
                  </h3>
                  <div className="rounded-lg bg-white/5 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400">ID del usuario</p>
                        <p className="font-mono text-sm">{viewUser.id}</p>
                      </div>
                      {/* Aquí puedes agregar más campos de información */}
                    </div>
                  </div>
                </div>

                {/* Cursos */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-[#3AF4EF]">
                    Cursos inscritos
                  </h3>
                  <div className="rounded-lg bg-white/5 p-4">
                    {viewUser.courses && viewUser.courses.length > 0 ? (
                      <CourseCarousel
                        courses={viewUser.courses}
                        userId={viewUser.id}
                      />
                    ) : (
                      <p className="text-center text-gray-400">
                        Este usuario no está inscrito en ningún curso.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="bg-opacity-30 fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="w-full max-w-3xl rounded-lg bg-gray-800 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                Asignar a Curso o Programa
              </h2>
              <button onClick={() => setShowAssignModal(false)}>
                <X className="size-6 text-gray-300 hover:text-white" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-700 p-4">
                <h3 className="mb-2 font-semibold text-white">
                  Seleccionar Estudiantes
                </h3>
                <input
                  type="text"
                  placeholder="Buscar estudiante..."
                  className="mb-2 w-full rounded border bg-gray-600 p-2 text-white"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
                <div className="mb-2 flex items-center justify-between rounded bg-gray-600 px-3 py-2">
                  <span className="font-semibold text-white">
                    Seleccionar Todos
                  </span>
                  <input
                    type="checkbox"
                    checked={
                      selectedStudents.length === users.length &&
                      users.length > 0
                    }
                    onChange={(e) =>
                      setSelectedStudents(
                        e.target.checked ? users.map((u) => u.id) : []
                      )
                    }
                    className="form-checkbox h-5 w-5 text-blue-500"
                  />
                </div>
                <div className="h-64 overflow-y-auto rounded border border-gray-600">
                  {users
                    .filter(
                      (user) =>
                        user.firstName
                          .toLowerCase()
                          .includes(studentSearch.toLowerCase()) ||
                        user.lastName
                          .toLowerCase()
                          .includes(studentSearch.toLowerCase()) ||
                        user.email
                          .toLowerCase()
                          .includes(studentSearch.toLowerCase())
                    )
                    .map((user) => (
                      <label
                        key={user.id}
                        className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-gray-600"
                      >
                        <span className="text-white">
                          {user.firstName} {user.lastName}
                        </span>
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(user.id)}
                          onChange={() => handleSelectStudent(user.id)}
                          className="form-checkbox h-5 w-5 text-blue-500"
                        />
                      </label>
                    ))}
                </div>
              </div>

              {/* Colapsable Cursos y Programas */}
              <div className="space-y-4 rounded-lg bg-gray-700 p-4">
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-white">
                    Plan de Suscripción
                  </label>
                  <select
                    value={selectedPlanType}
                    onChange={(e) =>
                      setSelectedPlanType(
                        e.target.value as 'Pro' | 'Premium' | 'Enterprise'
                      )
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white"
                  >
                    <option value="Pro">Pro</option>
                    <option value="Premium">Premium</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <button
                    onClick={() => setCoursesCollapsed(!coursesCollapsed)}
                    className="bg-secondary w-full rounded py-2 text-white"
                  >
                    {coursesCollapsed ? 'Mostrar Cursos' : 'Ocultar Cursos'}
                  </button>
                  {!coursesCollapsed && (
                    <div className="mt-2 h-48 overflow-y-auto rounded border border-gray-600">
                      <input
                        type="text"
                        placeholder="Buscar cursos..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        className="mb-2 w-full rounded border bg-gray-600 p-2 text-white"
                      />
                      {filteredCourses.map((course) => (
                        <label
                          key={course.id}
                          className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-gray-600"
                        >
                          <span className="text-white">{course.title}</span>
                          <input
                            type="radio"
                            name="selectedCourse"
                            checked={selectedCourse === course.id}
                            onChange={() => {
                              setSelectedCourse(course.id); // ✅ No longer resets the program
                            }}
                            className="form-radio h-5 w-5 text-blue-500"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                  {selectedCourse && (
                    <button
                      onClick={() => {
                        setSelectedCourse(null);
                        void fetchAllPrograms(); // 🔁 Forzar recarga de programas
                      }}
                      className="mt-2 w-full rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                    >
                      Quitar selección de curso
                    </button>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => {
                      setProgramsCollapsed(!programsCollapsed); // ✅ Esto era lo que faltaba
                    }}
                    className="bg-primary w-full rounded py-2 text-white"
                  >
                    {programsCollapsed
                      ? 'Mostrar Programas'
                      : 'Ocultar Programas'}
                  </button>

                  {!programsCollapsed && (
                    <div className="mt-2 h-48 overflow-y-auto rounded border border-gray-600">
                      <input
                        type="text"
                        placeholder="Buscar programas..."
                        value={programSearch}
                        onChange={(e) => setProgramSearch(e.target.value)}
                        className="mb-2 w-full rounded border bg-gray-600 p-2 text-white"
                      />
                      {filteredPrograms.map((program) => (
                        <label
                          key={program.id}
                          className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-gray-600"
                        >
                          <span className="text-white">{program.title}</span>
                          <input
                            type="radio"
                            name="selectedProgram"
                            checked={selectedProgram === program.id}
                            onChange={() => {
                              setSelectedProgram(program.id); // ✅ No longer resets the course
                            }}
                            className="form-radio h-5 w-5 text-green-500"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                  {selectedProgram && (
                    <button
                      onClick={() => setSelectedProgram(null)}
                      className="mt-2 w-full rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                    >
                      Quitar selección de programa
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={handleAssignStudents}
                className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                disabled={
                  selectedStudents.length === 0 ||
                  (!selectedCourse && !selectedProgram)
                }
              >
                Asignar Estudiantes
              </button>
              <button
                onClick={() => setShowAssignModal(false)}
                className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor de botones arriba de la tabla */}

      {notification && (
        <div
          className={`fixed right-5 bottom-5 rounded-md px-4 py-2 text-white shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
        >
          {notification.message}
        </div>
      )}
      {showAnuncioModal && (
        <div className="bg-opacity-60 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="relative max-h-screen w-full max-w-2xl overflow-y-auto rounded-lg bg-gray-900 p-6 text-white shadow-2xl">
            <button
              onClick={() => setShowAnuncioModal(false)}
              className="absolute top-4 right-4 text-white hover:text-red-500"
            >
              <X size={24} />
            </button>

            <h2 className="mb-6 text-center text-3xl font-bold">
              Crear Anuncio
            </h2>

            {/* Inputs que actualizan la vista previa en tiempo real */}
            {/* Tipo de destinatario */}
            <select
              className="mb-3 w-full rounded-lg border bg-gray-800 p-3 text-white"
              value={newAnuncio.tipo_destinatario || ''}
              onChange={(e) =>
                setNewAnuncio({
                  ...newAnuncio,
                  tipo_destinatario: e.target.value as
                    | 'todos'
                    | 'cursos'
                    | 'programas'
                    | 'custom',
                })
              }
            >
              <option value="todos">Todos</option>
              <option value="cursos">Cursos</option>
              <option value="programas">Programas</option>
              <option value="custom">Usuarios específicos</option>
            </select>
            {/* Mostrar el select de cursos si se selecciona "cursos" */}
            {newAnuncio.tipo_destinatario === 'cursos' && (
              <select
                className="mb-3 w-full rounded-lg border bg-gray-800 p-3 text-white"
                value={selectedCourses}
                onChange={(e) => setSelectedCourses([e.target.value])}
              >
                <option value="">Selecciona un curso</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            )}

            {/* Mostrar el select de programas si se selecciona "programas" */}
            {newAnuncio.tipo_destinatario === 'programas' && (
              <select
                className="mb-3 w-full rounded-lg border bg-gray-800 p-3 text-white"
                value={selectedPrograms}
                onChange={(e) => setSelectedPrograms([e.target.value])}
              >
                <option value="">Selecciona un programa</option>
                {/* Debes tener un array de programas similar a `courses` */}
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </select>
            )}

            {/* Mostrar el select de usuarios si se selecciona "custom" */}
            {newAnuncio.tipo_destinatario === 'custom' && (
              <select
                className="mb-3 w-full rounded-lg border bg-gray-800 p-3 text-white"
                value={selectedUsers}
                onChange={(e) => setSelectedUsers([e.target.value])}
              >
                <option value="">Selecciona usuarios</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            )}

            {/* Formulario de creación de anuncio */}
            <input
              type="text"
              placeholder="Título del anuncio"
              value={newAnuncio.titulo}
              onChange={(e) =>
                setNewAnuncio({ ...newAnuncio, titulo: e.target.value })
              }
              className="mb-3 w-full rounded-lg border bg-gray-800 p-3 text-white"
            />

            <textarea
              placeholder="Descripción"
              value={newAnuncio.descripcion}
              onChange={(e) =>
                setNewAnuncio({ ...newAnuncio, descripcion: e.target.value })
              }
              className="mb-3 w-full rounded-lg border bg-gray-800 p-3 text-white"
            />

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mb-4 w-full rounded-lg border bg-gray-800 p-3 text-white"
            />

            {/* 🔹 Componente de Vista Previa del Anuncio */}
            <AnuncioPreview
              titulo={newAnuncio.titulo}
              descripcion={newAnuncio.descripcion}
              imagenUrl={newAnuncio.previewImagen ?? ''}
            />

            <button
              onClick={handleCreateAnuncio}
              className="mt-6 w-full rounded-lg bg-blue-600 py-3 text-lg font-semibold text-white hover:bg-blue-700"
            >
              Guardar Anuncio
            </button>
          </div>
        </div>
      )}

      {editingUser && (
        <EditUserModal
          isOpen={!!editingUser}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={async (updatedUser, updatedPermissions) => {
            try {
              const res = await fetch('/api/super-admin/udateUser', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: updatedUser.id,
                  firstName: updatedUser.firstName,
                  lastName: updatedUser.lastName,
                  role: updatedUser.role,
                  status: updatedUser.status,
                  permissions: updatedPermissions,
                  subscriptionEndDate: updatedUser.subscriptionEndDate ?? null,
                  planType: updatedUser.planType ?? 'none', // ✅ INCLUIDO AQUÍ
                }),
              });

              if (!res.ok) throw new Error('Error actualizando usuario');

              // Actualizar el usuario localmente en el estado
              setUsers(
                users.map((user) =>
                  user.id === updatedUser.id
                    ? { ...updatedUser, permissions: updatedPermissions }
                    : user
                )
              );

              setEditingUser(null);
              showNotification('Usuario actualizado con éxito.', 'success');
            } catch (err) {
              console.error('❌ Error actualizando usuario:', err);
              showNotification('Error al actualizar usuario', 'error');
            }
          }}
        />
      )}

      <ConfirmDialog
        isOpen={confirmation?.isOpen ?? false}
        title={confirmation?.title ?? ''}
        message={confirmation?.message ?? ''}
        onConfirm={
          confirmation?.onConfirm
            ? async () => {
              await Promise.resolve(confirmation.onConfirm?.());
            }
            : async () => Promise.resolve()
        } // Asegura que `onConfirm` siempre devuelva una Promise<void></void>
        onCancel={() => setConfirmation(null)}
      />

      <InfoDialog
        isOpen={infoDialogOpen}
        title={infoDialogTitle}
        message={infoDialogMessage}
        onClose={() => setInfoDialogOpen(false)}
      />
      {showEmailModal && (
        <div className="bg-opacity-60 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="relative max-h-screen w-full max-w-2xl overflow-y-auto rounded-lg bg-gray-900 p-6 text-white shadow-2xl">
            {/* ❌ Botón de cierre */}
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute top-4 right-4 text-white hover:text-red-500"
            >
              <X size={24} />
            </button>

            <h2 className="mb-6 text-center text-3xl font-bold">
              Enviar Correo
            </h2>

            {/* 📌 Campo de Asunto */}
            <input
              type="text"
              placeholder="Asunto del correo"
              className="mb-4 w-full rounded-lg border-2 border-gray-700 bg-gray-800 p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            <div className="mb-4 flex flex-wrap gap-2">
              {selectedEmails.map((email) => (
                <span
                  key={email}
                  className="flex items-center rounded-full bg-blue-600 px-4 py-2 text-white"
                >
                  {email}
                  <button
                    onClick={() =>
                      setSelectedEmails((prev) =>
                        prev.filter((e) => e !== email)
                      )
                    }
                    className="ml-2 text-lg text-white"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            {/* 📌 Agregar correos manualmente */}
            <input
              type="text"
              placeholder="Agregar correos manualmente y presiona Enter"
              className="mb-4 w-full rounded-lg border-2 border-gray-700 bg-gray-800 p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={customEmails}
              onChange={(e) => setCustomEmails(e.target.value)}
              onKeyDown={handleManualEmailAdd}
            />

            {/* 📌 Editor de texto con SunEditor */}
            <SunEditor
              setContents={message}
              onChange={(content) => setMessage(content)}
              setOptions={{
                height: '200',
                buttonList: [
                  ['bold', 'italic', 'underline', 'strike'],
                  ['fontSize', 'fontColor', 'hiliteColor'],
                  ['align', 'list', 'table'],
                  ['link', 'image', 'video'],
                  ['removeFormat'],
                ],
              }}
            />

            {/* 📌 Adjuntar archivos con vista previa */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-white">
                Adjuntar Archivos
              </label>

              <div className="mb-4 flex flex-wrap gap-4">
                {previewAttachments.map((src, index) => (
                  <div key={index} className="relative h-24 w-24">
                    <Image
                      src={src}
                      alt={`preview-${index}`}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-lg"
                    />
                    <button
                      onClick={() => removeAttachment(index)}
                      className="absolute top-0 right-0 rounded-full bg-red-600 p-2 text-xs text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <input
                type="file"
                multiple
                onChange={handleAttachmentChange}
                className="rounded-lg border-2 border-gray-700 bg-gray-800 p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* 📌 WhatsApp */}
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={sendWhatsapp}
                onChange={(e) => setSendWhatsapp(e.target.checked)}
                className="form-checkbox h-5 w-5 text-green-500"
              />
              <label className="text-white">Enviar mensaje por WhatsApp</label>
            </div>

            {sendWhatsapp && (
              <>
                {/* ⬇️ Plantillas de WhatsApp */}
                <div className="mb-3">
                  <label className="mb-1 block text-sm">
                    Plantilla de WhatsApp
                  </label>
                  <div className="mb-2 text-xs text-gray-400">
                    Teléfonos detectados de seleccionados:{' '}
                    {users
                      .filter((u) => selectedUsers.includes(u.id) && u.phone)
                      .map((u) => u.phone)
                      .join(', ') || '—'}
                  </div>

                  {waLoading ? (
                    <div className="text-sm text-gray-400">
                      Cargando plantillas…
                    </div>
                  ) : waError ? (
                    <div className="text-sm text-red-400">{waError}</div>
                  ) : waTemplates.length === 0 ? (
                    <div className="text-sm text-gray-400">
                      No hay plantillas (revisa si están en PENDING/REJECTED o
                      el token/ID de WABA).
                    </div>
                  ) : (
                    <select
                      value={waSelectedTemplate}
                      onChange={(e) => {
                        const value = e.target.value;
                        setWaSelectedTemplate(value);

                        // Si no es plantilla real, limpiar variables
                        if (value === '' || value === WA_TEXT_ONLY) {
                          setWaVariables([]);
                          return;
                        }

                        // Si es plantilla, preparar variables
                        const tmpl = waTemplates.find((t) => t.name === value);
                        if (tmpl) {
                          const placeholders =
                            tmpl.body.match(/\{\{\d+\}\}/g) ?? [];
                          setWaVariables(
                            tmpl.example?.slice(0, placeholders.length) ??
                            Array.from(
                              { length: placeholders.length },
                              () => ''
                            )
                          );
                        } else {
                          setWaVariables([]);
                        }
                      }}
                      className="w-full rounded-lg border bg-gray-800 p-3 text-white"
                    >
                      {/* TEXTO + abrir sesión (solo si lo eliges) */}
                      <option value="">
                        Texto + abrir sesión (automático)
                      </option>

                      {/* SOLO MENSAJE (sin plantilla) – DEFAULT */}
                      <option value={WA_TEXT_ONLY}>
                        Solo mensaje (sin plantilla)
                      </option>

                      {/* PLANTILLAS REALES */}
                      {waTemplates.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.label} {t.status ? `(${t.status})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {waSelectedTemplate &&
                  waSelectedTemplate !== WA_TEXT_ONLY &&
                  waVariables.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {waVariables.map((v, idx) => (
                        <input
                          key={idx}
                          type="text"
                          className="w-full rounded-lg border bg-gray-800 p-2 text-white"
                          placeholder={`Valor para {{${idx + 1}}}`}
                          value={v}
                          onChange={(e) =>
                            setWaVariables((prev) =>
                              prev.map((val, i) =>
                                i === idx ? e.target.value : val
                              )
                            )
                          }
                        />
                      ))}
                    </div>
                  )}

                {waSelectedTemplate &&
                  waSelectedTemplate !== WA_TEXT_ONLY &&
                  selectedWaTemplate && (
                    <div className="mb-4 overflow-hidden rounded-xl border border-gray-700">
                      {/* Header estilo WhatsApp */}
                      <div className="flex items-center gap-3 bg-[#202C33] px-3 py-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00a884]/30 text-xs text-[#00a884]">
                          WA
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">
                            Contacto
                          </div>
                          <div className="text-xs text-gray-300">en línea</div>
                        </div>
                        <div className="text-xl text-gray-300">⋮</div>
                      </div>

                      {/* Área de chat */}
                      <div className="bg-[#0B141A] p-3">
                        {/* Burbuja de mensaje (emisor) */}
                        <div
                          className="ml-auto max-w-[85%] rounded-lg bg-[#005C4B] px-3 py-2 text-[14px] text-white shadow"
                          style={{ borderTopRightRadius: 4 }}
                        >
                          <div className="break-words whitespace-pre-wrap">
                            {selectedWaTemplate.body.replace(
                              /\{\{(\d+)\}\}/g,
                              (_match: string, n: string) => {
                                const i = Number(n) - 1;
                                return waVariables[i] ?? `{{${n}}}`;
                              }
                            )}
                          </div>
                          <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-gray-200/80">
                            <span>
                              {new Date().toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span>✓✓</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                <div className="mb-3">
                  <label className="mb-1 block text-sm">
                    Código de país para WhatsApp
                  </label>
                  <select
                    value={codigoPais}
                    onChange={(e) => setCodigoPais(e.target.value)}
                    className="w-full rounded-lg border bg-gray-800 p-3 text-white"
                  >
                    <option value="+57">🇨🇴 Colombia (+57)</option>
                    <option value="+52">🇲🇽 México (+52)</option>
                    <option value="+1">🇺🇸 USA (+1)</option>
                    <option value="+34">🇪🇸 España (+34)</option>
                    <option value="+51">🇵🇪 Perú (+51)</option>
                    <option value="+54">🇦🇷 Argentina (+54)</option>
                    <option value="+55">🇧🇷 Brasil (+55)</option>
                    <option value="+593">🇪🇨 Ecuador (+593)</option>
                    <option value="+506">🇨🇷 Costa Rica (+506)</option>
                    <option value="+58">🇻🇪 Venezuela (+58)</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Números locales separados por coma, ej: 3001234567,3012345678"
                  value={numerosLocales}
                  onChange={(e) => {
                    console.log('[WA][input] numerosLocales change →', e.target.value);
                    setNumerosLocales(e.target.value);
                  }}
                  className="mb-4 w-full rounded-lg border bg-gray-800 p-3 text-white"
                />

              </>
            )}

            <div className="mt-4 flex justify-center">
              <button
                onClick={sendEmail}
                className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={loadingEmail}
              >
                {loadingEmail ? <Loader2 className="text-white" /> : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
