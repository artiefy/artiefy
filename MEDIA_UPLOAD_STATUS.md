# 📦 Estado de Implementación: Carga de Media en Foros

## ✅ COMPLETADO

### Backend (100% - Funcional)

- ✅ S3 Upload Utility (`src/server/lib/s3-upload.ts`)
  - uploadMediaToS3() - Sube archivos a S3 con validación de tipo y tamaño
  - deleteMediaFromS3() - Elimina archivos de S3
  - getPublicUrl() - Genera URLs públicas
  - Validación: Imágenes (5MB), Audio (50MB), Video (200MB)

- ✅ Database Schema (`src/server/db/schema.ts`)
  - posts tabla: imageKey, audioKey, videoKey (TEXT nullable)
  - post_replies tabla: imageKey, audioKey, videoKey (TEXT nullable)

- ✅ API Routes
  - POST /api/forums/posts - Crea posts con media (FormData)
  - GET /api/forums/posts - Retorna posts con keys de media
  - DELETE /api/forums/posts/:id - Limpia S3 antes de borrar
  - POST /api/forums/posts/postReplay - Crea respuestas con media
  - GET /api/forums/posts/postReplay - Obtiene respuestas con media

- ✅ Data Models (`src/models/educatorsModels/forumAndPosts.ts`)
  - getPostsByForo() - Incluye imageKey, audioKey, videoKey
  - getPostById() - Incluye media keys
  - getPostRepliesByPostId() - Incluye media keys
  - getPostReplyById() - Incluye media keys
  - Interfaces actualizadas: Post, ForumPost con campos opcionales de media

### Frontend UI (100% - Implementado)

#### CourseDetail.tsx - Formulario de Crear Posts

- ✅ Textarea para contenido
- ✅ 3 Inputs de archivo (Imagen 🖼️, Audio 🎙️, Video 🎬)
- ✅ Soporte Drag & Drop (inherit del navegador)
- ✅ Mostrar nombres de archivos seleccionados
- ✅ Resumen de archivos seleccionados con preview de nombres
- ✅ Botón "Publicar Post" con estado de carga
- ✅ Estados React: selectedImage, selectedAudio, selectedVideo, isUploadingPost

#### CourseDetail.tsx - Mostrar Media en Posts

- ✅ Render de imágenes con `<img>` (max-h-96)
- ✅ Render de audio con `<audio controls>`
- ✅ Render de video con `<video controls>`
- ✅ Contenedores con styling coherente (rounded-lg, bg-black/40)

### Manejo de Formularios

- ✅ handleCreatePost() actualizado para:
  - Crear FormData en lugar de JSON
  - Enviar archivos como multipart/form-data
  - Limpiar estados después de publicar
  - Mostrar mensajes de éxito/error con toast

- ✅ handleCreateReply() actualizado para:
  - Soporte de media en respuestas
  - Estados: replyImage, replyAudio, replyVideo
  - FormData multipart
  - Limpieza de archivos después de enviar

## 🎯 Características

### Limits y Restricciones

- Imagen máxima: 5MB (MIME types: image/\*)
- Audio máximo: 50MB (MIME types: audio/\*)
- Video máximo: 200MB (MIME types: video/\*)
- Validación en cliente: Tipo MIME
- Validación en servidor: Tipo MIME y tamaño

### Almacenamiento S3

- Región: us-east-2
- Estructura de carpetas: `media/forums/{forumId}/{mediaType}/{userId}/{uuid}.{ext}`
- ACL: public-read
- URLs públicas: `${NEXT_PUBLIC_AWS_S3_URL}/{key}`

### Integración Clerk

- Se usa userId de Clerk para identificar al que sube
- Se integra fullName cuando está disponible

## 🚀 Cómo Usar

### Para crear un post con media:

1. Ve a CourseDetail → Tab Foros
2. Selecciona un foro
3. Escribe contenido en el textarea
4. (Opcional) Haz clic en los inputs para seleccionar:
   - 🖼️ Imagen
   - 🎙️ Audio
   - 🎬 Video
5. Verás el nombre del archivo cuando esté seleccionado
6. Haz clic en "Publicar Post"
7. El sistema cargará a S3 y guardará en la BD

### Para ver media en posts:

- La media aparece automáticamente debajo del contenido del post
- Imágenes se muestran como `<img>` responsive
- Audio con controles de reproducción
- Video con controles de reproducción

## 📋 Notas de Implementación

- **FormData**: Los archivos se envían como multipart/form-data (no JSON)
- **Límites**: Validados en cliente y servidor
- **Nombres**: Los archivos se guardan con UUID para evitar colisiones
- **Limpieza**: Cuando borras un post, los archivos de S3 se eliminan automáticamente
- **Estados**: currentlySumittingPost previene múltiples envíos

## ⚠️ Importante

- Asegúrate de que `NEXT_PUBLIC_AWS_S3_URL` esté configurado en .env.local
- Las variables de AWS (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION) deben estar en .env
- El bucket S3 debe existir y permitir ACL public-read

## 🔍 Testing Recomendado

1. Crear un post con solo texto ✅
2. Crear un post con imagen
3. Crear un post con audio
4. Crear un post con video
5. Crear un post con múltiples media
6. Verificar que aparezcan correctamente en los posts
7. Borrar un post con media y verificar que no queden archivos huérfanos en S3

## 📦 Archivos Modificados

- `src/app/dashboard/super-admin/(inicio)/cursos/[courseId]/CourseDetail.tsx` - UI y handlers
- `src/server/lib/s3-upload.ts` - Utilidad S3 (creado)
- `src/server/db/schema.ts` - Schema actualizado
- `src/app/api/forums/posts/route.ts` - API actualizado
- `src/app/api/forums/posts/postReplay/route.ts` - API de respuestas
- `src/models/educatorsModels/forumAndPosts.ts` - Modelos actualizados
