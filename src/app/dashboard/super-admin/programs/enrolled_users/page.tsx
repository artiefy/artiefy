'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';

import { useUser } from '@clerk/nextjs';
import { saveAs } from 'file-saver';
import {
  ChevronDown,
  Loader2,
  Mail,
  MessageCircle,
  UserPlus,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { z } from 'zod';

import { InfoDialog } from '~/app/dashboard/super-admin/components/InfoDialog';

import { AdvancedFilterMenu } from './AdvancedFilterMenu';

// helpers
const numNullOpt = z.preprocess(
  (v) => (v == null || v === '' ? null : v),
  z.coerce.number().nullable().optional()
);
const strNullOpt = z.preprocess((v) => {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return null; // Evita stringificar objetos
}, z.string().nullable().optional());

const studentSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    birthDate: z.string().nullable().optional(),
    subscriptionStatus: z.string(),
    subscriptionEndDate: z.string().nullable().optional(),
    role: z.string().optional(),
    planType: z.string().nullable().optional(),

    programTitle: z.string().nullish(),
    programTitles: z.array(z.string()).optional(),
    courseTitle: z.string().nullish(),
    courseTitles: z.array(z.string()).optional(),
    nivelNombre: z.string().nullable().optional(),
    purchaseDate: z.string().nullable().optional(),

    // ➕ CAMBIOS: ahora vienen del back desde users.*
    document: strNullOpt,
    modalidad: strNullOpt,
    inscripcionValor: numNullOpt,
    paymentMethod: strNullOpt,
    cuota1Fecha: strNullOpt,
    cuota1Metodo: strNullOpt,
    cuota1Valor: numNullOpt,
    valorPrograma: numNullOpt,

    identificacionTipo: strNullOpt,
    identificacionNumero: strNullOpt,
    nivelEducacion: strNullOpt,
    tieneAcudiente: strNullOpt,
    acudienteNombre: strNullOpt,
    acudienteContacto: strNullOpt,
    acudienteEmail: strNullOpt,

    programa: strNullOpt,
    fechaInicio: strNullOpt,
    comercial: strNullOpt,
    sede: strNullOpt,
    horario: strNullOpt,
    numeroCuotas: strNullOpt,
    pagoInscripcion: strNullOpt,
    pagoCuota1: strNullOpt,

    idDocKey: strNullOpt,
    utilityBillKey: strNullOpt,
    diplomaKey: strNullOpt,
    pagareKey: strNullOpt,

    // flags del back
    isNew: z.boolean().optional(),
    isSubOnly: z.boolean().optional(),
    enrolledInCourse: z.boolean().optional(),

    inscripcionOrigen: z.preprocess(
      (v) => {
        if (v == null) return undefined;
        if (typeof v !== 'string') return undefined;
        const normalized = v.trim().toLowerCase();
        // Si no coincide con los valores esperados, devolver undefined (será opcional)
        if (normalized !== 'formulario' && normalized !== 'artiefy')
          return undefined;
        return normalized;
      },
      z.enum(['formulario', 'artiefy']).optional()
    ),

    // carteraStatus derivado o desde back (normalizado)
    carteraStatus: z.preprocess(
      (v) => {
        if (v == null) return undefined;
        if (typeof v !== 'string') return undefined;
        const normalized = v.trim().toLowerCase();
        // Permitir solo los valores válidos, el resto se convierte en undefined
        if (!['activo', 'inactivo', 'no verificado'].includes(normalized))
          return undefined;
        return normalized;
      },
      z.enum(['activo', 'inactivo', 'no verificado']).optional()
    ),
    enrollmentStatus: z.string().optional(),
    userInscriptionDetails: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough(); // 👈 MUY IMPORTANTE

const courseSchema = z.object({
  id: z.string(),
  title: z.string(),
  instructor: z.string().nullable().optional(),
  instructorName: z.string().nullable().optional(),
});
const enrolledUserSchema = z.object({
  id: z.string(),
  programTitle: z.string().nullish(),
});

const apiResponseSchema = z.object({
  students: z.array(studentSchema),
  courses: z.array(courseSchema),
  enrolledUsers: z.array(enrolledUserSchema),
});

const errorResponseSchema = z.object({
  error: z.string(),
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
  planType?: string | null;
  programTitle?: string | null;
  programTitles?: string[];
  courseTitle?: string | null;
  nivelNombre?: string | null;
  purchaseDate?: string | null;

  // 🔽 campos que ahora trae users.*
  document?: string | null;
  modalidad?: string | null;
  inscripcionValor?: number | null;
  paymentMethod?: string | null;
  cuota1Fecha?: string | null;
  cuota1Metodo?: string | null;
  cuota1Valor?: number | null;
  valorPrograma?: number | null;

  identificacionTipo?: string | null;
  identificacionNumero?: string | null;
  nivelEducacion?: string | null;
  tieneAcudiente?: string | null;
  acudienteNombre?: string | null;
  acudienteContacto?: string | null;
  acudienteEmail?: string | null;

  programa?: string | null;
  fechaInicio?: string | null;
  comercial?: string | null;
  sede?: string | null;
  horario?: string | null;
  numeroCuotas?: string | null;
  pagoInscripcion?: string | null;
  pagoCuota1?: string | null;

  idDocKey?: string | null;
  utilityBillKey?: string | null;
  diplomaKey?: string | null;
  pagareKey?: string | null;

  // flags/extra UI
  isNew?: boolean;
  isSubOnly?: boolean;
  enrolledInCourse?: boolean;
  enrolledInCourseLabel?: 'Sí' | 'No';
  inscripcionOrigen?: 'formulario' | 'artiefy';
  carteraStatus?: 'activo' | 'inactivo' | 'no verificado';
  enrollmentStatus?:
    | 'Nuevo'
    | 'Graduando'
    | 'Egresado'
    | 'Aplaza'
    | 'Retirado'
    | 'Estudiante';
  userInscriptionDetails?: Record<string, unknown>;
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
  instructor?: string | null;
  instructorName?: string | null;
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
  // Básicos
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

  // Estado / fechas
  {
    id: 'enrollmentStatus',
    label: 'Estado',
    defaultVisible: true,
    type: 'select',
    options: [
      'Nuevo',
      'Graduando',
      'Egresado',
      'Aplaza',
      'Retirado',
      'Estudiante',
    ],
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

  // Cartera / origen
  {
    id: 'carteraStatus',
    label: 'Cartera',
    defaultVisible: true,
    type: 'select',
    options: ['activo', 'inactivo', 'No verificado'],
  },
  {
    id: 'inscripcionOrigen',
    label: 'Origen',
    defaultVisible: true,
    type: 'select',
    options: ['formulario', 'artiefy'],
  },

  // Programa / curso
  {
    id: 'programTitle',
    label: 'Programa',
    defaultVisible: true,
    type: 'select',
  },
  {
    id: 'courseTitle',
    label: 'Último curso',
    defaultVisible: true,
    type: 'select',
  },

  // Rol / plan
  {
    id: 'role',
    label: 'Rol',
    defaultVisible: false,
    type: 'select',
    options: ['estudiante', 'educador', 'admin', 'super-admin'],
  },
  {
    id: 'planType',
    label: 'Plan',
    defaultVisible: false,
    type: 'select',
    options: ['none', 'Pro', 'Premium', 'Enterprise'],
  },

  // Indicadores
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

  // 🔽 AHORA todo desde users.* (ocultas por defecto para no romper layouts)
  { id: 'document', label: 'Documento', defaultVisible: false, type: 'text' },
  {
    id: 'modalidad',
    label: 'Modalidad',
    defaultVisible: false,
    type: 'select',
    options: ['virtual', 'presencial', 'híbrida'],
  },
  {
    id: 'inscripcionValor',
    label: 'Inscripción (valor)',
    defaultVisible: false,
    type: 'text',
  },
  {
    id: 'paymentMethod',
    label: 'Método pago inscripción',
    defaultVisible: false,
    type: 'text',
  },
  {
    id: 'cuota1Fecha',
    label: 'Cuota 1 (fecha)',
    defaultVisible: false,
    type: 'date',
  },
  {
    id: 'cuota1Metodo',
    label: 'Cuota 1 (método)',
    defaultVisible: false,
    type: 'text',
  },
  {
    id: 'cuota1Valor',
    label: 'Cuota 1 (valor)',
    defaultVisible: false,
    type: 'text',
  },
  {
    id: 'valorPrograma',
    label: 'Valor Programa',
    defaultVisible: false,
    type: 'text',
  },

  {
    id: 'identificacionTipo',
    label: 'Identificación (tipo)',
    defaultVisible: false,
    type: 'text',
  },
  {
    id: 'identificacionNumero',
    label: 'Identificación (número)',
    defaultVisible: false,
    type: 'text',
  },
  {
    id: 'nivelEducacion',
    label: 'Nivel educación',
    defaultVisible: false,
    type: 'text',
  },
  {
    id: 'tieneAcudiente',
    label: '¿Tiene acudiente?',
    defaultVisible: false,
    type: 'text',
  },
  {
    id: 'acudienteNombre',
    label: 'Acudiente nombre',
    defaultVisible: false,
    type: 'text',
  },
  {
    id: 'acudienteContacto',
    label: 'Acudiente contacto',
    defaultVisible: false,
    type: 'text',
  },
  {
    id: 'acudienteEmail',
    label: 'Acudiente email',
    defaultVisible: false,
    type: 'text',
  },

  {
    id: 'programa',
    label: 'Programa (texto)',
    defaultVisible: false,
    type: 'text',
  },
  {
    id: 'fechaInicio',
    label: 'Fecha inicio',
    defaultVisible: false,
    type: 'date',
  },
  { id: 'comercial', label: 'Comercial', defaultVisible: false, type: 'text' },
  { id: 'sede', label: 'Sede', defaultVisible: false, type: 'text' },
  { id: 'horario', label: 'Horario', defaultVisible: false, type: 'text' },
  {
    id: 'numeroCuotas',
    label: 'N° cuotas',
    defaultVisible: false,
    type: 'text',
  },
  {
    id: 'pagoInscripcion',
    label: 'Pago inscripción',
    defaultVisible: false,
    type: 'text',
  },
  {
    id: 'pagoCuota1',
    label: 'Pago cuota 1',
    defaultVisible: false,
    type: 'text',
  },

  { id: 'idDocKey', label: 'ID Doc key', defaultVisible: false, type: 'text' },
  {
    id: 'utilityBillKey',
    label: 'Factura servicios key',
    defaultVisible: false,
    type: 'text',
  },
  {
    id: 'diplomaKey',
    label: 'Diploma key',
    defaultVisible: false,
    type: 'text',
  },
  { id: 'pagareKey', label: 'Pagaré key', defaultVisible: false, type: 'text' },
];

// Helper function for safe string conversion
function safeToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return value.toString();
  return JSON.stringify(value);
}
function getByPath(obj: Record<string, unknown>, path: string): unknown {
  if (!obj || !path) return '';
  return path.split('.').reduce<unknown>((acc, k) => {
    if (acc && typeof acc === 'object' && acc !== null && k in acc) {
      return (acc as Record<string, unknown>)[k];
    }
    return '';
  }, obj);
}
// Humaniza una key si quieres (UserName -> User Name). Si no, devuelve tal cual.
function humanizeKey(k: string): string {
  return k
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

// Valor seguro para cualquier columna (incluye "userInscriptionDetails.X")
function getValueForColumn(student: Student, colId: string): unknown {
  if (colId.startsWith('userInscriptionDetails.')) {
    const key = colId.split('.')[1] ?? '';
    return student.userInscriptionDetails?.[key] ?? '';
  }
  // Soporta colId anidado (a.b.c). Si no está anidado, lee directo.
  const studentRecord = student as unknown as Record<string, unknown>;
  const direct = studentRecord[colId];
  if (direct !== undefined) return direct;
  return getByPath(studentRecord, colId);
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

  const [manualEmails, setManualEmails] = useState<string[]>([]);
  const [newManualPhone, setNewManualPhone] = useState('');
  const [newManualEmail, setNewManualEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  // ✅ Estados para WhatsApp separado (como en super-admin/page.tsx)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  const [waSubjectText, setWaSubjectText] = useState('');
  const [waMessageText, setWaMessageText] = useState('');
  const [numerosLocales, setNumerosLocales] = useState('');
  const [waSelectedTemplate, setWaSelectedTemplate] =
    useState<string>('__TEXT_ONLY__');
  const [waVariables, setWaVariables] = useState<string[]>([]);
  const [waTemplates, setWaTemplates] = useState<
    {
      name: string;
      label: string;
      language: 'es' | 'en';
      body: string;
      example?: string[];
      status?: string;
      langCode?: string;
    }[]
  >([]);
  const [waLoading, setWaLoading] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  const [editablePagos, setEditablePagos] = useState<Pago[]>([]);
  const { user: clerkUser } = useUser();

  // Modal de vista previa de comprobantes
  const [receiptPreview, setReceiptPreview] = useState<{
    open: boolean;
    url?: string;
    name?: string;
  }>({ open: false });

  const openReceiptPreview = (url?: string, name?: string) => {
    if (!url) return;
    setReceiptPreview({ open: true, url, name });
  };
  const closeReceiptPreview = () =>
    setReceiptPreview((p) => ({ ...p, open: false }));

  const isPdfUrl = (u?: string) => !!u && /\.pdf(\?|$)/i.test(u);

  // Reemplaza tu botón de imprimir con esta función más robusta

  // Opción 3: La más simple - usar parámetros de ventana específicos

  const handlePrint = () => {
    // Crear ventana con parámetros específicos para que aparezca al frente
    const printWindow = window.open(
      '',
      '_blank',
      'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,location=no,status=no,menubar=no,top=50,left=50'
    );

    const printContent = generatePrintableHTML();

    if (!printWindow) {
      alert('No se pudo abrir la ventana de impresión.');
      return;
    }
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Forzar que la ventana esté al frente
    printWindow.focus();
    printWindow.moveTo(100, 100); // Mover la ventana para asegurar visibilidad

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus(); // Doble enfoque para asegurar
        printWindow.print();
        printWindow.close();
      }, 300);
    };
  };

  // Esta es la función generatePrintableHTML que también necesitas:
  const generatePrintableHTML = () => {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Factura de Matrícula - ${currentUser?.name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          color: black !important;
          background: white !important;
        }
        
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          background: white !important;
          color: black !important;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 2px solid black;
          padding-bottom: 15px;
        }
        
        .logos {
          display: flex;
          gap: 20px;
          align-items: center;
        }
        
        .title {
          text-align: right;
        }
        
        .title h1 {
          font-size: 16px;
          font-weight: bold;
          color: black !important;
          margin-bottom: 5px;
        }
        
        .title p {
          font-size: 12px;
          color: black !important;
        }
        
        .info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
          font-size: 13px;
        }
        
        .info-section p {
          margin-bottom: 6px;
          color: black !important;
        }
        
        .info-section strong {
          color: black !important;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 12px;
        }
        
        th, td {
          border: 1px solid black !important;
          padding: 6px;
          text-align: left;
          background: white !important;
          color: black !important;
        }
        
        th {
          font-weight: bold;
          background: white !important;
          color: black !important;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .totals {
          border-top: 2px solid black;
          padding-top: 15px;
          margin-top: 20px;
          font-size: 14px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .total-row.final {
          font-weight: bold;
          font-size: 16px;
          border-top: 1px solid black;
          padding-top: 8px;
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 11px;
          border-top: 1px solid black;
          padding-top: 10px;
        }
        
        @page {
          margin: 0.5in;
          size: A4;
        }
        
        @media print {
          body { margin: 0; padding: 10px; }
          .header { page-break-after: avoid; }
          table { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logos">
          <strong>ARTIEFY - PONAO</strong>
        </div>
        <div class="title">
          <p>POLITÉCNICO NACIONAL DE ARTES Y OFICIOS</p>
          <h1>FACTURA PAGO DE MATRÍCULA</h1>
        </div>
      </div>
      
      <div class="info-section">
        <div>
          <p><strong>NOMBRE ESTUDIANTE:</strong> ${currentUser?.name ?? '-'}</p>
          <p><strong>CC:</strong> ${currentUser?.document ?? currentUser?.id ?? '-'}</p>
          <p><strong>CELULAR:</strong> ${currentUser?.phone ?? '-'}</p>
          <p><strong>PROGRAMA:</strong> ${userPrograms?.[0]?.title ?? '—'}</p>
          <p><strong>FECHA:</strong> ${new Date().toLocaleDateString('es-CO')}</p>
        </div>
        <div>
          <p><strong>DIRECCIÓN:</strong> ${currentUser?.address ?? '-'}</p>
          <p><strong>CIUDAD:</strong> ${currentUser?.city ?? '-'}</p>
          <p><strong>EMAIL:</strong> ${currentUser?.email ?? '-'}</p>
          <p><strong>ESTADO:</strong> ${currentUser?.carteraStatus === 'activo' ? 'Al día' : 'En cartera'}</p>
          <p><strong>FIN SUSCRIPCIÓN:</strong> ${currentUser?.subscriptionEndDate ? new Date(currentUser.subscriptionEndDate).toLocaleDateString('es-CO') : '-'}</p>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>PRODUCTO</th>
            <th class="text-center">N° PAGO</th>
            <th>FECHA DE PAGO</th>
            <th>MÉTODO DE PAGO</th>
            <th class="text-right">VALOR</th>
          </tr>
        </thead>
        <tbody>
          ${generateTableRows()}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-row">
          <span>PLAN / VALOR PROGRAMA:</span>
          <span>${formatCOP(price)}</span>
        </div>
        <div class="total-row">
          <span>VALOR PAGADO:</span>
          <span>${formatCOP(carteraInfo?.totalPagado ?? 0)}</span>
        </div>
        <div class="total-row final">
          <span>DEUDA RESTANTE:</span>
          <span>${formatCOP(carteraInfo?.deuda ?? 0)}</span>
        </div>
      </div>
      
      <div class="footer">
        <p>Este documento es un comprobante de los pagos registrados</p>
        <p>Fecha de impresión: ${new Date().toLocaleString('es-CO')}</p>
      </div>
    </body>
    </html>
  `;
  };
  const generateTableRows = () => {
    let rows = '';

    // Generar filas de cuotas (1-12)
    for (let idx = 0; idx < 12; idx++) {
      const cuotaNum = idx + 1;
      const row = editablePagos[idx] ?? {};
      const valor =
        typeof row.valor === 'number' ? row.valor : Number(row.valor ?? 0);

      rows += `
      <tr>
        <td>${row.concepto ?? `Cuota ${cuotaNum}`}</td>
        <td class="text-center">${row.nro_pago ?? row.nroPago ?? cuotaNum}</td>
        <td>${row.fecha ? new Date(row.fecha).toLocaleDateString('es-CO') : '-'}</td>
        <td>${row.metodo ?? '-'}</td>
        <td class="text-right">${formatCOP(valor)}</td>
      </tr>
    `;
    }

    // Generar filas de conceptos especiales
    const especiales = [
      { label: 'PÓLIZA Y CARNET', idxBase: 12 },
      { label: 'UNIFORME', idxBase: 13 },
      { label: 'DERECHOS DE GRADO', idxBase: 14 },
    ];

    especiales.forEach(({ label, idxBase }) => {
      const row = editablePagos[idxBase] ?? {};
      const valor =
        typeof row.valor === 'number' ? row.valor : Number(row.valor ?? 0);

      rows += `
      <tr>
        <td style="font-weight: bold;">${row.concepto ?? label}</td>
        <td class="text-center">${idxBase + 1}</td>
        <td>${row.fecha ? new Date(row.fecha).toLocaleDateString('es-CO') : '-'}</td>
        <td>${row.metodo ?? '-'}</td>
        <td class="text-right">${formatCOP(valor)}</td>
      </tr>
    `;
    });

    return rows;
  };

  void setCodigoPais;

  // === NUEVO: estados para edición de cuotas y programa actual ===
  const [currentProgramId, setCurrentProgramId] = useState<string | null>(null);

  // Reutilizamos el input global para subir comprobante por fila
  const [pendingRowForReceipt, setPendingRowForReceipt] = useState<
    number | null
  >(null);

  // Normaliza a 12 filas editables
  // 15 filas: 0..11 cuotas, 12..14 conceptos especiales
  const ensure15 = useCallback((pagos: Pago[]) => {
    const arr = [...pagos];
    while (arr.length < 15) arr.push({});
    return arr.slice(0, 15);
  }, []);

  // ⬇️ Pega esto dentro del componente, donde hoy declaras ESPECIALES
  const ESPECIALES = useMemo(
    () =>
      [
        { label: 'PÓLIZA Y CARNET', idxBase: 12, nroPago: 13 },
        { label: 'UNIFORME', idxBase: 13, nroPago: 14 },
        { label: 'DERECHOS DE GRADO', idxBase: 14, nroPago: 15 },
      ] as const,
    []
  );

  const isEspecialIndex = (idx: number) => idx >= 12 && idx <= 14;
  const labelForIndex = (idx: number) =>
    ESPECIALES.find((e) => e.idxBase === idx)?.label ?? `Especial ${idx - 11}`;
  const nroPagoForIndex = (idx: number) =>
    ESPECIALES.find((e) => e.idxBase === idx)?.nroPago ?? idx + 1;

  // ✅ Helpers de lectura segura
  const asRec = (x: unknown): Record<string, unknown> =>
    x && typeof x === 'object' ? (x as Record<string, unknown>) : {};

  const getStr = (o: Record<string, unknown>, k: string): string =>
    typeof o[k] === 'string' ? (o[k] as string) : '';

  const getNum = (o: Record<string, unknown>, k: string): number => {
    const v = o[k];
    if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
    if (typeof v === 'string') {
      const n = Number(v);
      return Number.isFinite(n) ? n : NaN;
    }
    return NaN;
  };
  const toISODateLike = useCallback(
    (value?: string | number | Date | null): string => {
      if (!value && value !== 0) return '';
      const d =
        typeof value === 'string' || typeof value === 'number'
          ? new Date(value)
          : value instanceof Date
            ? value
            : null;
      return d && !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
    },
    [] // 👈 no depende de nada externo; estable entre renders
  );

  // ⛳️ CONVIERTE esta función en useCallback para estabilizar referencia (ayuda con el useEffect)
  const mapPagosToEditable = useCallback(
    (pagosFromApi: unknown[]): Pago[] => {
      const slots: Pago[] = Array.from({ length: 15 }, () => ({}) as Pago);

      for (const raw of pagosFromApi ?? []) {
        const p = asRec(raw) as Record<string, unknown>;

        const conceptoUC = getStr(p, 'concepto').toUpperCase().trim();

        // nroPago puede venir con varios nombres (y a veces como "index" 0-based)
        const nroPagoNum = (() => {
          const n1 = getNum(p, 'nroPago');
          if (Number.isFinite(n1)) return n1;
          const n2 = getNum(p, 'nro_pago');
          if (Number.isFinite(n2)) return n2;
          const n3 = getNum(p, 'numero');
          if (Number.isFinite(n3)) return n3;
          const idx0 = getNum(p, 'index'); // 👈 NUEVO
          if (Number.isFinite(idx0)) return idx0 + 1; //    convertir 0-based → 1..12
          return NaN;
        })();

        // ¿especial?
        const esp = ESPECIALES.find((e) => e.label === conceptoUC);
        if (esp) {
          const idx = esp.idxBase; // 👈 este sí existe en ESPECIALES
          slots[idx] = {
            concepto: getStr(p, 'concepto') || esp.label,
            nro_pago: Number.isFinite(getNum(p, 'nroPago'))
              ? getNum(p, 'nroPago')
              : Number.isFinite(getNum(p, 'nro_pago'))
                ? getNum(p, 'nro_pago')
                : esp.nroPago,
            fecha: ((): string => {
              const f = p.fecha;
              return typeof f === 'string' ||
                typeof f === 'number' ||
                f instanceof Date
                ? String(f)
                : '';
            })(),
            metodo: getStr(p, 'metodo') || getStr(p, 'metodoPago'),
            valor: Number.isFinite(getNum(p, 'valor')) ? getNum(p, 'valor') : 0,
            receiptUrl: getStr(p, 'receiptUrl') || undefined,
            receiptName: getStr(p, 'receiptName') || undefined,
            receiptVerified: ((): boolean => {
              const v = p.receiptVerified;
              return typeof v === 'boolean' ? v : false;
            })(),
            verifiedReceiptUrl: getStr(p, 'verifiedReceiptUrl') || undefined,
            verifiedReceiptName: getStr(p, 'verifiedReceiptName') || undefined,
          };
          continue;
        }

        // cuotas 1..12
        if (
          Number.isFinite(nroPagoNum) &&
          nroPagoNum >= 1 &&
          nroPagoNum <= 12
        ) {
          const idx = nroPagoNum - 1;
          slots[idx] = {
            concepto: getStr(p, 'concepto') || `Cuota ${idx + 1}`,
            nro_pago: nroPagoNum,
            fecha: ((): string => {
              const f = p.fecha;
              return typeof f === 'string' ||
                typeof f === 'number' ||
                f instanceof Date
                ? String(f)
                : '';
            })(),
            metodo: getStr(p, 'metodo') || getStr(p, 'metodoPago'),
            valor: Number.isFinite(getNum(p, 'valor')) ? getNum(p, 'valor') : 0,
            receiptUrl: getStr(p, 'receiptUrl') || undefined,
            receiptName: getStr(p, 'receiptName') || undefined,
            receiptVerified: ((): boolean => {
              const v = p.receiptVerified;
              return typeof v === 'boolean' ? v : false;
            })(),
            verifiedReceiptUrl: getStr(p, 'verifiedReceiptUrl') || undefined,
            verifiedReceiptName: getStr(p, 'verifiedReceiptName') || undefined,
          };
        }
      }

      return ensure15(slots);
    },
    [ensure15, ESPECIALES]
  );

  const daysInMonthUTC = useCallback((year: number, month0: number) => {
    return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  }, []);

  const addMonthsKeepingDay = useCallback(
    (iso: string, monthsToAdd: number) => {
      if (!iso) return '';
      const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
      if (!y || !m || !d) return '';

      const targetMonth0 = m - 1 + monthsToAdd;
      const targetYear = y + Math.floor(targetMonth0 / 12);
      const targetMonthFixed0 = ((targetMonth0 % 12) + 12) % 12;

      const dim = daysInMonthUTC(targetYear, targetMonthFixed0);
      const day = Math.min(d, dim);

      const mm = String(targetMonthFixed0 + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      return `${targetYear}-${mm}-${dd}`;
    },
    [daysInMonthUTC]
  );

  function fromCurrencyInput(v: string) {
    const n = Number(v.replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function handleCuotaChange(index: number, field: keyof Pago, value: string) {
    setEditablePagos((prev) => {
      const next = [...prev];
      const current: Pago = { ...(next[index] ?? {}) };

      if (field === 'fecha') {
        current.fecha = value || null;
        next[index] = current;

        // Autocompletar mes a mes a partir de la 1ª cuota
        if (index === 0 && value) {
          const base = value; // YYYY-MM-DD
          for (let i = 1; i < 12; i++) {
            const r: Pago = { ...(next[i] ?? {}) };
            const hasFecha =
              typeof r.fecha === 'string' && r.fecha.trim().length > 0;
            if (!hasFecha) {
              r.fecha = addMonthsKeepingDay(base, i);
              next[i] = r;
            }
          }
        }
        return next;
      }

      if (field === 'valor') {
        current.valor = fromCurrencyInput(value);
        next[index] = current;
        return next;
      }

      if (field === 'nro_pago') {
        const asNum = Number(value);
        current.nro_pago = Number.isFinite(asNum) ? asNum : value;
        next[index] = current;
        return next;
      }

      if (field === 'nroPago') {
        const asNum = Number(value);
        current.nroPago = Number.isFinite(asNum) ? asNum : value;
        next[index] = current;
        return next;
      }

      // Campos de texto conocidos
      if (field === 'concepto') {
        current.concepto = value || null;
      } else if (field === 'metodo') {
        current.metodo = value || null;
      } else if (field === 'receiptUrl') {
        current.receiptUrl = value || undefined;
      } else if (field === 'receiptName') {
        current.receiptName = value || undefined;
      }

      next[index] = current;
      return next;
    });
  }

  async function savePagoRow(index: number) {
    if (!carteraUserId) {
      alert('Falta userId');
      return;
    }

    const row = editablePagos[index] ?? {};
    const fechaStr = toISODateLike(row.fecha);

    if (!fechaStr) {
      alert('La fecha es obligatoria para guardar.');
      return;
    }

    const especial = isEspecialIndex(index);
    const concepto =
      (row.concepto && String(row.concepto).trim()) ??
      (especial ? labelForIndex(index) : `Cuota ${index + 1}`);
    const nro_pago = Number(
      row.nro_pago ??
        row.nroPago ??
        (especial ? nroPagoForIndex(index) : index + 1)
    );

    try {
      const res = await fetch(
        '/api/super-admin/enroll_user_program/programsUser/pagos',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: carteraUserId,
            programId: currentProgramId ? Number(currentProgramId) : null,
            index,
            concepto,
            nro_pago,
            fecha: fechaStr,
            metodo: row.metodo ?? '',
            valor: Number(
              typeof row.valor === 'number' ? row.valor : (row.valor ?? 0)
            ),
          }),
        }
      );

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => ({}));
        const msg = isErrorResponse(data) ? data.error : 'No se pudo guardar.';
        alert(msg);
        return;
      }

      // 👇 CAMBIO: Guardar el estado actual de fechas autocompletadas
      const currentFechas = editablePagos.map((p) => p.fecha);

      const pagosRefrescados = await fetchPagosUsuarioPrograma(
        carteraUserId,
        String(currentProgramId)
      );

      const pagosActualizados = mapPagosToEditable(pagosRefrescados);

      // 👇 NUEVO: Restaurar las fechas autocompletadas que no están en el backend
      const pagosMerged = pagosActualizados.map((p, idx) => {
        // Si la fecha está vacía en el backend pero la teníamos autocompletada, mantenerla
        if (!p.fecha && currentFechas[idx]) {
          return { ...p, fecha: currentFechas[idx] };
        }
        return p;
      });

      setEditablePagos(pagosMerged);
      alert('✅ Guardado');
    } catch (e) {
      console.error(e);
      alert('Error de red al guardar.');
    }
  }
  const onReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (
      !f ||
      pendingRowForReceipt === null ||
      !carteraUserId ||
      !currentProgramId
    ) {
      e.target.value = '';
      return;
    }

    try {
      const fd = new FormData();
      fd.append('userId', carteraUserId);
      fd.append('programId', String(currentProgramId));
      fd.append('index', String(pendingRowForReceipt)); // el backend convierte a nroPago = index+1
      fd.append('receipt', f, f.name);

      const res = await fetch(
        '/api/super-admin/enroll_user_program/programsUser/pagos',
        { method: 'POST', body: fd }
      );

      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = isErrorResponse(data)
          ? data.error
          : 'No se pudo subir el comprobante';
        alert(msg);
        return;
      }

      // refresca pagos y normaliza
      const pagosRefrescados = await fetchPagosUsuarioPrograma(
        carteraUserId,
        String(currentProgramId)
      );
      setEditablePagos(mapPagosToEditable(pagosRefrescados));
      alert('✅ Comprobante subido');
    } catch (err) {
      console.error(err);
      alert('Error al subir comprobante');
    } finally {
      setPendingRowForReceipt(null);
      e.target.value = '';
    }
  };

  const [filters, setFilters] = useState({
    name: '',
    email: '',
    subscriptionStatus: '',
    enrollmentStatus: '',
    purchaseDateFrom: '',
    purchaseDateTo: '',
  });

  // Opciones de estado de inscripción
  const enrollmentStatusOptions = useMemo(
    () => [
      'Nuevo',
      'Graduando',
      'Egresado',
      'Aplaza',
      'Retirado',
      'Estudiante',
    ],
    []
  );

  // Contar estudiantes por estado de inscripción
  const enrollmentStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    enrollmentStatusOptions.forEach((status) => {
      counts[status] = students.filter((s) => {
        const studentStatus = (s.enrollmentStatus ?? '').trim();
        return studentStatus === status;
      }).length;
    });
    return counts;
  }, [students, enrollmentStatusOptions]);

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
  const [columnFiltersMulti, setColumnFiltersMulti] = useState<
    Record<string, string[]>
  >({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  // Opciones únicas de programas
  const programOptions = useMemo(
    () =>
      Array.from(new Set(students.flatMap((s) => s.programTitles ?? [])))
        .map((t) => String(t ?? '').trim())
        .filter(Boolean),
    [students]
  );

  // Estado/UI del multiselect
  const [programQuery, setProgramQuery] = useState('');
  const [programOpen, setProgramOpen] = useState(false);
  const programRef = useRef<HTMLDivElement>(null);

  // Lista filtrada (excluye ya seleccionados mientras escribes)
  const filteredProgramOptions = useMemo(
    () =>
      programOptions.filter(
        (o) =>
          o.toLowerCase().includes(programQuery.toLowerCase()) &&
          !selectedPrograms.includes(o)
      ),
    [programOptions, programQuery, selectedPrograms]
  );

  // Handlers
  const toggleProgram = (val: string) =>
    setSelectedPrograms((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  const removeProgram = (val: string) =>
    setSelectedPrograms((prev) => prev.filter((v) => v !== val));

  // Cerrar al hacer click fuera
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!programRef.current) return;
      if (!programRef.current.contains(e.target as Node)) setProgramOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

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
  // Estado de cartera que respeta la regla del "último pago del mes no verificado"
  const estadoCarteraUI = useMemo(() => {
    // Estado base según el dato que ya trae el usuario
    const base =
      currentUser?.carteraStatus === 'activo' ? 'Al día' : 'En cartera';

    // Si no hay pagos cargados aún, mostramos el base
    if (!editablePagos || editablePagos.length === 0) return base;

    // Filtramos pagos del MES actual que tengan algún valor (>0) y fecha válida
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = hoy.getMonth();

    const pagosMesActual = editablePagos.filter((p) => {
      const f = p?.fecha ? new Date(String(p.fecha)) : null;
      const v = typeof p?.valor === 'number' ? p.valor : Number(p?.valor ?? 0);
      return (
        f &&
        !isNaN(f.getTime()) &&
        f.getFullYear() === y &&
        f.getMonth() === m &&
        v > 0
      );
    });

    if (pagosMesActual.length === 0) {
      // No hay pago en el mes → no cambia nada
      return base;
    }

    // Tomamos el ÚLTIMO pago del mes por fecha
    const ultimoPagoMes = [...pagosMesActual].sort(
      (a, b) =>
        new Date(String(a.fecha)).getTime() -
        new Date(String(b.fecha)).getTime()
    )[pagosMesActual.length - 1];

    // Regla: si tiene pago y el verificado dice "No verificado", mostramos "No verificado"
    if (
      ultimoPagoMes &&
      (ultimoPagoMes.valor as number) > 0 &&
      ultimoPagoMes.receiptUrl && // hay comprobante subido
      ultimoPagoMes.receiptVerified === false
    ) {
      return 'No verificado';
    }

    return base;
  }, [editablePagos, currentUser?.carteraStatus]);

  const [userCourses, setUserCourses] = useState<
    {
      id: string;
      title: string;
      instructor?: string | null;
      instructorName?: string | null;
    }[]
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

  // ✅ Estados para filtro avanzado tipo Excel
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState<string | null>(
    null
  );
  const [advancedFilterMenuPos, setAdvancedFilterMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<
    Record<string, string[]>
  >({});

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
    receiptUrl?: string;
    receiptName?: string;
    receiptVerified?: boolean;
    verifiedReceiptUrl?: string;
    verifiedReceiptName?: string;
  }

  interface CarteraInfo {
    programaPrice: number;
    pagosUsuarioPrograma: Pago[];
    totalPagado: number;
    deuda: number;
    carnetPolizaUniforme: number; // obligatorio
    derechosGrado: number; // obligatorio
    planType?: string; // opcional
  }

  function shouldMarkNoVerificado(arr: Pago[] = []): boolean {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = hoy.getMonth();

    const pagosMes = arr.filter((p) => {
      const f = p?.fecha ? new Date(String(p.fecha)) : null;
      const v = typeof p?.valor === 'number' ? p.valor : Number(p?.valor ?? 0);
      return (
        f &&
        !isNaN(f.getTime()) &&
        f.getFullYear() === y &&
        f.getMonth() === m &&
        v > 0
      );
    });

    if (pagosMes.length === 0) return false;

    const ultimo = [...pagosMes].sort(
      (a, b) =>
        new Date(String(a.fecha)).getTime() -
        new Date(String(b.fecha)).getTime()
    )[pagosMes.length - 1];

    return Boolean(ultimo?.receiptUrl) && ultimo?.receiptVerified === false;
  }

  // Ahora el estado usa exactamente CarteraInfo
  const [carteraInfo, setCarteraInfo] = useState<CarteraInfo>({
    programaPrice: 0,
    pagosUsuarioPrograma: [],
    totalPagado: 0,
    deuda: 0,
    carnetPolizaUniforme: 0, // inicializado
    derechosGrado: 0, // inicializado
    planType: undefined,
  });

  async function fetchUserCourses(userId: string) {
    const res = await fetch(
      `/api/super-admin/enroll_user_program/coursesUser?userId=${userId}`
    );
    if (!res.ok) throw new Error('Error cargando cursos');
    const data = (await res.json()) as {
      courses: {
        id: string;
        title: string;
        instructor?: string | null;
        instructorName?: string | null;
      }[];
    };
    // des-duplicar y sanitizar
    const unique = Array.from(
      new Map(data.courses.map((c) => [c.id, c])).values()
    ).map((c) => ({
      id: c.id,
      title: c.title,
      instructor: c.instructor ?? undefined,
      instructorName: c.instructorName ?? undefined,
    }));
    setUserCourses(unique);
  }

  const DEFAULT_CUOTAS = 12;
  const DEFAULT_VALOR = 150000;

  const [price, setPrice] = useState<number>(0);

  useEffect(() => {
    if (carteraInfo?.programaPrice) {
      // Si ya hay un plan guardado
      setPrice(carteraInfo.programaPrice);

      // Ajustamos las cuotas al valor existente
      const cuotas = Array.from({ length: DEFAULT_CUOTAS }, (_, idx) => ({
        concepto: `Cuota ${idx + 1}`,
        nro_pago: idx + 1,
        fecha: '',
        metodo: '',
        valor: Math.round(carteraInfo.programaPrice / DEFAULT_CUOTAS),
      }));
      setEditablePagos(cuotas);
    } else {
      // Si no hay plan creado, usamos 12 cuotas por defecto de 150000
      setPrice(DEFAULT_CUOTAS * DEFAULT_VALOR);

      const cuotas = Array.from({ length: DEFAULT_CUOTAS }, (_, idx) => ({
        concepto: `Cuota ${idx + 1}`,
        nro_pago: idx + 1,
        fecha: '',
        metodo: '',
        valor: DEFAULT_VALOR,
      }));
      setEditablePagos(cuotas);
    }
  }, [carteraInfo]);

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
  // Cerrar dropdowns de multiselect al hacer clic fuera
  useEffect(() => {
    function handleClickOutsideMulti(e: MouseEvent) {
      const target = e.target as HTMLElement;

      // No cerrar si se hace clic dentro de un dropdown multiselect
      if (target.closest('[id^="multi-"]')) return;

      // Cerrar todos los dropdowns si se hace clic fuera
      document.querySelectorAll('[id^="multi-"]').forEach((el) => {
        el.classList.add('hidden');
      });
    }
    document.addEventListener('mousedown', handleClickOutsideMulti);
    return () =>
      document.removeEventListener('mousedown', handleClickOutsideMulti);
  }, []);

  async function fetchPagosUsuarioPrograma(
    userId: string,
    programId: string
  ): Promise<Pago[]> {
    const res = await fetch(
      `/api/super-admin/enroll_user_program/programsUser/pagos?userId=${userId}&programId=${programId}`
    );
    if (!res.ok) throw new Error('Error cargando pagos');

    const json: unknown = await res.json();

    const pagos = Array.isArray((json as { pagos?: unknown }).pagos)
      ? ((json as { pagos?: unknown }).pagos as unknown[]).map((p): Pago => {
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
                ? r.fecha
                : null,
            metodo: typeof r.metodo === 'string' ? r.metodo : null,
            valor:
              typeof r.valor === 'string' || typeof r.valor === 'number'
                ? r.valor
                : null,

            // 👇 campos del comprobante original
            receiptUrl:
              typeof r.receiptUrl === 'string' ? r.receiptUrl : undefined,
            receiptName:
              typeof r.receiptName === 'string' ? r.receiptName : undefined,

            // 👇 NUEVOS: verificación + archivo verificado
            receiptVerified:
              typeof r.receiptVerified === 'boolean'
                ? (r.receiptVerified as boolean)
                : false,
            verifiedReceiptUrl:
              typeof r.verifiedReceiptUrl === 'string'
                ? (r.verifiedReceiptUrl as string)
                : undefined,
            verifiedReceiptName:
              typeof r.verifiedReceiptName === 'string'
                ? (r.verifiedReceiptName as string)
                : undefined,
          };
        })
      : [];

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

  // ✅ Función para cargar plantillas de WhatsApp
  const loadWhatsAppTemplates = useCallback(async () => {
    try {
      setWaLoading(true);
      setWaError(null);

      interface WaGetOk {
        templates?: typeof waTemplates;
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
        setWaError(msg);
        return;
      }

      const templates = (raw as WaGetOk)?.templates ?? [];
      setWaTemplates(templates);
    } catch (err) {
      console.error('No se pudieron cargar las plantillas de WhatsApp:', err);
      setWaTemplates([]);
      setWaError('Error de red cargando plantillas');
    } finally {
      setWaLoading(false);
    }
  }, []);

  // ✅ useEffect para cargar plantillas de WhatsApp
  useEffect(() => {
    // Solo cargar si se abre el modal de WhatsApp
    if (showPhoneModal && sendWhatsapp) {
      void loadWhatsAppTemplates();
    }
  }, [showPhoneModal, sendWhatsapp, loadWhatsAppTemplates]);

  // ✅ useMemo para obtener la plantilla seleccionada (como en super-admin/page.tsx)
  const selectedWaTemplate = useMemo(
    () => waTemplates.find((t) => t.name === waSelectedTemplate) ?? null,
    [waSelectedTemplate, waTemplates]
  );

  // ✅ Helpers reutilizables y testeables (como en super-admin/page.tsx)
  const stripHtml = (html: string) =>
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const buildEmailsList = () =>
    Array.from(
      new Set([
        ...students
          .filter((s) => selectedStudents.includes(s.id))
          .map((s) => s.email),
        ...manualEmails,
      ])
    );

  const buildWhatsappNumbers = () => {
    if (!numerosLocales.trim()) return [];

    const onlyDigits = (s: string) => s.replace(/\D/g, '');
    const countryDigits = codigoPais.replace('+', '');

    return Array.from(
      new Set(
        numerosLocales
          .split(',')
          .map((n) => n.trim())
          .filter(Boolean)
          .map((n) => {
            const d = onlyDigits(n);
            return d.startsWith(countryDigits) ? d : countryDigits + d;
          })
          .filter((d) => d.length >= 10)
      )
    );
  };

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
    console.log('📩 Enviando SOLO correo...');

    if (!subject.trim() || !message.trim()) {
      setNotification({
        message: 'Asunto y mensaje son obligatorios para enviar correo',
        type: 'error',
      });
      return;
    }

    const emails = buildEmailsList();
    if (emails.length === 0) {
      setNotification({
        message: 'Debes seleccionar o agregar al menos un correo',
        type: 'error',
      });
      return;
    }

    setLoadingEmail(true);
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

      console.log('✅ Correo enviado con éxito');
      setNotification({
        message: 'Correo enviado correctamente',
        type: 'success',
      });

      // Limpia SOLO lo relativo a correo
      setManualEmails([]);
      setAttachments([]);

      // OJO: NO limpiamos subject/message para que puedas reutilizarlos
    } catch (error) {
      console.error('❌ Error al enviar el correo:', error);
      setNotification({ message: 'Error al enviar el correo', type: 'error' });
    } finally {
      setLoadingEmail(false);
    }
  };

  const sendWhatsApp = async () => {
    console.log('📲 Enviando WhatsApp...');

    const whatsappNumbers = buildWhatsappNumbers();
    if (whatsappNumbers.length === 0) {
      setNotification({
        message: 'Debes ingresar al menos un número válido para WhatsApp',
        type: 'error',
      });
      return;
    }

    const WA_TEXT_ONLY = '__TEXT_ONLY__';
    const textOnly = waSelectedTemplate === WA_TEXT_ONLY;
    const useTemplate =
      Boolean(waSelectedTemplate) && !textOnly && waSelectedTemplate !== '';

    // Si NO es plantilla, exige mensaje
    if (!useTemplate && !waMessageText.trim()) {
      setNotification({
        message: 'Escribe un mensaje para WhatsApp',
        type: 'error',
      });
      return;
    }

    setLoadingWhatsApp(true);

    try {
      const selectedWaTemplate =
        waTemplates.find((t) => t.name === waSelectedTemplate) ?? null;
      const textMessage = `${waSubjectText.trim() ? waSubjectText.trim() + '\n\n' : ''}${stripHtml(waMessageText)}`;

      for (const number of whatsappNumbers) {
        const to = number;

        const body = useTemplate
          ? {
              to,
              forceTemplate: true,
              templateName: waSelectedTemplate,
              languageCode:
                selectedWaTemplate?.language === 'es' ? 'es' : 'en_US',
              variables: waVariables,
            }
          : textOnly
            ? {
                to,
                text: textMessage,
              }
            : {
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

      setNotification({
        message: 'WhatsApp enviado correctamente',
        type: 'success',
      });

      // Limpieza SOLO WhatsApp
      setNumerosLocales('');
      setCodigoPais('+57');
      setWaSelectedTemplate(WA_TEXT_ONLY);
      setWaVariables([]);
      setWaSubjectText('');
      setWaMessageText('');
      setShowWhatsAppModal(false);
    } catch (error) {
      console.error('❌ Error al enviar WhatsApp:', error);
      setNotification({
        message: 'Error al enviar WhatsApp',
        type: 'error',
      });
    } finally {
      setLoadingWhatsApp(false);
    }
  };

  const totalColumns: Column[] = useMemo(
    () => [...columnsWithOptions, ...dynamicColumns],
    [columnsWithOptions, dynamicColumns]
  );
  const [successMessage, setSuccessMessage] = useState('');
  void successMessage;
  const [searchFieldTerm, setSearchFieldTerm] = useState('');
  const filteredColumns = totalColumns.filter((col) =>
    col.label.toLowerCase().includes(searchFieldTerm.toLowerCase())
  );
  const [showCarteraModal, setShowCarteraModal] = useState(false);
  const [carteraUserId, setCarteraUserId] = useState<string | null>(null);
  const [carteraReceipt, setCarteraReceipt] = useState<File | null>(null);
  const fileInputPagoRef = useRef<HTMLInputElement>(null);
  const fileInputCarteraRef = useRef<HTMLInputElement>(null);
  const existingRecord = Boolean(carteraInfo?.programaPrice); // true si ya hay precio guardado
  const userId = currentUser?.id; // o currentUser?.document si prefieres
  const programaId = userPrograms?.[0]?.id; // tomamos el primer programa
  const [bulkSelectOpen, setBulkSelectOpen] = useState(false);
  const handleBulkSelect = (mode: 'visible' | 'all') => {
    setSelectedStudents((prev) => {
      const ids =
        mode === 'all'
          ? sortedStudents.map((s) => s.id) // ✅ TODOS los filtrados (incluye no visibles)
          : displayedStudents.map((s) => s.id); // ✅ SOLO visibles
      const set = new Set(prev);
      ids.forEach((id) => set.add(id));
      return Array.from(set);
    });
    setBulkSelectOpen(false);
  };

  const handleSavePrice = async () => {
    // Guardamos en backend
    await fetch('/api/super-admin/teams/price_program', {
      method: existingRecord ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, programaId, price }),
    });
  };

  const openCarteraModal = async (userId: string) => {
    try {
      setCurrentUserId(userId);
      setCarteraUserId(userId);

      // Cargar programas/cursos en paralelo
      const [progs] = await Promise.all([
        fetchUserPrograms(userId), // devuelve { id, title }[]
        fetchUserCourses(userId),
      ]);

      // Elegir programa preferido (por título) o el primero
      const preferTitle = students.find((s) => s.id === userId)?.programTitle;
      const chosen = progs?.find((p) => p.title === preferTitle) ?? progs?.[0];
      const programId = chosen?.id ?? null;
      setCurrentProgramId(programId);

      if (!programId) {
        // ⬇️ AÚN SIN PROGRAMA: igual traemos pagos (programId=null)
        setCurrentProgramId(null);

        const pagosUsuarioPrograma = await fetchPagosUsuarioPrograma(
          userId,
          'null'
        );

        // Totales básicos (sin depender de helpers externos)
        const toNum = (v: unknown) =>
          typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;

        const totalPagado = pagosUsuarioPrograma.reduce(
          (s, p) => s + (Number.isFinite(toNum(p.valor)) ? toNum(p.valor) : 0),
          0
        );

        // Solo cuotas 1..12 para deuda
        const totalPagadoCuotas = pagosUsuarioPrograma
          .filter((p) => {
            const n = Number(p.nro_pago ?? p.nroPago ?? 0);
            return Number.isFinite(n) && n >= 1 && n <= 12;
          })
          .reduce(
            (s, p) =>
              s + (Number.isFinite(toNum(p.valor)) ? toNum(p.valor) : 0),
            0
          );

        // Usa el precio por defecto que ya manejas (12 x 150000)
        const programaPrice = DEFAULT_CUOTAS * DEFAULT_VALOR;
        const deuda = Math.max(programaPrice - totalPagadoCuotas, 0);

        setCarteraInfo({
          programaPrice,
          pagosUsuarioPrograma,
          totalPagado,
          deuda,
          carnetPolizaUniforme: 0,
          derechosGrado: 0,
          planType: undefined,
        });

        // Mapea y muestra las cuotas reales
        setEditablePagos(mapPagosToEditable(pagosUsuarioPrograma));
        // 👇 NUEVO: actualizar el chip en la lista también cuando NO hay programa
        setStudents((prev) =>
          prev.map((s) =>
            s.id === userId
              ? {
                  ...s,
                  carteraStatus: shouldMarkNoVerificado(pagosUsuarioPrograma)
                    ? 'no verificado'
                    : s.carteraStatus,
                }
              : s
          )
        );

        // Resetear el flag para permitir autocompletado en la próxima apertura
        setShowCarteraModal(true);
        return;
      }

      // ✅ Regla: si viene del backend, usar ese valor tal cual.
      // Si no viene (o no es numérico), usar 1.800.000 (12 x 150.000).
      let programaPrice = DEFAULT_VALOR * DEFAULT_CUOTAS; // 1.800.000 por defecto

      try {
        console.log('🧮 [PRICE] Fetching price_program', { userId, programId });
        const res = await fetch(
          `/api/super-admin/teams/price_program?userId=${userId}&programaId=${programId}`
        );
        console.log('🧮 [PRICE] status:', res.status);

        if (res.ok) {
          const data = (await res.json()) as { price?: number | string };
          const raw = data?.price;
          // normaliza por si llega "1.800.000" o "1,800,000"
          const normalized =
            typeof raw === 'number'
              ? raw
              : raw != null
                ? Number(String(raw).replace(/[^\d.-]/g, ''))
                : NaN;

          console.log('🧮 [PRICE] backend ->', { raw, normalized });

          if (Number.isFinite(normalized)) {
            programaPrice = normalized; // 👉 usa exactamente lo del backend (ej: 150000 o 1800000)
            console.log('✅ [PRICE] Usando precio del backend:', programaPrice);
          } else {
            programaPrice = DEFAULT_VALOR * DEFAULT_CUOTAS; // 1.800.000
            console.warn(
              '⚠️ [PRICE] Backend sin precio válido. Usando 1.800.000'
            );
          }
        } else {
          programaPrice = DEFAULT_VALOR * DEFAULT_CUOTAS; // 1.800.000
          console.warn(
            '⚠️ [PRICE] fetch NO OK. Usando 1.800.000. status=',
            res.status
          );
        }
      } catch (err) {
        programaPrice = DEFAULT_VALOR * DEFAULT_CUOTAS; // 1.800.000
        console.error('❌ [PRICE] Error de red. Usando 1.800.000', err);
      }

      console.log('🏁 [PRICE] programaPrice final:', programaPrice);

      // 2️⃣ Pagos del usuario en ese programa
      const pagosUsuarioPrograma = await fetchPagosUsuarioPrograma(
        userId,
        programId
      );

      // Total pagado (todos los registros, igual que antes)
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

      // ➕ NUEVO: total pagado SOLO por las 12 cuotas (excluye los 3 especiales)
      const ESPECIALES = new Set([
        'PÓLIZA Y CARNET',
        'POLIZA Y CARNET', // por si viene sin tilde
        'UNIFORME',
        'DERECHOS DE GRADO',
      ]);

      const esEspecial = (p: Pago) => {
        const c = (typeof p.concepto === 'string' ? p.concepto : '')
          .toUpperCase()
          .trim();
        if (ESPECIALES.has(c)) return true;
        const n = Number(p.nro_pago ?? p.nroPago);
        return Number.isFinite(n) && n >= 13; // también excluye si viene como 13/14/15
      };

      const totalPagadoCuotas = pagosUsuarioPrograma
        .filter((p) => !esEspecial(p))
        .reduce((sum: number, p: Pago) => {
          const v =
            typeof p.valor === 'string'
              ? Number(p.valor)
              : typeof p.valor === 'number'
                ? p.valor
                : 0;
          return sum + (Number.isFinite(v) ? v : 0);
        }, 0);

      // ⬅️ Deuda = precio total - (solo cuotas)
      const deuda = Math.max(programaPrice - totalPagadoCuotas, 0);

      // Guardar en state

      // Montos detectados por concepto
      const toNumber = (v: unknown) =>
        typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;
      const findMonto = (regex: RegExp) => {
        const pago = pagosUsuarioPrograma.find((p) =>
          (p.concepto ?? '').toLowerCase().match(regex)
        );
        return toNumber(pago?.valor);
      };
      void findMonto;

      setCarteraInfo({
        programaPrice,
        pagosUsuarioPrograma,
        totalPagado,
        deuda,
        carnetPolizaUniforme: 0, // o el valor real que corresponda
        derechosGrado: 0, // o el valor real que corresponda
        planType: undefined, // opcional
      });

      setEditablePagos(() => {
        const norm = mapPagosToEditable(pagosUsuarioPrograma);

        let baseIndex = norm.findIndex(
          (r) => typeof r?.fecha === 'string' && r.fecha.trim() !== ''
        );
        const baseISO =
          baseIndex >= 0
            ? (norm[baseIndex]!.fecha as string)
            : new Date().toISOString().split('T')[0];
        if (baseIndex < 0) baseIndex = 0;

        const next = norm.map((r, i) => {
          const hasFecha =
            typeof r?.fecha === 'string' && r.fecha.trim() !== '';
          if (hasFecha) return r;
          // sólo autocompleta cuotas 0..11
          if (i <= 11)
            return { ...r, fecha: addMonthsKeepingDay(baseISO, i - baseIndex) };
          return r; // especiales intactos
        });

        return next;
      });

      // Abrir modal
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
  useEffect(() => {
    // Solo ejecutar cuando hay datos de pagos
    if (!carteraInfo?.pagosUsuarioPrograma) return;

    const norm = mapPagosToEditable(carteraInfo.pagosUsuarioPrograma);
    const baseIndex = norm.findIndex(
      (r) => typeof r?.fecha === 'string' && r.fecha.trim() !== ''
    );

    // Si no hay ninguna fecha, solo mapear
    if (baseIndex === -1) {
      setEditablePagos(norm);
      return;
    }

    const baseISO = norm[baseIndex]!.fecha as string;

    // Autocompletar fechas vacías mes a mes
    const filled = norm.map((r, i) => {
      const hasFecha = typeof r.fecha === 'string' && r.fecha.trim() !== '';
      if (hasFecha) return r; // Ya tiene fecha, mantenerla

      // Solo autocompleta cuotas 0..11 que estén vacías
      if (i <= 11) {
        return { ...r, fecha: addMonthsKeepingDay(baseISO, i - baseIndex) };
      }

      return r; // Especiales sin tocar
    });

    setEditablePagos(filled);
  }, [
    carteraInfo?.pagosUsuarioPrograma,
    addMonthsKeepingDay,
    mapPagosToEditable,
  ]);
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

      const studentsFilteredByRole: Student[] = data.students
        .filter((s) => s.role === 'estudiante')
        .map((s) => {
          const showNOW = !!s.isSubOnly;

          const enrolledInCourseLabel: 'Sí' | 'No' = s.enrolledInCourse
            ? 'Sí'
            : 'No';

          const displayName = s.isNew ? `${s.name} (NEW)` : s.name;

          const computedByDate: 'activo' | 'inactivo' =
            s.subscriptionEndDate &&
            new Date(s.subscriptionEndDate) >= new Date()
              ? 'activo'
              : 'inactivo';

          const validEnrollmentStatuses = [
            'Nuevo',
            'Graduando',
            'Egresado',
            'Aplaza',
            'Retirado',
            'Estudiante',
          ];
          const trimmedEnrollmentStatus = (s.enrollmentStatus ?? '')
            .toString()
            .trim();
          const enrollmentStatusValue = validEnrollmentStatuses.includes(
            trimmedEnrollmentStatus
          )
            ? (trimmedEnrollmentStatus as
                | 'Nuevo'
                | 'Graduando'
                | 'Egresado'
                | 'Aplaza'
                | 'Retirado'
                | 'Estudiante')
            : 'Nuevo';

          const obj: Student = {
            ...s,
            name: displayName,
            programTitle: showNOW
              ? 'NOW'
              : (enrolledMap.get(s.id) ?? 'No inscrito'),
            courseTitle: showNOW ? 'NOW' : (s.courseTitle ?? 'Sin curso'),
            enrolledInCourseLabel,
            nivelNombre: s.nivelNombre ?? 'No definido',
            planType: s.planType ?? undefined,
            inscripcionOrigen: (s.inscripcionOrigen ?? 'artiefy') as
              | 'formulario'
              | 'artiefy',
            carteraStatus: (s.carteraStatus ?? computedByDate) as
              | 'activo'
              | 'inactivo'
              | 'no verificado',
            // Aseguramos que subscriptionEndDate sea string o null (no undefined)
            subscriptionEndDate:
              typeof s.subscriptionEndDate === 'string' &&
              s.subscriptionEndDate.trim() !== ''
                ? s.subscriptionEndDate
                : Object.prototype.toString.call(s.subscriptionEndDate) ===
                    '[object Date]'
                  ? (s.subscriptionEndDate as unknown as Date).toISOString()
                  : s.subscriptionEndDate != null
                    ? String(s.subscriptionEndDate)
                    : null,
            userInscriptionDetails: s.userInscriptionDetails,
            enrollmentStatus: enrollmentStatusValue,
          };

          return obj;
        });

      setStudents(studentsFilteredByRole as Student[]);

      setAvailableCourses(data.courses);

      // ✅ 1) Columnas dinámicas desde userInscriptionDetails.*
      const allUIDKeys = new Set<string>();
      for (const s of studentsFilteredByRole) {
        const uid = (s as Student).userInscriptionDetails;
        if (uid && typeof uid === 'object') {
          Object.keys(uid).forEach((k) => allUIDKeys.add(k));
        }
      }
      const dynamicUIDColumns: Column[] = Array.from(allUIDKeys).map((key) => ({
        id: `userInscriptionDetails.${key}`,
        label: humanizeKey(String(key)),
        defaultVisible: true,
        type: 'text',
      }));

      // ✅ 2) Columnas dinámicas desde users.* (todas las keys del usuario que no estén ya en allColumns)
      const knownIds = new Set(allColumns.map((c) => c.id));
      const dynamicUserKeys = new Set<string>();

      for (const student of studentsFilteredByRole as Student[]) {
        // Recolecta claves top-level del objeto usuario
        const studentKeys = Object.keys(
          student as unknown as Record<string, unknown>
        );
        studentKeys.forEach((k) => {
          if (
            !knownIds.has(k) && // no duplicar las ya definidas
            k !== 'userInscriptionDetails' && // ya lo tratamos arriba
            k !== 'programTitles' &&
            k !== 'courseTitles' &&
            k !== 'enrolledInCourseLabel' &&
            k !== 'isNew' &&
            k !== 'isSubOnly' &&
            k !== 'enrolledInCourse'
          ) {
            dynamicUserKeys.add(k);
          }
        });
      }

      const dynamicUserColumns: Column[] = Array.from(dynamicUserKeys).map(
        (key) => ({
          id: key,
          label: humanizeKey(key),
          defaultVisible: true, // ponlo visible por defecto si quieres verlos ya
          type: 'text',
        })
      );

      // ✅ 3) Unimos ambas fuentes dinámicas
      setDynamicColumns([...dynamicUserColumns, ...dynamicUIDColumns]);
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
      void showWhatsAppModal;

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
          selectedPrograms.length
            ? (student.programTitles ?? []).some((t) =>
                selectedPrograms.includes(String(t).trim())
              )
            : true
        )

        // Filtros por columnas dinámicas (incluye customFields) - AHORA CON MULTISELECT
        .filter((student) => {
          // Filtros de texto (columnFilters)
          const passesTextFilters = Object.entries(columnFilters ?? {}).every(
            ([key, value]) => {
              if (!value) return true;

              const studentValue = getValueForColumn(student, key);

              // ⚠️ Caso especial: carteraStatus puede ser "derivado" = "No verificado"
              if (key === 'carteraStatus') {
                const base = safeToString(studentValue);
                let ui = base;
                if (student.id === currentUserId) {
                  const hoy = new Date();
                  const y = hoy.getFullYear();
                  const m = hoy.getMonth();

                  const pagosMes = (editablePagos ?? []).filter((p) => {
                    const f = p?.fecha ? new Date(String(p.fecha)) : null;
                    const v =
                      typeof p?.valor === 'number'
                        ? p.valor
                        : Number(p?.valor ?? 0);
                    return (
                      f &&
                      !isNaN(f.getTime()) &&
                      f.getFullYear() === y &&
                      f.getMonth() === m &&
                      v > 0
                    );
                  });

                  if (pagosMes.length > 0) {
                    const ultimo = [...pagosMes].sort(
                      (a, b) =>
                        new Date(String(a.fecha)).getTime() -
                        new Date(String(b.fecha)).getTime()
                    )[pagosMes.length - 1];

                    if (
                      ultimo?.receiptUrl &&
                      ultimo?.receiptVerified === false
                    ) {
                      ui = 'no verificado';
                    }
                  }
                }

                return ui.toLowerCase().includes(value.toLowerCase());
              }

              if (!studentValue) return false;

              if (key === 'subscriptionEndDate') {
                const dateStr = safeToString(studentValue);
                return new Date(dateStr).toISOString().split('T')[0] === value;
              }

              const safeStudentValue = safeToString(studentValue);
              return safeStudentValue
                .toLowerCase()
                .includes(value.toLowerCase());
            }
          );

          const passesMultiFilters = Object.entries(columnFiltersMulti).every(
            ([key, selectedValues]) => {
              if (!selectedValues || selectedValues.length === 0) return true;

              const studentValue = getValueForColumn(student, key);
              const safeStudentValue = safeToString(studentValue);

              // Si es carteraStatus, usar la lógica derivada
              if (key === 'carteraStatus') {
                const base = safeToString(studentValue);
                let ui = base;
                if (student.id === currentUserId) {
                  const hoy = new Date();
                  const y = hoy.getFullYear();
                  const m = hoy.getMonth();

                  const pagosMes = (editablePagos ?? []).filter((p) => {
                    const f = p?.fecha ? new Date(String(p.fecha)) : null;
                    const v =
                      typeof p?.valor === 'number'
                        ? p.valor
                        : Number(p?.valor ?? 0);
                    return (
                      f &&
                      !isNaN(f.getTime()) &&
                      f.getFullYear() === y &&
                      f.getMonth() === m &&
                      v > 0
                    );
                  });

                  if (pagosMes.length > 0) {
                    const ultimo = [...pagosMes].sort(
                      (a, b) =>
                        new Date(String(a.fecha)).getTime() -
                        new Date(String(b.fecha)).getTime()
                    )[pagosMes.length - 1];

                    if (
                      ultimo?.receiptUrl &&
                      ultimo?.receiptVerified === false
                    ) {
                      ui = 'no verificado';
                    }
                  }
                }

                return selectedValues.some((v) =>
                  ui.toLowerCase().includes(v.toLowerCase())
                );
              }

              return selectedValues.some((v) =>
                safeStudentValue.toLowerCase().includes(v.toLowerCase())
              );
            }
          );

          return passesTextFilters && passesMultiFilters;
        })

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
          filters.enrollmentStatus
            ? (s.enrollmentStatus ?? '').trim() === filters.enrollmentStatus
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

        // ✅ FILTROS AVANZADOS tipo Excel
        .filter((student) => {
          return Object.entries(advancedFilters).every(
            ([colId, selectedValues]) => {
              if (!selectedValues || selectedValues.length === 0) return true;

              const studentValue = getValueForColumn(student, colId);
              const safeStudentValue = safeToString(studentValue).trim();

              // Si es carteraStatus, usar la lógica derivada
              if (colId === 'carteraStatus') {
                const base = safeToString(studentValue);
                let ui = base;
                if (student.id === currentUserId) {
                  const hoy = new Date();
                  const y = hoy.getFullYear();
                  const m = hoy.getMonth();

                  const pagosMes = (editablePagos ?? []).filter((p) => {
                    const f = p?.fecha ? new Date(String(p.fecha)) : null;
                    const v =
                      typeof p?.valor === 'number'
                        ? p.valor
                        : Number(p?.valor ?? 0);
                    return (
                      f &&
                      !isNaN(f.getTime()) &&
                      f.getFullYear() === y &&
                      f.getMonth() === m &&
                      v > 0
                    );
                  });

                  if (pagosMes.length > 0) {
                    const ultimo = [...pagosMes].sort(
                      (a, b) =>
                        new Date(String(a.fecha)).getTime() -
                        new Date(String(b.fecha)).getTime()
                    )[pagosMes.length - 1];

                    if (
                      ultimo?.receiptUrl &&
                      ultimo?.receiptVerified === false
                    ) {
                      ui = 'no verificado';
                    }
                  }
                }

                return selectedValues.some((v) =>
                  ui.toLowerCase().includes(v.toLowerCase())
                );
              }

              return selectedValues.some(
                (filterVal) =>
                  safeStudentValue.toLowerCase() === filterVal.toLowerCase() ||
                  safeStudentValue
                    .toLowerCase()
                    .includes(filterVal.toLowerCase())
              );
            }
          );
        })

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

  const columnFilterOptions = useMemo(() => {
    const options: Record<string, (string | null | undefined)[]> = {};

    totalColumns.forEach((col) => {
      const values: (string | null | undefined)[] = [];
      students.forEach((student) => {
        const value = getValueForColumn(student, col.id);
        if (value !== null && value !== undefined) {
          values.push(safeToString(value));
        }
      });
      options[col.id] = values;
    });

    return options;
  }, [students, totalColumns]);

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
    const [fieldType, setFieldType] = useState('text');
    const [fieldDescription, setFieldDescription] = useState('');
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
              fieldType,
              fieldDescription,
              fieldValue,
            }),
          }
        );

        if (res.ok) {
          alert('Columna agregada correctamente');
          setFieldKey('');
          setFieldType('text');
          setFieldDescription('');
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
          placeholder="Nombre del campo"
          value={fieldKey}
          onChange={(e) => setFieldKey(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-800 p-2 transition focus:ring-2 focus:ring-blue-500 focus:outline-none sm:flex-1"
        />
        <input
          type="text"
          placeholder="Descripción (opcional)"
          value={fieldDescription}
          onChange={(e) => setFieldDescription(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-800 p-2 transition focus:ring-2 focus:ring-blue-500 focus:outline-none sm:flex-1"
        />
        <select
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-800 p-2 transition focus:ring-2 focus:ring-blue-500 focus:outline-none sm:flex-1"
        >
          <option value="text">Texto</option>
          <option value="integer">Número entero</option>
          <option value="decimal">Decimal</option>
          <option value="boolean">Booleano</option>
          <option value="date">Fecha</option>
          <option value="timestamp">Fecha y hora</option>
        </select>
        <input
          type="text"
          placeholder="Valor inicial (opcional)"
          value={fieldValue}
          onChange={(e) => setFieldValue(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-800 p-2 transition focus:ring-2 focus:ring-blue-500 focus:outline-none sm:flex-1"
        />
        <button
          disabled={loading || !fieldKey}
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
    console.log('🔧 [updateStudentField] Iniciando actualización:', {
      userId,
      field,
      value,
    });

    const student = students.find((s) => s.id === userId);
    if (!student) {
      console.error(
        '❌ [updateStudentField] Estudiante no encontrado:',
        userId
      );
      return;
    }
    const updatedStudent = { ...student };
    // Asigna directamente sobre el student (todo viene de users.*)
    if (field in updatedStudent) {
      (updatedStudent as Record<string, unknown>)[field] = value;
    }
    // Soporte edición en tabla para dinámicos
    if (field.startsWith('userInscriptionDetails.')) {
      const k = field.split('.')[1] ?? '';
      updatedStudent.userInscriptionDetails = {
        ...(updatedStudent.userInscriptionDetails ?? {}),
        [k]: value,
      };
    } else if (!(field in updatedStudent)) {
      (updatedStudent as Record<string, unknown>)[field] = value;
    }

    const nameParts = String(updatedStudent.name ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const firstNameVal = nameParts.length > 0 ? nameParts[0] : '';
    const lastNameVal =
      nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const payload: Record<string, unknown> = {
      userId: updatedStudent.id,
      firstName: firstNameVal,
      lastName: lastNameVal,
      email: updatedStudent.email, // siempre incluir
      role: updatedStudent.role ?? 'estudiante',
      status: updatedStudent.subscriptionStatus,
      permissions: [],

      // datos básicos
      phone: updatedStudent.phone,
      address: updatedStudent.address,
      city: updatedStudent.city,
      country: updatedStudent.country,
      birthDate: updatedStudent.birthDate,

      // plan / fechas
      planType: updatedStudent.planType,
      purchaseDate: updatedStudent.purchaseDate,
      subscriptionEndDate: updatedStudent.subscriptionEndDate
        ? new Date(updatedStudent.subscriptionEndDate)
            .toISOString()
            .split('T')[0]
        : null,

      // 🔽 AHORA los de inscripción (users.*)
      document: updatedStudent.document,
      modalidad: updatedStudent.modalidad,
      inscripcionValor: updatedStudent.inscripcionValor,
      paymentMethod: updatedStudent.paymentMethod,
      cuota1Fecha: updatedStudent.cuota1Fecha,
      cuota1Metodo: updatedStudent.cuota1Metodo,
      cuota1Valor: updatedStudent.cuota1Valor,
      valorPrograma: updatedStudent.valorPrograma,

      identificacionTipo: updatedStudent.identificacionTipo,
      identificacionNumero: updatedStudent.identificacionNumero,
      nivelEducacion: updatedStudent.nivelEducacion,
      tieneAcudiente: updatedStudent.tieneAcudiente,
      acudienteNombre: updatedStudent.acudienteNombre,
      acudienteContacto: updatedStudent.acudienteContacto,
      acudienteEmail: updatedStudent.acudienteEmail,

      programa: updatedStudent.programa,
      fechaInicio: updatedStudent.fechaInicio,
      comercial: updatedStudent.comercial,
      sede: updatedStudent.sede,
      horario: updatedStudent.horario,
      numeroCuotas: updatedStudent.numeroCuotas,
      pagoInscripcion: updatedStudent.pagoInscripcion,
      pagoCuota1: updatedStudent.pagoCuota1,

      idDocKey: updatedStudent.idDocKey,
      utilityBillKey: updatedStudent.utilityBillKey,
      diplomaKey: updatedStudent.diplomaKey,
      pagareKey: updatedStudent.pagareKey,

      enrollmentStatus:
        field === 'enrollmentStatus' ? value : updatedStudent.enrollmentStatus,
    };
    // Inyectar dinámicos en el payload

    // Mantén la lógica de programTitle / courseTitle tal cual
    if (field === 'programTitle') {
      const prog = programs.find((p) => p.title === value);
      if (prog) payload.programId = Number(prog.id);
    }
    if (field === 'courseTitle') {
      const curso = availableCourses.find((c) => c.title === value);
      if (curso) payload.courseId = Number(curso.id);
    }

    console.log(
      '📤 [updateStudentField] Payload completo:',
      JSON.stringify(payload, null, 2)
    );
    console.log('📧 [updateStudentField] Email en payload:', payload.email);

    if (field === 'programTitle') {
      const prog = programs.find((p) => p.title === value);
      if (prog) {
        payload.programId = Number(prog.id);
        console.log('🎓 [updateStudentField] Programa encontrado:', prog.id);
      }
    }

    if (field === 'courseTitle') {
      const curso = availableCourses.find((c) => c.title === value);
      if (curso) {
        payload.courseId = Number(curso.id);
        console.log('📚 [updateStudentField] Curso encontrado:', curso.id);
      }
    }

    console.log('🚀 [updateStudentField] Enviando request a API...');
    const res = await fetch('/api/super-admin/udateUser/updateUserDinamic', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('📡 [updateStudentField] Response status:', res.status);

    if (!res.ok) {
      const data: unknown = await res.json();
      const errorData = errorResponseSchema.parse(data);
      console.error(
        '❌ [updateStudentField] Error del servidor:',
        errorData.error
      );
      alert(`❌ Error al guardar: ${errorData.error}`);
    } else {
      console.log('✅ [updateStudentField] Actualización exitosa');
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

      <div className="min-h-screen space-y-8 bg-gray-900 p-6 text-white print:hidden">
        <div
          ref={headerRef}
          className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
        >
          <h1 className="text-2xl font-bold">Matricular Estudiantes</h1>

          <div className="relative w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateForm(true)}
                className="group/button relative inline-flex items-center gap-1 overflow-hidden rounded-md border border-white/20 bg-background px-2 py-1.5 text-xs text-primary transition hover:bg-primary/10 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
              >
                <span className="relative z-10 font-medium">Crear Usuario</span>
                <UserPlus className="relative z-10 size-3.5 sm:size-4" />
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
              </button>

              <button
                onClick={() => {
                  setSendWhatsapp(false);
                  setShowPhoneModal(true);
                }}
                className="group/button relative inline-flex items-center gap-1 overflow-hidden rounded-md border border-white/20 bg-background px-2 py-1.5 text-xs text-primary transition hover:bg-primary/10 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
              >
                <span className="relative z-10 font-medium">📧 Correo</span>
                <Mail className="relative z-10 size-3.5 sm:size-4" />
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
              </button>

              <button
                onClick={() => {
                  setSendWhatsapp(true);
                  setShowPhoneModal(true);
                }}
                className="group/button relative inline-flex items-center gap-1 overflow-hidden rounded-md border border-white/20 bg-background px-2 py-1.5 text-xs text-primary transition hover:bg-primary/10 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
              >
                <span className="relative z-10 font-medium">💬 WhatsApp</span>
                <MessageCircle className="relative z-10 size-3.5 sm:size-4" />
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
            <option value="">Estado Suscripción</option>
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

          {/* Filtro: Programas (multiselect con búsqueda y chips) */}
          <div ref={programRef} className="relative">
            <label className="mb-1 block text-sm text-gray-300">
              Programas
            </label>

            {/* “Input” con chips + búsqueda */}
            <div
              onClick={() => setProgramOpen(true)}
              className="flex min-h-[40px] w-full cursor-text flex-wrap items-center gap-1 rounded border border-gray-700 bg-gray-800 px-2 py-1 focus-within:ring-2 focus-within:ring-blue-500"
            >
              {selectedPrograms.length === 0 && (
                <span className="px-1 text-sm text-gray-400">
                  Selecciona programas…
                </span>
              )}

              {/* Chips seleccionados (reducidos / truncados) */}
              {selectedPrograms.map((p) => (
                <span
                  key={p}
                  className="group inline-flex max-w-[160px] items-center gap-1 truncate rounded bg-blue-700/70 px-2 py-0.5 text-xs"
                  title={p}
                >
                  <span className="truncate">{p}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProgram(p);
                    }}
                    className="opacity-80 transition group-hover:opacity-100"
                    aria-label={`Quitar ${p}`}
                  >
                    ×
                  </button>
                </span>
              ))}

              {/* Input de búsqueda dentro del “input” */}
              <input
                type="text"
                value={programQuery}
                onChange={(e) => setProgramQuery(e.target.value)}
                onFocus={() => setProgramOpen(true)}
                placeholder={selectedPrograms.length ? '' : ''}
                className="min-w-[80px] flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
              />
            </div>

            {/* Dropdown de opciones */}
            {programOpen && (
              <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded border border-gray-700 bg-gray-800 shadow-xl">
                {filteredProgramOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-400">
                    Sin resultados
                  </div>
                ) : (
                  filteredProgramOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        toggleProgram(opt);
                        setProgramQuery('');
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-700"
                    >
                      <span>{opt}</span>
                      {selectedPrograms.includes(opt) && <span>✓</span>}
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedPrograms.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedPrograms([])}
                className="mt-1 rounded bg-gray-700 px-2 py-1 text-xs"
              >
                Limpiar selección
              </button>
            )}
          </div>

          {/* Botón para limpiar todos los filtros */}
          {(filters.name ||
            filters.email ||
            filters.subscriptionStatus ||
            filters.enrollmentStatus ||
            filters.purchaseDateFrom ||
            filters.purchaseDateTo ||
            selectedPrograms.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setFilters({
                  name: '',
                  email: '',
                  subscriptionStatus: '',
                  enrollmentStatus: '',
                  purchaseDateFrom: '',
                  purchaseDateTo: '',
                });
                setSelectedPrograms([]);
              }}
              className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 active:bg-red-800"
              title="Limpiar todos los filtros"
            >
              🗑️ Limpiar Filtros
            </button>
          )}
        </div>

        {/* TABS DE ESTADO DE INSCRIPCIÓN - ESTILO IMAGEN */}
        <div className="mb-6 border-b border-gray-700">
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-4">
            {/* Botón "Todos" */}
            <button
              onClick={() => setFilters({ ...filters, enrollmentStatus: '' })}
              className={`rounded-t-lg px-4 py-2 font-semibold whitespace-nowrap transition-all ${
                filters.enrollmentStatus === ''
                  ? 'border-b-2 border-cyan-400 text-white'
                  : 'border-b-2 border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Todos
            </button>

            {/* Tabs por estado */}
            {enrollmentStatusOptions.map((status) => (
              <button
                key={status}
                onClick={() =>
                  setFilters({ ...filters, enrollmentStatus: status })
                }
                className={`relative rounded-t-lg px-4 py-2 font-semibold whitespace-nowrap transition-all ${
                  filters.enrollmentStatus === status
                    ? 'border-b-2 border-cyan-400 text-white'
                    : 'border-b-2 border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                {status}
                {enrollmentStatusCounts[status] > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-cyan-500 px-2 py-0.5 text-xs font-bold text-slate-950">
                    {enrollmentStatusCounts[status]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            Seleccionar Estudiantes
          </h2>
          <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-gray-300 sm:text-sm">
            <span>
              Seleccionados: <strong>{selectedStudents.length}</strong> /{' '}
              {sortedStudents.length}
            </span>
            <span className="opacity-70">
              (Visibles: {displayedStudents.length})
            </span>
            {selectedStudents.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedStudents([])}
                className="rounded bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600"
                title="Limpiar selección"
              >
                Limpiar
              </button>
            )}
            {Object.keys(advancedFilters).some(
              (k) => (advancedFilters[k]?.length ?? 0) > 0
            ) && (
              <button
                type="button"
                onClick={() => setAdvancedFilters({})}
                className="rounded bg-blue-700 px-2 py-1 text-xs font-medium hover:bg-blue-600"
                title="Limpiar filtros avanzados"
              >
                ✓ Limpiar filtros avanzados
              </button>
            )}
          </div>

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
                      onChange={(e) => {
                        if (e.target.checked) {
                          // ✨ Abrir modal para elegir "visibles" o "todos"
                          setBulkSelectOpen(true);
                        } else {
                          // ✅ Mantiene el comportamiento actual: deselecciona SOLO lo visible
                          setSelectedStudents((prev) =>
                            prev.filter(
                              (id) =>
                                !displayedStudents.some((s) => s.id === id)
                            )
                          );
                        }
                      }}
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
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate">{col.label}</span>
                            <button
                              onClick={(e) => {
                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                setAdvancedFilterMenuPos({
                                  top: rect.bottom + 4,
                                  left: rect.left,
                                  width: rect.width,
                                });
                                setAdvancedFilterOpen(col.id);
                              }}
                              className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs transition ${
                                (advancedFilters[col.id]?.length ?? 0) > 0
                                  ? 'bg-blue-600 hover:bg-blue-700'
                                  : 'bg-gray-700 hover:bg-gray-600'
                              }`}
                              title="Filtro avanzado"
                            >
                              <ChevronDown className="size-3.5" />
                              {(advancedFilters[col.id]?.length ?? 0) > 0 && (
                                <span className="ml-0.5 text-xs font-semibold">
                                  {advancedFilters[col.id]?.length}
                                </span>
                              )}
                            </button>
                          </div>
                          {col.type === 'select' ? (
                            <div className="relative">
                              {/* Input que muestra chips seleccionados */}
                              <div
                                onClick={(e) => {
                                  const elem = document.getElementById(
                                    `multi-${col.id}`
                                  );
                                  if (!elem) return;

                                  const isHidden =
                                    elem.classList.contains('hidden');

                                  // Cerrar todos los demás dropdowns
                                  document
                                    .querySelectorAll('[id^="multi-"]')
                                    .forEach((el) => {
                                      if (el.id !== `multi-${col.id}`)
                                        el.classList.add('hidden');
                                    });

                                  if (isHidden) {
                                    // Posicionar el dropdown justo debajo del input
                                    const rect =
                                      e.currentTarget.getBoundingClientRect();
                                    elem.style.top = `${rect.bottom + 4}px`;
                                    elem.style.left = `${rect.left}px`;
                                    elem.style.width = `${rect.width}px`;
                                    elem.classList.remove('hidden');
                                  } else {
                                    elem.classList.add('hidden');
                                  }
                                }}
                                className="flex min-h-[32px] w-full cursor-pointer flex-wrap items-center gap-1 rounded bg-gray-700 px-2 py-1 text-xs sm:text-sm"
                              >
                                {(columnFiltersMulti[col.id] || []).length ===
                                  0 && (
                                  <span className="text-gray-400">Todos</span>
                                )}
                                {(columnFiltersMulti[col.id] || []).map(
                                  (val) => (
                                    <span
                                      key={val}
                                      className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-0.5 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setColumnFiltersMulti((prev) => ({
                                          ...prev,
                                          [col.id]: (prev[col.id] || []).filter(
                                            (v) => v !== val
                                          ),
                                        }));
                                      }}
                                    >
                                      {val}
                                      <span className="cursor-pointer">×</span>
                                    </span>
                                  )
                                )}
                              </div>

                              {/* Dropdown de opciones - AHORA CON POSITION FIXED */}
                              <div
                                id={`multi-${col.id}`}
                                className="fixed z-[60] hidden max-h-64 overflow-auto rounded border border-gray-600 bg-gray-800 shadow-2xl"
                                style={{ minWidth: '200px' }}
                              >
                                {col.options?.map((opt) => {
                                  const isSelected = (
                                    columnFiltersMulti[col.id] || []
                                  ).includes(opt);
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => {
                                        setColumnFiltersMulti((prev) => {
                                          const current = prev[col.id] || [];
                                          return {
                                            ...prev,
                                            [col.id]: isSelected
                                              ? current.filter((v) => v !== opt)
                                              : [...current, opt],
                                          };
                                        });
                                      }}
                                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-gray-700 sm:text-sm"
                                    >
                                      <span>{opt}</span>
                                      {isSelected && <span>✓</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
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
                        let raw = safeToString(
                          getValueForColumn(student, col.id)
                        );
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
                          // Estado base según el dato del alumno
                          const esAlDiaBase = raw === 'activo';

                          // 🔎 Reglas "No verificado" usando los pagos cargados del alumno actualmente abierto
                          // (solo podemos evaluar para el alumno activo en la modal)
                          const pagosParaEvaluar =
                            student.id === currentUserId ? editablePagos : [];

                          const hoy = new Date();
                          const y = hoy.getFullYear();
                          const m = hoy.getMonth();

                          const pagosMes = pagosParaEvaluar.filter((p) => {
                            const f = p?.fecha
                              ? new Date(String(p.fecha))
                              : null;
                            const v =
                              typeof p?.valor === 'number'
                                ? p.valor
                                : Number(p?.valor ?? 0);
                            return (
                              f &&
                              !isNaN(f.getTime()) &&
                              f.getFullYear() === y &&
                              f.getMonth() === m &&
                              v > 0
                            );
                          });

                          let etiqueta:
                            | 'Al día'
                            | 'En cartera'
                            | 'No verificado' = esAlDiaBase
                            ? 'Al día'
                            : 'En cartera';

                          if (pagosMes.length > 0) {
                            const ultimo = [...pagosMes].sort(
                              (a, b) =>
                                new Date(String(a.fecha)).getTime() -
                                new Date(String(b.fecha)).getTime()
                            )[pagosMes.length - 1];

                            // ✔️ Si el último pago del mes tiene comprobante y está no verificado → "No verificado"
                            if (
                              ultimo?.receiptUrl &&
                              ultimo?.receiptVerified === false
                            ) {
                              etiqueta = 'No verificado';
                            }
                          }

                          const badgeClass =
                            etiqueta === 'Al día'
                              ? 'bg-green-600'
                              : etiqueta === 'No verificado'
                                ? 'bg-gray-600'
                                : 'bg-red-600';

                          return (
                            <td
                              key={col.id}
                              className="px-4 py-2 align-top whitespace-nowrap"
                            >
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}
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

        {advancedFilterOpen && (
          <AdvancedFilterMenu
            columnId={advancedFilterOpen}
            columnLabel={
              totalColumns.find((c) => c.id === advancedFilterOpen)?.label ??
              advancedFilterOpen
            }
            columnType={
              totalColumns.find((c) => c.id === advancedFilterOpen)?.type ??
              'text'
            }
            allValues={columnFilterOptions[advancedFilterOpen] || []}
            currentFilters={advancedFilters[advancedFilterOpen] || []}
            onApplyFilters={(filters) => {
              setAdvancedFilters((prev) => ({
                ...prev,
                [advancedFilterOpen]: filters,
              }));
              setAdvancedFilterOpen(null);
            }}
            onClose={() => setAdvancedFilterOpen(null)}
            position={advancedFilterMenuPos ?? undefined}
          />
        )}
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
            className="w-full rounded bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:flex-1"
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
                  userCourses.map((c) => {
                    const instructorName =
                      c.instructorName ?? c.instructor ?? 'Sin instructor';
                    return (
                      <li
                        key={c.id}
                        className="text-gray-900 dark:text-gray-100"
                      >
                        <div>• {c.title}</div>
                        <div className="mt-0.5 ml-4 text-xs text-emerald-600 dark:text-emerald-400">
                          👨‍🏫 {instructorName}
                        </div>
                      </li>
                    );
                  })
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
                className="mt-4 flex w-full justify-center rounded-md bg-primary px-4 py-2 font-bold text-white hover:bg-secondary"
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
            <div className="relative max-h-screen w-full max-w-3xl overflow-y-auto rounded-lg bg-gray-900 p-6 text-white shadow-2xl">
              <button
                onClick={() => setShowPhoneModal(false)}
                className="absolute top-4 right-4 text-white hover:text-red-500"
              >
                <X size={24} />
              </button>

              <h2 className="mb-6 text-center text-3xl font-bold">
                Enviar Correo y/o WhatsApp
              </h2>

              {/* Tabs para Email y WhatsApp */}
              <div className="mb-6 flex gap-2 border-b border-gray-700">
                <button
                  onClick={() => setSendWhatsapp(false)}
                  className={`px-4 py-2 font-semibold transition ${
                    !sendWhatsapp
                      ? 'border-b-2 border-blue-500 text-blue-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📧 Correo
                </button>
                <button
                  onClick={() => setSendWhatsapp(true)}
                  className={`px-4 py-2 font-semibold transition ${
                    sendWhatsapp
                      ? 'border-b-2 border-green-500 text-green-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📱 WhatsApp
                </button>
              </div>

              {/* TAB: CORREO */}
              {!sendWhatsapp && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Agregar correo manual
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="ejemplo@correo.com"
                        value={newManualEmail}
                        onChange={(e) => setNewManualEmail(e.target.value)}
                        className="flex-1 rounded border bg-gray-800 p-2"
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
                        className="rounded bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700"
                      >
                        ➕ Agregar
                      </button>
                    </div>
                  </div>

                  {/* Correos finales */}
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">
                      Correos destinatarios:
                    </h3>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {buildEmailsList().map((email, idx) => (
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
                      {buildEmailsList().length === 0 && (
                        <div className="text-gray-400">
                          Sin correos seleccionados
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Asunto y Mensaje */}
                  <div>
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
                  </div>

                  {/* Adjuntos */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Adjuntos (opcional)
                    </label>
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
                    {attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {attachments.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded bg-gray-800 p-2"
                          >
                            <span className="text-sm">{file.name}</span>
                            <button
                              onClick={() =>
                                setAttachments((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                              className="text-red-400 hover:text-red-600"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Botón enviar correo */}
                  <div className="mt-6 flex justify-center gap-4">
                    <button
                      onClick={sendEmail}
                      className="rounded bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      disabled={loadingEmail}
                    >
                      {loadingEmail ? '⏳ Enviando...' : '✉️ Enviar Correo'}
                    </button>
                    <button
                      onClick={() => setShowPhoneModal(false)}
                      className="rounded bg-gray-700 px-6 py-3 font-semibold text-white hover:bg-gray-600"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: WHATSAPP */}
              {sendWhatsapp && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Código de país
                    </label>
                    <input
                      type="text"
                      placeholder="+57"
                      value={codigoPais}
                      onChange={(e) => setCodigoPais(e.target.value)}
                      className="w-full rounded border bg-gray-800 p-2"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Números de WhatsApp (separados por coma)
                    </label>
                    <textarea
                      placeholder="3001234567, 3007654321"
                      value={numerosLocales}
                      onChange={(e) => setNumerosLocales(e.target.value)}
                      className="w-full rounded border bg-gray-800 p-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      O agregar teléfono manual
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="3001234567"
                        value={newManualPhone}
                        onChange={(e) => setNewManualPhone(e.target.value)}
                        className="flex-1 rounded border bg-gray-800 p-2"
                      />
                      <button
                        onClick={() => {
                          if (newManualPhone.trim()) {
                            setNumerosLocales(
                              numerosLocales.trim()
                                ? `${numerosLocales}, ${newManualPhone.trim()}`
                                : newManualPhone.trim()
                            );
                            setNewManualPhone('');
                          }
                        }}
                        className="rounded bg-green-600 px-4 py-2 font-semibold hover:bg-green-700"
                      >
                        ➕ Agregar
                      </button>
                    </div>
                  </div>

                  {/* Números finales procesados */}
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">
                      Números finales de WhatsApp:
                    </h3>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {buildWhatsappNumbers().length > 0 ? (
                        buildWhatsappNumbers().map((phone, idx) => (
                          <span
                            key={idx}
                            className="flex items-center rounded-full bg-green-600 px-3 py-1"
                          >
                            {phone}
                          </span>
                        ))
                      ) : (
                        <div className="text-gray-400">Sin números válidos</div>
                      )}
                    </div>
                  </div>

                  {/* Seleccionar plantilla de WhatsApp */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-sm font-semibold">
                        Seleccionar plantilla (opcional)
                      </label>
                      {waError && (
                        <button
                          onClick={() => void loadWhatsAppTemplates()}
                          className="rounded bg-yellow-600 px-2 py-1 text-xs transition hover:bg-yellow-700"
                        >
                          🔄 Reintentar
                        </button>
                      )}
                    </div>
                    {waLoading ? (
                      <div className="rounded bg-gray-800 p-3 text-sm text-gray-400">
                        ⏳ Cargando plantillas...
                      </div>
                    ) : waError ? (
                      <div className="rounded border border-red-600/50 bg-red-900/30 p-3 text-sm text-red-400">
                        ⚠️ {waError}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <select
                          value={waSelectedTemplate}
                          onChange={(e) =>
                            setWaSelectedTemplate(e.target.value)
                          }
                          className="w-full rounded bg-gray-800 p-2 text-white"
                        >
                          <option value="__TEXT_ONLY__">
                            Texto personalizado
                          </option>
                          {waTemplates.length > 0 && (
                            <>
                              <optgroup label="Plantillas disponibles">
                                {waTemplates.map((tpl) => (
                                  <option key={tpl.name} value={tpl.name}>
                                    {tpl.label || tpl.name} ({tpl.language})
                                  </option>
                                ))}
                              </optgroup>
                            </>
                          )}
                        </select>
                        {waSelectedTemplate !== '__TEXT_ONLY__' && (
                          <button
                            onClick={() => setShowTemplatePreview(true)}
                            className="w-full rounded bg-blue-600 px-3 py-1.5 text-sm transition hover:bg-blue-700"
                          >
                            👁️ Ver preview
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Asunto y Mensaje para WhatsApp */}
                  <div>
                    <input
                      type="text"
                      placeholder="Asunto (opcional)"
                      value={waSubjectText}
                      onChange={(e) => setWaSubjectText(e.target.value)}
                      className="mb-2 w-full rounded bg-gray-800 p-2"
                    />
                    <textarea
                      placeholder="Mensaje"
                      value={waMessageText}
                      onChange={(e) => setWaMessageText(e.target.value)}
                      className="w-full rounded bg-gray-800 p-2"
                      rows={5}
                    />
                  </div>

                  {/* Botón enviar WhatsApp */}
                  <div className="mt-6 flex justify-center gap-4">
                    <button
                      onClick={sendWhatsApp}
                      className="rounded bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      disabled={loadingWhatsApp}
                    >
                      {loadingWhatsApp
                        ? '⏳ Enviando...'
                        : '💬 Enviar WhatsApp'}
                    </button>
                    <button
                      onClick={() => setShowPhoneModal(false)}
                      className="rounded bg-gray-700 px-6 py-3 font-semibold text-white hover:bg-gray-600"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
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
                  className="hover:bg-primary-700 focus:ring-primary-400 w-full rounded bg-primary px-4 py-2 font-semibold text-white transition focus:ring-2 focus:outline-none sm:w-auto"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}
        {showCarteraModal && currentUser && (
          <div className="showCarteraModal fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="max-h-[90vh] w-full max-w-[min(100vw-1rem,72rem)] overflow-y-auto rounded-lg bg-white text-gray-900 shadow-2xl dark:bg-gray-800 dark:text-gray-100">
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
                <h4 className="mb-3 flex items-center justify-between text-base font-semibold">
                  <span>Detalle de pagos</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Valor restante a pagar:{' '}
                    <strong className="text-red-600 dark:text-red-400">
                      {formatCOP(
                        price -
                          editablePagos.slice(0, 12).reduce((sum, p) => {
                            const v =
                              typeof p?.valor === 'number'
                                ? p.valor
                                : Number(p?.valor ?? 0);
                            return sum + (Number.isFinite(v) ? v : 0);
                          }, 0)
                      )}
                    </strong>
                  </span>
                </h4>
                <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100">
                      <tr>
                        <th className="border-b border-gray-200 px-3 py-2 text-left dark:border-gray-600">
                          PRODUCTO
                        </th>
                        <th className="border-b border-gray-200 px-3 py-2 text-left dark:border-gray-600">
                          N° PAGO{' '}
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

                        {/* 👇 NUEVA COLUMNA */}
                        <th className="border-b border-gray-200 px-3 py-2 text-center dark:border-gray-600">
                          VERIFICADO
                        </th>

                        <th className="border-b border-gray-200 px-3 py-2 text-right dark:border-gray-600">
                          ACCIONES
                        </th>
                      </tr>
                    </thead>

                    {/* ───────────────────────────────────────────────────────── */}
                    {/* TABLA: 12 cuotas (ahora con select en Método de pago) */}
                    {/* ───────────────────────────────────────────────────────── */}
                    <tbody>
                      {Array.from({ length: 12 }, (_, idx) => {
                        const cuotaNum = idx + 1;
                        const row = editablePagos[idx] ?? {};
                        const rawValor =
                          (typeof row.valor === 'number'
                            ? row.valor
                            : Number(row.valor ?? 0)) || 0;

                        return (
                          <tr
                            key={`cuota-${cuotaNum}`}
                            className="align-top odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-900"
                          >
                            {/* PRODUCTO */}
                            <td className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                              <input
                                type="text"
                                value={row.concepto ?? `Cuota ${cuotaNum}`}
                                onChange={(e) =>
                                  handleCuotaChange(
                                    idx,
                                    'concepto',
                                    e.target.value
                                  )
                                }
                                className="w-full rounded border border-gray-300 bg-white p-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                              />
                            </td>

                            {/* N° PAGO */}
                            <td className="border-b border-gray-100 px-3 py-2 text-center dark:border-gray-700">
                              <input
                                type="text"
                                value={String(
                                  row.nro_pago ?? row.nroPago ?? cuotaNum
                                )}
                                onChange={(e) =>
                                  handleCuotaChange(
                                    idx,
                                    'nro_pago',
                                    e.target.value
                                  )
                                }
                                className="w-24 rounded border border-gray-300 bg-white p-1 text-center text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                              />
                            </td>

                            {/* FECHA */}
                            <td className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                              <input
                                type="date"
                                value={
                                  typeof editablePagos[idx]?.fecha === 'string'
                                    ? (editablePagos[idx]!.fecha as string)
                                    : toISODateLike(editablePagos[idx]?.fecha)
                                }
                                onChange={(e) =>
                                  handleCuotaChange(
                                    idx,
                                    'fecha',
                                    e.target.value
                                  )
                                }
                                className="w-36 rounded border border-gray-300 bg-white p-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                              />
                            </td>

                            {/* MÉTODO */}
                            <td className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                              <select
                                value={row.metodo ?? ''}
                                onChange={(e) =>
                                  handleCuotaChange(
                                    idx,
                                    'metodo',
                                    e.target.value
                                  )
                                }
                                className="w-full rounded border border-gray-300 bg-white p-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                              >
                                <option value="">—</option>
                                <option value="Transferencia">
                                  Transferencia
                                </option>
                                <option value="Artiefy">Artiefy</option>
                              </select>
                            </td>

                            {/* VALOR */}
                            <td className="border-b border-gray-100 px-3 py-2 text-right tabular-nums dark:border-gray-700">
                              <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:justify-end">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={rawValor.toString()}
                                  onChange={(e) =>
                                    handleCuotaChange(
                                      idx,
                                      'valor',
                                      e.target.value
                                    )
                                  }
                                  className="w-28 rounded border border-gray-300 bg-white p-1 text-right text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                />
                              </div>
                            </td>

                            {/* VERIFICADO */}
                            <td className="border-b border-gray-100 px-3 py-2 text-center dark:border-gray-700">
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                                    editablePagos[idx]?.receiptVerified
                                      ? 'bg-green-600 text-white'
                                      : 'bg-gray-500 text-white'
                                  }`}
                                  title="Estado de verificación del comprobante"
                                >
                                  {editablePagos[idx]?.receiptVerified
                                    ? 'Verificado'
                                    : 'No verificado'}
                                </span>

                                {editablePagos[idx]?.verifiedReceiptUrl && (
                                  <a
                                    href={
                                      editablePagos[idx]
                                        .verifiedReceiptUrl as string
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] underline"
                                    title={
                                      editablePagos[idx]?.verifiedReceiptName ??
                                      'Comprobante verificado'
                                    }
                                  >
                                    Ver verificado
                                  </a>
                                )}
                              </div>
                            </td>

                            <td className="border-b border-gray-100 px-3 py-2 text-right dark:border-gray-700">
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                {/* Guardar */}
                                <button
                                  type="button"
                                  onClick={() => savePagoRow(idx)}
                                  className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-400/60 focus:outline-none"
                                  title="Guardar cambios de esta cuota"
                                >
                                  <svg
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-3.5 w-3.5"
                                  >
                                    <path d="M3 4a2 2 0 012-2h7l5 5v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4zM5 4v4h6V4H5z" />
                                  </svg>
                                  Guardar
                                </button>

                                {/* Subir comprobante */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPendingRowForReceipt(idx);
                                    fileInputPagoRef.current?.click();
                                  }}
                                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-400/60 focus:outline-none"
                                  title="Subir comprobante"
                                >
                                  <svg
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-3.5 w-3.5"
                                  >
                                    <path d="M3 16a2 2 0 002 2h10a2 2 0 002-2v-5h-2v5H5V5h5V3H5a2 2 0 00-2 2v11z" />
                                    <path d="M15 3h-3V1h5v5h-2V3z" />
                                    <path d="M10 14l4-4h-3V5H9v5H6l4 4z" />
                                  </svg>
                                  Subir
                                </button>

                                {/* Ver comprobante (si existe) */}
                                {editablePagos[idx]?.receiptUrl ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openReceiptPreview(
                                        editablePagos[idx].receiptUrl!,
                                        editablePagos[idx]?.receiptName ??
                                          'Comprobante'
                                      )
                                    }
                                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700/60"
                                    title={
                                      editablePagos[idx]?.receiptName ??
                                      'Ver comprobante'
                                    }
                                  >
                                    <svg
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                      className="h-3.5 w-3.5"
                                    >
                                      <path d="M10 3c-5 0-8 7-8 7s3 7 8 7 8-7 8-7-3-7-8-7zm0 2a5 5 0 110 10A5 5 0 0110 5zm0 2a3 3 0 100 6 3 3 0 000-6z" />
                                    </svg>
                                    Ver
                                  </button>
                                ) : (
                                  <span
                                    className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-dashed border-gray-300 px-2.5 py-1 text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500"
                                    title="Sin comprobante"
                                  >
                                    <svg
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                      className="h-3.5 w-3.5"
                                    >
                                      <path d="M10 3c-5 0-8 7-8 7l2 2s3-7 6-7 6 7 6 7l2-2s-3-7-8-7z" />
                                    </svg>
                                    Ver
                                  </span>
                                )}

                                {/* Badge de verificación (compacto) */}
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    editablePagos[idx]?.receiptVerified
                                      ? 'bg-green-100 text-green-700 ring-1 ring-green-600/20 dark:bg-green-900/40 dark:text-green-300'
                                      : 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20 dark:bg-gray-800 dark:text-gray-300'
                                  }`}
                                  title="Estado de verificación del comprobante"
                                >
                                  <svg
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                  >
                                    {editablePagos[idx]?.receiptVerified ? (
                                      <path d="M16.707 5.293l-8 8-4-4 1.414-1.414L8.707 10.586l6.293-6.293 1.707 1z" />
                                    ) : (
                                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-5H9v2h2v-2zm0-8H9v6h2V5z" />
                                    )}
                                  </svg>
                                  {editablePagos[idx]?.receiptVerified
                                    ? 'Verificado'
                                    : 'No verificado'}
                                </span>

                                {/* Verificar (solo si hay comprobante) */}
                                {!!editablePagos[idx]?.receiptUrl && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const nro_pago = Number(
                                        editablePagos[idx]?.nro_pago ??
                                          editablePagos[idx]?.nroPago ??
                                          idx + 1
                                      );
                                      const verifiedBy = clerkUser?.id ?? null; // ID real del admin (o null si no está logueado)
                                      const programIdNum = currentProgramId
                                        ? Number(currentProgramId)
                                        : null;

                                      const res = await fetch(
                                        '/api/super-admin/enroll_user_program/programsUser/pagos/verify',
                                        {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({
                                            userId: carteraUserId,
                                            programId: programIdNum,
                                            nro_pago,
                                            verified: true,
                                            verifiedBy,
                                          }),
                                        }
                                      );

                                      if (!res.ok) {
                                        const data = await res
                                          .json()
                                          .catch(() => ({}));
                                        alert(
                                          isErrorResponse(data)
                                            ? data.error
                                            : 'No se pudo verificar'
                                        );
                                        return;
                                      }

                                      const pagosRefrescados =
                                        await fetchPagosUsuarioPrograma(
                                          carteraUserId!,
                                          String(currentProgramId)
                                        );
                                      setEditablePagos(
                                        mapPagosToEditable(pagosRefrescados)
                                      );
                                      alert('✅ Comprobante verificado');
                                    }}
                                    className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 focus:ring-2 focus:ring-amber-400/60 focus:outline-none"
                                    title="Marcar como verificado"
                                  >
                                    <svg
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                      className="h-3.5 w-3.5"
                                    >
                                      <path d="M10 2l2.39 4.84 5.34.78-3.86 3.76.91 5.31L10 14.77 4.22 16.7l.91-5.31L1.27 7.62l5.34-.78L10 2z" />
                                    </svg>
                                    Verificar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                    <tfoot>
                      {/* Encabezado plan */}
                      <tr>
                        <td colSpan={5} className="px-3 py-3">
                          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                            <span className="font-semibold text-gray-700 dark:text-gray-200">
                              PLAN / VALOR PROGRAMA
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="w-32 rounded border bg-gray-50 px-2 py-1 text-right font-semibold text-gray-900 dark:bg-gray-800 dark:text-white"
                              value={price ? String(price) : ''} // muestra 150000
                              onChange={(e) => {
                                // acepta 150000, 150.000, 150,000 → siempre queda 150000
                                const onlyDigits = e.target.value.replace(
                                  /\D/g,
                                  ''
                                );
                                setPrice(
                                  onlyDigits ? parseInt(onlyDigits, 10) : 0
                                );
                              }}
                              onBlur={handleSavePrice}
                            />
                          </div>
                        </td>
                      </tr>

                      {/* Valor pagado */}
                      <tr>
                        <td colSpan={5} className="px-3 py-3">
                          <div className="flex items-center justify-between rounded-lg bg-green-50 p-3 dark:bg-green-900/30">
                            <span className="font-semibold text-green-700 dark:text-green-400">
                              VALOR PAGADO
                            </span>
                            <span className="font-semibold text-green-700 dark:text-green-400">
                              {formatCOP(
                                editablePagos.slice(0, 12).reduce((sum, p) => {
                                  const v =
                                    typeof p?.valor === 'number'
                                      ? p.valor
                                      : Number(p?.valor ?? 0);
                                  return sum + (Number.isFinite(v) ? v : 0);
                                }, 0)
                              )}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Deuda restante */}
                      <tr>
                        <td colSpan={5} className="px-3 py-3">
                          <div className="flex items-center justify-between rounded-lg bg-red-50 p-3 dark:bg-red-900/30">
                            <span className="font-semibold text-red-700 dark:text-red-400">
                              DEUDA RESTANTE
                            </span>
                            <span className="font-semibold text-red-700 dark:text-red-400">
                              {formatCOP(
                                price -
                                  editablePagos
                                    .slice(0, 12)
                                    .reduce((sum, p) => {
                                      const v =
                                        typeof p?.valor === 'number'
                                          ? p.valor
                                          : Number(p?.valor ?? 0);
                                      return sum + (Number.isFinite(v) ? v : 0);
                                    }, 0)
                              )}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  {/* ───────────────────────────────────────────────────────── */}
                  {/* TABLA APARTE: Conceptos especiales (13, 14, 15) */}
                  {/* ───────────────────────────────────────────────────────── */}
                  <div className="mt-6">
                    <h4 className="mb-3 text-base font-semibold">
                      Conceptos especiales
                    </h4>
                    <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
                      <table className="min-w-full border-collapse text-sm">
                        <thead className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100">
                          <tr>
                            <th className="border-b border-gray-200 px-3 py-2 text-left dark:border-gray-600">
                              PRODUCTO
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
                            <th className="border-b border-gray-200 px-3 py-2 text-right dark:border-gray-600">
                              ACCIONES
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {[
                            { label: 'PÓLIZA Y CARNET', idxBase: 12 }, // nroPago 13
                            { label: 'UNIFORME', idxBase: 13 }, // nroPago 14
                            { label: 'DERECHOS DE GRADO', idxBase: 14 }, // nroPago 15
                          ].map(({ label, idxBase }) => {
                            const nroPago = idxBase + 1;
                            const row = editablePagos[idxBase] ?? {};
                            const rawValor =
                              (typeof row.valor === 'number'
                                ? row.valor
                                : Number(row.valor ?? 0)) || 0;

                            return (
                              <tr
                                key={`especial-${nroPago}`}
                                className="align-top odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-900"
                              >
                                {/* CONCEPTO (editable, se guarda tal cual en 'pagos') */}
                                <td className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                                  <input
                                    type="text"
                                    value={row.concepto ?? label}
                                    onChange={(e) =>
                                      handleCuotaChange(
                                        idxBase,
                                        'concepto',
                                        e.target.value
                                      )
                                    }
                                    className="w-full rounded border border-gray-300 bg-white p-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                  />
                                </td>

                                {/* FECHA */}
                                <td className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                                  <input
                                    type="date"
                                    value={
                                      typeof editablePagos[idxBase]?.fecha ===
                                      'string'
                                        ? (editablePagos[idxBase]!
                                            .fecha as string)
                                        : toISODateLike(
                                            editablePagos[idxBase]?.fecha
                                          )
                                    }
                                    onChange={(e) =>
                                      handleCuotaChange(
                                        idxBase,
                                        'fecha',
                                        e.target.value
                                      )
                                    }
                                    className="w-36 rounded border border-gray-300 bg-white p-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                  />
                                </td>

                                {/* SELECT MÉTODO */}
                                <td className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                                  <select
                                    value={row.metodo ?? ''}
                                    onChange={(e) =>
                                      handleCuotaChange(
                                        idxBase,
                                        'metodo',
                                        e.target.value
                                      )
                                    }
                                    className="w-full rounded border border-gray-300 bg-white p-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                  >
                                    <option value="">—</option>
                                    <option value="Transferencia">
                                      Transferencia
                                    </option>
                                    <option value="Artiefy">Artiefy</option>
                                  </select>
                                </td>

                                {/* VALOR + acciones */}
                                <td className="border-b border-gray-100 px-3 py-2 text-right tabular-nums dark:border-gray-700">
                                  <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:justify-end">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={rawValor.toString()}
                                      onChange={(e) =>
                                        handleCuotaChange(
                                          idxBase,
                                          'valor',
                                          e.target.value
                                        )
                                      }
                                      className="w-28 rounded border border-gray-300 bg-white p-1 text-right text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                    />
                                  </div>
                                </td>
                                <td className="border-b border-gray-100 px-3 py-2 text-right tabular-nums dark:border-gray-700">
                                  <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:justify-end">
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => savePagoRow(idxBase)}
                                        className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                                      >
                                        Guardar
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPendingRowForReceipt(idxBase);
                                          fileInputPagoRef.current?.click();
                                        }}
                                        className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                                      >
                                        Subir comprobante
                                      </button>

                                      {editablePagos[idxBase]?.receiptUrl && (
                                        <a
                                          href={
                                            editablePagos[idxBase]
                                              .receiptUrl as string
                                          }
                                          target="_blank"
                                          rel="noreferrer"
                                          className="ml-1 text-xs underline"
                                          title={
                                            editablePagos[idxBase]
                                              ?.receiptName ?? 'Comprobante'
                                          }
                                        >
                                          Ver
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* input global para subir comprobantes */}
                  <input
                    ref={fileInputPagoRef}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    className="hidden"
                    onChange={onReceiptChange}
                  />
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
                        ref={fileInputCarteraRef}
                        id="carteraReceipt"
                        type="file"
                        accept="application/pdf,image/png,image/jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setCarteraReceipt(f);
                          if (f && pendingRowForReceipt !== null) {
                            uploadCarteraReceipt().then(() =>
                              setPendingRowForReceipt(null)
                            );
                          }
                        }}
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputCarteraRef.current?.click()}
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
                {/* Contenido específico para impresión - agregarlo después del botón imprimir */}
                <div
                  id="printable-invoice"
                  className="pointer-events-none hidden print:block"
                >
                  <div className="bg-white p-8 text-black">
                    {/* Cabecera */}
                    <div className="mb-6 flex items-center justify-between border-b border-black pb-4">
                      <div className="flex items-center gap-4">
                        <Image
                          src="/artiefy-logo.png"
                          alt="Artiefy"
                          width={120}
                          height={36}
                          className="h-9 w-auto object-contain"
                          priority
                        />
                        <Image
                          src="/logo-ponao.png"
                          alt="PONAO"
                          width={120}
                          height={36}
                          className="h-9 w-auto object-contain"
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold tracking-wide text-black">
                          POLITÉCNICO NACIONAL DE ARTES Y OFICIOS
                        </p>
                        <h3 className="text-lg font-bold text-black">
                          FACTURA PAGO DE MATRÍCULA
                        </h3>
                      </div>
                    </div>

                    {/* Info estudiante */}
                    <div className="mb-6 grid grid-cols-2 gap-6 text-sm">
                      <div className="space-y-2">
                        <p className="text-black">
                          <strong>NOMBRE ESTUDIANTE:</strong>{' '}
                          {currentUser?.name ?? '-'}
                        </p>
                        <p className="text-black">
                          <strong>CC:</strong>{' '}
                          {currentUser?.document ?? currentUser?.id ?? '-'}
                        </p>
                        <p className="text-black">
                          <strong>CELULAR:</strong> {currentUser?.phone ?? '-'}
                        </p>
                        <p className="text-black">
                          <strong>PROGRAMA:</strong>{' '}
                          {userPrograms?.[0]?.title ?? '—'}
                        </p>
                        <p className="text-black">
                          <strong>FECHA:</strong>{' '}
                          {new Date().toISOString().split('T')[0]}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-black">
                          <strong>DIRECCIÓN:</strong>{' '}
                          {currentUser?.address ?? '-'}
                        </p>
                        <p className="text-black">
                          <strong>CIUDAD:</strong> {currentUser?.city ?? '-'}
                        </p>
                        <p className="text-black">
                          <strong>EMAIL:</strong> {currentUser?.email ?? '-'}
                        </p>
                        <p className="text-black">
                          <strong>ESTADO:</strong> {estadoCarteraUI}
                        </p>
                        <p className="text-black">
                          <strong>FIN SUSCRIPCIÓN:</strong>{' '}
                          {currentUser?.subscriptionEndDate
                            ? new Date(currentUser.subscriptionEndDate)
                                .toISOString()
                                .split('T')[0]
                            : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Tabla de pagos solo con información, sin inputs */}
                    <table className="mb-6 w-full border-collapse border border-black text-sm">
                      <thead>
                        <tr className="bg-white">
                          <th className="border border-black px-3 py-2 text-left font-bold text-black">
                            PRODUCTO
                          </th>
                          <th className="border border-black px-3 py-2 text-center font-bold text-black">
                            N° PAGO
                          </th>
                          <th className="border border-black px-3 py-2 text-left font-bold text-black">
                            FECHA DE PAGO
                          </th>
                          <th className="border border-black px-3 py-2 text-left font-bold text-black">
                            MÉTODO DE PAGO
                          </th>
                          <th className="border border-black px-3 py-2 text-right font-bold text-black">
                            VALOR
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Primero las 12 cuotas */}
                        {Array.from({ length: 12 }, (_, idx) => {
                          const cuotaNum = idx + 1;
                          const row = editablePagos[idx] ?? {};
                          const valor =
                            typeof row.valor === 'number'
                              ? row.valor
                              : Number(row.valor ?? 0);

                          return (
                            <tr
                              key={`print-cuota-${cuotaNum}`}
                              className="bg-white"
                            >
                              <td className="border border-black px-3 py-2 text-black">
                                {row.concepto ?? `Cuota ${cuotaNum}`}
                              </td>
                              <td className="border border-black px-3 py-2 text-center text-black">
                                {row.nro_pago ?? row.nroPago ?? cuotaNum}
                              </td>
                              <td className="border border-black px-3 py-2 text-black">
                                {row.fecha
                                  ? new Date(row.fecha).toLocaleDateString(
                                      'es-CO'
                                    )
                                  : '-'}
                              </td>
                              <td className="border border-black px-3 py-2 text-black">
                                {row.metodo ?? '-'}
                              </td>
                              <td className="border border-black px-3 py-2 text-right text-black">
                                {formatCOP(valor)}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Luego los conceptos especiales */}
                        {[
                          { label: 'PÓLIZA Y CARNET', idxBase: 12 },
                          { label: 'UNIFORME', idxBase: 13 },
                          { label: 'DERECHOS DE GRADO', idxBase: 14 },
                        ].map(({ label, idxBase }) => {
                          const row = editablePagos[idxBase] ?? {};
                          const valor =
                            typeof row.valor === 'number'
                              ? row.valor
                              : Number(row.valor ?? 0);

                          return (
                            <tr
                              key={`print-especial-${idxBase}`}
                              className="bg-white"
                            >
                              <td className="border border-black px-3 py-2 font-semibold text-black">
                                {row.concepto ?? label}
                              </td>
                              <td className="border border-black px-3 py-2 text-center text-black">
                                {idxBase + 1}
                              </td>
                              <td className="border border-black px-3 py-2 text-black">
                                {row.fecha
                                  ? new Date(row.fecha).toLocaleDateString(
                                      'es-CO'
                                    )
                                  : '-'}
                              </td>
                              <td className="border border-black px-3 py-2 text-black">
                                {row.metodo ?? '-'}
                              </td>
                              <td className="border border-black px-3 py-2 text-right text-black">
                                {formatCOP(valor)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Totales */}
                    <div className="space-y-3 border-t border-black pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-black">
                          PLAN / VALOR PROGRAMA:
                        </span>
                        <span className="font-semibold text-black">
                          {formatCOP(price)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-black">
                          VALOR PAGADO:
                        </span>
                        <span className="font-semibold text-black">
                          {formatCOP(carteraInfo?.totalPagado ?? 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-black pt-2">
                        <span className="text-lg font-bold text-black">
                          DEUDA RESTANTE:
                        </span>
                        <span className="text-lg font-bold text-black">
                          {formatCOP(carteraInfo?.deuda ?? 0)}
                        </span>
                      </div>
                    </div>

                    {/* Pie de página opcional */}
                    <div className="mt-8 border-t border-black pt-4 text-center text-xs text-black">
                      <p>
                        Este documento es un comprobante de los pagos
                        registrados
                      </p>
                      <p>
                        Fecha de impresión: {new Date().toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* FOOTER / BOTONES */}
              <div className="flex flex-col gap-2 border-t border-gray-200 p-4 sm:flex-row sm:justify-end dark:border-gray-700">
                <button
                  onClick={handlePrint}
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
                    const instructorName =
                      c.instructorName ?? c.instructor ?? 'Sin instructor';
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
                        className={`flex cursor-pointer items-start justify-between rounded px-3 py-2 transition ${isSelected ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-gray-600'}`}
                      >
                        <div className="flex-1">
                          <div>{c.title}</div>
                          <div className="mt-0.5 text-xs text-emerald-400">
                            👨‍🏫 {instructorName}
                          </div>
                        </div>
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
      {bulkSelectOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          {/* Fondo */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setBulkSelectOpen(false)}
          />

          {/* Caja */}
          <div className="relative mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-5 shadow-2xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Seleccionar estudiantes</h3>
              <p className="mt-1 text-sm text-neutral-300">
                ¿Quieres seleccionar <strong>todos los filtrados</strong> o solo
                los <strong>visibles</strong>?
              </p>
            </div>

            {/* Resumen de cantidades */}
            <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-neutral-300">
              <div className="rounded-lg border border-white/10 p-3">
                <div className="opacity-75">Visibles</div>
                <div className="text-base font-semibold">
                  {displayedStudents.length}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 p-3">
                <div className="opacity-75">Filtrados (total)</div>
                <div className="text-base font-semibold">
                  {sortedStudents.length}
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setBulkSelectOpen(false)}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleBulkSelect('visible')}
                className="rounded-xl bg-neutral-800 px-4 py-2 text-sm hover:bg-neutral-700"
                title={`Seleccionar solo los visibles (${displayedStudents.length})`}
              >
                Solo visibles ({displayedStudents.length})
              </button>
              <button
                type="button"
                onClick={() => handleBulkSelect('all')}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-white/90"
                title={`Seleccionar todos los filtrados (${sortedStudents.length})`}
              >
                Todos los filtrados ({sortedStudents.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vista previa de comprobante */}
      {receiptPreview.open && receiptPreview.url && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="relative grid max-h-[90vh] w-full max-w-4xl grid-rows-[auto,1fr,auto] overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {receiptPreview.name ?? 'Comprobante'}
              </h3>
              <button
                onClick={closeReceiptPreview}
                className="inline-flex items-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Cerrar"
                title="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body (preview) */}
            <div className="min-h-[50vh] overflow-auto bg-gray-50 dark:bg-gray-950">
              {isPdfUrl(receiptPreview.url) ? (
                <iframe
                  src={receiptPreview.url}
                  className="h-[70vh] w-full"
                  title="Vista previa PDF"
                />
              ) : (
                // Si no es PDF, mostramos imagen. (Usamos <img> para evitar necesitar domain config de Next/Image)
                <div className="flex items-center justify-center p-3">
                  <Image
                    src={receiptPreview.url}
                    alt={receiptPreview.name ?? 'Comprobante'}
                    className="max-h-[70vh] max-w-full rounded-md shadow"
                    width={800}
                    height={600}
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <a
                href={receiptPreview.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Abrir en pestaña
              </a>
              <a
                href={receiptPreview.url}
                download={receiptPreview.name ?? 'comprobante'}
                className="inline-flex items-center gap-1 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
              >
                Descargar
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview de Plantilla de WhatsApp - IGUAL QUE SUPER-ADMIN */}
      {showTemplatePreview && waSelectedTemplate !== '__TEXT_ONLY__' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-gray-900 p-6 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Preview de Plantilla</h3>
              <button
                onClick={() => setShowTemplatePreview(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Preview estilo WhatsApp */}
            {selectedWaTemplate && (
              <div className="space-y-4">
                {/* Simulación de chat WhatsApp */}
                <div className="overflow-hidden rounded-xl border border-gray-700">
                  <div className="flex items-center gap-3 bg-[#202C33] px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00a884]/30 text-xs text-[#00a884]">
                      WA
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">
                        Plantilla
                      </div>
                      <div className="text-xs text-gray-300">vista previa</div>
                    </div>
                    <div className="text-xl text-gray-300">⋮</div>
                  </div>

                  <div className="bg-[#0B141A] p-3">
                    <div
                      className="ml-auto max-w-[85%] rounded-lg bg-[#005C4B] px-3 py-2 text-[14px] text-white shadow"
                      style={{ borderTopRightRadius: 4 }}
                    >
                      <div className="break-words whitespace-pre-wrap">
                        {selectedWaTemplate.body}
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

                {/* Detalles de la plantilla */}
                <div className="space-y-2 border-t border-gray-700 pt-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400">
                      Nombre
                    </label>
                    <p className="text-white">
                      {selectedWaTemplate.label || selectedWaTemplate.name}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400">
                      Idioma
                    </label>
                    <p className="text-white">
                      {selectedWaTemplate.language === 'es'
                        ? 'Español'
                        : 'Inglés'}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400">
                      Estado
                    </label>
                    <p className="text-white">
                      {selectedWaTemplate.status ?? 'N/A'}
                    </p>
                  </div>

                  {selectedWaTemplate.example &&
                    selectedWaTemplate.example.length > 0 && (
                      <div>
                        <label className="text-xs font-semibold text-gray-400">
                          Ejemplos
                        </label>
                        <p className="text-xs text-gray-300">
                          {selectedWaTemplate.example.join(', ')}
                        </p>
                      </div>
                    )}
                </div>

                <button
                  onClick={() => setShowTemplatePreview(false)}
                  className="w-full rounded bg-blue-600 px-4 py-2 font-semibold transition hover:bg-blue-700"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
