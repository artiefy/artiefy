# Implementación de Media en Replies - Forum System

## ✅ Estado Actual (2024)

### Componente: `/src/app/dashboard/super-admin/foro/[forumId]/page.tsx`

**Estado: COMPLETAMENTE FUNCIONAL**

#### 1. Respuestas con Media (PostReplay Interface)

```tsx
interface PostReplay {
  id: number;
  userId: { id: string; name: string; email: string };
  postId: number;
  content: string;
  imageKey?: string; // ✅ Support image
  audioKey?: string; // ✅ Support audio
  videoKey?: string; // ✅ Support video
  createdAt: string;
  updatedAt: string;
}
```

#### 2. Envío de Respuestas - FormData Pattern

**Función**: `handleReplySubmit()` - Lines 292-330

```tsx
const handleReplySubmit = async () => {
  // Validación: permite texto OR cualquier tipo de media
  if (
    !replyMessage.trim() &&
    !selectedAudio &&
    !selectedImage &&
    !selectedVideo
  )
    return;

  // Usa FormData para enviar archivos (NO JSON)
  const formData = new FormData();
  formData.append('content', replyMessage);
  formData.append('postId', String(replyingToPostId));
  if (selectedImage) formData.append('image', selectedImage);
  if (selectedAudio) formData.append('audio', selectedAudio);
  if (selectedVideo) formData.append('video', selectedVideo);

  const response = await fetch('/api/forums/posts/postReplay', {
    method: 'POST',
    body: formData, // ✅ Envía los archivos
  });

  // Limpia los archivos después de éxito
  if (response.ok) {
    setReplyMessage('');
    setSelectedImage(null);
    setSelectedAudio(null);
    setSelectedVideo(null);
    await fetchPostReplays();
  }
};
```

#### 3. Visualización de Respuestas con Media

**Función**: `renderPostReplies()` - Lines 436-603

- ✅ Muestra título/nombre del usuario
- ✅ Muestra contenido de texto
- ✅ **Grid responsivo de media**:
  - Imagen + Video: lado a lado (2 columnas en desktop, 1 en mobile)
  - Audio: ancho completo debajo
- ✅ Iconos de edición/eliminación
- ✅ Collapse/expand "Ver X respuestas" / "Ocultar respuestas"

**Estructura de Grid**:

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
  {/* Image - Side by side */}
  {reply.imageKey && <Image src={...} />}

  {/* Video - Side by side */}
  {reply.videoKey && <video src={...} />}

  {/* Audio - Full width */}
  {reply.audioKey && (
    <div className="col-span-1 sm:col-span-2">
      <audio src={...} />
    </div>
  )}
</div>
```

#### 4. Formulario de Respuesta - Media Preview

**Sección**: Lines 1090-1230

- ✅ Textarea para contenido
- ✅ AudioRecorder component (grabar audio en tiempo real)
- ✅ Buttons dinámicos usando `document.createElement()`:
  - Micrófono: Subir archivo de audio
  - Música: Grabar audio
  - Imagen: Subir archivo de imagen
  - Video: Subir archivo de video
- ✅ **Media preview grid** antes de enviar:
  - Muestra archivos seleccionados
  - Botón X para eliminar individual
  - Icono de nombre de archivo
- ✅ Validación: Botón "Enviar" habilitado con texto O cualquier media

#### 5. Validación Mejorada

```tsx
// Botón habilitado si hay contenido:
disabled={(!replyMessage.trim() && !selectedAudio && !selectedImage && !selectedVideo) || isSubmittingReply}
```

Esto permite:

- ✅ Solo texto
- ✅ Solo audio
- ✅ Solo imagen
- ✅ Solo video
- ✅ Cualquier combinación

---

### Componente: `/src/app/dashboard/super-admin/(inicio)/cursos/[courseId]/CourseDetail.tsx`

**Estado: SIN SOPORTE DE RESPUESTAS**

#### Diferencia Arquitectónica:

1. **CourseDetail.tsx** tiene un sistema de Foros pero:
   - ❌ No tiene sistema de respuestas (replies) a posts
   - ✅ Sí tiene posts con media (imagen soportada)
   - ❌ No hay colapsables "Ver respuestas"
   - ❌ No hay FormData para respuestas

2. **page.tsx** tiene un sistema COMPLETO:
   - ✅ Posts con media (imagen, audio, video)
   - ✅ Respuestas con media
   - ✅ Colapsables para expandir/contraer
   - ✅ Previsualizaciones antes de enviar

#### Estructura de CourseDetail Posts (Lines 2750-2850):

```tsx
// Solo posts (no replies)
<textarea placeholder="Comparte tu pensamiento..." />

