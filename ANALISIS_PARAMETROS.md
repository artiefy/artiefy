# Análisis del Sistema de Parámetros y Plantillas

## 📊 Resumen Ejecutivo

Se ha implementado un sistema completo de gestión de **Parámetros de Evaluación** y **Plantillas de Parámetros** para el administrador super-admin. Este sistema permite crear criterios de evaluación reutilizables y organizarlos en plantillas que no pueden superar el 100% de ponderación.

---

## 🔍 Análisis de Funcionamiento de Parámetros

### Estructura Original (Antes)

Los parámetros existían en la base de datos con la siguiente estructura:

```sql
CREATE TABLE parametros (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  porcentaje INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  FOREIGN KEY(course_id) REFERENCES courses(id)
);
```

**Campos:**

- `id`: Identificador único
- `name`: Nombre del parámetro
- `description`: Descripción
- `porcentaje`: Peso porcentual (0-100)
- `courseId`: Referencia al curso

**Funcionamiento:**

- Se creaban a nivel de curso
- Se asociaban a actividades mediante `activities.parametro_id`
- Las calificaciones se almacenaban en `parameterGrades`

---

## ✨ Mejoras Implementadas

### 1. **Campo Nuevo: `numberOfActivities`**

Se agregó un nuevo campo para definir cuántas actividades pertenecen a cada parámetro:

```sql
numberOfActivities: integer('number_of_activities').default(0).notNull()
```

**Propósito:**

- Permite dividir automáticamente el porcentaje del parámetro entre las actividades
- **Ejemplo:** Si un parámetro tiene 40% y 4 actividades, cada actividad contribuye 10% a la nota final

**Fórmula de cálculo:**

```
Porcentaje por actividad = (Porcentaje del parámetro / Número de actividades)
```

### 2. **Nuevas Tablas para Plantillas**

#### Tabla: `parameter_templates`

```sql
CREATE TABLE parameter_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_percentage INTEGER NOT NULL DEFAULT 0,
  course_id INTEGER NOT NULL,
  creator_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(course_id) REFERENCES courses(id),
  FOREIGN KEY(creator_id) REFERENCES users(id)
);
```

**Propósito:** Almacena las plantillas reutilizables

#### Tabla: `template_parametros`

```sql
CREATE TABLE template_parametros (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL,
  parametro_id INTEGER NOT NULL,
  order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(template_id) REFERENCES parameter_templates(id),
  FOREIGN KEY(parametro_id) REFERENCES parametros(id)
);
```

**Propósito:** Relación muchos-a-muchos entre plantillas y parámetros

---

## 🛠️ Componentes Creados

### 1. **Página de Parámetros**

**Ruta:** `/dashboard/super-admin/parametros`

**Funcionalidades:**

- ✅ Listar todos los parámetros del curso
- ✅ Crear nuevo parámetro (modal)
- ✅ Editar parámetro existente
- ✅ Eliminar parámetro
- ✅ Mostrar detalles: nombre, descripción, porcentaje, número de actividades

**Campos del formulario:**

- Título (string, requerido)
- Descripción (text, requerido)
- Porcentaje (0-100, requerido)
- Número de Actividades (entero, opcional - default 0)

### 2. **Página de Plantillas**

**Ruta:** `/dashboard/super-admin/parametros/plantillas`

**Funcionalidades:**

- ✅ Listar todas las plantillas con visualización estética (grid)
- ✅ Crear nueva plantilla
- ✅ Editar plantilla existente
- ✅ Eliminar plantilla
- ✅ Buscador de parámetros en tiempo real
- ✅ Validación de 100% máximo
- ✅ Vista previa del porcentaje total
- ✅ Indicador visual con barra de progreso

**Campos del modal:**

- Nombre de plantilla (requerido)
- Descripción (opcional)
- Parámetros (selección múltiple con validación)

**Restricciones:**

```
Total Porcentaje ≤ 100%
```

**Validaciones:**

- ✅ No puede agregar parámetro si excede 100%
- ✅ No puede crear plantilla sin parámetros
- ✅ No puede crear plantilla si el porcentaje no suma 100%

### 3. **Menú Actualizado**

**Ubicación:** `eduAndAdmiMenu.tsx` - Sección Super Admin

Se agregó un nuevo submenú bajo "Parámetros" con dos opciones:

```
Parámetros
├── Parámetros
└── Plantillas
```

---

## 📡 API Endpoints Creados

### Parámetros

#### GET `/api/educadores/parametros`

```
Query: courseId (requerido)
Response: Parametros[]
```

#### POST `/api/educadores/parametros`

```json
{
  "name": "string",
  "description": "string",
  "porcentaje": number,
  "numberOfActivities": number,
  "courseId": number
}
```

#### PUT `/api/educadores/parametros`

