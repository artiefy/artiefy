# 📋 INSTRUCCIONES: Completar Otros ModalFormCourse

Este documento explica cómo replicar los cambios en los otros 2 ModalFormCourse que aún necesitan actualización.

## Archivos que necesitan actualización

1. ❌ `src/components/educators/modals/ModalFormCourse.tsx`
2. ❌ `src/components/educators/modals/program/ModalFormCourse.tsx`
3. ✅ `src/components/super-admin/modals/ModalFormCourse.tsx` (HECHO)

## Cambios a Aplicar

### PASO 1: Actualizar Estados

**Ubicar esta sección de estados:**

```tsx
const [isLoadingModalidades, setIsLoadingModalidades] = useState(true);
void isLoadingModalidades;
```

**Reemplazar con:**

```tsx
const [isLoadingModalidades, setIsLoadingModalidades] = useState(true);
const [frameImageFile, setFrameImageFile] = useState<File | null>(null);

// ✅ New states for schedule and space options
const [scheduleOptions, setScheduleOptions] = useState<
  { id: number; name: string }[]
>([]);
const [spaceOptions, setSpaceOptions] = useState<
  { id: number; name: string }[]
>([]);
const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
  null
);
const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
const [isLoadingSpaces, setIsLoadingSpaces] = useState(true);

void isLoadingCategories;
void isLoadingModalidades;
void isLoadingSchedules;
void isLoadingSpaces;
```

---

### PASO 2: Agregar useEffects para Cargar Datos

**Encontrar la sección de useEffects (al final de los existentes)**

**Agregar estos dos useEffects:**

```tsx
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

      const data = await response.json();
      setScheduleOptions(data.data || []);
    } catch (error) {
      console.error('Error detallado:', error);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  void fetchSchedules();
}, []);

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

      const data = await response.json();
      setSpaceOptions(data.data || []);
    } catch (error) {
      console.error('Error detallado:', error);
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  void fetchSpaces();
}, []);
```

---

### PASO 3: Actualizar Interfaz CourseFormProps

**Encontrar esta sección:**

```tsx
interface CourseFormProps {
  onSubmitAction: (
    id: string,
    title: string,
    description: string,
    file: File | null,
    categoryid: number,
    modalidadesid: number[], // o number, depende del archivo
    nivelid: number,
    rating: number,
    addParametros: boolean,
    coverImageKey: string,
    fileName: string,
    subjects: { id: number }[],
    programId: number, // puede no estar
    isActive: boolean,
    courseTypeId: number[],
    individualPrice: number | null,
    videoKey: string,
    horario: string | null, // ← CAMBIAR
    espacios: string | null // ← CAMBIAR
  ) => Promise<void>;
  // ... resto de propiedades
  horario: string | null; // ← CAMBIAR
  setHorario: (horario: string | null) => void; // ← CAMBIAR
  espacios: string | null; // ← CAMBIAR
  setEspacios: (espacios: string | null) => void; // ← CAMBIAR
}
```

**Reemplazar tipos de `string | null` a `number | null`:**

```tsx
interface CourseFormProps {
  onSubmitAction: (
    // ... otros parámetros
    horario: number | null, // ← ACTUALIZADO
    espacios: number | null // ← ACTUALIZADO
  ) => Promise<void>;
  // ... resto de propiedades
  horario: number | null; // ← ACTUALIZADO
  setHorario: (horario: number | null) => void; // ← ACTUALIZADO
  espacios: number | null; // ← ACTUALIZADO
  setEspacios: (espacios: number | null) => void; // ← ACTUALIZADO
}
```

---

### PASO 4: Reemplazar Selects HTML

**Encontrar los selects:**

```tsx
<div className="w-full">
  <label>Horario</label>
  <select
    value={horario ?? ''}
    onChange={(e) => setHorario(e.target.value || null)}
  >
    <option value="">Seleccionar horario</option>
    {horariosOptions.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
</div>

<div className="w-full">
  <label>Espacios</label>
  <select
    value={espacios ?? ''}
    onChange={(e) => setEspacios(e.target.value || null)}
  >
    <option value="">Seleccionar espacio</option>
    {espaciosOptions.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
</div>
```

**Reemplazar con:**

