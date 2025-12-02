# Artiefy

Plataforma educativa moderna y profesional, destacando sus características principales, el stack tecnológico utilizado y cómo comenzar. He mantenido algunos elementos útiles del formato T3 original pero los he adaptado al contexto de una plataforma educativa basada en IA.

¿Te gustaría que ajustemos alguna sección específica o agreguemos más información sobre algún aspecto en particular?

## Developer setup (rápido)

- Después de clonar el repo, instala dependencias y configura los hooks ejecutando:

```bash
npm install
# o: npm ci
```

- Esto ejecuta el `prepare` script que corre `node .husky/install.mjs` y configura Husky localmente.
- Si por alguna razón necesitas forzar la instalación de hooks manualmente:

```bash
npm run setup:hooks
```

- Pre-commit hooks: el hook `pre-commit` ejecuta `npm run typecheck` y `npx lint-staged`. `lint-staged` aplica ESLint + Prettier a los archivos staged.

- Nota EOL (Windows): añadimos `.gitattributes` para normalizar finales de línea entre colaboradores. Si ves advertencias `LF will be replaced by CRLF`, puedes pedir a tus compañeros que hagan un checkout limpio o ejecutar:

```bash
git rm --cached -r .
git reset --hard
```

Si prefieres una opción menos intrusiva, configura Git localmente:

```bash
git config --global core.autocrlf true
```
