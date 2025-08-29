'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';

import { saveAs } from 'file-saver';
import { Loader2, Mail, UserPlus, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { z } from 'zod';

import { InfoDialog } from '~/app/dashboard/super-admin/components/InfoDialog';

const studentSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  country: z.string().nullable(),
  city: z.string().nullable(),
  birthDate: z.string().nullable(),
  subscriptionStatus: z.string(),
  subscriptionEndDate: z.string().nullable(),
  role: z.string().optional(),
  planType: z.string().nullable().optional(),
  programTitle: z.string().nullish(),
  programTitles: z.array(z.string()).optional(),
  courseTitle: z.string().nullish(),
  courseTitles: z.array(z.string()).optional(),
  nivelNombre: z.string().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
  customFields: z.record(z.string(), z.string()).optional(),

  // ➕ NUEVOS CAMPOS DEL BACKEND
  isNew: z.boolean().optional(),
  isSubOnly: z.boolean().optional(),
  enrolledInCourse: z.boolean().optional(),
  inscripcionOrigen: z.enum(['formulario', 'artiefy']).optional(),
  carteraStatus: z.enum(['activo', 'inactivo']).optional(),
});

const courseSchema = z.object({
  id: z.string(),
  title: z.string(),
});

// después
const enrolledUserSchema = z.object({
  id: z.string(),
  programTitle: z.string().nullish(), // acepta null o undefined
});

const errorResponseSchema = z.object({
  error: z.string(),
});

const apiResponseSchema = z.object({
  students: z.array(studentSchema),
  courses: z.array(courseSchema),
  enrolledUsers: z.array(enrolledUserSchema),
});

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  city?: string | null;
  birthDate?: string | null;
  subscriptionStatus: string;
  subscriptionEndDate: string | null;
  role?: string;
  planType?: string;
  programTitle?: string;
  programTitles?: string[];
  nivelNombre?: string | null;
  purchaseDate?: string | null;
  customFields?: Record<string, string>;

  // ➕ nuevos
  isNew?: boolean;
  isSubOnly?: boolean;
  enrolledInCourse?: boolean;
  enrolledInCourseLabel?: 'Sí' | 'No';
  inscripcionOrigen?: 'formulario' | 'artiefy';
  carteraStatus?: 'activo' | 'inactivo';

  // ➕ CAMPOS PARA CARTERA Y PAGOS
  document?: string;
  modalidad?: string;
  inscripcionValor?: number;
  paymentMethod?: string;
  cuota1Fecha?: string;
  cuota1Metodo?: string;
  cuota1Valor?: number;
  valorPrograma?: number;
}

interface CreateUserResponse {
  user: {
    id: string;
    username: string;
  };
  generatedPassword: string;
}

interface Course {
  id: string;
  title: string;
}

interface ProgramsResponse {
  programs: { id: string; title: string }[];
}

interface UserProgramsResponse {
  programs: { id: string; title: string }[];
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  selected?: boolean;
  isNew?: boolean;
  permissions?: string[]; // 👈 AGREGA ESTO
  subscriptionEndDate?: string | null;
}

type ColumnType = 'text' | 'date' | 'select';

interface Column {
  id: string;
  label: string;
  defaultVisible: boolean;
  type: ColumnType;
  options?: string[];
}

const allColumns: Column[] = [
  { id: 'name', label: 'Nombre', defaultVisible: true, type: 'text' },
  { id: 'email', label: 'Correo', defaultVisible: true, type: 'text' },
  { id: 'phone', label: 'Teléfono', defaultVisible: false, type: 'text' },
  { id: 'address', label: 'Dirección', defaultVisible: false, type: 'text' },
  { id: 'country', label: 'País', defaultVisible: false, type: 'text' },
  { id: 'city', label: 'Ciudad', defaultVisible: false, type: 'text' },
  {
    id: 'birthDate',
    label: 'Fecha de nacimiento',
    defaultVisible: false,
    type: 'date',
  },
  {
    id: 'subscriptionStatus',
    label: 'Estado',
    defaultVisible: true,
    type: 'select',
    options: ['active', 'inactive'],
  },
  {
    id: 'purchaseDate',
    label: 'Fecha de compra',
    defaultVisible: true,
    type: 'date',
  },

  {
    id: 'subscriptionEndDate',
    label: 'Fin Suscripción',
    defaultVisible: true,
    type: 'date',
  },
  {
    id: 'carteraStatus',
    label: 'Cartera',
    defaultVisible: true,
    type: 'select',
    options: ['activo', 'inactivo'], // solo para filtrar
  },
  {
    id: 'inscripcionOrigen',
    label: 'Origen',
    defaultVisible: true,
    type: 'select',
    options: ['formulario', 'artiefy'],
  },
  {
    id: 'programTitle',
    label: 'Programa',
    defaultVisible: true,
    type: 'select', // sin options aquí
  },
  {
    id: 'courseTitle',
    label: 'Último curso',
    defaultVisible: true,
    type: 'select',
  },
  {
    id: 'nivelNombre',
    label: 'Nivel de educación',
    defaultVisible: false,
    type: 'text',
  },
  {
    id: 'role',
    label: 'Rol',
    defaultVisible: false,
    type: 'select', // ✅ CAMBIA a 'select'
    options: ['estudiante', 'educador', 'admin', 'super-admin'], // ✅ AÑADE opciones
  },
  {
    id: 'planType',
    label: 'Plan',
    defaultVisible: false,
    type: 'select', // ✅ CAMBIA a 'select'
    options: ['none', 'Pro', 'Premium', 'Enterprise'], // ✅ AÑADE opciones
  },

  // ➕ NUEVA COLUMNA
  {
    id: 'enrolledInCourseLabel',
    label: '¿En curso?',
    defaultVisible: true,
    type: 'select',
    options: ['Sí', 'No'],
  },

  {
    id: 'nivelNombre',
    label: 'Nivel de educación',
    defaultVisible: false,
    type: 'text',
  },
];

// Helper function for safe string conversion
function safeToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return value.toString();
  return JSON.stringify(value);
}

// comprueba si un objeto tiene { error: string }
function isErrorResponse(x: unknown): x is { error: string } {
  return (
    typeof x === 'object' &&
    x !== null &&
    'error' in x &&
    typeof (x as Record<string, unknown>).error === 'string'
  );
}

