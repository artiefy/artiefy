# Guía de entregas guiadas para el frontend administrativo

## Estado del backend

El alcance estudiantil implementa el contrato de datos, la carga privada en S3,
la persistencia del historial y el marcado automático de progreso.

La migración incluida crea únicamente `guided_activity_submissions`, sus claves
foráneas, restricción única e índices. Fue curada contra una inspección de solo
lectura del esquema existente; todavía debe revisarse y aplicarse mediante el
flujo normal del repositorio antes de habilitar entregas en un entorno.

En este alcance **no están implementados**:

- el listado/API administrativa;
- el endpoint administrativo de descarga autorizada;
- la interfaz administrativa;
- cambios en los campos de video de actividades.

## Historial inmutable

`guided_activity_submissions` guarda una fila nueva por cada envío aceptado. Una
reentrega no sobrescribe ni elimina entregas anteriores.

Esta tabla es la fuente canónica del contenido y del historial de entregas de
archivos o enlaces realizadas por estudiantes. El frontend administrativo debe
consultar `guided_activity_submissions` para listar archivos, URLs y reentregas.

`guided_activity_deliveries` es un modelo existente, separado y mutable para
estado administrativo. No reemplaza a `guided_activity_submissions`: no guarda
URLs ni conserva el historial inmutable de cada envío. El frontend del compañero
puede mantener ese modelo para sus estados, pero debe consultar las entregas
estudiantiles siguiendo el contrato de esta guía.

| Campo          | Descripción                                       |
| -------------- | ------------------------------------------------- |
| `id`           | Identificador incremental de la entrega.          |
| `user_id`      | Estudiante propietario.                           |
| `activity_id`  | Actividad de `guided_objective_activities`.       |
| `request_id`   | UUID idempotente dentro de la actividad.          |
| `files`        | Arreglo JSONB de metadatos de archivos privados.  |
| `urls`         | Arreglo JSONB de enlaces HTTP/HTTPS.              |
| `submitted_at` | Fecha inmutable en la que se aceptó esta entrega. |

La restricción única `(user_id, activity_id, request_id)` hace seguro reintentar
una misma solicitud dentro de la actividad y permite reutilizar el mismo UUID en
otra actividad o proyecto. El índice
`(user_id, activity_id, submitted_at, id)` permite recorrer el historial y
resolver la entrega más reciente con orden descendente.

Existe un único tipo compartido para `files`:

```ts
interface GuidedActivitySubmissionFile {
  key: string; // Clave privada de S3; nunca es una URL pública.
  name: string; // Nombre sanitizado, máximo 120 caracteres y sin controles.
  contentType: string;
  size: number; // Bytes.
}
```

La validación comprueba extensión, MIME, tamaño y firma conservadora. Esto no es
un análisis antivirus y no debe presentarse como tal en la interfaz.

El endpoint estudiantil exige `Content-Length` antes de procesar multipart y
rechaza cuerpos mayores de **10.747.904 bytes**: 10 MiB para archivos más
262.144 bytes reservados para límites, cabeceras, enlaces y campos multipart.
Después de parsear mantiene la validación independiente de 10 MiB acumulados.

## Relaciones

1. `guided_activity_submissions.user_id` → `users.id`.
2. `guided_activity_submissions.activity_id` →
   `guided_objective_activities.id`.
3. `guided_objective_activities.objective_id` → `guided_objectives.id`.
4. `guided_objectives.guided_project_id` → `guided_projects.id`.
5. Estado/calificación: `user_guided_activity_progress` por `user_id` y
   `activity_id`.

No se deben reutilizar `user_activities_progress`,
`project_activity_deliveries` ni `guided_activity_deliveries` como sustitutos de
`guided_activity_submissions`: pertenecen a otros dominios o responsabilidades.

## Contrato propuesto para el listado administrativo

Ruta propuesta, todavía no implementada:

```text
GET /api/admin/guided-projects/{projectId}/submissions
```

Parámetros de consulta:

