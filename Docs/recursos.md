---

## Mini tutorial: Guardar y exportar variables de entorno (ejemplo SNYK_TOKEN)

### Windows (PowerShell, recomendado)

1. Abre PowerShell como administrador.
2. Ejecuta:
  ```powershell
  [System.Environment]::SetEnvironmentVariable("SNYK_TOKEN", "TU_TOKEN_AQUI", "User")
  ```
  (Reemplaza TU_TOKEN_AQUI por tu token real)
3. Cierra y vuelve a abrir tu terminal/editor para que la variable esté disponible.

### Windows (CMD)
1. Abre CMD como administrador.
2. Ejecuta:
  ```cmd
  setx SNYK_TOKEN "TU_TOKEN_AQUI"
  ```
3. Cierra y vuelve a abrir tu terminal/editor.

### Linux/macOS (bash/zsh)
1. Abre tu terminal.
2. Agrega al final de tu archivo `~/.bashrc`, `~/.zshrc` o `~/.profile`:
  ```bash
  export SNYK_TOKEN="TU_TOKEN_AQUI"
  ```
3. Guarda y ejecuta:
  ```bash
  source ~/.bashrc
  ```
  (o el archivo que editaste)

### Verificar que la variable esté configurada
4. echo $CONTEXT7_API_KEY
  (Debería mostrar tu token)

---

# Herramientas y Comandos

## GITHUB RECONECTARSE A OTROS REPOSITORIOS

- `git remote remove origin` // Desconectarte del repo actual
- `git remote add origin https://github.com/techotaku1/animetopx.git` // Conectarte a este repo
- `git remote add origin https://github.com/artiefy/artiefy.git` // Conectarte a este repo
- `git remote -v` // Verificar a que repo estas conectado

---

Uptash o Neon usan Serveless

Un servicio serverless como Upstash o Neon es una plataforma que proporciona bases de datos y otros servicios sin que el usuario tenga que gestionar servidores. En lugar de aprovisionar y mantener instancias manualmente, estos servicios escalan automáticamente y cobran solo por el uso real.

¿Qué significa "serverless"?

"Serverless" no significa que no haya servidores, sino que el proveedor se encarga de la infraestructura. Esto trae beneficios como:
✅ Escalabilidad automática: Crece o disminuye según la demanda.
✅ Pago por uso: No hay costos fijos por servidores inactivos.
✅ Sin gestión de infraestructura: No tienes que preocuparte por actualizaciones o mantenimiento

---

TAILWINDCSS V4.0

Si deseas aplicar estilos a un rango específico de pantalla, Tailwind CSS 4 permite usar max-breakpoints:

```html
<!-- Aplicar flex solo entre md y xl -->
<div class="md:max-xl:flex">
  <!-- ... -->
</div>
```

📌 Ejemplo de variantes max-\*:

max-sm @media (width < 40rem) { ... }
max-md @media (width < 48rem) { ... }
max-lg @media (width < 64rem) { ... }
max-xl @media (width < 80rem) { ... }
max-2xl @media (width < 96rem) { ... }

---

## Volver a un commit anterior

- `git reset --hard <commit-hash>`

---

Para mejorar el rendimiento de tu proyecto y limpiar archivos innecesarios, puedes seguir estos pasos:

chmod +x clean.sh //Dale permisos de ejecución (solo la primera vez)
./clean.sh //Ejecutar el archivo de limpieza automatica

- `rm -rf node_modules package-lock.json .next`
- `npm cache clean --force`
- `rm -rf .turbo`
- `rm -rf next-env.d.ts`
- `rm -rf tsconfig.tsbuildinfo`
- `rm -rf .tsbuildinfo`
- `rm -rf .eslintcache`
- `npm cache verify`
- `rm -rf node_modules/.cache`

---

Algunas opciones del CLI de npm para optimizar o reaprar tus librerias

- `npm dedupe` //Reducir la duplicación en el árbol de paquetes
- `npm doctor` //Comprueba el estado de tu entorno npm
- `npm prune` //Eliminar paquetes extraños
- `npm ci` //# Para CI/CD y despliegues
- `npm install -g npm@latest` //actualizar ultima version del npm

---

### **Comandos Generales de TypeScript y ESlint**

