import { NextRequest, NextResponse } from 'next/server';

import { auth as clerkAuth, currentUser } from '@clerk/nextjs/server';
import { and, eq, inArray } from 'drizzle-orm';
import * as XLSX from 'xlsx';

import { db } from '~/server/db';
import { users, pagos } from '~/server/db/schema';
import { createUser } from '~/server/queries/queries';

// === Runtime ===
export const runtime = 'nodejs';
export const maxDuration = 300;

// ====== Tipos ======
type ResultadoEstado = 'GUARDADO' | 'YA_EXISTE' | 'ERROR';
interface RowResultado {
    email: string;
    estado: ResultadoEstado;
    detalle?: string;
}
interface ClerkUser {
    id: string;
}
interface ColumnMapping {
    excelColumn: string;
    dbField: string;
}
interface CuotaDet {
    nroPago: number;
    fecha?: string | null;
    metodo?: string | null;
    valor?: number | null;
}

const safeTrim = (v?: unknown): string => {
    if (typeof v === 'string') return v.trim();
    if (v == null) return '';
    if (typeof v === 'object') {
        try {
            return JSON.stringify(v).trim();
        } catch {
            return '[object]';
        }
    }
    if (typeof v === 'number' || typeof v === 'boolean') {
        return String(v).trim();
    }
    return '';
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/** Date -> 'YYYY-MM-DD' */
const toYMD = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

/** Excel serial o string -> 'YYYY-MM-DD' (para columnas date() de Drizzle) */
function excelToDateString(input: unknown): string | null {
    if (input == null) return null;

    if (typeof input === 'number' && !Number.isNaN(input)) {
        const epoch = new Date(Date.UTC(1899, 11, 30));
        const date = new Date(epoch.getTime() + input * 24 * 60 * 60 * 1000);
        const yyyy = date.getUTCFullYear();
        const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(date.getUTCDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    if (input instanceof Date && !Number.isNaN(input.getTime())) {
        const yyyy = input.getFullYear();
        const mm = String(input.getMonth() + 1).padStart(2, '0');
        const dd = String(input.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    const raw = safeTrim(input);
    if (!raw) return null;

    // 1º intento: parse nativo
    let tryParse = new Date(raw);
    if (!Number.isNaN(tryParse.getTime())) {
        const yyyy = tryParse.getFullYear();
        const mm = String(tryParse.getMonth() + 1).padStart(2, '0');
        const dd = String(tryParse.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // 2º intento: meses en español (e.g. "06 Junio 2025")
    const esToEn: Record<string, string> = {
        enero: 'january',
        febrero: 'february',
        marzo: 'march',
        abril: 'april',
        mayo: 'may',
        junio: 'june',
        julio: 'july',
        agosto: 'august',
        septiembre: 'september',
        setiembre: 'september',
        octubre: 'october',
        noviembre: 'november',
        diciembre: 'december',
    };
    let lowered = raw.toLowerCase().replace(/\b(de|del)\b/g, ' ');
    for (const [es, en] of Object.entries(esToEn)) {
        lowered = lowered.replace(new RegExp(`\\b${es}\\b`, 'g'), en);
    }
    tryParse = new Date(lowered);
    if (!Number.isNaN(tryParse.getTime())) {
        const yyyy = tryParse.getFullYear();
        const mm = String(tryParse.getMonth() + 1).padStart(2, '0');
        const dd = String(tryParse.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    return null;
}

// ================== Helpers cuotas ==================
const CUOTA_RE = /^cuota\s*(\d+)\s*(fecha|m[eé]todo|metodo|valor)$/i;

const normalizeKey = (k: string) =>
    String(k)
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\.\d+$/, '') // <- quita .1, .2, ...
        .trim();

const toIntMoney = (v: unknown): number | null => {
    const raw = safeTrim(v);
    if (!raw) return null;
    const cleaned = raw.replace(/[^\d-]/g, '');
    if (!cleaned) return null;
    const n = Number.parseInt(cleaned, 10);
    return Number.isFinite(n) ? n : null;
};

function extractCuotas(row: Record<string, unknown>): CuotaDet[] {
    const buckets = new Map<number, { fecha?: string | null; metodo?: string | null; valor?: number | null }>();

    const getNextIndexFor = (field: 'valor' | 'fecha' | 'metodo') => {
        let n = 1;
        while (buckets.has(n) && (buckets.get(n) as any)?.[field] != null) n += 1;
        return n;
    };
    const getFirstMissingInExisting = (field: 'fecha' | 'metodo') => {
        const entries = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);
        for (const [n, b] of entries) {
            if ((b as any)[field] == null) return n;
        }
        return null;
    };

    for (const [rawKey, rawVal] of Object.entries(row)) {
        const key = normalizeKey(String(rawKey));

        // "primera cuota" => cuota 1 (valor)
        if (key === 'primera cuota') {
            if (!buckets.has(1)) buckets.set(1, {});
            buckets.get(1)!.valor = toIntMoney(rawVal);
            continue;
        }

        // "cuota2" o "cuota 2" (valor)
        let m =
            key.match(/^cuota\s*(\d+)$/i) ||
            key.match(/^cuota(\d+)$/i);
        if (m) {
            const n = Number(m[1]);
            if (!buckets.has(n)) buckets.set(n, {});
            buckets.get(n)!.valor = toIntMoney(rawVal);
            continue;
        }

        // "fecha2" / "fecha 2"  -> fecha de cuota N
        m = key.match(/^fecha\s*(\d+)$/i) || key.match(/^fecha(\d+)$/i);
        if (m) {
            const n = Number(m[1]);
            if (!buckets.has(n)) buckets.set(n, {});
            buckets.get(n)!.fecha = excelToDateString(rawVal);
            continue;
        }

        // "metodo de pago2" / "método de pago2"
        m = key.match(/^m[eé]todo de pago\s*(\d+)$/i);
        if (m) {
            const n = Number(m[1]);
            if (!buckets.has(n)) buckets.set(n, {});
            buckets.get(n)!.metodo = safeTrim(rawVal) || null;
            continue;
        }

        // Compatibilidad: "cuota 3 valor" / "cuota3 valor"
        m = key.match(/^cuota\s*(\d+)\s*valor$/i) || key.match(/^cuota(\d+)\s*valor$/i);
        if (m) {
            const n = Number(m[1]);
            if (!buckets.has(n)) buckets.set(n, {});
            buckets.get(n)!.valor = toIntMoney(rawVal);
            continue;
        }

        // "cuota 3 fecha" / "cuota3 fecha"
        m = key.match(/^cuota\s*(\d+)\s*fecha$/i) || key.match(/^cuota(\d+)\s*fecha$/i);
        if (m) {
            const n = Number(m[1]);
            if (!buckets.has(n)) buckets.set(n, {});
            buckets.get(n)!.fecha = excelToDateString(rawVal);
            continue;
        }

        // "cuota 3 metodo" / "cuota3 método"
        m = key.match(/^cuota\s*(\d+)\s*m[eé]todo$/i) || key.match(/^cuota(\d+)\s*m[eé]todo$/i);
        if (m) {
            const n = Number(m[1]);
            if (!buckets.has(n)) buckets.set(n, {});
            buckets.get(n)!.metodo = safeTrim(rawVal) || null;
            continue;
        }

        // Columnas duplicadas "cuota", "cuota.1"… sin número (pandas)
        if (key === 'cuota') {
            const n = getNextIndexFor('valor');
            if (!buckets.has(n)) buckets.set(n, {});
            buckets.get(n)!.valor = toIntMoney(rawVal);
            continue;
        }

        // Columnas duplicadas "fecha" sin número → asigna a la primera cuota que no tenga fecha
        if (key === 'fecha') {
            const target = getFirstMissingInExisting('fecha') ?? getNextIndexFor('fecha');
            if (!buckets.has(target)) buckets.set(target, {});
            buckets.get(target)!.fecha = excelToDateString(rawVal);
            continue;
        }

        // Columnas duplicadas "metodo de pago" sin número → asigna a la primera cuota sin método
        if (key === 'metodo de pago') {
            const target = getFirstMissingInExisting('metodo') ?? getNextIndexFor('metodo');
            if (!buckets.has(target)) buckets.set(target, {});
            buckets.get(target)!.metodo = safeTrim(rawVal) || null;
            continue;
        }

        // Compatibilidad genérica con el patrón CUOTA_RE
        m = key.match(CUOTA_RE);
        if (m) {
            const n = Number(m[1]);
            const field = m[2].toLowerCase();
            if (!buckets.has(n)) buckets.set(n, {});
            const b = buckets.get(n)!;
            if (field.startsWith('m')) b.metodo = safeTrim(rawVal) || null;
            else if (field === 'fecha') b.fecha = excelToDateString(rawVal);
            else if (field === 'valor') b.valor = toIntMoney(rawVal);
            continue;
        }
    }

    return Array.from(buckets.entries())
        .map(([n, b]) => ({ nroPago: n, ...b }))
        .filter((c) => c.nroPago > 0 && (c.fecha || c.metodo || (c.valor ?? 0) > 0));
}


/** Excel serial o string -> Date (para columnas timestamp() de Drizzle) */
function excelToDateObject(input: unknown): Date | null {
    if (input == null) return null;
    if (typeof input === 'number' && !Number.isNaN(input)) {
        const epoch = new Date(Date.UTC(1899, 11, 30));
        return new Date(epoch.getTime() + input * 24 * 60 * 60 * 1000);
    }
    if (input instanceof Date && !Number.isNaN(input.getTime())) return input;
    const raw = safeTrim(input);
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
}

// ====== Clerk helpers ======
async function getClerkUserByEmail(email: string): Promise<ClerkUser | null> {
    const key = process.env.CLERK_SECRET_KEY;
    if (!key) throw new Error('Falta CLERK_SECRET_KEY');
    const url = `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
        },
        method: 'GET',
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Clerk lookup failed (${res.status}): ${text}`);
    }

    const data: unknown = await res.json();
    const arr: ClerkUser[] = Array.isArray(data)
        ? (data as ClerkUser[])
        : Array.isArray((data as Record<string, unknown>)?.data)
            ? ((data as Record<string, unknown>).data as ClerkUser[])
            : [];

    return arr.length ? arr[0] : null;
}

// ================== Excel parse helpers ==================

// Sinónimos para detectar encabezados aunque estén "raros"
const HEADER_SYNONYMS = new Map<string, string>([
    ['nombres', 'Nombres'],
    ['nombre', 'Nombres'],
    ['apellidos', 'Apellidos'],
    ['apellido', 'Apellidos'],
    ['correo', 'Correo electrónico'],
    ['correo electrónico', 'Correo electrónico'],
    ['email', 'Correo electrónico'],
    ['teléfono', 'Número de teléfono'],
    ['telefono', 'Número de teléfono'],
    ['número de teléfono', 'Número de teléfono'],
    ['numero de telefono', 'Número de teléfono'],
    ['identificacion', 'Identificación'],
    ['identificación', 'Identificación'],
    ['n.documento', 'Identificación'],
    ['n documento', 'Identificación'],
    ['numero de identificación', 'Identificación'],
    ['número de identificación', 'Identificación'],

    ['dirección', 'Dirección'],
    ['direccion', 'Dirección'],
    ['país de residencia', 'País de residencia'],
    ['pais de residencia', 'País de residencia'],
    ['ciudad de residencia', 'Ciudad de residencia'],
    ['birthdate', 'Fecha de nacimiento'],
    ['fecha de nacimiento', 'Fecha de nacimiento'],

    ['nivel de educación', 'Nivel de educación'],
    ['nivel educación', 'Nivel de educación'],
    ['programa', 'Programa'],
    ['comercial', 'Comercial'],
    ['asesor', 'Comercial'],
    ['sede', 'Sede'],
    ['horario', 'Horario'],
    ['fecha de inicio', 'Fecha de inicio'],
    ['fecha primera cuota', 'Fecha de inicio'],

    ['número de cuotas', 'Numero de cuotas'],
    ['numero de cuotas', 'Numero de cuotas'],
    ['pago de inscripción', 'Pago de inscripción'],
    ['pago inscripción', 'Pago de inscripción'],
    ['pago cuota 1', 'Pago cuota 1'],
    ['valor del programa', 'valor del programa'],
    ['valor inscripción', 'Valor inscripción'],
    ['inscripción valor', 'Valor inscripción'],
    ['inscripcion valor', 'Valor inscripción'],
    ['inscripcion_valor', 'Valor inscripción'],
    ['método de pago', 'Método de pago'],
    ['payment method', 'Método de pago'],
    ['paymentmethod', 'Método de pago'],
    ['cuota1 fecha', 'Cuota1 fecha'],
    ['cuota 1 fecha', 'Cuota1 fecha'],
    ['cuota1 método', 'Cuota1 método'],
    ['cuota1 metodo', 'Cuota1 método'],
    ['cuota 1 método', 'Cuota1 método'],
    ['cuota 1 metodo', 'Cuota1 método'],
    ['cuota1 valor', 'Cuota1 valor'],
    ['cuota 1 valor', 'Cuota1 valor'],
    ['origen de inscripción', 'Origen de inscripción'],
    ['inscripción origen', 'Origen de inscripción'],
    ['inscripcion_origen', 'Origen de inscripción'],
    ['fecha de compra', 'Fecha de compra'],
    ['purchase date', 'Fecha de compra'],
]);

function normalizeHeaderCell(v: unknown): string {
    const raw = safeTrim(v).toLowerCase();
    const key = raw.replace(/\s+/g, ' ');
    return HEADER_SYNONYMS.get(key) ?? safeTrim(v);
}

/** Detección de fila de encabezados (aunque no sea la primera) y parseo robusto */
function extractObjectsFromSheet(sheet: XLSX.WorkSheet) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        blankrows: false,
        defval: '',
    }) as unknown[][];

    // 1) Detectar la fila de encabezados escaneando las primeras 20 filas
    const maxScan = Math.min(rows.length, 20);
    let headersRowIndex = 0;
    let bestScore = -1;

    for (let i = 0; i < maxScan; i++) {
        const row = rows[i] || [];
        const score = row.reduce((acc: number, cell: unknown) => {
            const norm = normalizeHeaderCell(cell).toLowerCase();
            const isWord = /[a-záéíóúñ]/i.test(norm) && norm.length <= 50;
            const isKey = ['nombre', 'nombres', 'apellido', 'apellidos', 'correo', 'email', 'teléfono', 'telefono', 'identificación', 'identificacion'].some((k) =>
                norm.includes(k),
            );
            return acc + (isWord ? 1 : 0) + (isKey ? 2 : 0);
        }, 0);

        if (score > bestScore) {
            bestScore = score;
            headersRowIndex = i;
        }
    }

    // 2) Construir encabezados normalizados
    const headersRaw = rows[headersRowIndex] || [];
    const headers = headersRaw.map((h: unknown, idx: number) => {
        const norm = normalizeHeaderCell(h);
        return norm || `col_${idx + 1}`;
    });

    const objects: Record<string, unknown>[] = [];
    for (let i = headersRowIndex + 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const obj: Record<string, unknown> = {};
        let empty = true;
        for (let c = 0; c < headers.length; c++) {
            const key = headers[c] ?? `col_${c + 1}`;
            const val = row[c];
            if (val !== null && val !== undefined) {
                let strVal: string;
                if (typeof val === 'object') {
                    strVal = JSON.stringify(val);
                } else if (typeof val === 'string') {
                    strVal = val;
                } else if (typeof val === 'number' || typeof val === 'boolean') {
                    strVal = String(val);
                } else {
                    strVal = JSON.stringify(val);
                }
                if (strVal.trim() !== '') empty = false;
            }
            obj[key] = val;
        }
        if (!empty) objects.push(obj);
    }

    return { headersRowIndex, headers, objects };
}

/** Genera mappings automáticos */
function autoDetectMappings(detectedColumns: string[]): ColumnMapping[] {
    const lc = detectedColumns.map((c) => c.trim().toLowerCase());
    const find = (...names: string[]) => {
        const needle = names.map((n) => n.trim().toLowerCase());
        const idx = lc.findIndex((c) => needle.includes(c));
        return idx >= 0 ? detectedColumns[idx] : undefined;
    };

    const mappings: ColumnMapping[] = [];

    const pairs: { excel: string | undefined; db: string }[] = [
        // básicos
        { excel: find('nombres', 'nombre', 'firstname'), db: 'firstName' },
        { excel: find('apellidos', 'apellido', 'lastname'), db: 'lastName' },
        { excel: find('correo electrónico', 'correo', 'email'), db: 'email' },
        { excel: find('número de teléfono', 'numero de telefono', 'teléfono', 'telefono', 'phone'), db: 'phone' },
        { excel: find('identificación', 'n.documento', 'n documento', 'numero de identificación', 'número de identificación', 'documento'), db: 'document' },

        // dirección
        { excel: find('dirección', 'direccion', 'address'), db: 'address' },
        { excel: find('país de residencia', 'pais de residencia', 'country'), db: 'country' },
        { excel: find('ciudad de residencia', 'ciudad', 'city'), db: 'city' },
        { excel: find('fecha de nacimiento', 'birthdate'), db: 'birthDate' },

        // académicos
        { excel: find('nivel de educación', 'nivel educación', 'niveleducacion'), db: 'nivelEducacion' },
        { excel: find('programa'), db: 'programa' },
        { excel: find('fecha de inicio', 'fecha de inicio', 'fecha inicio', 'fecha primera cuota'), db: 'fechaInicio' },
        { excel: find('comercial', 'asesor'), db: 'comercial' },
        { excel: find('sede'), db: 'sede' },
        { excel: find('horario'), db: 'horario' },

        // pagos / cuotas
        { excel: find('número de cuotas', 'numero de cuotas'), db: 'numeroCuotas' },
        { excel: find('pago de inscripción', 'pago inscripción'), db: 'pagoInscripcion' },
        { excel: find('pago cuota 1'), db: 'pagoCuota1' },
        { excel: find('valor del programa'), db: 'valorPrograma' },
        { excel: find('valor inscripción', 'inscripción valor', 'inscripcion valor', 'inscripcion_valor'), db: 'inscripcionValor' },
        { excel: find('método de pago', 'payment method', 'paymentmethod'), db: 'paymentMethod' },
        { excel: find('cuota1 fecha', 'cuota 1 fecha'), db: 'cuota1Fecha' },
        { excel: find('cuota1 método', 'cuota1 metodo', 'cuota 1 método', 'cuota 1 metodo'), db: 'cuota1Metodo' },
        { excel: find('cuota1 valor', 'cuota 1 valor'), db: 'cuota1Valor' },
        { excel: find('origen de inscripción', 'inscripcion_origen', 'inscripción origen'), db: 'inscripcionOrigen' },
        { excel: find('fecha de compra', 'purchase date', 'purchasedate'), db: 'purchaseDate' },

        // identificación / acudiente
        { excel: find('tipo de identificación', 'identificacion_tipo'), db: 'identificacionTipo' },
        { excel: find('número identificación', 'numero identificación', 'identificacion_numero'), db: 'identificacionNumero' },
        { excel: find('tiene acudiente', 'tiene_acudiente'), db: 'tieneAcudiente' },
        { excel: find('acudiente nombre', 'acudiente_nombre'), db: 'acudienteNombre' },
        { excel: find('acudiente contacto', 'acudiente_contacto'), db: 'acudienteContacto' },
        { excel: find('acudiente email', 'acudiente_email'), db: 'acudienteEmail' },
    ];

    for (const p of pairs) if (p.excel) mappings.push({ excelColumn: p.excel, dbField: p.db });

    // columnas no capturadas también se devuelven (dbField vacío)
    for (const c of detectedColumns) {
        if (!mappings.some((m) => m.excelColumn === c)) {
            mappings.push({ excelColumn: c, dbField: '' });
        }
    }
    return mappings;
}
export async function POST(request: NextRequest) {
    try {
        // auth robusto (tipado con Clerk)
        const authData = await clerkAuth();
        const userId: string | null = authData?.userId ?? null;

        // fallback DEV
        const headerUserId = request.headers.get('x-user-id');
        const effectiveUserId = userId ?? headerUserId ?? null;

        if (!effectiveUserId) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const form = await request.formData();
        const file = form.get('file');
        const mappingsJson = form.get('mappings');
        const previewOnly = form.get('previewOnly') === 'true';
        // Filas editadas/eliminadas desde el front (opcional)
        const rowsJson = form.get('rowsJson');

        if (!file || !(file instanceof Blob)) {
            return NextResponse.json({ error: 'Archivo no válido' }, { status: 400 });
        }

        const buf = await (file as Blob).arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });

        const sheetName = wb.SheetNames?.[0];
        if (!sheetName) {
            return NextResponse.json({ error: 'Excel sin hojas válidas' }, { status: 400 });
        }

        // Parseo robusto del Excel
        const { headersRowIndex, headers, objects } = extractObjectsFromSheet(wb.Sheets[sheetName]);
        if (objects.length === 0) {
            return NextResponse.json({ error: 'Excel vacío' }, { status: 400 });
        }

        console.log('[MASIVE] Hoja:', sheetName);
        console.log('[MASIVE] headersRowIndex:', headersRowIndex);
        console.log('[MASIVE] headers[0..15]:', headers.slice(0, 15));
        console.log('[MASIVE] total rows detectadas:', objects.length);

        // No filtramos por “Comercial/Asesor”
        const rowsPorUsuario = objects;

        // Filas SIN nombre → fuera
        const hasName = (o: Record<string, unknown>) =>
            !!safeTrim((o as Record<string, unknown>).Nombres ?? (o as Record<string, unknown>).Nombre ?? '');
        const allowedRows = rowsPorUsuario.filter(hasName);

        const omitidosPorSinNombre = rowsPorUsuario.length - allowedRows.length;

        // Si el cliente envió filas editadas, usamos esas filas
        let rowsToProcess: Record<string, unknown>[] = allowedRows;
        let omitidosPorCliente = 0;

        if (rowsJson && typeof rowsJson === 'string') {
            try {
                const clientRows = JSON.parse(rowsJson) as Record<string, unknown>[];
                rowsToProcess = (clientRows || []).filter(hasName);
                omitidosPorCliente = Math.max(allowedRows.length - rowsToProcess.length, 0);
            } catch {
                // seguimos con allowedRows
            }
        }

        console.log('[MASIVE] rowsAllowed:', allowedRows.length, 'rowsToProcess:', rowsToProcess.length);

        // Preview
        if (previewOnly) {
            const autoMappings = autoDetectMappings(headers);
            console.log('[MASIVE][PREVIEW] autoMappings:', autoMappings);
            return NextResponse.json({
                preview: true,
                columns: headers,
                autoMappings,
                detectedHeaderRow: headersRowIndex,
                rowCount: allowedRows.length,
                rowsTotal: objects.length,
                rowsAllowed: allowedRows.length,
                sampleData: allowedRows,
            });
        }

        // Parse mappings recibidos del front
        const mappings: ColumnMapping[] =
            mappingsJson && typeof mappingsJson === 'string' ? (JSON.parse(mappingsJson) as ColumnMapping[]) : [];
        const get = (row: Record<string, unknown>, dbField: string) => {
            const map = mappings.find((m) => m.dbField === dbField);
            if (map?.excelColumn) return safeTrim(row[map.excelColumn]);
            return '';
        };

        console.log('[MASIVE] mappings filtrados:', mappings);

        const resultados: RowResultado[] = [];
        const createdOrSynced: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            isNew: boolean;
        }[] = [];

        let processed = 0;

        // helper para loggear sólo columnas de cuotas/fechas/metodos
        const pickCuotaLike = (row: Record<string, unknown>) => {
            const out: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(row)) {
                const kk = String(k).toLowerCase();
                if (
                    kk.includes('cuota') ||
                    kk === 'cuota' ||
                    /^cuota\s*\d+/.test(kk) ||
                    kk.startsWith('fecha') ||
                    kk.includes('método') ||
                    kk.includes('metodo') ||
                    kk.includes('metodo de pago') ||
                    kk.includes('método de pago') ||
                    kk.includes('primera cuota')
                ) {
                    out[k] = v;
                }
            }
            return out;
        };

        for (const row of rowsToProcess) {
            processed++;
            if (processed % 10 === 0) await delay(700);

            const firstName = String(get(row, 'firstName') ?? '');
            const lastName = String(get(row, 'lastName') ?? '');
            let email = String(get(row, 'email') ?? '').toLowerCase();
            // Fallback: si "Correo electrónico" viene vacío, usa el del acudiente/empresa
            if (!email) {
                email = safeTrim(
                    (row as Record<string, unknown>)['Correo de contacto acudiente o empresa'] ??
                    (row as Record<string, unknown>).acudiente_email ??
                    ''
                ).toLowerCase();
            }
            const phone = String(get(row, 'phone') ?? '');
            const document = String(get(row, 'document') ?? '');

            if (!firstName) continue;

            if (!lastName || !email) {
                resultados.push({
                    email: email || '(sin_email)',
                    estado: 'ERROR',
                    detalle: 'Campos obligatorios faltantes (firstName, lastName, email)',
                });
                console.warn(`[MASIVE][ROW ${processed}] faltan obligatorios`, { firstName, lastName, email });
                continue;
            }
            if (!isValidEmail(email)) {
                resultados.push({ email, estado: 'ERROR', detalle: 'Email inválido' });
                console.warn(`[MASIVE][ROW ${processed}] email inválido:`, email);
                continue;
            }

            // opcionales
            const address = safeTrim(
                (row as Record<string, unknown>)['Dirección'] ?? (row as Record<string, unknown>).Direccion ?? get(row, 'address')
            );
            const country = safeTrim(
                (row as Record<string, unknown>)['País de residencia'] ??
                (row as Record<string, unknown>)['Pais de residencia'] ??
                get(row, 'country')
            );
            const city = safeTrim(
                (row as Record<string, unknown>)['Ciudad de residencia'] ??
                (row as Record<string, unknown>).ciudad ??
                get(row, 'city')
            );
            const birthDateStr = excelToDateString(
                (row as Record<string, unknown>)['Fecha de nacimiento'] ?? get(row, 'birthDate')
            );

            const nivelEducacion = safeTrim(
                (row as Record<string, unknown>)['Nivel de educación'] ??
                (row as Record<string, unknown>)['Nivel Educación'] ??
                get(row, 'nivelEducacion')
            );
            const programa = safeTrim((row as Record<string, unknown>).Programa ?? get(row, 'programa'));
            const fechaInicioStr = excelToDateString(
                (row as Record<string, unknown>)['Fecha de inicio'] ??
                (row as Record<string, unknown>)['FECHA PRIMERA CUOTA'] ??
                get(row, 'fechaInicio')
            );
            const comercial = safeTrim(
                (row as Record<string, unknown>).Comercial ?? (row as Record<string, unknown>).Asesor ?? get(row, 'comercial')
            );
            const sede = safeTrim((row as Record<string, unknown>).Sede ?? get(row, 'sede'));
            const horario = safeTrim((row as Record<string, unknown>).Horario ?? get(row, 'horario'));

            const numeroCuotas = safeTrim(
                (row as Record<string, unknown>)['Número de cuotas'] ??
                (row as Record<string, unknown>)['Numero de cuotas'] ??
                get(row, 'numeroCuotas')
            );
            const pagoInscripcion = safeTrim(
                (row as Record<string, unknown>)['Pago de inscripción'] ??
                (row as Record<string, unknown>)['pago de inscripción'] ??
                get(row, 'pagoInscripcion')
            );
            const pagoCuota1 = safeTrim((row as Record<string, unknown>)['Pago cuota 1'] ?? get(row, 'pagoCuota1'));
            const valorProgramaRaw = safeTrim(
                (row as Record<string, unknown>)['valor del programa'] ??
                (row as Record<string, unknown>)['Valor del programa'] ??
                get(row, 'valorPrograma')
            );
            const valorPrograma =
                valorProgramaRaw && !Number.isNaN(Number(valorProgramaRaw)) ? Number(valorProgramaRaw) : null;

            const inscripcionValorRaw = safeTrim(
                (row as Record<string, unknown>)['Valor inscripción'] ??
                (row as Record<string, unknown>)['Inscripción valor'] ??
                (row as Record<string, unknown>)['inscripcion valor'] ??
                (row as Record<string, unknown>).inscripcion_valor ??
                get(row, 'inscripcionValor')
            );
            const inscripcionValor =
                inscripcionValorRaw && !Number.isNaN(Number(inscripcionValorRaw))
                    ? Number(inscripcionValorRaw)
                    : null;

            const paymentMethod = safeTrim(
                (row as Record<string, unknown>)['Método de pago'] ??
                (row as Record<string, unknown>)['payment method'] ??
                get(row, 'paymentMethod')
            );
            const cuota1FechaStr = excelToDateString(
                (row as Record<string, unknown>)['Cuota1 fecha'] ??
                (row as Record<string, unknown>)['CUOTA 1 FECHA'] ??
                get(row, 'cuota1Fecha')
            );
            const cuota1Metodo = safeTrim(
                (row as Record<string, unknown>)['Cuota1 método'] ??
                (row as Record<string, unknown>)['CUOTA 1 MÉTODO'] ??
                (row as Record<string, unknown>)['CUOTA 1 METODO'] ??
                get(row, 'cuota1Metodo')
            );
            const cuota1ValorRaw = safeTrim(
                (row as Record<string, unknown>)['Cuota1 valor'] ??
                (row as Record<string, unknown>)['CUOTA 1 VALOR'] ??
                get(row, 'cuota1Valor')
            );
            const cuota1Valor =
                cuota1ValorRaw && !Number.isNaN(Number(cuota1ValorRaw)) ? Number(cuota1ValorRaw) : null;

            const inscripcionOrigen = safeTrim(
                (row as Record<string, unknown>)['Origen de inscripción'] ??
                (row as Record<string, unknown>).inscripcion_origen ??
                get(row, 'inscripcionOrigen')
            );
            const purchaseDateDate = excelToDateObject(
                (row as Record<string, unknown>)['Fecha de compra'] ??
                (row as Record<string, unknown>)['purchase date'] ??
                get(row, 'purchaseDate')
            );

            const identificacionTipo = safeTrim(
                (row as Record<string, unknown>)['Tipo de identificación'] ??
                (row as Record<string, unknown>).identificacion_tipo ??
                get(row, 'identificacionTipo')
            );
            const identificacionNumero =
                safeTrim(
                    (row as Record<string, unknown>)['Número identificación'] ??
                    (row as Record<string, unknown>)['Numero identificación'] ??
                    (row as Record<string, unknown>).identificacion_numero ??
                    get(row, 'identificacionNumero')
                ) || document;
            const tieneAcudiente = safeTrim(
                (row as Record<string, unknown>)['Tiene acudiente'] ??
                (row as Record<string, unknown>).tiene_acudiente ??
                get(row, 'tieneAcudiente')
            );
            const acudienteNombre = safeTrim(
                (row as Record<string, unknown>)['Acudiente nombre'] ??
                (row as Record<string, unknown>).acudiente_nombre ??
                get(row, 'acudienteNombre')
            );
            const acudienteContacto = safeTrim(
                (row as Record<string, unknown>)['Acudiente contacto'] ??
                (row as Record<string, unknown>).acudiente_contacto ??
                get(row, 'acudienteContacto')
            );
            const acudienteEmail = safeTrim(
                (row as Record<string, unknown>)['Acudiente email'] ??
                (row as Record<string, unknown>).acudiente_email ??
                get(row, 'acudienteEmail')
            );

            console.log(`[MASIVE][ROW ${processed}] base`, {
                firstName,
                lastName,
                email,
                programa,
                numeroCuotas,
                valorPrograma,
                inscripcionValor,
            });

            console.log(`[MASIVE][ROW ${processed}] cuota-like fields crudos`, pickCuotaLike(row));

            try {
                // 1) Clerk (tolerante cuota agotada)
                let isNewInClerk = false;
                let clerkUser: ClerkUser | null = null;
                let generatedPassword: string | null = null;

                try {
                    const created = await createUser(firstName, lastName, email, 'estudiante', 'active');
                    if (created && typeof created === 'object' && 'user' in created) {
                        isNewInClerk = true;
                        clerkUser = created.user as ClerkUser;
                        generatedPassword =
                            'generatedPassword' in created
                                ? ((created as Record<string, unknown>).generatedPassword as string)
                                : null;
                    } else {
                        clerkUser = await getClerkUserByEmail(email);
                    }
                } catch (err) {
                    const msg = (err as Error)?.message ?? '';
                    const quotaExceeded = /user[_\s-]*quota[_\s-]*exceeded|status:\s*403|^\s*403\s*$/i.test(msg);
                    const probablyExists = /already\s*exist|identifier.*in\s*use|email.*taken|409|422/i.test(msg);

                    console.warn(`[MASIVE][ROW ${processed}] Clerk error:`, msg);

                    if (probablyExists) {
                        clerkUser = await getClerkUserByEmail(email);
                    } else if (quotaExceeded) {
                        clerkUser = null; // seguimos modo local
                    } else {
                        resultados.push({
                            email,
                            estado: 'ERROR',
                            detalle: `Clerk: ${msg || 'error creando usuario'}`,
                        });
                        continue;
                    }
                }

                // 2) Upsert en BD (tabla users) → aunque no haya clerkUser, seguimos con id local
                const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

                const subscriptionEnd = new Date();
                subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

                const baseSet = {
                    name: `${firstName} ${lastName}`,
                    role: 'estudiante' as const,
                    updatedAt: new Date(),
                    planType: 'Premium' as const,
                    subscriptionStatus: 'active' as const,
                    subscriptionEndDate: subscriptionEnd,

                    phone: phone || null,
                    document: document || null,

                    address: address || null,
                    country: country || null,
                    city: city || null,
                    birthDate: birthDateStr,

                    identificacionTipo: identificacionTipo || null,
                    identificacionNumero: identificacionNumero || null,
                    nivelEducacion: nivelEducacion || null,

                    programa: programa || null,
                    fechaInicio: fechaInicioStr ?? null,
                    comercial: comercial || null,
                    sede: sede || null,
                    horario: horario || null,

                    numeroCuotas: numeroCuotas || null,
                    pagoInscripcion: pagoInscripcion || null,
                    pagoCuota1: pagoCuota1 || null,

                    valorPrograma: valorPrograma ?? null,
                    inscripcionValor: inscripcionValor ?? null,
                    paymentMethod: paymentMethod || null,
                    cuota1Fecha: cuota1FechaStr,
                    cuota1Metodo: cuota1Metodo || null,
                    cuota1Valor: cuota1Valor ?? null,
                    inscripcionOrigen: inscripcionOrigen || null,

                    purchaseDate: purchaseDateDate,

                    tieneAcudiente: tieneAcudiente || null,
                    acudienteNombre: acudienteNombre || null,
                    acudienteContacto: acudienteContacto || null,
                    acudienteEmail: acudienteEmail || null,
                };

                const userIdToUse = existing.length > 0 ? existing[0].id : (clerkUser?.id ?? `local:${email}`);

                if (existing.length > 0) {
                    await db.update(users).set(baseSet).where(eq(users.id, existing[0].id));
                    resultados.push({
                        email,
                        estado: 'YA_EXISTE',
                        detalle: 'Actualizado en BD (ya existía)',
                    });
                    console.log(`[MASIVE][ROW ${processed}] user actualizado`, { id: existing[0].id });
                } else {
                    await db.insert(users).values({
                        id: userIdToUse,
                        email,
                        createdAt: new Date(),
                        ...baseSet,
                    });
                    resultados.push({ email, estado: 'GUARDADO' });
                    console.log(`[MASIVE][ROW ${processed}] user insertado`, { id: userIdToUse });
                }

                // 3) ➕ Guardar cuotas en `pagos` (normalizado: 1 fila por cuota)
                const cuotasDet = extractCuotas(row);
                console.log(`[MASIVE][ROW ${processed}] cuotasDet extraídas`, cuotasDet);

                const cuotasRows = cuotasDet
                    .map<CuotaDet>((c) => ({
                        nroPago: c.nroPago,
                        // si la fecha vino vacía en la cuota, usamos fallback: cuota1Fecha -> fechaInicio -> hoy
                        fecha: c.fecha ?? cuota1FechaStr ?? fechaInicioStr ?? toYMD(new Date()),
                        metodo: (c.metodo ?? paymentMethod) || 'No especificado',
                        valor: c.valor ?? null,
                    }))
                    // Pagos requiere: fecha, metodo y valor (NOT NULL). Solo insertamos si hay valor y fecha.
                    .filter((c) => c.valor !== null && c.valor !== undefined && c.fecha);

                console.log(`[MASIVE][ROW ${processed}] cuotasRows (a insertar)`, cuotasRows);

                if (cuotasRows.length > 0) {
                    const nros = cuotasRows.map((c) => c.nroPago);
                    await db
                        .delete(pagos)
                        .where(and(eq(pagos.userId, userIdToUse), eq(pagos.concepto, 'cuota'), inArray(pagos.nroPago, nros)));
                    console.log(`[MASIVE][ROW ${processed}] DELETE pagos cuota nros:`, nros);

                    await db.insert(pagos).values(
                        cuotasRows.map((c) => ({
                            userId: userIdToUse,
                            programaId: null,
                            concepto: 'cuota',
                            nroPago: c.nroPago,
                            fecha: c.fecha as string, // 'YYYY-MM-DD'
                            metodo: (c.metodo || 'No especificado') as string,
                            valor: c.valor as number,
                        }))
                    );
                    console.log(`[MASIVE][ROW ${processed}] INSERT pagos cuota:`, cuotasRows.length);
                } else {
                    console.warn(
                        `[MASIVE][ROW ${processed}] NO se insertaron cuotas (faltó valor/fecha en todas).`
                    );
                }

                // 4) ➕ Guardar inscripción (concepto='inscripción', nroPago=0) si viene valor
                if (inscripcionValor !== null && inscripcionValor !== undefined) {
                    const insFechaStr =
                        (purchaseDateDate ? toYMD(purchaseDateDate) : null) ?? cuota1FechaStr ?? fechaInicioStr ?? toYMD(new Date());

                    await db
                        .delete(pagos)
                        .where(and(eq(pagos.userId, userIdToUse), eq(pagos.concepto, 'inscripción'), eq(pagos.nroPago, 0)));
                    console.log(`[MASIVE][ROW ${processed}] DELETE pago inscripción (nroPago=0)`);

                    await db.insert(pagos).values({
                        userId: userIdToUse,
                        programaId: null,
                        concepto: 'inscripción',
                        nroPago: 0,
                        fecha: insFechaStr,
                        metodo: paymentMethod || 'No especificado',
                        valor: inscripcionValor,
                    });
                    console.log(`[MASIVE][ROW ${processed}] INSERT pago inscripción`, {
                        fecha: insFechaStr,
                        valor: inscripcionValor,
                    });
                }

                createdOrSynced.push({
                    id: userIdToUse,
                    email,
                    firstName,
                    lastName,
                    isNew: !!clerkUser && existing.length === 0,
                });
                void generatedPassword;
            } catch (err) {
                console.error(`[MASIVE][ROW ${processed}] ERROR al guardar usuario/pagos`, err);
                resultados.push({
                    email,
                    estado: 'ERROR',
                    detalle: (err as Error)?.message ?? 'Error desconocido al guardar usuario',
                });
            }
        }

        const summary = {
            total: resultados.length,
            guardados: resultados.filter((r) => r.estado === 'GUARDADO').length,
            yaExiste: resultados.filter((r) => r.estado === 'YA_EXISTE').length,
            errores: resultados.filter((r) => r.estado === 'ERROR').length,
            omitidosPorCompatibilidad: omitidosPorSinNombre + omitidosPorCliente,
        };

        console.log('[MASIVE] summary:', summary);

        return NextResponse.json({
            message: 'OK',
            summary,
            resultados,
            users: createdOrSynced,
        });
    } catch (error) {
        console.error('[MASIVE] ERROR general', error);
        return NextResponse.json(
            {
                error: 'Error al procesar archivo',
                detalle: (error as Error)?.message ?? 'Error desconocido',
            },
            { status: 500 }
        );
    }
}


