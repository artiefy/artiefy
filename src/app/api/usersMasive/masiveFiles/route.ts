import { NextRequest, NextResponse } from 'next/server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import * as XLSX from 'xlsx';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import { createUser } from '~/server/queries/queries';

// === Runtime ===
export const runtime = 'nodejs';
export const maxDuration = 300;

// ====== Tipos ======
type ResultadoEstado = 'GUARDADO' | 'YA_EXISTE' | 'ERROR';
interface RowResultado { email: string; estado: ResultadoEstado; detalle?: string }
interface ClerkUser { id: string }
interface ColumnMapping { excelColumn: string; dbField: string }

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

const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

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

    const raw = safeTrim(input);
    if (!raw) return null;

    const tryParse = new Date(raw);
    if (!Number.isNaN(tryParse.getTime())) {
        const yyyy = tryParse.getFullYear();
        const mm = String(tryParse.getMonth() + 1).padStart(2, '0');
        const dd = String(tryParse.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    return null;
}

/** Excel serial o string -> Date (para columnas timestamp() de Drizzle) */
function excelToDateObject(input: unknown): Date | null {
    if (input == null) return null;
    if (typeof input === 'number' && !Number.isNaN(input)) {
        const epoch = new Date(Date.UTC(1899, 11, 30));
        return new Date(epoch.getTime() + input * 24 * 60 * 60 * 1000);
    }
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
            const isKey = ['nombre', 'nombres', 'apellido', 'apellidos', 'correo', 'email', 'teléfono', 'telefono', 'identificación', 'identificacion']
                .some((k) => norm.includes(k));
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

/** Genera mappings automáticos para tus 2 formatos y variantes */
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
        // auth robusto
        const authMaybe = auth();
        const isPromise = authMaybe != null && typeof authMaybe === 'object' && 'then' in authMaybe && typeof (authMaybe as { then?: unknown }).then === 'function'; const authResult = isPromise ? await authMaybe : authMaybe;
        const userId: string | null = authResult?.userId ?? null;

        // fallback DEV
        const headerUserId = request.headers.get('x-user-id');
        const effectiveUserId = userId ?? headerUserId ?? null;

        if (!effectiveUserId) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // saca tu fila; si no existe, usa Clerk para name/email
        const meArr = await db.select().from(users).where(eq(users.id, effectiveUserId)).limit(1);
        let me = meArr[0] ?? null;

        if (!me) {
            const cu = await currentUser().catch(() => null);
            me = {
                id: effectiveUserId,
                role: 'estudiante',
                email: cu?.emailAddresses?.[0]?.emailAddress ?? null,
                name: [cu?.firstName, cu?.lastName].filter(Boolean).join(' ') || null,
            } as typeof users.$inferSelect;
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

        // 🔁 NUEVO: no filtramos por "Comercial/Asesor". Mostramos todo.
        const rowsPorUsuario = objects;

        // Filas SIN nombre → fuera
        const hasName = (o: Record<string, unknown>) => !!safeTrim(o.Nombres ?? o.Nombre ?? '');
        const allowedRows = rowsPorUsuario.filter(hasName);

        const omitidosPorSinNombre = rowsPorUsuario.length - allowedRows.length;
        // Si el cliente envió filas editadas, usamos esas filas en lugar de re-leer del Excel
        let rowsToProcess: Record<string, unknown>[] = allowedRows;
        let omitidosPorCliente = 0;

        if (rowsJson && typeof rowsJson === 'string') {
            try {
                const clientRows = JSON.parse(rowsJson) as Record<string, unknown>[];
                // Aseguramos que también tengan nombre
                rowsToProcess = (clientRows || []).filter(hasName);
                // Cuántas quitó explícitamente el cliente (aprox)
                omitidosPorCliente = Math.max(allowedRows.length - rowsToProcess.length, 0);
            } catch {
                // si no se puede parsear, seguimos con allowedRows
            }
        }


        // Preview
        if (previewOnly) {
            const autoMappings = autoDetectMappings(headers);
            return NextResponse.json({
                preview: true,
                columns: headers,
                autoMappings,
                detectedHeaderRow: headersRowIndex,
                rowCount: allowedRows.length,
                rowsTotal: objects.length,
                rowsAllowed: allowedRows.length,
                sampleData: allowedRows, // TODAS las filas permitidas (no solo 5)
            });
        }

        // Parse mappings (desde el front)
        const mappings: ColumnMapping[] = mappingsJson && typeof mappingsJson === 'string'
            ? (JSON.parse(mappingsJson) as ColumnMapping[])
            : [];

        const get = (row: Record<string, unknown>, dbField: string) => {
            const map = mappings.find((m) => m.dbField === dbField);
            if (map?.excelColumn) return safeTrim(row[map.excelColumn]);
            return '';
        };

        const resultados: RowResultado[] = [];
        const createdOrSynced: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            isNew: boolean;
        }[] = [];

        let processed = 0;

        for (const row of rowsToProcess) {
            processed++;
            if (processed % 10 === 0) await delay(700);

            const firstName = String(get(row, 'firstName') ?? '');
            const lastName = String(get(row, 'lastName') ?? '');
            const email = String(get(row, 'email') ?? '').toLowerCase();
            const phone = String(get(row, 'phone') ?? '');
            const document = String(get(row, 'document') ?? '');

            // seguridad extra: si no hay nombre, omite sin marcar error
            if (!firstName) continue;

            if (!lastName || !email) {
                resultados.push({
                    email: email || '(sin_email)',
                    estado: 'ERROR',
                    detalle: 'Campos obligatorios faltantes (firstName, lastName, email)',
                });
                continue;
            }
            if (!isValidEmail(email)) {
                resultados.push({ email, estado: 'ERROR', detalle: 'Email inválido' });
                continue;
            }

            // opcionales
            const address = safeTrim(row['Dirección'] ?? row.Direccion ?? get(row, 'address'));
            const country = safeTrim(row['País de residencia'] ?? row['Pais de residencia'] ?? get(row, 'country'));
            const city = safeTrim(row['Ciudad de residencia'] ?? row.ciudad ?? get(row, 'city'));
            const birthDateStr = excelToDateString(row['Fecha de nacimiento'] ?? get(row, 'birthDate'));

            const nivelEducacion = safeTrim(row['Nivel de educación'] ?? row['Nivel Educación'] ?? get(row, 'nivelEducacion'));
            const programa = safeTrim(row.Programa ?? get(row, 'programa'));
            const fechaInicioStr = excelToDateString(row['Fecha de inicio'] ?? row['FECHA PRIMERA CUOTA'] ?? get(row, 'fechaInicio'));
            const comercial = safeTrim(row.Comercial ?? row.Asesor ?? get(row, 'comercial'));
            const sede = safeTrim(row.Sede ?? get(row, 'sede'));
            const horario = safeTrim(row.Horario ?? get(row, 'horario'));

            const numeroCuotas = safeTrim(row['Número de cuotas'] ?? row['Numero de cuotas'] ?? get(row, 'numeroCuotas'));
            const pagoInscripcion = safeTrim(row['Pago de inscripción'] ?? row['pago de inscripción'] ?? get(row, 'pagoInscripcion'));
            const pagoCuota1 = safeTrim(row['Pago cuota 1'] ?? get(row, 'pagoCuota1'));
            const valorProgramaRaw = safeTrim(row['valor del programa'] ?? row['Valor del programa'] ?? get(row, 'valorPrograma'));
            const valorPrograma =
                valorProgramaRaw && !Number.isNaN(Number(valorProgramaRaw)) ? Number(valorProgramaRaw) : null;

            const inscripcionValorRaw = safeTrim(
                row['Valor inscripción'] ??
                row['Inscripción valor'] ??
                row['inscripcion valor'] ??
                row.inscripcion_valor ??
                get(row, 'inscripcionValor'),
            );
            const inscripcionValor =
                inscripcionValorRaw && !Number.isNaN(Number(inscripcionValorRaw)) ? Number(inscripcionValorRaw) : null;

            const paymentMethod = safeTrim(row['Método de pago'] ?? row['payment method'] ?? get(row, 'paymentMethod'));
            const cuota1FechaStr = excelToDateString(row['Cuota1 fecha'] ?? row['CUOTA 1 FECHA'] ?? get(row, 'cuota1Fecha'));
            const cuota1Metodo = safeTrim(row['Cuota1 método'] ?? row['CUOTA 1 MÉTODO'] ?? row['CUOTA 1 METODO'] ?? get(row, 'cuota1Metodo'));
            const cuota1ValorRaw = safeTrim(row['Cuota1 valor'] ?? row['CUOTA 1 VALOR'] ?? get(row, 'cuota1Valor'));
            const cuota1Valor =
                cuota1ValorRaw && !Number.isNaN(Number(cuota1ValorRaw)) ? Number(cuota1ValorRaw) : null;

            const inscripcionOrigen = safeTrim(row['Origen de inscripción'] ?? row.inscripcion_origen ?? get(row, 'inscripcionOrigen'));
            const purchaseDateDate = excelToDateObject(row['Fecha de compra'] ?? row['purchase date'] ?? get(row, 'purchaseDate'));

            const identificacionTipo = safeTrim(row['Tipo de identificación'] ?? row.identificacion_tipo ?? get(row, 'identificacionTipo'));
            const identificacionNumero =
                safeTrim(row['Número identificación'] ?? row['Numero identificación'] ?? row.identificacion_numero ?? get(row, 'identificacionNumero')) || document;
            const tieneAcudiente = safeTrim(row['Tiene acudiente'] ?? row.tiene_acudiente ?? get(row, 'tieneAcudiente'));
            const acudienteNombre = safeTrim(row['Acudiente nombre'] ?? row.acudiente_nombre ?? get(row, 'acudienteNombre'));
            const acudienteContacto = safeTrim(row['Acudiente contacto'] ?? row.acudiente_contacto ?? get(row, 'acudienteContacto'));
            const acudienteEmail = safeTrim(row['Acudiente email'] ?? row.acudiente_email ?? get(row, 'acudienteEmail'));

            try {
                // 1) Clerk
                let isNewInClerk = false;
                let clerkUser: ClerkUser | null = null;
                let generatedPassword: string | null = null;

                try {
                    const created = await createUser(firstName, lastName, email, 'estudiante', 'active');
                    if (created && typeof created === 'object' && 'user' in created) {
                        isNewInClerk = true;
                        clerkUser = created.user as ClerkUser;
                        generatedPassword = 'generatedPassword' in created ? (created.generatedPassword as string) : null;
                    } else {
                        clerkUser = await getClerkUserByEmail(email);
                    }
                } catch (err) {
                    const msg = (err as Error)?.message ?? '';
                    const probablyExists =
                        /already\s*exist|identifier.*in\s*use|email.*taken|409|422/i.test(msg);
                    if (probablyExists) {
                        clerkUser = await getClerkUserByEmail(email);
                    } else {
                        resultados.push({
                            email,
                            estado: 'ERROR',
                            detalle: `Clerk: ${msg || 'error creando usuario'}`,
                        });
                        continue;
                    }
                }

                if (!clerkUser) {
                    resultados.push({
                        email,
                        estado: 'ERROR',
                        detalle: 'No se pudo obtener/crear usuario en Clerk',
                    });
                    continue;
                }

                // 2) Upsert en BD
                const existing = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, email))
                    .limit(1);

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

                if (existing.length > 0) {
                    await db.update(users).set(baseSet).where(eq(users.id, existing[0].id));
                    resultados.push({
                        email,
                        estado: 'YA_EXISTE',
                        detalle: 'Actualizado en BD (ya existía)',
                    });
                } else {
                    await db.insert(users).values({
                        id: clerkUser.id,
                        email,
                        createdAt: new Date(),
                        ...baseSet,
                    });

                    resultados.push({ email, estado: 'GUARDADO' });
                }

                createdOrSynced.push({
                    id: clerkUser.id,
                    email,
                    firstName,
                    lastName,
                    isNew: isNewInClerk,
                });
                void generatedPassword;
            } catch (err) {
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
            // solo los que se eliminaron por estar sin nombre
            omitidosPorCompatibilidad: omitidosPorSinNombre + omitidosPorCliente,
        };

        return NextResponse.json({
            message: 'OK',
            summary,
            resultados,
            users: createdOrSynced,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: 'Error al procesar archivo',
                detalle: (error as Error)?.message ?? 'Error desconocido',
            },
            { status: 500 },
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
            },
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;

        return new NextResponse(buffer, {
            headers: {
                'Content-Type':
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename=plantilla_usuarios_v2.xlsx',
            },
        });
    } catch {
        return NextResponse.json(
            { error: 'No se pudo generar la plantilla' },
            { status: 500 },
        );
    }
}