| Parámetro     | Formato                                             |
| ------------- | --------------------------------------------------- |
| `activityId`  | Entero positivo opcional.                           |
| `objectiveId` | Entero positivo opcional.                           |
| `studentId`   | Identificador Clerk opcional.                       |
| `from`/`to`   | Fecha ISO opcional.                                 |
| `view`        | `latest` por defecto o `history`.                   |
| `cursor`      | Cursor opaco opcional.                              |
| `limit`       | 1–50; valor recomendado 20.                         |
| `sort`        | `submittedAt:desc` por defecto o `submittedAt:asc`. |

`latest` debe devolver solamente la fila más reciente por
`(user_id, activity_id)`, usando `submitted_at DESC, id DESC` para desempatar.
`history` devuelve todas las filas que coincidan con los filtros.

Respuesta propuesta:

```ts
interface GuidedSubmissionListResponse {
  success: true;
  items: Array<{
    id: number;
    requestId: string;
    submittedAt: string;
    files: GuidedActivitySubmissionFile[];
    urls: string[];
    student: { id: string; name: string | null; email: string };
    activity: { id: number; name: string; objectiveId: number };
    project: { id: number; title: string };
    progress: {
      isCompleted: boolean;
      revisada: boolean | null;
      finalGrade: number | null;
    } | null;
  }>;
  page: { nextCursor: string | null; hasMore: boolean };
}
```

El cursor debe codificar de forma opaca el par `(submitted_at, id)`. La API debe
seleccionar únicamente las columnas necesarias y limitar siempre la consulta.

## Autorización del listado

La API propuesta debe:

- exigir sesión Clerk en el servidor;
- resolver el rol desde datos confiables;
- permitir solo `super-admin`, `admin` o educadores autorizados para el
  proyecto;
- validar que actividad y objetivo pertenecen al `projectId` de la ruta;
- aplicar filtros y paginación en el servidor;
- devolver `403` cuando el actor existe pero no administra el proyecto, y `404`
  cuando el recurso solicitado no pertenece al proyecto visible.

Ocultar controles en React no reemplaza estas verificaciones.

## Contrato propuesto de descarga segura

Ruta propuesta, todavía no implementada:

```text
POST /api/admin/guided-projects/{projectId}/submissions/{submissionId}/files/download
Content-Type: application/json
{ "fileKey": "..." }
```

La API debe aplicar protección CSRF/origen, autenticación, rol y pertenencia del
proyecto. También debe verificar que `fileKey` aparece exactamente en `files`
de la entrega indicada. Solo después puede devolver una URL S3 firmada de corta
duración —por ejemplo, 60 segundos— o transmitir el archivo.

```ts
interface GuidedSubmissionDownloadResponse {
  success: true;
  url: string;
  expiresAt: string;
}
```

Nunca se concatena `fileKey` con una URL pública, nunca se exponen credenciales
AWS y nunca se registra la clave en logs. El nombre de descarga debe salir del
`name` sanitizado guardado en la entrega.

## Presentación

- Mostrar estudiante, proyecto, objetivo, actividad, `submittedAt`, archivos y
  enlaces.
- En vista `latest`, indicar que existe historial cuando haya más de una fila.
- En vista `history`, ordenar explícitamente y no agrupar filas como si fueran
  una sola entrega.
- Abrir enlaces externos con `target="_blank"` y
  `rel="noopener noreferrer"`.
- No crear vistas previas que descarguen URLs externas desde el servidor sin
  controles SSRF.
- Contemplar carga, vacío, error recuperable, archivo no disponible y móvil.

## Lista de aceptación futura

- [ ] La migración limpia fue generada, revisada y aplicada.
- [ ] El listado distingue `latest` de `history`.
- [ ] Filtros, orden y cursor se validan en el servidor.
- [ ] Roles y pertenencia al proyecto se verifican en cada endpoint.
- [ ] Las claves privadas nunca llegan como URL pública.
- [ ] La descarga valida que la clave pertenece a la entrega solicitada.
- [ ] Los enlaces usan `noopener noreferrer`.
- [ ] La interfaz distingue firma de archivo de análisis antivirus.
- [ ] Los cambios de video administrativo continúan fuera de este alcance.