```json
{
  "parametros": [
    {
      "id": number,
      "name": "string",
      "description": "string",
      "porcentaje": number,
      "numberOfActivities": number,
      "courseId": number
    }
  ]
}
```

#### PUT `/api/educadores/parametros/[id]`

```json
{
  "name": "string",
  "description": "string",
  "porcentaje": number,
  "numberOfActivities": number,
  "courseId": number
}
```

#### DELETE `/api/educadores/parametros`

```
Query: courseId (para eliminar todos) o body: { id }
```

### Plantillas

#### GET `/api/educadores/templates`

```
Query: courseId (requerido)
Response: TemplateWithParametros[]
```

#### POST `/api/educadores/templates`

```json
{
  "name": "string",
  "description": "string",
  "courseId": number,
  "creatorId": "string"
}
```

#### PUT `/api/educadores/templates`

```json
{
  "id": number,
  "name": "string",
  "description": "string"
}
```

#### DELETE `/api/educadores/templates`

```
Query: templateId (requerido)
```

### Parámetros en Plantillas

#### POST `/api/educadores/templates/parametros`

```json
{
  "templateId": number,
  "parametroId": number,
  "order": number
}
```

#### DELETE `/api/educadores/templates/parametros`

```
Query: templateId, parametroId
```

---

## 🔄 Flujo de Datos

### Crear un Parámetro

```
1. Usuario accede a /dashboard/super-admin/parametros
2. Hace clic en "Crear Nuevo Parámetro"
3. Completa el formulario modal
4. Sistema valida datos
5. POST a /api/educadores/parametros
6. Parámetro se guarda en BD
7. Tabla se actualiza automáticamente
```

### Crear una Plantilla

```
1. Usuario accede a /dashboard/super-admin/parametros/plantillas
2. Hace clic en "Crear Nueva Plantilla"
3. Completa nombre y descripción
4. Busca y selecciona parámetros
5. Sistema valida que no exceda 100%
6. POST a /api/educadores/templates para crear plantilla
7. POST a /api/educadores/templates/parametros para cada parámetro
8. Plantilla aparece en el grid
```

### Usar una Plantilla en un Curso

```
1. Cuando se crea/edita un curso
2. Se puede seleccionar una plantilla
3. Los parámetros de la plantilla se asocian al curso
4. Las actividades se crean bajo estos parámetros
```

---

## 💾 Modelos TypeScript

### Parametros

```typescript
interface Parametros {
  id: number;
  name: string;
  description: string;
  porcentaje: number;
  numberOfActivities: number;
  courseId: number;
}
```

### ParameterTemplate

```typescript
interface ParameterTemplate {
  id: number;
  name: string;
  description: string | null;
  totalPercentage: number;
  courseId: number;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### TemplateWithParametros

```typescript
interface TemplateWithParametros extends ParameterTemplate {
  parametros: Parametros[];
}
```

---

## 📝 Ejemplo de Uso

### Scenario: Crear Plantilla de Evaluación Continua

1. **Parámetros disponibles:**
   - Participación (20%)
   - Tareas (30%)
   - Quizzes (25%)
   - Proyecto Final (25%)

2. **Crear Plantilla:**
   - Nombre: "Evaluación Continua"
   - Descripción: "Plantilla estándar con 4 componentes"
   - Parámetros: Todos seleccionados
   - Total: 100% ✓

3. **Usar en curso:**
   - Curso nuevo selecciona plantilla
   - Se crean 4 parámetros automáticamente
   - Educador puede crear actividades bajo cada parámetro
   - El sistema calcula porcentajes proporcionales

---

## 🔐 Seguridad

- ✅ Validación de courseId en todas las operaciones
- ✅ Comprobación de autorización (creatorId)
- ✅ Validaciones de porcentaje en el servidor
- ✅ Sanitización de inputs

---

## 🚀 Próximas Mejoras Sugeridas

1. **Orden de parámetros:** Permitir reordenar parámetros en plantillas
2. **Duplicar plantillas:** Crear copia de plantilla existente
3. **Importar parámetros:** De otros cursos
4. **Historial:** Auditoría de cambios
5. **Presets:** Plantillas predefinidas por institución

---

## 📊 Referencias en el Código

**Modelos:**

- `src/models/educatorsModels/parametrosModels.ts`
- `src/models/educatorsModels/templateParametrosModels.ts`

**API:**

- `src/app/api/educadores/parametros/route.ts`
- `src/app/api/educadores/parametros/[id]/route.ts`
- `src/app/api/educadores/templates/route.ts`
- `src/app/api/educadores/templates/parametros/route.ts`

**UI:**

- `src/app/dashboard/super-admin/parametros/page.tsx`
- `src/app/dashboard/super-admin/parametros/plantillas/page.tsx`
- `src/components/eduAndAdmiMenu.tsx`

**Schema:**

- `src/server/db/schema.ts` (líneas 570-620)
