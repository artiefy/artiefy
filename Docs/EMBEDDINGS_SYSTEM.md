# Sistema de Embeddings Vectoriales

## Descripción General

Este sistema permite generar embeddings vectoriales (representaciones matemáticas) del contenido de los cursos para habilitar búsquedas semánticas inteligentes. Utiliza OpenAI's `text-embedding-3-small` que genera vectores de 1536 dimensiones optimizados para balance velocidad/precisión.

## Arquitectura

### Componentes Principales

1. **Schema Drizzle** (`src/server/db/schema/embeddings.ts`)
   - Tabla `document_embeddings`: almacena chunks con sus embeddings
   - Tabla `embeddingProcessingLog`: registra el progreso del procesamiento
   - Índice HNSW para búsquedas vectoriales rápidas

2. **Procesador** (`src/lib/embeddings/processor.ts`)
   - `generateEmbedding()`: crea embedding de texto con OpenAI
   - `processDocument()`: divide documento en chunks y genera embeddings
   - `generateQueryEmbedding()`: embedding para queries de búsqueda
   - `searchDocuments()`: búsqueda por similitud coseno

3. **Base de Datos** (`src/lib/embeddings/search.ts`)
   - `saveDocumentEmbeddings()`: guarda embeddings en BD
   - `searchDocumentEmbeddings()`: búsqueda vectorial en PostgreSQL
   - `getCourseDocuments()`: obtiene documentos de un curso
   - `getEmbeddingsStats()`: estadísticas de uso

4. **API Routes**
   - `POST /api/embeddings/generate`: procesa documento y genera embeddings
   - `POST /api/embeddings/search`: busca documentos similares
   - `GET /api/embeddings/documents`: lista documentos procesados

5. **Componente UI** (`src/components/embeddings/EmbeddingsGenerator.tsx`)
   - Botón interactivo para generar embeddings
   - Muestra estadísticas de procesamiento
   - Manejo de errores y feedback visual

## Configuración Requerida

### 1. Variables de Entorno

Ya están configuradas en `src/env.ts`:

```typescript
OPENAI_API_KEY: z.string().min(1) // Requerida
```

### 2. Base de Datos PostgreSQL

Requiere pgvector extension. Ejecutar migración:

```bash
npm run db:generate
npm run db:migrate
```

O ejecutar manualmente en Neon:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Dependencias

Ya incluidas en `package.json`:

- `openai`: ^4.0.0
- `@neondatabase/serverless`: ^1.0.2
- `drizzle-orm`: última versión

## Uso

### Desde la UI

1. Ir a Dashboard > Super Admin > Cursos > [Seleccionar Curso]
2. Hacer click en tab "🧠 Embeddings"
3. Hacer click en botón "🚀 Generar Embeddings"
4. Esperar confirmación y ver estadísticas

### Desde CLI

**Generar embeddings para un curso específico:**

```bash
npm run embeddings:regen -- --courseId=123
```

**Regenerar para todos los cursos:**

```bash
npm run embeddings:regen -- --all
```

## Flujo de Procesamiento

```
Documento (PDF/DOCX/TXT)
       ↓
Extracción de Texto
       ↓
Normalización
       ↓
Chunking (1000 tokens, 200 overlap)
       ↓
Generación de Embeddings (OpenAI)
       ↓
Guardado en PostgreSQL con pgvector
       ↓
Indexación HNSW
```

## Costos y Estimaciones

**Modelo:** text-embedding-3-small
**Precio:** $0.020 por 1M tokens

Ejemplos:

- 10,000 tokens = $0.0002 (0.02¢)
- 100,000 tokens = $0.002 (0.2¢)
- 1,000,000 tokens = $0.02 (2¢)

## Búsqueda Semántica

Una vez procesados los embeddings, puedes hacer búsquedas:

```typescript
// Desde la API
POST /api/embeddings/search
{
  "courseId": "123",
  "query": "¿Cómo funciona el algoritmo de clasificación?",
  "topK": 5,
  "threshold": 0.5
}
```

Respuesta:

```json
{
  "success": true,
  "query": "¿Cómo funciona...",
  "results": [
    {
      "content": "El algoritmo de clasificación...",
      "similarity": 0.92,
      "chunkIndex": 0,
      "source": "course-123",
      "metadata": {...}
    }
  ]
}
```

## Estructura de Archivos

```
src/
├── lib/embeddings/
│   ├── processor.ts      # Procesamiento y generación de embeddings
│   ├── search.ts         # Búsqueda y base de datos
│   └── utils.ts          # Utilidades (chunking, normalización)
├── server/db/schema/
│   └── embeddings.ts     # Schema Drizzle
├── app/api/embeddings/
│   ├── generate/route.ts # API para generar
│   ├── search/route.ts   # API para buscar
│   └── documents/route.ts # API para listar
├── components/embeddings/
│   └── EmbeddingsGenerator.tsx # Componente UI
└── app/dashboard/super-admin/.../CourseDetail.tsx # Integración

scripts/
└── regen-embeddings.ts  # Script CLI para regenerar
```

## Troubleshooting

### Error: "pgvector extension not enabled"

Solución: Ejecutar `CREATE EXTENSION IF NOT EXISTS vector;` en Neon

### Error: "Invalid OpenAI API key"

Solución: Verificar que `OPENAI_API_KEY` está correctamente configurada en `.env`

### Procesamiento lento

- Los chunks grandes requieren múltiples llamadas a OpenAI
- Se aplica rate limiting de 100ms entre requests
- Cursos con >100,000 tokens pueden tomar varios minutos

### Errores de memoria

- Limitar tamaño de chunks a máximo 1000 tokens
- Procesar por lotes si hay muchos documentos

## Optimizaciones Futuras

1. **Batch Processing**: procesar múltiples chunks en paralelo
2. **Caching**: cachear embeddings frecuentes
3. **Reranking**: agregar modelos de reranking para mejorar relevancia
4. **Filtros**: permitir búsqueda híbrida (semántica + keywords)
5. **Analytics**: tracking de consultas y uso de tokens

## Referencias

- [OpenAI Embeddings API](https://platform.openai.com/docs/api-reference/embeddings)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Semantic Search Best Practices](https://www.pinecone.io/learn/semantic-search/)
