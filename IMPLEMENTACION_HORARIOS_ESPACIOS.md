# Implementación de Opciones de Horarios y Espacios

## Resumen de Cambios

Este documento describe la implementación completa del sistema de opciones de horarios y espacios para cursos en Artiefy.

### 1. **Modificaciones en Base de Datos** (`src/server/db/schema.ts`)

#### Nuevas Tablas Creadas:

- **`scheduleOptions`**: Almacena las opciones disponibles de horarios
  - `id`: PRIMARY KEY
  - `name`: Nombre del horario (ej: "Mañana (8:00 - 12:00)")
  - `description`: Descripción opcional
  - `startTime`: Hora de inicio (formato HH:MM)
  - `endTime`: Hora de finalización (formato HH:MM)
  - `isActive`: Estado (activo/inactivo)
  - `createdAt`, `updatedAt`: Timestamps

- **`spaceOptions`**: Almacena las opciones disponibles de espacios
  - `id`: PRIMARY KEY
  - `name`: Nombre del espacio (ej: "Sede Centro")
  - `description`: Descripción opcional
  - `location`: Ubicación física
  - `capacity`: Capacidad máxima
  - `isActive`: Estado
  - `createdAt`, `updatedAt`: Timestamps

#### Cambios en Tabla `courses`:

- **Reemplazadas columnas de texto:**
  - `horario: text` → `scheduleOptionId: integer` (FK a scheduleOptions)
  - `espacios: text` → `spaceOptionId: integer` (FK a spaceOptions)

---

### 2. **APIs REST** (`src/app/api/super-admin/`)

#### Schedule Options API (`schedule-options/route.ts`)

- **GET**: Obtiene todas las opciones de horarios activos
- **POST**: Crea una nueva opción de horario
- **PUT**: Actualiza una opción existente
- **DELETE**: Elimina una opción

#### Space Options API (`space-options/route.ts`)

- **GET**: Obtiene todas las opciones de espacios activos
- **POST**: Crea una nueva opción de espacio
- **PUT**: Actualiza una opción existente
- **DELETE**: Elimina una opción

---

### 3. **Vistas del Dashboard** (`src/app/dashboard/subscription/`)

#### Schedule Options Page (`schedule-options/page.tsx`)

- Interfaz CRUD completa para gestionar horarios
- Tabla con todas las opciones
- Modal para crear/editar
- Validaciones y feedback en tiempo real

#### Space Options Page (`space-options/page.tsx`)

- Interfaz CRUD completa para gestionar espacios
- Tabla con todas las opciones
- Modal para crear/editar
- Campos: nombre, descripción, ubicación, capacidad

---

### 4. **Componentes Actualizados**

#### ModalFormCourse (Super Admin)

**Archivo**: `src/components/super-admin/modals/ModalFormCourse.tsx`

**Cambios:**

- Reemplazadas opciones hardcodeadas con datos dinámicos de API
- Agregados nuevos estados:
  - `scheduleOptions`: array de opciones de horarios
  - `spaceOptions`: array de opciones de espacios
  - `selectedScheduleId`: ID seleccionado del horario
  - `selectedSpaceId`: ID seleccionado del espacio
  - `isLoadingSchedules`, `isLoadingSpaces`: estados de carga

- **Nuevos useEffect** para cargar datos de APIs
- **Selects actualizados** para mostrar nombres dinámicos
- **Tipos actualizados** de `string | null` a `number | null`

---

### 5. **API de Cursos Actualizada** (`src/app/api/educadores/courses/route.ts`)

**Cambios en POST:**

```typescript
// Body recibe:
horario?: number | null;      // ID de schedule_options
espacios?: number | null;     // ID de space_options

// Se almacena como:
scheduleOptionId: horario ?? null
spaceOptionId: espacios ?? null
```

**Cambios en PUT:**

- Misma lógica de actualización con IDs de FK

---

### 6. **Modelos Actualizados** (`src/models/educatorsModels/courseModelsEducator.ts`)

**Función `updateCourse`:**

- Tipos actualizados:
  - `horario?: string` → `scheduleOptionId?: number`
  - `espacios?: string` → `spaceOptionId?: number`

---

### 7. **Page del Super-Admin** (`src/app/dashboard/super-admin/(inicio)/cursos/page.tsx`)

**Cambios:**

```typescript
// Antes:
const [horario, setHorario] = useState<string | null>(null);
const [espacios, setEspacios] = useState<string | null>(null);

// Ahora:
const [horario, setHorario] = useState<number | null>(null);
const [espacios, setEspacios] = useState<number | null>(null);
```

---

## Flujo de Uso

### Crear/Editar Opciones:

1. Admin accede a `/dashboard/subscription/schedule-options` o `space-options`
2. Hace clic en "Nuevo Horario/Espacio"
3. Completa el formulario modal
4. Los datos se guardan en BD y se muestran en tabla

### Asignar a Cursos:

1. Admin crea/edita un curso
2. En el modal de curso, selecciona el horario y espacio de los dropdowns
3. Los IDs se envían a la API
4. Se guardan como FK en tabla `courses`

---

## Próximos Pasos

- [ ] Ejecutar `npm run db:generate` para generar migraciones
- [ ] Ejecutar `npm run db:migrate` para aplicar cambios
- [ ] Probar CRUD de opciones en dashboard
- [ ] Verificar selects en formularios de cursos
- [ ] Actualizar otros componentes que usen `horario`/`espacios`
- [ ] Agregar relaciones en el modelo para queries optimizadas

---

## Archivos Modificados Resumen

```
✅ src/server/db/schema.ts
✅ src/app/api/super-admin/schedule-options/route.ts (NUEVO)
✅ src/app/api/super-admin/space-options/route.ts (NUEVO)
✅ src/app/dashboard/subscription/schedule-options/page.tsx (NUEVO)
✅ src/app/dashboard/subscription/space-options/page.tsx (NUEVO)
✅ src/components/super-admin/modals/ModalFormCourse.tsx
✅ src/app/api/educadores/courses/route.ts
✅ src/models/educatorsModels/courseModelsEducator.ts
✅ src/app/dashboard/super-admin/(inicio)/cursos/page.tsx
```

---

## Notas Importantes

1. **No hay cambios en componentes de educadores** directamente, pero usan el mismo ModalFormCourse
2. **Las vistas de subscription** están solo en super-admin (acceso limitado)
3. **Las migraciones** aún no se han ejecutado - necesita correr `npm run db:generate` y `npm run db:migrate`
4. **Las FK** están configuradas con `default(sql\`NULL\`)` para compatibilidad
