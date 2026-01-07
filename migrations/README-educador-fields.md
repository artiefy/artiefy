# Migración: Campos para Educadores

## Descripción

Esta migración agrega tres campos opcionales a la tabla `users` para usuarios con rol "educador":

- `profesion`: Profesión del educador
- `descripcion`: Descripción del educador (máximo 161 caracteres)
- `profile_image_key`: Clave S3 para la imagen de perfil

## Aplicar la Migración

### Opción 1: Usando psql directamente

```bash
psql -U <usuario> -d <base_de_datos> -f migrations/add-educador-fields.sql
```

### Opción 2: Usando el script de PowerShell

```powershell
# Si tienes las credenciales en variables de entorno
$env:DATABASE_URL = "postgresql://usuario:password@host:puerto/database"
psql $env:DATABASE_URL -f migrations/add-educador-fields.sql
```

### Opción 3: Usando Drizzle Kit (si está configurado)

```bash
npm run db:push
# o
pnpm db:push
```

## Verificar la Migración

Después de aplicar la migración, verifica que los campos fueron agregados:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('profesion', 'descripcion', 'profile_image_key');
```

## Funcionalidad en la Aplicación

### Frontend (Modal de Crear Usuario)

Cuando se selecciona el rol "educador" en el formulario de creación de usuario, aparecen tres campos adicionales:

1. **Profesión** (opcional)
   - Campo de texto simple
   - Sin límite de caracteres

2. **Descripción** (opcional)
   - Área de texto
   - Máximo 161 caracteres
   - Contador de caracteres en tiempo real

3. **Foto de perfil** (opcional)
   - Campo de archivo (solo imágenes)
   - Vista previa de la imagen seleccionada
   - Botón para eliminar la imagen antes de enviar

### Backend

- Los campos se envían solo si el rol es "educador"
- La imagen se convierte a base64 en el frontend
- Se sube a S3 en la carpeta `educadores/{userId}/profile-{timestamp}.jpg`
- Los campos se guardan en la base de datos

## Rollback

Si necesitas revertir la migración:

```sql
ALTER TABLE users
DROP COLUMN IF EXISTS profesion,
DROP COLUMN IF EXISTS descripcion,
DROP COLUMN IF EXISTS profile_image_key;
```

## Notas

- Todos los campos son opcionales
- Solo aplican para usuarios con rol "educador"
- La imagen se almacena en S3, no en la base de datos
- El campo `descripcion` tiene validación de 161 caracteres en frontend y backend