1. `Eslint: Restart ESlint Server`: Reinicia el servidor de ESlint.
2. `TypeScript: Select TypeScript Version`: Cambia la versión de TypeScript que utiliza el proyecto.
3. `TypeScript: Restart TS Server`: Reinicia el servidor de TypeScript
4. `npm install -g eslint`: Intalar globalmente Eslint
5. `npm install -g typescript`: Intalar globalmente typescript
6. `npm install typescript --save-dev`: Instala TypeScript localmente en el proyecto como una dependencia de desarrollo.
7. `npx tsc`: Ejecuta el compilador TypeScript localmente.
8. `tsc`: Ejecuta el compilador TypeScript globalmente.
9. `npm install next@latest react@latest react-dom@latest`: Actualizar Next
10. `npm install --save-dev eslint typescript-eslint @eslint/js eslint-plugin-import eslint-config-prettier eslint-plugin-prettier eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-simple-import-sort eslint-config-next globals prettier-plugin-tailwindcss`: Dependencias para que funcione el archivo eslint.config.mjs
11. `npx eslint --debug .` : Debugear Eslint para cuando no quiera detectar errores
12. `npm install eslint --save-dev`: Instala TypeScript localmente en el proyecto como una dependencia de desarrollo.
13. `Remove-Item -Recurse -Force "C:\Users\Usuario\AppData\Local\npm-cache"` : remover cache npm

---

Tecnologias Que Se Usan:

- Next.js 16, App Router, Clerk, Tailwind CSS, Shadcn/UI, Drizzle ORM, PostgreSQL, Neon, Vercel, TypeScript, AWS S3, Husky, Lint-Staged, Upstash.

---

CORREO SOPORTE:

<artiefysupport@gmail.com>

---

Colores del manual de marca:

```css
#22C4D3 #00BDD8 #01142B #2ecc71

#01142B -background //variable de tailwindcss
#1e2939 //color de fondo de las tarjetas de cursos
#22C4D3 -primary //variable de tailwindcss
#00BDD8 -secondary //variable de tailwindcss

#00A5C0 //color parecido mas oscuro de -secondary para el hover
#1d283a border-color de las tarjetas de cursos
```

Lik Del Modo Blur:

blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk2HujHgAEcAIWCbqEhgAAAABJRU5ErkJggg=="

## blurDataURL="data"

Tutorial UPDATE DEPENDENCIES:

1. `npm install -g npm-check-updates@latest` // Instala de manera global la herramienta npm-check-updates
2. `ncu` // Muestra las dependencias que tienen nuevas versiones
3. `ncu -u` // Actualiza el archivo package.json con las últimas versiones de las dependencias
4. `npm install` // Instala las dependencias actualizadas según el archivo package.json

5. `npm outdated` // Muestra una lista de las dependencias que están desactualizadas
6. `npm update` // Actualiza las dependencias a sus versiones más recientes compatibles
7. `npm install nombre-del-paquete@latest` // Instala la última versión de un paquete específico

8. `npm outdated --include=dev` // Muestra las dependencias de desarrollo que están desactualizadas
9. `npm list -g --depth=0` // Muestra las dependencias globales que están desactualizadas
10. `npm outdated -g --depth=0` // Instala la última versión de los paquetes globales
11. `npm install tailwindcss @tailwindcss/postcss postcss` // Instala las últimas versiones de TailwindCSS 4.0
12. `npm install tailwindcss@latest @tailwindcss/cli@latest` // Actualizar TailwindCss 4
13. `npx @clerk/upgrade --from=core-1` // Instala la última versión de Clerk para Next.js 1
14. `npx @clerk/upgrade -g` // Instala la última versión de Clerk para Next.js 2
15. `npm install drizzle-orm@latest` // Instala la última versión de Drizzle ORM
16. `npx @next/codemod@canary upgrade latest` // Ayuda a actualizar tu código para que sea compatible con la última versión de Next.js
17. `npm i next@latest react@latest react-dom@latest` // Este comando instala las últimas versiones estables de los paquetes core necesarios para Next.js

---

Para La Instalacion Dependencias En Devs

```bash
--save-dev
```

Forzar Dependencias

```bash

--force
--legacy-peer-deps
```

---

Tutorial de Comandos Para El Fomateo Eslint, Prettier y Typescript:

1. `npm run lint`: Ejecuta ESLint para identificar problemas en el código sin corregirlos.|
2. `npm run lint:fix`: Ejecuta ESLint y corrige automáticamente los problemas que pueda solucionar.
3. `npm run format:check`: Verifica si el código está formateado correctamente según Prettier, sin hacer cambios.
4. `npm run format:write`: Formatea automáticamente el código del proyecto usando Prettier.
5. `npm run typecheck`: Ejecuta el verificador de tipos de TypeScript sin generar archivos de salida.
6. `npm run build`: Ejecuta el verificador de despliegue
7. `npm audit fix --force`: Repara algunas fallas del servicio de paquetes de npm

---

Tutorial Para analizar tus dependecias :

1. `npm install -g depcheck`
2. `npm install -g depcheck typescript`
3. `depcheck --ignores="@types/*,next,react,react-dom,typescript,@clerk/nextjs,react-icons" --parsers="*.ts:typescript,*.tsx:typescript"`

---

Limpia la caché de VS Code:

Borra los datos en:
Windows: `C:\Users\TU_USUARIO\AppData\Roaming\Code`

---

Instalar dependencias globales en una sola :

`npm install -g npm-check-updates@latest npm@latest eslint@latest typescript@latest`

`npm list -g --depth=0` /Chekear las versiones de tus paquetes globales

---

Pasos en Vim:

Presiona `:wq` y luego Enter para guardar y salir.

---

Configurar localmente tu cuenta de github en tu proyecto

```bash
git config user.name "artiefy"
git config user.email "artiefy4@gmail.com"
```

---

## Configurar usuario de Git por proyecto

Para que cada proyecto use una cuenta de Git diferente:

1. Abre la carpeta del proyecto (por ejemplo, `gonzaapp`).
2. Ejecuta:

```bash
git config user.name "techotaku1"
git config user.email "correo@trabajo.com"
```

En otro proyecto (por ejemplo, personal con artiefy):

```bash
git config user.name "artiefy"
git config user.email "correo@personal.com"
```

Esto asegura que cada commit dentro de ese repositorio use la cuenta correcta.

### Ver la configuración local de Git

Dentro de un repositorio, puedes ver la configuración local con:

```bash
git config --list --local
git remote -v
```

---

## Precommit config

- pip install pre-commit
- pre-commit install
- pre-commit --version
- pre-commit autoupdate
- pre-commit run --all-files
- pre-commit install -t commit-msg
- git-conventional-commits.yaml
- npx git-conventional-commits - changelog para generar el changelog automáticamente.
- npx git-conventional-commits - version para determinar la versión según los commits.

## generar automáticamente el changelog y calcular la versión del proyecto usando comandos como

- npx git-conventional-commits changelog

- npx git-conventional-commits version

---

## .releaserc

- branches: ["main"]: Indica que solo se publicarán versiones desde la rama main.
- "plugins": Lista de plugins que definen el flujo de publicación:
- @semantic-release/npm: Publica el paquete en npm (en tu caso, con "npmPublish": false, solo actualiza la versión en package.json, no publica).
- @semantic-release/release-notes-generator: Genera notas de la versión automáticamente.
- @semantic-release/github: Crea un release en GitHub.
- @semantic-release/commit-analyzer: Analiza los commits para decidir el tipo de versión.
- @semantic-release/git: Hace commits automáticos de los archivos generados (como el changelog).
- @semantic-release/changelog: Actualiza el archivo CHANGELOG.md con los cambios.

### Plugins a instalar

- "@semantic-release/commit-analyzer",
- "@semantic-release/release-notes-generator",
- "@semantic-release/changelog",
- "@semantic-release/npm",
- "@semantic-release/git"
- "@semantic-release/github"

En resumen:
Este archivo automatiza y estandariza el proceso de lanzar nuevas versiones de tu proyecto, generando changelogs y releases en GitHub de forma automática según tus commits.

---

## Ts Reset

¿Para qué sirve y qué ventajas tiene usar ts-reset?

Función:

ts-reset mejora los tipos de TypeScript en tu proyecto, corrigiendo comportamientos inseguros o poco precisos en funciones comunes como JSON.parse, .filter(Boolean), .includes, etc.

Ventajas:

Evita el uso de any en operaciones críticas, haciendo tu código más seguro.
Mejora la experiencia de desarrollo, mostrando errores antes de que ocurran en tiempo de ejecución.

Hace que el tipado de TypeScript sea más estricto y confiable en todo el proyecto.
Reduce bugs y facilita el mantenimiento del código.