// ====== GET: plantilla ======
export function GET() {
    try {
        const template = [
            {
                Nombres: 'Ana',
                Apellidos: 'Ramírez',
                'Correo electrónico': 'ana.ramirez@example.com',
                'Número de teléfono': '3001234567',
                'Numero de identificación': '1234567890',
                'País de residencia': 'Colombia',
                'Ciudad de residencia': 'Bogotá',
                'Fecha de nacimiento': '1999-07-15',

                Programa: 'Diseño',
                'Fecha de inicio': '2025-02-01',
                Comercial: 'Tu Nombre',
                Sede: 'Norte',
                Horario: 'Mañana',

                'Numero de cuotas': '10',
                'Pago de inscripción': 'Sí',
                'Pago cuota 1': 'No',
                'valor del programa': 1200000,

                'Valor inscripción': 200000,
                'Método de pago': 'Tarjeta',
                'Cuota1 fecha': '2025-03-01',
                'Cuota1 método': 'Transferencia',
                'Cuota1 valor': 300000,
                'Origen de inscripción': 'Web',
                'Fecha de compra': '2025-02-10',

                'Tipo de identificación': 'CC',
                'Acudiente nombre': '',
                'Acudiente contacto': '',
                'Acudiente email': '',

                // Ejemplos de cuotas adicionales:
                'Cuota 2 fecha': '2025-04-01',
                'Cuota 2 método': 'Transferencia',
                'Cuota 2 valor': 300000,
                'Cuota 3 fecha': '2025-05-01',
                'Cuota 3 método': 'Tarjeta',
                'Cuota 3 valor': 300000,
            },
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename=plantilla_usuarios_v2.xlsx',
            },
        });
    } catch {
        return NextResponse.json({ error: 'No se pudo generar la plantilla' }, { status: 500 });
    }
}
