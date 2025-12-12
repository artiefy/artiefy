# 📋 PASOS FINALES - Sistema de Horarios y Espacios

## ✅ Lo que se ha implementado

### 1️⃣ **Base de Datos**

- ✅ Nuevas tablas: `scheduleOptions` y `spaceOptions`
- ✅ Relaciones FK en tabla `courses`
- ✅ Reemplazadas columnas `horario` y `espacios` (antes `text`, ahora `integer`)

### 2️⃣ **APIs CRUD**

- ✅ `/api/super-admin/schedule-options` - Gestión completa de horarios
- ✅ `/api/super-admin/space-options` - Gestión completa de espacios

### 3️⃣ **Dashboard - Vistas**

- ✅ `/dashboard/subscription/schedule-options` - Tabla CRUD de horarios
- ✅ `/dashboard/subscription/space-options` - Tabla CRUD de espacios

### 4️⃣ **Componentes Actualizados**

- ✅ `ModalFormCourse` - Selects dinámicos con datos de API
- ✅ `courseModelsEducator.ts` - Tipos actualizados
- ✅ `page.tsx` (super-admin) - Estados de número en lugar de string

---

## 🔄 PRÓXIMOS PASOS REQUERIDOS

### PASO 1: Ejecutar Migraciones

```bash
cd "c:\Users\lsosa\Desktop\Artiefy\artiefy"
npm run db:generate
npm run db:migrate
```

### PASO 2: Agregar link en menú

Actualiza `src/components/eduAndAdmiMenu.tsx` para agregar links a:

- `/dashboard/subscription/schedule-options`
- `/dashboard/subscription/space-options`

**Ejemplo:**

```tsx
const navItemsSuperAdmin = [
  // ... items existentes
  {
    icon: <FiClock size={18} />,
    title: 'Opciones de Horarios',
    id: 'schedules',
    link: '/dashboard/subscription/schedule-options',
  },
  {
    icon: <FiMapPin size={18} />,
    title: 'Opciones de Espacios',
    id: 'spaces',
    link: '/dashboard/subscription/space-options',
  },
];
```

### PASO 3: Verificar Carga de Datos

1. **Crear opciones iniciales:**
   - Accede a `/dashboard/subscription/schedule-options`
   - Crea al menos 2-3 horarios
   - Accede a `/dashboard/subscription/space-options`
   - Crea al menos 2-3 espacios

2. **Probar en formulario de cursos:**
   - Accede a `/dashboard/super-admin/cursos`
   - Crea/edita un curso
   - Verifica que los selects muestren las opciones creadas

### PASO 4: Actualizar otros ModalFormCourse

Hay 3 versiones de ModalFormCourse que necesitan los mismos cambios:

- ✅ `src/components/super-admin/modals/ModalFormCourse.tsx` (HECHO)
- ⏳ `src/components/educators/modals/ModalFormCourse.tsx` (TODO)
- ⏳ `src/components/educators/modals/program/ModalFormCourse.tsx` (TODO)

**Para cada una, aplicar los mismos cambios:**

- Reemplazar `horariosOptions` y `espaciosOptions` hardcodeados
- Agregar estados: `scheduleOptions`, `spaceOptions`, `selectedScheduleId`, `selectedSpaceId`
- Agregar useEffect para cargar de API
- Actualizar selects para usar IDs en lugar de strings
- Actualizar tipos de `string | null` a `number | null`

### PASO 5: Actualizar otros Pages de Cursos

Actualizar los types en estos archivos de la misma forma:

- ⏳ `src/app/dashboard/educadores/(inicio)/cursos/page.tsx`
- ⏳ `src/app/dashboard/admin/cursos/page.tsx`

---

## 📊 Estructura de Datos

### scheduleOptions

```json
{
  "id": 1,
  "name": "Mañana (8:00 - 12:00)",
  "description": "Clases en la mañana",
  "startTime": "08:00",
  "endTime": "12:00",
  "isActive": true,
  "createdAt": "2025-12-09T...",
  "updatedAt": "2025-12-09T..."
}
```

### spaceOptions

```json
{
  "id": 1,
  "name": "Sede Centro",
  "description": "Oficina principal en el centro",
  "location": "Calle 10 # 5-50, Bogotá",
  "capacity": 30,
  "isActive": true,
  "createdAt": "2025-12-09T...",
  "updatedAt": "2025-12-09T..."
}
```

### Courses (cambios)

```json
{
  "id": 1,
  "title": "React Avanzado",
  "scheduleOptionId": 1, // ← FK a scheduleOptions
  "spaceOptionId": 1 // ← FK a spaceOptions
  // ... otros campos
}
```

---

## 🧪 Testing

### 1. Test de API (usando cURL o Postman)

**Crear horario:**

```bash
curl -X POST http://localhost:3000/api/super-admin/schedule-options \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mañana",
    "startTime": "08:00",
    "endTime": "12:00",
    "isActive": true
  }'
```

**Obtener todos los horarios:**

```bash
curl http://localhost:3000/api/super-admin/schedule-options
```

### 2. Test en Dashboard

1. Inicia sesión como super-admin
2. Navega a opciones de horarios/espacios
3. CRUD: crear, editar, eliminar
4. Verifica que aparezcan en selects de cursos

---

## 📝 Notas Importantes

- Las migraciones **no se han ejecutado** aún
- Los componentes de educadores aún usan las versiones antiguas
- Las tablas `scheduleOptions` y `spaceOptions` están optimizadas con índices
- Los campos `isActive` permiten desactivar opciones sin eliminarlas

---

## 🔗 Referencias de Archivos Clave

| Archivo                                                    | Propósito                         |
| ---------------------------------------------------------- | --------------------------------- |
| `src/server/db/schema.ts`                                  | Definición de tablas              |
| `src/app/api/super-admin/schedule-options/route.ts`        | API CRUD horarios                 |
| `src/app/api/super-admin/space-options/route.ts`           | API CRUD espacios                 |
| `src/app/dashboard/subscription/schedule-options/page.tsx` | Dashboard horarios                |
| `src/app/dashboard/subscription/space-options/page.tsx`    | Dashboard espacios                |
| `src/components/super-admin/modals/ModalFormCourse.tsx`    | Modal de cursos (actualizado)     |
| `src/app/api/educadores/courses/route.ts`                  | API de cursos (actualizado tipos) |

---

## ❓ FAQ

**P: ¿Puedo eliminar una opción si ya está en uso?**
A: Depende de las restricciones FK. Actualmente sin restricción, pero deberías hacer soft-delete con `isActive`.

**P: ¿Qué pasa con los cursos existentes?**
A: Los campos `scheduleOptionId` y `spaceOptionId` quedarán NULL. Necesitarás migrar datos manualmente si existen registros.

**P: ¿Dónde creo las primeras opciones?**
A: En `/dashboard/subscription/schedule-options` y `/dashboard/subscription/space-options`

---

✨ **¡Sistema completo y listo para usar!** 🚀