---

## renovate.json

¿Para qué sirve y qué ventajas tiene usar renovate.json?
Función:

renovate.json configura Renovate Bot, una herramienta que revisa y actualiza automáticamente las dependencias de tu proyecto.
Ventajas:

Mantiene tus dependencias siempre actualizadas y seguras.

Automatiza la creación de Pull Requests para actualizar paquetes.

Te avisa de vulnerabilidades en tus dependencias.

Reduce el trabajo manual y el riesgo de tener dependencias obsoletas o inseguras.

Facilita el mantenimiento y la calidad del proyecto a largo plazo.

---

## Tailwind 4

- @layer base {
  input::placeholder,
  textarea::placeholder {
  color: var(--color-gray-400);
  }
  }

- @layer base {
  button:not(:disabled),
  [role="button"]:not(:disabled) {
  cursor: pointer;
  }
  }

- @theme inline {
  --font-display: var(--font-delius);
  --font-table-text: var(--font-lexend);
  }

## Cómo Poner Tu Cuenta De Github En Proyectos de VSCode

### Paso 1. Elimina las configuraciones globales (si no quieres interferencias)

```bash
git config --global --unset user.name
git config --global --unset user.email
```

### Paso 2. Configura el usuario y email para el proyecto actual

```bash
git config user.name "artiefy"
git config user.email "artiefy4@gmail.com"

git config user.name "techotaku1"
git config user.email "jsdg1818@gmail.com"
```

### Paso 3. Verifica la configuración local

```bash
git config --local --list
```

### Paso 4. Confirma qué usuario usa cada proyecto

```bash
git config user.name
git config user.email
```

### Paso 5. Configura el almacenamiento de credenciales (tokens personales)

```bash
git config credential.helper store
```

---

## Mini tutorial: Husky + lint-staged + ESLint + Prettier + TypeScript

1. Instala dependencias:

   ```bash
   npm install --save-dev husky lint-staged eslint prettier typescript
   ```

2. Inicializa Husky:

   ```bash
   npx husky init
   ```

3. Agrega el script en package.json:

   ```json
   "prepare": "husky"
   ```

4. Crea el hook pre-commit en `.husky/pre-commit`:

   ```bash
   npm run typecheck
   if [ $? -ne 0 ]; then
     echo "Error: El commit fue bloqueado por errores de TypeScript."
     exit 1
   fi
   npx lint-staged
   ```

5. Configura lint-staged en `package.json` o `.lintstagedrc.js`:

   ```js
   module.exports = {
     '*.{js,jsx,ts,tsx}': ['eslint --fix --max-warnings 0', 'prettier --write'],
     '*.{json,md,mdx,css,yml,yaml}': ['prettier --write'],
   };
   ```

   ```js
    "prepare": "husky",
    ...
   "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix --max-warnings 0",
      "prettier --write"
    ],
    "*.{json,md,mdx,css,yml,yaml}": [
      "prettier --write"
    ]
    }
   ```

6. ¡Listo! Al hacer `git commit`, se bloquea el commit si hay errores de formato, lint o tipos.

---

## Mini tutorial: Regenerar docs locales de Next para AGENTS.md

Usa este flujo cuando cambies la version de `next` y quieras que los agentes
(Codex/Copilot) lean documentacion local actualizada.

### Comando base

```bash
npx @next/codemod@canary agents-md --output AGENTS.md
```

### Cuando ejecutarlo

1. Despues de subir/bajar version de `next`.
2. Al cambiar de rama si trae otra version de `next`.
3. Si borraste o se desactualizo la carpeta `.next-docs`.

### Paso a paso

1. Verifica tu version de Next:

```bash
npm ls next
```

2. Regenera el bloque de agentes:

```bash
npx @next/codemod@canary agents-md --output AGENTS.md
```

3. Revisa que `AGENTS.md` tenga el bloque `NEXT-AGENTS-MD` con:
   `root: ./.next-docs`

4. Si todo esta correcto, guarda cambios:

```bash
git add AGENTS.md .gitignore
git commit -m "docs(agents): refresh next local docs index"
```

### Nota

- La guia oficial de Next tambien permite un `AGENTS.md` minimo apuntando a
  `node_modules/next/dist/docs/`.
- Este flujo con `.next-docs` es util si ya estandarizaste el bloque generado
  por `agents-md` en tu proyecto.