```tsx
<div className="w-full">
  <label className="text-primary text-sm font-medium md:text-lg">
    Horario
  </label>
  <select
    className="bg-background mt-1 w-full rounded border p-2 text-sm text-white md:text-base"
    value={selectedScheduleId ?? ''}
    onChange={(e) =>
      setSelectedScheduleId(
        e.target.value ? parseInt(e.target.value) : null
      )
    }
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
  <label className="text-primary text-sm font-medium md:text-lg">
    Espacios
  </label>
  <select
    className="bg-background mt-1 w-full rounded border p-2 text-sm text-white md:text-base"
    value={selectedSpaceId ?? ''}
    onChange={(e) =>
      setSelectedSpaceId(
        e.target.value ? parseInt(e.target.value) : null
      )
    }
  >
    <option value="">Seleccionar espacio</option>
    {spaceOptions.map((opt) => (
      <option key={opt.id} value={opt.id}>
        {opt.name}
      </option>
    ))}
  </select>
</div>
```

---

### PASO 5: Actualizar Llamada a onSubmitAction

**Encontrar donde se llama `onSubmitAction`:**

```tsx
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
  finalCoverImageKey,
  finalUploadedFileName,
  courseTypeId,
  isActive,
  subjects,
  finalVideoKey,
  individualPrice,
  parametros,
  horario, // ← CAMBIAR
  espacios // ← CAMBIAR
);
```

**Reemplazar con:**

```tsx
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
  finalCoverImageKey,
  finalUploadedFileName,
  courseTypeId,
  isActive,
  subjects,
  finalVideoKey,
  individualPrice,
  parametros,
  selectedScheduleId, // ← ACTUALIZADO
  selectedSpaceId // ← ACTUALIZADO
);
```

---

### PASO 6: Remover Opciones Hardcodeadas

**Eliminar estas líneas (que tenían opciones hardcodeadas):**

```tsx
// ❌ ELIMINAR ESTAS LÍNEAS
const horariosOptions = ['Sábado Mañana', 'Sábado Tarde', 'Lunes y Martes'];

const espaciosOptions = ['Florencia', 'Cali', 'Virtual'];
```

---

## Archivo 1: educators/modals/ModalFormCourse.tsx

Este archivo es similar al super-admin. Aplicar todos los cambios anteriores.

**Nota adicional:** Verificar que el parámetro `programId` se maneje correctamente.

---

## Archivo 2: educators/modals/program/ModalFormCourse.tsx

Este archivo es para gestionar cursos dentro de programas.

**Cambios adicionales necesarios:**

- Verificar si `programId` se pasa en la interfaz
- Asegurar que los tipos de `horario` y `espacios` sean `number | null`
- Aplicar todos los cambios del PASO 1-6

---

## Pages que necesitan Actualizar Tipos

### 1. `src/app/dashboard/educadores/(inicio)/cursos/page.tsx`

```tsx
// Cambiar:
const [horario, setHorario] = useState<string | null>(null);
const [espacios, setEspacios] = useState<string | null>(null);

// Por:
const [horario, setHorario] = useState<number | null>(null);
const [espacios, setEspacios] = useState<number | null>(null);
```

### 2. `src/app/dashboard/admin/cursos/page.tsx`

```tsx
// Cambiar:
const [horario, setHorario] = useState<string | null>(null);
const [espacios, setEspacios] = useState<string | null>(null);

// Por:
const [horario, setHorario] = useState<number | null>(null);
const [espacios, setEspacios] = useState<number | null>(null);
```

### 3. Handler Function en cada Page

```tsx
// En handleCreateOrEditCourse o similar:
// Cambiar tipos en firma:
horario: string | null,  →  horario: number | null,
espacios: string | null  →  espacios: number | null
```

---

## Validación Después de Cambios

Después de aplicar los cambios, verificar:

1. ✅ TypeScript compila sin errores
2. ✅ Los selects cargan opciones dinámicamente
3. ✅ Se pueden crear/editar cursos
4. ✅ Los IDs se guardan correctamente en BD
5. ✅ No hay errores en consola del navegador

---

## Scripts de Ayuda

### Buscar archivos con "horariosOptions"

```bash
grep -r "horariosOptions" src/components/educators/
```

### Buscar todos los ModalFormCourse

```bash
find src/components -name "ModalFormCourse.tsx"
```

### Buscar horario: string

```bash
grep -rn "horario.*string" src/
```

---

## ⏱️ Tiempo Estimado

- 10-15 minutos por archivo
- Total: 30-40 minutos para los 2 ModalFormCourse + 2 pages

---

## 🔍 Checklist de Verificación

Después de cada archivo, verificar:

- [ ] Estados agregados correctamente
- [ ] useEffects para cargar datos presente
- [ ] Tipos cambiados de string a number
- [ ] Selects reemplazados
- [ ] onSubmitAction usa selectedScheduleId y selectedSpaceId
- [ ] Opciones hardcodeadas removidas
- [ ] TypeScript sin errores
- [ ] Sin errores en consola

---

✨ **¡Listo para completar los cambios!** 🚀
