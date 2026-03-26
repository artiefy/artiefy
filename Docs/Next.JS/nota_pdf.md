# Implementación de descarga de notas en PDF profesional (Next.js + TypeScript)

## Dependencias necesarias

Instala en tu proyecto:

Si usas TypeScript, instala los tipos:

```
npm install --save-dev @types/jspdf
```

## Resumen de integración

- Usa la función `handleDownloadPDF` en tu componente.
- Utiliza el helper `imageToBase64` para convertir el logo a base64.
- El PDF incluye logo, colores de marca, tabla de actividades y resumen.
- El botón de descarga PDF se muestra junto al de CSV.
- El código es compatible con Next.js App Router y React 18+.

## Notas

- El logo debe estar en `public/artiefy-logo.png`.
- Si el logo no carga, el PDF se genera igual pero sin logo.
- El PDF se descarga automáticamente con el nombre sugerido.

---

> Si necesitas personalizar el diseño, edita la función `handleDownloadPDF` en tu componente.
