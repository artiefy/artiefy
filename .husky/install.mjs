// Instalador silencioso para Husky
// Evita errores en CI/prod y ejecuta la instalación localmente
if (process.env.NODE_ENV === 'production' || process.env.CI === 'true') {
  // No instalar hooks en CI o producción
  process.exit(0);
}

try {
  const husky = (await import('husky')).default;
  // Ejecuta la instalación de hooks (devs locales)
  // Husky devuelve un mensaje; lo mostramos por información
  // En caso de error, no fallamos la instalación de dependencias
  // para evitar bloquear `npm install` si algo raro sucede.
  // eslint-disable-next-line no-console
  console.log(await husky());
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn(
    'Husky install skipped or failed silently:',
    err?.message || err
  );
  process.exit(0);
}
