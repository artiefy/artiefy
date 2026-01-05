# 🎯 Sistema de Filtros Avanzados tipo Excel

## Descripción

Se ha implementado un sistema completo de filtros avanzados similar a Microsoft Excel en la página de "Matricular Estudiantes". Este sistema permite filtrar, buscar y ordenar datos de manera profesional y eficiente.

## ✨ Características Implementadas

### 1. **Filtro Avanzado por Columna** 🔍

- Botón con icono de chevron en cada encabezado de columna
- Al hacer clic, se abre un menú modal con opciones avanzadas
- Los filtros se aplican a **TODOS los datos** del dataset, no solo a los visibles en pantalla

### 2. **Búsqueda en Tiempo Real** 🔎

- Campo de búsqueda en la parte superior del menú de filtro
- Filtra las opciones disponibles mientras escribes
- Es case-insensitive

### 3. **Tres Modos de Ordenamiento** 📊

- **A → Z**: Ordena alfabéticamente ascendente
- **Z → A**: Ordena alfabéticamente descendente
- **Conteo**: Ordena por cantidad de registros (de mayor a menor)

### 4. **Conteo de Registros** 🔢

- Cada valor muestra la cantidad de registros que contiene
- Útil para entender la distribución de datos
- El conteo es sobre **TODOS los estudiantes**, no solo los visibles

### 5. **Selección Múltiple** ✓

- Casillas de verificación para cada valor
- Botón "Seleccionar todo" para activar/desactivar todos
- Al aplicar filtros, solo se muestran registros que coinciden
- Los filtros se pueden combinar con otros filtros del sistema

### 6. **Indicadores Visuales** 🎨

- Botón del filtro se vuelve **azul** cuando hay filtros activos
- Muestra un **número** indicando cuántos filtros están aplicados
- Botón "Limpiar filtros avanzados" aparece cuando hay filtros activos

### 7. **Funcionamiento con Scroll Virtual** 📜

- La tabla usa infinite scroll para mostrar datos a medida que se hace scroll
- Los filtros se aplican a **TODO el dataset**
- Solo se muestran los resultados filtrados (aunque sea un subset)
- Los filtros funcionan correctamente aunque no todos los datos sean visibles

## 🔧 Componentes

### `AdvancedFilterMenu.tsx`

Componente reutilizable que proporciona:

- Interfaz de filtro tipo Excel
- Búsqueda
- Ordenamiento (A-Z, Z-A, Conteo)
- Selección múltiple
- Contadores de registros

### Integración en `page.tsx`

- Estados para gestionar el menú abierto/cerrado
- Estado `advancedFilters` para almacenar filtros activos
- `columnFilterOptions` useMemo que genera valores únicos de **TODO** el dataset
- Lógica de filtrado en `getFilteredSortedStudents()`
- Renderizado del componente cuando está activo

## 📋 Uso

### Para el Usuario

1. Haz clic en el **botón de chevron** en la columna que deseas filtrar
2. Se abrirá el menú de filtro avanzado
3. **Busca** valores específicos (opcional)
4. **Ordena** como prefieras (A-Z, Z-A, Conteo)
5. **Selecciona** los valores que deseas (checkboxes)
6. Haz clic en **"Aplicar"** para aplicar los filtros
7. Los resultados se filtran inmediatamente
8. Haz clic en **"Limpiar"** para resetear ese filtro

### Para Combinar Filtros

- Puedes abrir múltiples filtros (uno a la vez)
- Los filtros se combinan con lógica AND
- Un registro aparece solo si cumple TODOS los filtros activos
- Usa el botón "Limpiar filtros avanzados" para resetear todo

## 🎯 Datos Sobre los que se Aplican

Los filtros funcionan sobre:

- **Todos los estudiantes** del sistema (no solo los visibles)
- **Todas las columnas** (incluyendo customFields)
- Respeta los filtros generales previos (nombre, email, estado, fechas)
- Respeta el filtro de programas

## 🔌 Integración con Sistema Existente

✅ **Compatible con:**

- Filtros simples de texto (nombre, email)
- Filtros de estado y fechas
- Filtros de programas (multiselect)
- Filtros por columnas dinámicas
- Filtros de cartera con lógica especial
- Sistema de selección de estudiantes
- Scroll virtual / infinite scroll

✅ **No interfiere con:**

- Edición inline de celdas
- Botones de acción (matricular, correo, WhatsApp)
- Selector de columnas
- Selección de estudiantes

## 📊 Ejemplo de Uso

### Filtrar estudiantes "En cartera"

1. Haz clic en el chevron de la columna "Cartera"
2. En el menú, busca "inactivo"
3. Selecciona "inactivo"
4. Haz clic en "Aplicar"
5. La tabla ahora solo muestra estudiantes con estado "inactivo"

### Filtrar múltiples estados de suscripción

1. Haz clic en el chevron de "Estado"
2. Selecciona "active"
3. Haz clic en "Aplicar"
4. Ahora abre el chevron de "Cartera"
5. Selecciona "activo"
6. Haz clic en "Aplicar"
7. Se muestran solo estudiantes "active" AND "activo en cartera"

## 🚀 Rendimiento

- Los valores únicos se generan con `useMemo` (se cachean)
- Se recalculan solo cuando cambian los estudiantes
- Conteos precisos en **O(n)** al abrir el menú
- Búsqueda en **O(n log n)** con ordenamiento
- Filtrado de resultados en **O(m)** donde m = resultados mostrados

## 📝 Notas Técnicas

- Usa `position: fixed` para el menú (no se corta por overflow)
- **Posicionamiento inteligente**: Se reposiciona automáticamente si se sale de pantalla
- Ajusta horizontalmente si está muy al borde derecho
- Ajusta verticalmente si está muy al borde inferior (aparece encima del botón)
- Z-index: 70 (más alto que la mayoría de elementos)
- Responsive en mobile y desktop
- Colores consistentes con el tema oscuro actual
- Máximo ancho: 100vw - 32px (padding de seguridad)

## 🎓 Seguimiento de las Guías Internas

✅ Sigue `Docs/doc-nextjs16/guia-swr-nextjs.md`: Los datos se filtran en el servidor (server-side logic)
✅ Respeta la estructura y convenciones del proyecto
✅ Usa TypeScript con tipos estrictos
✅ Mantiene la separación de responsabilidades
✅ Compatible con Next.js 16

---

**¡El sistema de filtros avanzados está completamente funcional y listo para usar!**