export default function EnrolledUsersPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [dynamicColumns, setDynamicColumns] = useState<Column[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [codigoPais, setCodigoPais] = useState('+57');
  const [manualPhones, setManualPhones] = useState<string[]>([]);
  const [manualEmails, setManualEmails] = useState<string[]>([]);
  const [newManualPhone, setNewManualPhone] = useState('');
  const [newManualEmail, setNewManualEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  void setCodigoPais;

  const [filters, setFilters] = useState({
    name: '',
    email: '',
    subscriptionStatus: '',
    purchaseDateFrom: '',
    purchaseDateTo: '',
  });

  function formatCOP(n = 0) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(n || 0);
  }

  const [limit] = useState(10);
  const [filteredCourseResults, setFilteredCourseResults] = useState<Course[]>(
    []
  );
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    allColumns.filter((c) => c.defaultVisible).map((c) => c.id)
  );
  const [users, setUsers] = useState<User[]>([]);

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [programs, setPrograms] = useState<{ id: string; title: string }[]>([]);
  const [userPrograms, setUserPrograms] = useState<
    { id: string; title: string }[]
  >([]);
  const [showUserProgramsModal, setShowUserProgramsModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // Dentro de EnrolledUsersPage, antes del return:
  const currentUser = currentUserId
    ? students.find((s) => s.id === currentUserId)
    : undefined;
  const [userCourses, setUserCourses] = useState<
    { id: string; title: string }[]
  >([]);
  const [showUserCoursesModal, setShowUserCoursesModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'estudiante',
  });
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  void notification;
  const [creatingUser, setCreatingUser] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoDialogTitle, setInfoDialogTitle] = useState('');
  const [infoDialogMessage, setInfoDialogMessage] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [showMassiveEditModal, setShowMassiveEditModal] = useState(false);
  const [massiveEditFields, setMassiveEditFields] = useState<
    Record<string, string>
  >({});
  const [selectedMassiveFields, setSelectedMassiveFields] = useState<string[]>(
    []
  );
  // Tipos fuertes para pagos/cartera
  interface Pago {
    concepto?: string | null;
    nro_pago?: string | number | null;
    nroPago?: string | number | null;
    fecha?: string | number | Date | null;
    metodo?: string | null;
    valor?: string | number | null;
  }

  interface CarteraInfo {
    programaPrice: number;
    pagosUsuarioPrograma: Pago[];
    totalPagado: number;
    deuda: number;
    carnetPolizaUniforme?: number; // monto detectado
    derechosGrado?: number; // monto detectado
  }

  const [carteraInfo, setCarteraInfo] = useState<CarteraInfo | null>(null);

  async function fetchUserCourses(userId: string) {
    const res = await fetch(
      `/api/super-admin/enroll_user_program/coursesUser?userId=${userId}`
    );
    if (!res.ok) throw new Error('Error cargando cursos');
    const data = (await res.json()) as {
      courses: { id: string; title: string }[];
    };
    // des-duplicar
    const unique = Array.from(
      new Map(data.courses.map((c) => [c.id, c])).values()
    );
    setUserCourses(unique);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        showColumnSelector &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowColumnSelector(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnSelector]);

  async function fetchPagosUsuarioPrograma(userId: string, programId: string) {
    const url = `/api/super-admin/enroll_user_program/programsUser/pagos?userId=${userId}&programId=${programId}`;
    console.log('➡️ GET Pagos:', url);

    const res = await fetch(url);
    if (!res.ok) throw new Error('Error cargando pagos');

    const json: unknown = await res.json();
    const pagos: Pago[] = Array.isArray((json as { pagos?: unknown }).pagos)
      ? ((json as { pagos?: unknown }).pagos as unknown[]).map((p) => {
          const r = p as Record<string, unknown>;
          return {
            concepto: typeof r.concepto === 'string' ? r.concepto : null,
            nro_pago:
              typeof r.nro_pago === 'string' || typeof r.nro_pago === 'number'
                ? r.nro_pago
                : null,
            nroPago:
              typeof r.nroPago === 'string' || typeof r.nroPago === 'number'
                ? r.nroPago
                : null,
            fecha:
              typeof r.fecha === 'string' ||
              typeof r.fecha === 'number' ||
              r.fecha instanceof Date
                ? (r.fecha as string | number | Date)
                : null,
            metodo: typeof r.metodo === 'string' ? r.metodo : null,
            valor:
              typeof r.valor === 'string' || typeof r.valor === 'number'
                ? r.valor
                : null,
          } satisfies Pago;
        })
      : [];

    console.log('✅ Pagos recibidos:', pagos.length);
    return pagos;
  }

  useEffect(() => {
    // función asíncrona para cargar programasp
    const loadPrograms = async () => {
      try {
        const res = await fetch(
          '/api/super-admin/enroll_user_program/programsFilter'
        );
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        const json = (await res.json()) as ProgramsResponse;
        setPrograms(json.programs);
      } catch (err) {
        console.error('No se pudieron cargar los programas:', err);
      }
    };

    // evitamos "floating promise"
    void loadPrograms();
  }, []);

  const columnsWithOptions = useMemo<Column[]>(() => {
    const programOptions = ['No inscrito', ...programs.map((p) => p.title)];
    const courseOptions = [
      'Sin curso',
      ...availableCourses.map((c) => c.title),
    ];

    return allColumns.map((col) => {
      if (col.id === 'programTitle') {
        return { ...col, options: programOptions };
      }
      if (col.id === 'courseTitle') {
        return { ...col, options: courseOptions };
      }
      return col;
    });
  }, [programs, availableCourses]);

  const sendEmail = async () => {
    console.log('📩 Enviando correo...');
    if (
      !subject ||
      !message ||
      ([
        ...students
          .filter((s) => selectedStudents.includes(s.id))
          .map((s) => s.email),
        ...manualEmails,
      ].length === 0 &&
        [
          ...students
            .filter((s) => selectedStudents.includes(s.id) && s.phone)
            .map((s) => `${codigoPais}${s.phone}`),
          ...manualPhones,
        ].length === 0 &&
        !sendWhatsapp)
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
        ...students
          .filter((s) => selectedStudents.includes(s.id))
          .map((s) => s.email),
        ...manualEmails,
      ])
    );

    const whatsappNumbers = sendWhatsapp
      ? Array.from(
          new Set([
            ...students
              .filter((s) => selectedStudents.includes(s.id) && s.phone)
              .map((s) => `${codigoPais}${s.phone}`),
            ...manualPhones.map((p) => `${codigoPais}${p}`),
          ])
        )
      : [];

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

      if (!response.ok) throw new Error('Error al enviar el correo');

      // Enviar whatsapp
      if (sendWhatsapp) {
        for (const number of whatsappNumbers) {
          console.log('📲 Enviando WhatsApp a:', number);

          await fetch('/api/super-admin/whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: number,
              message: `${subject}\n\n${message.replace(/<[^>]+>/g, '')}`,
            }),
          });
        }
      }

      console.log('✅ Mensajes enviados con éxito');
      setNotification({
        message: 'Correo y/o WhatsApp enviados correctamente',
        type: 'success',
      });

      setSubject('');
      setMessage('');
      setAttachments([]);
      setManualPhones([]);
      setManualEmails([]);
      setShowPhoneModal(false);
    } catch (err) {
      console.error('❌ Error al enviar:', err);
      setNotification({ message: 'Error al enviar', type: 'error' });
    } finally {
      setLoadingEmail(false);
    }
  };

  const totalColumns: Column[] = [...columnsWithOptions, ...dynamicColumns];
  const [successMessage, setSuccessMessage] = useState('');
  void successMessage;
  const [searchFieldTerm, setSearchFieldTerm] = useState('');
  const filteredColumns = totalColumns.filter((col) =>
    col.label.toLowerCase().includes(searchFieldTerm.toLowerCase())
  );
  const [showCarteraModal, setShowCarteraModal] = useState(false);
  const [carteraUserId, setCarteraUserId] = useState<string | null>(null);
  const [carteraReceipt, setCarteraReceipt] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCarteraModal = async (userId: string) => {
    try {
      setCurrentUserId(userId);

      // Carga ambos; pero toma los programas del retorno (no del state)
      const [progs] = await Promise.all([
        fetchUserPrograms(userId), // 👈 ahora retorna el array
        fetchUserCourses(userId), // no lo usamos aquí, pero lo mantenemos
      ]);

      setCarteraUserId(userId);

      // Elige el programa: intenta el que coincide con la fila, sino el primero
      const preferTitle = students.find((s) => s.id === userId)?.programTitle;
      const chosen = progs?.find((p) => p.title === preferTitle) ?? progs?.[0];

      const programId = chosen?.id;
      if (!programId) {
        // Sin programa: deja el modal con tabla vacía
        setCarteraInfo({
          programaPrice: 0,
          pagosUsuarioPrograma: [],
          totalPagado: 0,
          deuda: 0,
        });
        setShowCarteraModal(true);
        return;
      }

      // 1) Precio del programa (tu endpoint actual)
      interface ProgramPriceResponse {
        programaPrice?: number | null;
      }

      const priceRes = await fetch(
        `/api/super-admin/enroll_user_program?userId=${userId}&programId=${programId}`
      );
      let programaPrice = 0;
      if (priceRes.ok) {
        const priceJson = (await priceRes.json()) as ProgramPriceResponse;
        programaPrice = Number(priceJson.programaPrice ?? 0);
      }

      // 2) Pagos del usuario en ese programa (nuevo endpoint)
      const pagosUsuarioPrograma = await fetchPagosUsuarioPrograma(
        userId,
        programId
      );

      // Detectar montos por concepto
      const toNumber = (v: unknown) =>
        typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;

      const findMonto = (regex: RegExp) => {
        const pago = pagosUsuarioPrograma.find((p) =>
          (p.concepto ?? '').toLowerCase().match(regex)
        );
        return toNumber(pago?.valor);
      };

      // Busca conceptos (ajusta si tus nombres varían)
      const carnetPolizaUniforme = findMonto(/carnet|p[oó]liza|uniforme/);
      const derechosGrado = findMonto(/derechos?\s+de\s+grado/);

      // 3) Totales y deuda
      const totalPagado = pagosUsuarioPrograma.reduce(
        (sum: number, p: Pago) => {
          const v =
            typeof p.valor === 'string'
              ? Number(p.valor)
              : typeof p.valor === 'number'
                ? p.valor
                : 0;
          return sum + (Number.isFinite(v) ? v : 0);
        },
        0
      );

      const deuda = Math.max(Number(programaPrice ?? 0) - totalPagado, 0);

      setCarteraInfo({
        programaPrice,
        pagosUsuarioPrograma,
        totalPagado,
        deuda,
        carnetPolizaUniforme,
        derechosGrado,
      });

      setShowCarteraModal(true);
    } catch (e) {
      console.error('openCarteraModal error:', e);
      alert('No se pudieron cargar los pagos.');
    }
  };

  const markCarteraActivo = async () => {
    if (!carteraUserId) return;
    const res = await fetch('/api/super-admin/enroll_user_program', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateCartera',
        userId: carteraUserId,
        status: 'activo',
      }),
    });
    if (res.ok) {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === carteraUserId ? { ...s, carteraStatus: 'activo' } : s
        )
      );
      setShowCarteraModal(false);
    } else {
      alert('No se pudo actualizar el estado.');
    }
  };

  const uploadCarteraReceipt = async () => {
    if (!carteraUserId || !carteraReceipt) return;

    try {
      const fd = new FormData();
      fd.append('action', 'uploadCarteraReceipt');
      fd.append('userId', carteraUserId);
      // 👇 añade el nombre para evitar que llegue sin filename
      fd.append('receipt', carteraReceipt, carteraReceipt.name);

      const res = await fetch('/api/super-admin/enroll_user_program', {
        method: 'POST',
        body: fd,
      });

      const data: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('Upload error:', data);
        const msg = isErrorResponse(data)
          ? data.error
          : 'Error subiendo comprobante.';
        alert(msg);
        return;
      }

      // éxito: pónlo en ACTIVO y cierra modal
      setStudents((prev) =>
        prev.map((s) =>
          s.id === carteraUserId ? { ...s, carteraStatus: 'activo' } : s
        )
      );
      setCarteraReceipt(null);
      setShowCarteraModal(false);
      alert('Comprobante subido y estado marcado como ACTIVO.');
      // dentro de uploadCarteraReceipt()
    } catch (e: unknown) {
      console.error('Network/JS error:', e);
      const msg =
        e instanceof Error ? e.message : 'Error de red al subir comprobante';
      alert(msg);
    }
  };

  // Save visible columns to localStorage
  useEffect(() => {
    localStorage.setItem('visibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/super-admin/enroll_user_program');
      const json: unknown = await res.json();
      const data = apiResponseSchema.parse(json);

      // ⚠️ programTitle puede venir null: sácalos del Map
      const enrolledMap = new Map<string, string>(
        data.enrolledUsers
          .filter((u) => !!u.programTitle)
          .map((u) => [u.id, u.programTitle!])
      );

      const studentsFilteredByRole = data.students
        .filter((s) => s.role === 'estudiante')
        .map((s) => {
          // 1) ¿Tiene suscripción activa pero sin ninguna matrícula? => NOW
          const showNOW = !!s.isSubOnly;

          // 2) ¿Está en algún curso? (para la nueva columna)
          const enrolledInCourseLabel: 'Sí' | 'No' = s.enrolledInCourse
            ? 'Sí'
            : 'No';

          // 3) Etiqueta NEW en el nombre (si aplica)
          const displayName = s.isNew ? `${s.name} (NEW)` : s.name;
          const computedByDate =
            s.subscriptionEndDate &&
            new Date(s.subscriptionEndDate) >= new Date()
              ? 'activo' // al día
              : 'inactivo'; // en cartera

          return {
            ...s,
            name: displayName,
            programTitle: showNOW
              ? 'NOW'
              : (enrolledMap.get(s.id) ?? 'No inscrito'),
            courseTitle: showNOW ? 'NOW' : (s.courseTitle ?? 'Sin curso'),
            enrolledInCourseLabel,
            nivelNombre: s.nivelNombre ?? 'No definido',
            planType: s.planType ?? undefined,
            customFields: s.customFields
              ? Object.fromEntries(
                  Object.entries(s.customFields).map(([k, v]) => [k, String(v)])
                )
              : undefined,
            inscripcionOrigen: s.inscripcionOrigen ?? 'artiefy',
            carteraStatus: s.carteraStatus ?? computedByDate, // 👈 añade esto
          };
        });

      setStudents(studentsFilteredByRole);
      setAvailableCourses(data.courses);

      // NUEVO: detectar las claves de los campos personalizados
      const allCustomKeys = new Set<string>();
      studentsFilteredByRole.forEach((student) => {
        if (student.customFields) {
          Object.keys(student.customFields).forEach((key) =>
            allCustomKeys.add(key)
          );
        }
      });

      // Generar dinámicamente las columnas de customFields
      const dynamicCustomColumns = Array.from(allCustomKeys).map((key) => ({
        id: `customFields.${key}`,
        label: key,
        defaultVisible: true,
        type: 'text' as ColumnType,
      }));

      // Agregamos al state las columnas dinámicas
      setDynamicColumns(dynamicCustomColumns);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };
  async function fetchUserPrograms(userId: string) {
    const res = await fetch(
      `/api/super-admin/enroll_user_program/programsUser?userId=${userId}`
    );
    if (!res.ok) throw new Error('Error cargando programas');

    const data = (await res.json()) as UserProgramsResponse;
    setUserPrograms(data.programs); // deja el state como antes
    return data.programs; // 👈 DEVUELVE el array para usarlo al instante
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

  const downloadSelectedAsExcel = () => {
    const selectedData = students.filter((s) =>
      selectedStudents.includes(s.id)
    );

    if (selectedData.length === 0) {
      alert('No hay estudiantes seleccionados.');
      return;
    }

    // Crea filas with las columnas visibles
    const rows = selectedData.map((student) => {
      const row: Record<string, string> = {};
      visibleColumns.forEach((colId) => {
        const value = student[colId as keyof Student];
        const safeValue = safeToString(value);
        row[allColumns.find((c) => c.id === colId)?.label ?? colId] = safeValue;
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes');

    const excelBuffer = XLSX.write(workbook, {
      type: 'array',
      bookType: 'xlsx',
    }) as ArrayBuffer;

    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    saveAs(blob, 'estudiantes_seleccionados.xlsx');
  };

  const getFilteredSortedStudents = () => {
    return (
      [...students]
        // Filtro por programa seleccionado
        .filter((student) =>
          selectedProgram
            ? student.programTitles?.includes(selectedProgram)
            : true
        )

        // Filtros por columnas dinámicas (incluye customFields)
        .filter((student) =>
          Object.entries(columnFilters).every(([key, value]) => {
            if (!value) return true;

            const studentValue = key.startsWith('customFields.')
              ? student.customFields?.[key.split('.')[1]]
              : student[key as keyof Student];

            if (!studentValue) return false;

            if (key === 'subscriptionEndDate') {
              const dateStr = safeToString(studentValue);
              return new Date(dateStr).toISOString().split('T')[0] === value;
            }

            const safeStudentValue = safeToString(studentValue);
            return safeStudentValue.toLowerCase().includes(value.toLowerCase());
          })
        )

        // Filtros generales (nombre, email, estado, fechas)
        .filter((s) =>
          filters.name
            ? s.name.toLowerCase().includes(filters.name.toLowerCase())
            : true
        )
        .filter((s) =>
          filters.email
            ? s.email.toLowerCase().includes(filters.email.toLowerCase())
            : true
        )
        .filter((s) =>
          filters.subscriptionStatus
            ? s.subscriptionStatus === filters.subscriptionStatus
            : true
        )
        .filter((s) =>
          filters.purchaseDateFrom
            ? (s.purchaseDate ? s.purchaseDate.split('T')[0] : '') >=
              filters.purchaseDateFrom
            : true
        )
        .filter((s) =>
          filters.purchaseDateTo
            ? (s.purchaseDate ? s.purchaseDate.split('T')[0] : '') <=
              filters.purchaseDateTo
            : true
        )

        // Ordenar activos primero
        .sort((a, b) => {
          if (
            a.subscriptionStatus === 'active' &&
            b.subscriptionStatus !== 'active'
          )
            return -1;
          if (
            a.subscriptionStatus !== 'active' &&
            b.subscriptionStatus === 'active'
          )
            return 1;
          return 0;
        })
    );
  };

  const sortedStudents = getFilteredSortedStudents();
  // — Hooks para infinite scroll
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Estudiantes a mostrar según página actual
  const displayedStudents = sortedStudents.slice(0, currentPage * limit);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (
      scrollTop + clientHeight >= scrollHeight - 20 &&
      !loadingMore &&
      displayedStudents.length < sortedStudents.length
    ) {
      setLoadingMore(true);
      setTimeout(() => {
        setCurrentPage((p) => p + 1);
        setLoadingMore(false);
      }, 300);
    }
  };

  function CustomFieldForm({ selectedUserId }: { selectedUserId: string }) {
    const [fieldKey, setFieldKey] = useState('');
    const [fieldValue, setFieldValue] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          '/api/super-admin/enroll_user_program/newTable',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: selectedUserId,
              fieldKey,
              fieldValue,
            }),
          }
        );

        if (res.ok) {
          alert('Campo personalizado agregado');
          setFieldKey('');
          setFieldValue('');
        } else {
          const json: unknown = await res.json();
          const errorData = errorResponseSchema.parse(json);
          alert('Error: ' + errorData.error);
        }
      } catch (err) {
        console.error(err);
        alert('Error inesperado');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Clave"
          value={fieldKey}
          onChange={(e) => setFieldKey(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-800 p-2 transition focus:ring-2 focus:ring-blue-500 focus:outline-none sm:flex-1"
        />
        <input
          type="text"
          placeholder="Valor"
          value={fieldValue}
          onChange={(e) => setFieldValue(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-800 p-2 transition focus:ring-2 focus:ring-blue-500 focus:outline-none sm:flex-1"
        />
        <button
          disabled={loading || !fieldKey || !fieldValue}
          onClick={handleSubmit}
          className="w-full rounded bg-blue-600 px-4 py-2 font-semibold transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
        >
          {loading ? 'Guardando...' : 'Agregar'}
        </button>
      </div>
    );
  }

  const handleEnroll = async () => {
    try {
      const response = await fetch('/api/super-admin/enroll_user_program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedStudents,
          courseIds: selectedCourses,
        }),
      });

      const json: unknown = await response.json();

      if (response.ok) {
        alert('Estudiantes matriculados exitosamente');
        setSelectedStudents([]);
        setSelectedCourses([]);
        setShowModal(false);
      } else {
        const errorData = errorResponseSchema.parse(json);
        alert(`Error: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error al matricular:', err);
      alert('Error inesperado al matricular estudiantes');
    }
  };

  const updateStudentField = async (
    userId: string,
    field: string,
    value: string
  ) => {
    const student = students.find((s) => s.id === userId);
    if (!student) return;

    const updatedStudent = { ...student };

    if (field.startsWith('customFields.')) {
      const key = field.split('.')[1];
      updatedStudent.customFields = {
        ...updatedStudent.customFields,
        [key]: value,
      };
    } else {
      if (field in updatedStudent) {
        (updatedStudent as Record<string, unknown>)[field] = value;
      }
    }

    const [firstName, ...lastNameParts] = updatedStudent.name.split(' ');
    const lastName = lastNameParts.join(' ');

    const payload: Record<string, unknown> = {
      userId: updatedStudent.id,
      firstName: firstName || '',
      lastName,
      role: updatedStudent.role ?? 'estudiante',
      status: updatedStudent.subscriptionStatus,
      permissions: [],
      phone: updatedStudent.phone,
      address: updatedStudent.address,
      city: updatedStudent.city,
      country: updatedStudent.country,
      birthDate: updatedStudent.birthDate,
      planType: updatedStudent.planType,
      purchaseDate: updatedStudent.purchaseDate,
      subscriptionEndDate: updatedStudent.subscriptionEndDate
        ? new Date(updatedStudent.subscriptionEndDate)
            .toISOString()
            .split('T')[0]
        : null,
      customFields: updatedStudent.customFields ?? {},
    };

    if (field === 'programTitle') {
      const prog = programs.find((p) => p.title === value);
      if (prog) payload.programId = Number(prog.id);
    }

    // 5. Si cambió de curso, añadimos courseId
    if (field === 'courseTitle') {
      const curso = availableCourses.find((c) => c.title === value);
      if (curso) payload.courseId = Number(curso.id);
    }

    const res = await fetch('/api/super-admin/udateUser/updateUserDinamic', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data: unknown = await res.json();
      if (!res.ok) {
        const errorData = errorResponseSchema.parse(data);
        alert(`❌ Error al guardar: ${errorData.error}`);
      }
    } else {
      setStudents((prev) =>
        prev.map((s) => (s.id === userId ? updatedStudent : s))
      );
      setSuccessMessage(`✅ Campo "${field}" guardado correctamente`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const updateStudentsMassiveField = async (fields: Record<string, string>) => {
    const payload: {
      userIds: string[];
      fields: Record<string, unknown>;
    } = {
      userIds: selectedStudents,
      fields: {},
    };

    for (const [field, value] of Object.entries(fields)) {
      if (!value) continue;

      if (field === 'programTitle') {
        const prog = programs.find((p) => p.title === value);
        if (prog) {
          payload.fields.programId = Number(prog.id);
        } else {
          payload.fields[field] = value;
        }
      } else if (field === 'courseTitle') {
        const curso = availableCourses.find((c) => c.title === value);
        if (curso) {
          payload.fields.courseId = Number(curso.id);
        } else {
          payload.fields[field] = value;
        }
      } else {
        payload.fields[field] = value;
      }
    }

    try {
      const res = await fetch('/api/super-admin/udateUser/updateMassive', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data: unknown = await res.json();
        const errorData = errorResponseSchema.parse(data);
        alert(`❌ Error masivo: ${errorData.error}`);
      } else {
        await fetchData();
        setShowMassiveEditModal(false);
        setSuccessMessage(
          `✅ Cambios aplicados a ${selectedStudents.length} usuarios`
        );
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('❌ Error inesperado:', err);
      alert('❌ Error inesperado al actualizar masivamente');
    }
  };

  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        showColumnSelector &&
        headerRef.current &&
        !headerRef.current.contains(e.target as Node)
      ) {
        setShowColumnSelector(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnSelector]);

  return (
    <>
      {/* Este InfoDialog SÍ quedará “montado” y React lo mostrará cuando isOpen===true */}
      <InfoDialog
        isOpen={infoDialogOpen}
        title={infoDialogTitle}
        message={infoDialogMessage}
        onClose={() => setInfoDialogOpen(false)}
      />
      <div className="min-h-screen space-y-8 bg-gray-900 p-6 text-white">
        <div
          ref={headerRef}
          className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
        >
          <h1 className="text-2xl font-bold">Matricular Estudiantes</h1>

          <div className="relative w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPhoneModal(true)}
                className="group/button bg-background text-primary hover:bg-primary/10 relative inline-flex items-center gap-1 overflow-hidden rounded-md border border-white/20 px-2 py-1.5 text-xs transition sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
              >
                <span className="relative z-10 font-medium">
                  Enviar correo y/o whatsapp
                </span>
                <Mail className="relative z-10 size-3.5 sm:size-4" />
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
              </button>

              <button
                onClick={() => setShowCreateForm(true)}
                className="group/button bg-background text-primary hover:bg-primary/10 relative inline-flex items-center gap-1 overflow-hidden rounded-md border border-white/20 px-2 py-1.5 text-xs transition sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
              >
                <span className="relative z-10 font-medium">Crear Usuario</span>
                <UserPlus className="relative z-10 size-3.5 sm:size-4" />
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
              </button>

              <button
                onClick={() => setShowColumnSelector((v) => !v)}
                className="rounded-md bg-gray-700 px-4 py-2 text-white transition hover:bg-gray-600"
              >
                ⚙️ Columnas
              </button>
            </div>

            {showColumnSelector && (
              <div className="absolute right-0 z-50 mt-2 max-h-60 w-full max-w-xs overflow-y-auto rounded-md bg-gray-800 p-4 shadow-lg sm:w-64">
                <h3 className="mb-2 font-semibold text-white">
                  Mostrar columnas
                </h3>
                <div className="space-y-2">
                  {totalColumns.map((col) => (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 text-white"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(col.id)}
                        onChange={() =>
                          setVisibleColumns((prev) =>
                            prev.includes(col.id)
                              ? prev.filter((id) => id !== col.id)
                              : [...prev, col.id]
                          )
                        }
                        className="h-4 w-4 rounded border-gray-400 bg-gray-700"
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <input
            type="text"
            placeholder="Nombre"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            className="rounded border border-gray-700 bg-gray-800 p-2"
          />
          <input
            type="email"
            placeholder="Correo"
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
            className="rounded border border-gray-700 bg-gray-800 p-2"
          />
          <select
            value={filters.subscriptionStatus}
            onChange={(e) =>
              setFilters({ ...filters, subscriptionStatus: e.target.value })
            }
            className="rounded border border-gray-700 bg-gray-800 p-2"
          >
            <option value="">Estado</option>
            <option value="active">Activa</option>
            <option value="inactive">Inactiva</option>
          </select>
          <input
            type="date"
            value={filters.purchaseDateFrom}
            onChange={(e) =>
              setFilters({ ...filters, purchaseDateFrom: e.target.value })
            }
            className="rounded border border-gray-700 bg-gray-800 p-2"
          />

          <input
            type="date"
            value={filters.purchaseDateTo}
            onChange={(e) =>
              setFilters({ ...filters, purchaseDateTo: e.target.value })
            }
            className="rounded border border-gray-700 bg-gray-800 p-2"
          />

          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="rounded border border-gray-700 bg-gray-800 p-2"
          >
            <option value="">Todos los programas</option>
            {Array.from(
              new Set(students.flatMap((s) => s.programTitles ?? []))
            ).map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            Seleccionar Estudiantes
          </h2>
          <div
            className="max-h-[60vh] w-full overflow-auto rounded-lg border border-gray-700"
            onScroll={handleScroll}
          >
            <table className="w-full min-w-max table-auto border-collapse">
              {/* Cabecera fija */}
              <thead className="sticky top-0 z-10 bg-gray-900">
                <tr className="border-b border-gray-700 bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] text-xs text-white sm:text-sm">
                  <th className="w-12 px-4 py-2">
                    <input
                      type="checkbox"
                      checked={
                        displayedStudents.length > 0 &&
                        displayedStudents.every((s) =>
                          selectedStudents.includes(s.id)
                        )
                      }
                      onChange={(e) =>
                        setSelectedStudents(
                          e.target.checked
                            ? Array.from(
                                new Set([
                                  ...selectedStudents,
                                  ...displayedStudents.map((s) => s.id),
                                ])
                              )
                            : selectedStudents.filter(
                                (id) =>
                                  !displayedStudents.some((s) => s.id === id)
                              )
                        )
                      }
                      className="rounded border-white/20"
                    />
                  </th>
                  {totalColumns
                    .filter((col) => visibleColumns.includes(col.id))
                    .map((col) => (
                      <th
                        key={col.id}
                        className="px-4 py-2 text-left font-medium"
                      >
                        <div className="space-y-1">
                          <div className="truncate">{col.label}</div>
                          {col.type === 'select' ? (
                            <select
                              value={columnFilters[col.id] || ''}
                              onChange={(e) =>
                                setColumnFilters((prev) => ({
                                  ...prev,
                                  [col.id]: e.target.value,
                                }))
                              }
                              className="w-full rounded bg-gray-700 p-1 text-xs sm:text-sm"
                            >
                              <option value="">Todos</option>
                              {col.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={col.type}
                              value={columnFilters[col.id] || ''}
                              onChange={(e) =>
                                setColumnFilters((prev) => ({
                                  ...prev,
                                  [col.id]: e.target.value,
                                }))
                              }
                              placeholder={`Filtrar ${col.label.toLowerCase()}…`}
                              className="w-full rounded bg-gray-700 p-1 text-xs sm:text-sm"
                            />
                          )}
                        </div>
                      </th>
                    ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-700/50 text-xs sm:text-sm">
                {displayedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-700">
                    <td className="px-4 py-2 align-top">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() =>
                          setSelectedStudents((prev) =>
                            prev.includes(student.id)
                              ? prev.filter((id) => id !== student.id)
                              : [...prev, student.id]
                          )
                        }
                        className="rounded border-white/20"
                      />
                    </td>

                    {totalColumns
                      .filter((col) => visibleColumns.includes(col.id))
                      .map((col) => {
                        let raw = '';
                        if (col.id.startsWith('customFields.')) {
                          const key = col.id.split('.')[1];
                          raw = student.customFields?.[key] ?? '';
                        } else {
                          raw = safeToString(
                            student[col.id as keyof Student] ?? ''
                          );
                        }
                        if (col.type === 'date' && raw) {
                          const d = new Date(raw);
                          if (!isNaN(d.getTime()))
                            raw = d.toISOString().split('T')[0];
                        }
                        if (col.id === 'programTitle') {
                          return (
                            <td
                              key={col.id}
                              className="px-4 py-2 align-top whitespace-nowrap"
                            >
                              <select
                                defaultValue={raw}
                                onBlur={(e) =>
                                  updateStudentField(
                                    student.id,
                                    col.id,
                                    e.target.value
                                  )
                                }
                                className="min-w-[120px] rounded bg-gray-800 p-1 text-xs text-white sm:text-sm"
                              >
                                {col.options?.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => {
                                  setCurrentUserId(student.id);
                                  void fetchUserPrograms(student.id);
                                  setShowUserProgramsModal(true);
                                }}
                                className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                              >
                                Ver más
                              </button>
                            </td>
                          );
                        }

                        if (col.id === 'carteraStatus') {
                          const esAlDia = raw === 'activo'; // 'activo' = al día
                          const etiqueta = esAlDia ? 'Al día' : 'En cartera';

                          return (
                            <td
                              key={col.id}
                              className="px-4 py-2 align-top whitespace-nowrap"
                            >
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  esAlDia ? 'bg-green-600' : 'bg-red-600'
                                }`}
                                title={etiqueta}
                              >
                                {etiqueta}
                              </span>
                              <button
                                onClick={() => openCarteraModal(student.id)}
                                className="ml-2 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium hover:bg-indigo-700"
                              >
                                Ver más
                              </button>
                            </td>
                          );
                        }

                        // 2) columna Último curso
                        if (col.id === 'courseTitle') {
                          return (
                            <td
                              key={col.id}
                              className="px-4 py-2 align-top whitespace-nowrap"
                            >
                              <select
                                defaultValue={raw}
                                onBlur={(e) =>
                                  updateStudentField(
                                    student.id,
                                    col.id,
                                    e.target.value
                                  )
                                }
                                className="min-w-[120px] rounded bg-gray-800 p-1 text-xs text-white sm:text-sm"
                              >
                                {col.options?.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => {
                                  setCurrentUserId(student.id);
                                  void fetchUserCourses(student.id);
                                  setShowUserCoursesModal(true);
                                }}
                                className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                              >
                                Ver más
                              </button>
                            </td>
                          );
                        }

                        // Resto de columnas (select, date, text)
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-2 align-top break-words whitespace-normal"
                          >
                            {col.type === 'select' && col.options ? (
                              <select
                                defaultValue={raw}
                                onBlur={(e) =>
                                  updateStudentField(
                                    student.id,
                                    col.id,
                                    e.target.value
                                  )
                                }
                                className="w-full rounded bg-gray-800 p-1 text-xs text-white sm:text-sm"
                              >
                                {col.options.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : col.type === 'date' ? (
                              <input
                                type="date"
                                defaultValue={raw}
                                onBlur={(e) =>
                                  updateStudentField(
                                    student.id,
                                    col.id,
                                    e.target.value
                                  )
                                }
                                className="w-full rounded bg-gray-800 p-1 text-xs text-white sm:text-sm"
                              />
                            ) : (
                              <input
                                type="text"
                                defaultValue={raw}
                                onBlur={(e) =>
                                  updateStudentField(
                                    student.id,
                                    col.id,
                                    e.target.value
                                  )
                                }
                                className="w-full rounded bg-gray-800 p-1 text-xs text-white sm:text-sm"
                              />
                            )}
                          </td>
                        );
                      })}
                  </tr>
                ))}

                {loadingMore && (
                  <tr>
                    <td
                      colSpan={visibleColumns.length + 1}
                      className="py-4 text-center text-gray-400"
                    >
                      Cargando más…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación 

       <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
          className="rounded bg-gray-700 px-3 py-1 disabled:opacity-40"
        >
          Anterior
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
          .map((n, i, arr) => (
            <span key={n} className="px-1">
              {arr[i - 1] && n - arr[i - 1] > 1 && '...'}
              <button
                onClick={() => goToPage(n)}
                className={`rounded px-2 py-1 ${
                  page === n ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              >
                {n}
              </button>
            </span>
          ))}
        <input
          type="number"
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          placeholder="Ir a"
          className="w-20 rounded bg-gray-800 px-2 py-1 text-white"
        />
        <button
          onClick={() => {
            const n = parseInt(pageInput);
            if (!isNaN(n)) goToPage(n);
            setPageInput('');
          }}
          className="rounded bg-gray-700 px-2 py-1"
        >
          Ir
        </button>
      </div>
      
      
      */}

        <div className="mt-6">
          <h2 className="text-lg font-semibold">Añadir campo personalizado</h2>
          <CustomFieldForm selectedUserId={selectedStudents[0]} />
        </div>

        {/* Acciones */}
        <div className="mt-4 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
          <button
            disabled={selectedStudents.length === 0}
            onClick={() => {
              setSelectedCourses([]);
              setShowModal(true);
            }}
            className="w-full rounded bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50 sm:flex-1"
          >
            Matricular a curso
          </button>
          <button
            disabled={selectedStudents.length === 0}
            onClick={downloadSelectedAsExcel}
            className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 sm:flex-1"
          >
            Descargar seleccionados en Excel
          </button>
          <button
            disabled={selectedStudents.length === 0}
            onClick={() => setShowMassiveEditModal(true)}
            className="w-full rounded bg-yellow-600 px-4 py-2 font-semibold text-white transition hover:bg-yellow-700 disabled:opacity-50 sm:flex-1"
          >
            Editar masivamente
          </button>
        </div>

        {showUserProgramsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-xs rounded-lg bg-white p-6 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Programas de {currentUser?.name ?? 'Usuario'}
              </h3>
              <ul className="mb-4 max-h-64 space-y-2 overflow-y-auto">
                {userPrograms.length === 0 ? (
                  <li className="text-gray-500">
                    No inscrito en ningún programa
                  </li>
                ) : (
                  userPrograms.map((p) => (
                    <li key={p.id} className="text-gray-900 dark:text-gray-100">
                      • {p.title}
                    </li>
                  ))
                )}
              </ul>
              <button
                onClick={() => setShowUserProgramsModal(false)}
                className="w-full rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {showUserCoursesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-xs rounded-lg bg-white p-6 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Cursos de {currentUser?.name ?? 'Usuario'}
              </h3>
              <ul className="mb-4 max-h-64 space-y-2 overflow-y-auto">
                {userCourses.length === 0 ? (
                  <li className="text-gray-500">No inscrito en ningún curso</li>
                ) : (
                  userCourses.map((c) => (
                    <li key={c.id} className="text-gray-900 dark:text-gray-100">
                      • {c.title}
                    </li>
                  ))
                )}
              </ul>
              <button
                onClick={() => setShowUserCoursesModal(false)}
                className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

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
                {creatingUser ? (
                  <Loader2 className="size-5" />
                ) : (
                  'Crear Usuario'
                )}
              </button>
            </div>
          </div>
        )}
        {showPhoneModal && (
          <div className="bg-opacity-60 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="relative max-h-screen w-full max-w-2xl overflow-y-auto rounded-lg bg-gray-900 p-6 text-white shadow-2xl">
              <button
                onClick={() => setShowPhoneModal(false)}
                className="absolute top-4 right-4 text-white hover:text-red-500"
              >
                <X size={24} />
              </button>

              <h2 className="mb-6 text-center text-3xl font-bold">
                Enviar Correo y/o WhatsApp
              </h2>

              {/* Inputs manuales */}
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <input
                    type="text"
                    placeholder="Agregar teléfono manual"
                    value={newManualPhone}
                    onChange={(e) => setNewManualPhone(e.target.value)}
                    className="w-full rounded border bg-gray-800 p-2"
                  />
                  <button
                    onClick={() => {
                      if (newManualPhone.trim()) {
                        setManualPhones([
                          ...manualPhones,
                          newManualPhone.trim(),
                        ]);
                        setNewManualPhone('');
                      }
                    }}
                    className="mt-2 w-full rounded bg-green-600 px-3 py-1"
                  >
                    ➕ Agregar Teléfono
                  </button>
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Agregar correo manual"
                    value={newManualEmail}
                    onChange={(e) => setNewManualEmail(e.target.value)}
                    className="w-full rounded border bg-gray-800 p-2"
                  />
                  <button
                    onClick={() => {
                      if (newManualEmail.trim()) {
                        setManualEmails([
                          ...manualEmails,
                          newManualEmail.trim(),
                        ]);
                        setNewManualEmail('');
                      }
                    }}
                    className="mt-2 w-full rounded bg-blue-600 px-3 py-1"
                  >
                    ➕ Agregar Correo
                  </button>
                </div>
              </div>

              {/* Teléfonos finales */}
              <h3 className="mt-4 text-lg font-semibold">Teléfonos:</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  ...students
                    .filter((s) => selectedStudents.includes(s.id) && s.phone)
                    .map((s) => `${codigoPais}${s.phone}`),
                  ...manualPhones,
                ].map((phone, idx) => (
                  <span
                    key={idx}
                    className="flex items-center rounded-full bg-green-600 px-3 py-1"
                  >
                    {phone}
                    <button
                      onClick={() =>
                        setManualPhones((prev) =>
                          prev.filter((p) => p !== phone)
                        )
                      }
                      className="ml-2"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {manualPhones.length +
                  students.filter(
                    (s) => selectedStudents.includes(s.id) && s.phone
                  ).length ===
                  0 && <div className="text-gray-400">Sin teléfonos</div>}
              </div>

              {/* Correos finales */}
              <h3 className="mt-4 text-lg font-semibold">Correos:</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  ...students
                    .filter((s) => selectedStudents.includes(s.id))
                    .map((s) => s.email),
                  ...manualEmails,
                ].map((email, idx) => (
                  <span
                    key={idx}
                    className="flex items-center rounded-full bg-blue-600 px-3 py-1"
                  >
                    {email}
                    <button
                      onClick={() =>
                        setManualEmails((prev) =>
                          prev.filter((e) => e !== email)
                        )
                      }
                      className="ml-2"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {manualEmails.length +
                  students.filter((s) => selectedStudents.includes(s.id))
                    .length ===
                  0 && <div className="text-gray-400">Sin correos</div>}
              </div>

              {/* Formulario mensaje */}
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Asunto"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mb-2 w-full rounded bg-gray-800 p-2"
                />
                <textarea
                  placeholder="Mensaje"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded bg-gray-800 p-2"
                  rows={5}
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      setAttachments([
                        ...attachments,
                        ...Array.from(e.target.files ?? []),
                      ]);
                    }}
                    className="text-sm text-gray-300"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sendWhatsapp}
                  onChange={() => setSendWhatsapp(!sendWhatsapp)}
                />
                <label>Enviar también por WhatsApp</label>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={sendEmail}
                  className="rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
                  disabled={loadingEmail}
                >
                  {loadingEmail ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showMassiveEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="animate-fadeIn w-full max-w-lg rounded-xl bg-gray-800 p-6 text-white shadow-2xl transition-transform duration-300">
              <h2 className="mb-4 text-center text-2xl font-bold tracking-wide text-white">
                Editar Masivamente
              </h2>

              {/* Mostrar estudiantes seleccionados */}
              <div className="mb-6 max-h-28 overflow-y-auto rounded-md border border-gray-700 bg-gray-900 p-3 shadow-inner">
                {selectedStudents.length === 0 ? (
                  <p className="text-center text-gray-400">
                    No hay estudiantes seleccionados
                  </p>
                ) : (
                  students
                    .filter((s) => selectedStudents.includes(s.id))
                    .map((s) => (
                      <div
                        key={s.id}
                        className="mb-1 rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600"
                      >
                        {s.name}
                      </div>
                    ))
                )}
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Campos a editar
                </label>

                <div className="relative w-full rounded-lg border border-gray-600 bg-gray-800 p-2 shadow-inner">
                  <input
                    type="text"
                    placeholder="Buscar campo..."
                    className="mb-2 w-full rounded bg-gray-700 p-2 text-sm text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    value={searchFieldTerm}
                    onChange={(e) => setSearchFieldTerm(e.target.value)}
                  />

                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {filteredColumns.length > 0 ? (
                      filteredColumns.map((col) => {
                        const isSelected = selectedMassiveFields.includes(
                          col.id
                        );
                        return (
                          <div
                            key={col.id}
                            onClick={() =>
                              setSelectedMassiveFields((prev) =>
                                isSelected
                                  ? prev.filter((id) => id !== col.id)
                                  : [...prev, col.id]
                              )
                            }
                            className={`cursor-pointer rounded px-3 py-2 text-sm transition ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {col.label}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-sm text-gray-400">
                        No se encontraron campos
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Inputs dinámicos */}
              <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
                {selectedMassiveFields.map((field) => {
                  const col = totalColumns.find((c) => c.id === field);
                  if (!col) return null;

                  return (
                    <div
                      key={field}
                      className="rounded-lg bg-gray-700 p-4 shadow-inner"
                    >
                      <label className="mb-1 block text-sm font-semibold text-gray-200">
                        {col.label}
                      </label>

                      {field === 'programTitle' ? (
                        <select
                          className="w-full rounded border border-gray-600 bg-gray-800 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          onChange={(e) =>
                            setMassiveEditFields((prev) => ({
                              ...prev,
                              [field]: e.target.value,
                            }))
                          }
                        >
                          <option value="">--</option>
                          {programs.map((prog) => (
                            <option key={prog.id} value={prog.title}>
                              {prog.title}
                            </option>
                          ))}
                        </select>
                      ) : field === 'courseTitle' ? (
                        <select
                          className="w-full rounded border border-gray-600 bg-gray-800 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          onChange={(e) =>
                            setMassiveEditFields((prev) => ({
                              ...prev,
                              [field]: e.target.value,
                            }))
                          }
                        >
                          <option value="">--</option>
                          {availableCourses.map((course) => (
                            <option key={course.id} value={course.title}>
                              {course.title}
                            </option>
                          ))}
                        </select>
                      ) : col.type === 'select' && col.options ? (
                        <select
                          className="w-full rounded border border-gray-600 bg-gray-800 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          onChange={(e) =>
                            setMassiveEditFields((prev) => ({
                              ...prev,
                              [field]: e.target.value,
                            }))
                          }
                        >
                          <option value="">--</option>
                          {col.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : col.type === 'date' ? (
                        <input
                          type="date"
                          className="w-full rounded border border-gray-600 bg-gray-800 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          onChange={(e) =>
                            setMassiveEditFields((prev) => ({
                              ...prev,
                              [field]: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <input
                          type="text"
                          className="w-full rounded border border-gray-600 bg-gray-800 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          onChange={(e) =>
                            setMassiveEditFields((prev) => ({
                              ...prev,
                              [field]: e.target.value,
                            }))
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Acciones */}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setShowMassiveEditModal(false)}
                  className="w-full rounded bg-gray-600 px-4 py-2 transition hover:bg-gray-500 focus:ring-2 focus:ring-gray-400 focus:outline-none sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    updateStudentsMassiveField(massiveEditFields)
                      .then(() => {
                        setShowMassiveEditModal(false);
                        setSuccessMessage(
                          `✅ Cambios aplicados a ${selectedStudents.length} usuarios`
                        );
                        setTimeout(() => setSuccessMessage(''), 3000);
                      })
                      .catch((err) => {
                        console.error('❌ Error masivo:', err);
                        alert('❌ Ocurrió un error al actualizar masivamente');
                      });
                  }}
                  className="bg-primary hover:bg-primary-700 focus:ring-primary-400 w-full rounded px-4 py-2 font-semibold text-white transition focus:ring-2 focus:outline-none sm:w-auto"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}
        {showCarteraModal && currentUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-4xl rounded-lg bg-white text-gray-900 shadow-2xl dark:bg-gray-800 dark:text-gray-100">
              {/* CABECERA / LOGOS */}
              <div className="border-b border-gray-200 p-4 sm:p-6 dark:border-gray-700">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  {/* Logos: Artiefy primero */}
                  <div className="flex items-center gap-4">
                    <Image
                      src="/artiefy-logo.png"
                      alt="Artiefy"
                      width={160}
                      height={48}
                      className="h-10 w-auto object-contain sm:h-12"
                    />
                    <Image
                      src="/logo-ponao.png"
                      alt="PONAO"
                      width={160}
                      height={48}
                      className="h-10 w-auto object-contain sm:h-12"
                    />
                  </div>

                  <div className="text-center sm:text-right">
                    <p className="text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-300">
                      POLITÉCNICO NACIONAL DE ARTES Y OFICIOS
                    </p>
                    <h3 className="text-lg font-bold">
                      FACTURA PAGO DE MATRÍCULA
                    </h3>
                  </div>
                </div>
              </div>

              {/* INFO INSTITUCIÓN / ESTUDIANTE */}
              <div className="grid grid-cols-1 gap-4 border-b border-gray-200 p-4 text-sm sm:grid-cols-2 sm:p-6 dark:border-gray-700">
                <div className="space-y-1">
                  <p>
                    <span className="font-semibold">NOMBRE ESTUDIANTE: </span>
                    {currentUser.name ?? '-'}
                  </p>
                  <p>
                    <span className="font-semibold">CC: </span>
                    {currentUser.document ?? currentUser.id ?? '-'}
                  </p>
                  <p>
                    <span className="font-semibold">CELULAR: </span>
                    {currentUser.phone ?? '-'}
                  </p>
                  <p>
                    <span className="font-semibold">PROGRAMA: </span>
                    {userPrograms?.[0]?.title ?? '—'}
                    <span className="ml-2 rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-100">
                      {currentUser.modalidad ?? 'virtual'}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">FECHA: </span>
                    {new Date().toISOString().split('T')[0]}
                  </p>
                </div>

                <div className="space-y-1 sm:text-right">
                  <p>
                    <span className="font-semibold">DIRECCIÓN: </span>
                    {currentUser.address ?? '-'}
                  </p>
                  <p>
                    <span className="font-semibold">CIUDAD: </span>
                    {currentUser.city ?? '-'}
                  </p>
                  <p>
                    <span className="font-semibold">EMAIL: </span>
                    {currentUser.email ?? '-'}
                  </p>
                  <p>
                    <span className="font-semibold">ESTADO: </span>
                    <strong
                      className={
                        currentUser.carteraStatus === 'activo'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {currentUser.carteraStatus === 'activo'
                        ? 'Al día'
                        : 'En cartera'}
                    </strong>
                  </p>
                  <p>
                    <span className="font-semibold">FIN SUSCRIPCIÓN: </span>
                    {currentUser.subscriptionEndDate
                      ? new Date(currentUser.subscriptionEndDate)
                          .toISOString()
                          .split('T')[0]
                      : '-'}
                  </p>
                  <p>
                    <span className="font-semibold">
                      CARNET / PÓLIZA / UNIFORME:{' '}
                    </span>
                    {formatCOP(carteraInfo?.carnetPolizaUniforme ?? 0)}
                  </p>
                </div>
              </div>

              {/* TABLA DE PAGOS */}
              <div className="p-4 sm:p-6">
                <h4 className="mb-3 text-base font-semibold">
                  Detalle de pagos
                </h4>
                <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100">
                      <tr>
                        <th className="border-b border-gray-200 px-3 py-2 text-left dark:border-gray-600">
                          PRODUCTO
                        </th>
                        <th className="border-b border-gray-200 px-3 py-2 text-center dark:border-gray-600">
                          N° PAGO
                        </th>
                        <th className="border-b border-gray-200 px-3 py-2 text-left dark:border-gray-600">
                          FECHA DE PAGO
                        </th>
                        <th className="border-b border-gray-200 px-3 py-2 text-left dark:border-gray-600">
                          MÉTODO DE PAGO
                        </th>
                        <th className="border-b border-gray-200 px-3 py-2 text-right dark:border-gray-600">
                          VALOR
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* ➤ 12 cuotas fijas */}
                      {Array.from({ length: 12 }, (_, idx) => {
                        const cuotaNum = idx + 1;
                        const pago = carteraInfo?.pagosUsuarioPrograma?.[idx]; // si tu backend trae en orden, perfecto

                        const fechaISO =
                          pago?.fecha != null
                            ? (() => {
                                const d =
                                  typeof pago.fecha === 'string' ||
                                  typeof pago.fecha === 'number'
                                    ? new Date(pago.fecha)
                                    : pago.fecha;
                                return isNaN(d.getTime())
                                  ? '-'
                                  : d.toISOString().split('T')[0];
                              })()
                            : '-';

                        const valorNum =
                          typeof pago?.valor === 'string'
                            ? Number(pago.valor)
                            : typeof pago?.valor === 'number'
                              ? pago.valor
                              : 0;

                        return (
                          <tr
                            key={cuotaNum}
                            className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-900"
                          >
                            <td className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                              {pago?.concepto ?? `Cuota ${cuotaNum}`}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2 text-center dark:border-gray-700">
                              {pago?.nro_pago ?? pago?.nroPago ?? `${cuotaNum}`}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                              {fechaISO}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                              {pago?.metodo ?? '-'}
                            </td>
                            <td className="border-b border-gray-100 px-3 py-2 text-right tabular-nums dark:border-gray-700">
                              {formatCOP(
                                Number.isFinite(valorNum) ? valorNum : 0
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {/* ➤ Fila fija de DERECHOS DE GRADO */}
                      <tr className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-900">
                        <td className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                          DERECHOS DE GRADO
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2 text-center dark:border-gray-700">
                          {/* número de pago si lo tienes, o '-' */}-
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                          {/* fecha si la tienes, o '-' */}-
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                          {/* método si lo tienes, o '-' */}-
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2 text-right tabular-nums dark:border-gray-700">
                          {formatCOP(carteraInfo?.derechosGrado ?? 0)}
                        </td>
                      </tr>
                    </tbody>

                    <tfoot>
                      <tr className="bg-gray-50 font-semibold dark:bg-gray-900">
                        <td className="px-3 py-2" colSpan={4}>
                          VALOR PROGRAMA
                        </td>
                        <td className="px-3 py-2 text-right">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            maximumFractionDigits: 0,
                          }).format(carteraInfo?.programaPrice ?? 0)}
                        </td>
                      </tr>
                      <tr className="bg-gray-50 dark:bg-gray-900">
                        <td className="px-3 py-2 font-semibold" colSpan={4}>
                          VALOR PAGADO
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            maximumFractionDigits: 0,
                          }).format(carteraInfo?.totalPagado ?? 0)}
                        </td>
                      </tr>
                      <tr className="bg-gray-50 dark:bg-gray-900">
                        <td className="px-3 py-2 font-semibold" colSpan={4}>
                          DEUDA RESTANTE
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-red-600">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            maximumFractionDigits: 0,
                          }).format(carteraInfo?.deuda ?? 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {/* Acciones de cartera (cuando NO está al día) */}
                {currentUser.carteraStatus !== 'activo' && (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      onClick={markCarteraActivo}
                      className="w-full rounded bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
                    >
                      Marcar AL DÍA
                    </button>

                    <div className="rounded border border-gray-300 p-3 dark:border-gray-700">
                      <label className="mb-2 block text-sm font-medium">
                        Subir comprobante de pago
                      </label>

                      <input
                        ref={fileInputRef}
                        id="carteraReceipt"
                        type="file"
                        accept="application/pdf,image/png,image/jpeg"
                        className="hidden"
                        onChange={(e) =>
                          setCarteraReceipt(e.target.files?.[0] ?? null)
                        }
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-500"
                        >
                          Elegir archivo
                        </button>

                        <button
                          type="button"
                          disabled={!carteraReceipt}
                          onClick={uploadCarteraReceipt}
                          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Subir comprobante
                        </button>

                        {carteraReceipt && (
                          <p className="mt-2 w-full text-xs text-gray-500">
                            Archivo seleccionado:{' '}
                            <strong>{carteraReceipt.name}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* FOOTER / BOTONES */}
              <div className="flex flex-col gap-2 border-t border-gray-200 p-4 sm:flex-row sm:justify-end dark:border-gray-700">
                <button
                  onClick={() => window.print()}
                  className="rounded bg-gray-200 px-4 py-2 font-semibold text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  Imprimir / Guardar PDF
                </button>
                <button
                  onClick={() => setShowCarteraModal(false)}
                  className="rounded bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-black dark:bg-gray-600 dark:hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="animate-fadeIn w-full max-w-md scale-100 rounded-lg bg-gray-800 p-6 shadow-xl transition-transform duration-300">
              <h3 className="mb-4 text-center text-xl font-bold text-white">
                Matricular {selectedStudents.length} estudiante
                {selectedStudents.length !== 1 && 's'}
              </h3>

              {/* Lista de estudiantes seleccionados */}
              <div className="mb-4 max-h-40 overflow-y-auto rounded-md border border-gray-600 bg-gray-700 p-3 shadow-inner">
                {students
                  .filter((s) => selectedStudents.includes(s.id))
                  .map((s) => (
                    <div
                      key={s.id}
                      className="mb-2 rounded bg-gray-900 p-2 text-sm text-gray-200 shadow hover:bg-gray-700"
                    >
                      {s.name}
                    </div>
                  ))}
                {selectedStudents.length === 0 && (
                  <p className="text-center text-gray-400">
                    No hay estudiantes seleccionados
                  </p>
                )}
              </div>

              {/* Selector de cursos con búsqueda */}
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Seleccionar Cursos
                </label>
                <input
                  type="text"
                  placeholder="Buscar curso..."
                  className="mb-3 w-full rounded border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const term = e.target.value.toLowerCase();
                    const filtered = availableCourses.filter((c) =>
                      c.title.toLowerCase().includes(term)
                    );
                    setFilteredCourseResults(filtered);
                  }}
                />

                <div className="max-h-48 space-y-2 overflow-y-auto rounded border border-gray-600 bg-gray-700 p-2 shadow-inner">
                  {(filteredCourseResults.length > 0
                    ? filteredCourseResults
                    : availableCourses
                  ).map((c) => {
                    const isSelected = selectedCourses.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() =>
                          setSelectedCourses((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== c.id)
                              : [...prev, c.id]
                          )
                        }
                        className={`flex cursor-pointer items-center justify-between rounded px-3 py-2 transition ${isSelected ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-gray-600'}`}
                      >
                        <span>{c.title}</span>
                        {isSelected && <span className="ml-2">✅</span>}
                      </div>
                    );
                  })}
                  {availableCourses.length === 0 && (
                    <p className="text-center text-gray-400">
                      No hay cursos disponibles
                    </p>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full rounded bg-gray-600 px-4 py-2 text-white transition hover:bg-gray-500 focus:ring-2 focus:ring-gray-400 focus:outline-none sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  disabled={selectedCourses.length === 0}
                  onClick={handleEnroll}
                  className={`w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto`}
                >
                  Matricular
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