// Media inputs simples
<label>
  <input type="file" accept="image/*" />
  Imagen
</label>

// Button simple
<Button onClick={handleCreatePost} />

// Sin sección de respuestas ni visualización de replies
```

---

## 🔧 Cambios Realizados en page.tsx

### 1. Interface Update

- **Linea 72-87**: Agregadas propiedades media a `PostReplay`
  ```tsx
  imageKey?: string;
  audioKey?: string;
  videoKey?: string;
  ```

### 2. handleReplySubmit Refactoring

- **Línea 292-330**: Convertida de JSON a FormData
- Antes: `JSON.stringify({ content, postId, userId })`
- Después: `FormData` con campos image, audio, video
- Ahora **ENVÍA los archivos realmente**

### 3. renderPostReplies Enhancement

- **Línea 436-603**: Agregada sección de media display
- Replica el grid pattern de posts
- Incluye lightbox para imágenes
- Controls para audio/video

### 4. Botones Dinámicos

- **Línea 1208-1280**: Cambiados de refs a `document.createElement()`
- Más limpio sin refs innecesarios
- Funciona exactamente igual pero mejor patrón

### 5. Media Preview (Ya existente)

- **Línea 1120-1210**: Mostraba archivos seleccionados antes
- Ahora completamente sincronizado con handleReplySubmit

---

## 📋 Checklist de Funcionalidad

### ✅ Posts en page.tsx

- [x] Crear posts con texto
- [x] Crear posts con imagen
- [x] Crear posts con audio (upload)
- [x] Crear posts con audio (grabado)
- [x] Crear posts con video
- [x] Vista previa de archivos antes de enviar
- [x] Mostrar imagen en grid responsive
- [x] Mostrar video en grid responsive
- [x] Mostrar audio ancho completo
- [x] Lightbox para imágenes

### ✅ Respuestas en page.tsx

- [x] Crear respuestas con texto
- [x] Crear respuestas con imagen
- [x] Crear respuestas con audio (upload)
- [x] Crear respuestas con audio (grabado)
- [x] Crear respuestas con video
- [x] Vista previa de archivos antes de enviar
- [x] Mostrar imagen en grid responsive
- [x] Mostrar video en grid responsive
- [x] Mostrar audio ancho completo
- [x] Lightbox para imágenes
- [x] Collapse/Expand respuestas
- [x] Editar respuesta
- [x] Eliminar respuesta

### ❌ Respuestas en CourseDetail.tsx (No implementado)

- [ ] Sistema de respuestas completo
- [ ] FormData para media en replies
- [ ] Grid de media en replies
- [ ] Collapse/expand replies
- [ ] Preview de archivos en reply form

---

## 🚀 Cómo Usar

### En page.tsx (Foro)

1. Selecciona un foro de la lista
2. En "Ver N respuesta(s)", haz click para expandir
3. Haz click en "Responder" para un post
4. Adjunta archivos (imagen, audio, video)
5. Escribe texto (opcional)
6. Haz click en "Enviar"
7. ✅ El archivo se guarda en S3 y se muestra en el grid

### Grid de Media Renderizado

```
[Imagen]  [Video]      ← 2 columnas en desktop, 1 en mobile
[    Audio ancho    ]  ← Siempre ancho completo
```

---

## 🔗 URLs S3 Relevantes

- Base URL: `process.env.NEXT_PUBLIC_AWS_S3_URL`
- Bucket: `artiefy-upload`
- Region: `us-east-2`
- Patrón: `{BASE_URL}/{imageKey}`, etc.

---

## 📝 Próximos Pasos Opcionales

Si necesitas sincronizar CourseDetail.tsx con la misma funcionalidad:

1. **Copiar PostReply interface** (agregar imageKey, audioKey, videoKey)
2. **Implementar renderPostReplies** (copiar de page.tsx)
3. **Convertir handleReplySubmit** a FormData
4. **Agregar expandedPosts state** para collapse/expand
5. **Agregar buttons dinámicos** para media en reply form
6. **Agregar media preview section** en reply form

Esto daría a CourseDetail el mismo nivel de funcionalidad que page.tsx.

---

## 📊 Resumen de Archivos Modificados

| Archivo          | Cambios                  | Estado               |
| ---------------- | ------------------------ | -------------------- |
| page.tsx (foro)  | 4 reemplazos principales | ✅ Completo          |
| CourseDetail.tsx | Sin cambios              | ⚠️ Sin replies media |
