Uptash o Neon usan Serveless

Un servicio serverless como Upstash o Neon es una plataforma que proporciona bases de datos y otros servicios sin que el usuario tenga que gestionar servidores. En lugar de aprovisionar y mantener instancias manualmente, estos servicios escalan automáticamente y cobran solo por el uso real.

¿Qué significa "serverless"?

"Serverless" no significa que no haya servidores, sino que el proveedor se encarga de la infraestructura. Esto trae beneficios como:
✅ Escalabilidad automática: Crece o disminuye según la demanda.
✅ Pago por uso: No hay costos fijos por servidores inactivos.
✅ Sin gestión de infraestructura: No tienes que preocuparte por actualizaciones o mantenimiento.
---------------------------------------------------------------------
TAILWINDCSS V4.0

Si deseas aplicar estilos a un rango específico de pantalla, Tailwind CSS 4 permite usar max-breakpoints:

<!-- Aplicar flex solo entre md y xl -->
<div class="md:max-xl:flex">
  <!-- Contenido -->
</div>

📌 Ejemplo de variantes max-*:

max-sm	@media (width < 640px)
max-md	@media (width < 768px)
max-lg	@media (width < 1024px)
max-xl	@media (width < 1280px)
-------------------------------------------------------------------
Volver a un commit anterior
- git reset --hard ??????
-------------------------------------------------------------------
Para mejorar el rendimiento de tu proyecto y limpiar archivos innecesarios, puedes seguir estos pasos:

Eliminar dependencias no utilizadas:

Usa herramientas como depcheck para identificar dependencias no utilizadas.
Instala depcheck globalmente:

- npm install -g depcheck
- depcheck
- rm -rf .next/cache // Eliminar la caché de Next.js
- rm -rf node_modules // Eliminar la carpeta node_modules
- rm package-lock.json // Eliminar el archivo package-lock
- npm i // Reinstalar las dependencias:
- npm cache clean --force // Limpiar la caché de npm
-------------------------------------------------------------------
### **Comandos Generales de TypeScript y ESlint**

7. `ESlint: Fix All Auto-Fixable Problems`: Corrige todos los problemas que se puedan solucionar automáticamente.
0. `Eslint: Restart ESlint Server`: Reinicia el servidor de ESlint.
1. `TypeScript: Select TypeScript Version`: Cambia la versión de TypeScript que utiliza el proyecto.
2. `TypeScript: Restart TS Server`: Reinicia el servidor de TypeScript
3. `TypeScript: Go to Project Configuration`: Abre el archivo `tsconfig.json` del proyecto.
4. `TypeScript: Open TS Server Log`: Abre el log del servidor de TypeScript para depurar problemas.
5. `TypeScript: Reload Project`: Recarga la configuración del proyecto de TypeScript.
15. `Quick Fix...`: Sugiere soluciones rápidas para errores destacados.
16. `npm install -g eslint`: Intalar localmente Eslint
17. `npm install -g typescript`: Intalar localmente typescript
18. `npm install typescript --save-dev`: Instala TypeScript localmente en el proyecto como una dependencia de desarrollo.
19. `npx tsc`: Ejecuta el compilador TypeScript localmente.
20. `tsc`: Ejecuta el compilador TypeScript globalmente.
-------------------------------------------------------------------
uploads/ee9fb9aa-a3ad-4e4e-b952-eab0c5da84ed
-------------------------------------------------------------------
Tecnologias Que Se Usan:

~ Next.js 15, App Router, Clerk, Tailwind CSS, Shadcn/UI, Drizzle ORM,
PostgreSQL, Neon, Vercel, TypeScript, AWS S3, Upstash.
-------------------------------------------------------------------
CORREO SOPORTE:
artiefysupport@gmail.com
-------------------------------------------------------------------
Colores del manual de marca:

#3AF4EF #00BDD8 #01142B

#01142B -background //variable de tailwindcss
#3AF4EF -primary //variable de tailwindcss
#00BDD8 -secondary //variable de tailwindcss

#00A5C0 //color parecido mas oscuro de -secondary para el hover
-------------------------------------------------------------------
Lik Del Modo Blur:

blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk2HujHgAEcAIWCbqEhgAAAABJRU5ErkJggg=="

blurDataURL="data"
-------------------------------------------------------------------
Tutorial UPDATE DEPENDENCIES:

1. npm install -g npm-check-updates
2. ncu
3. ncu -u
4. npm install

1. npm outdated
2. npm update
3. npm install nombre-del-paquete@latest

1. npm outdated --include=dev
2. npm outdated -g --depth=0
3. npm install -g [nombre-del-paquete]@latest

1. npm install --save-dev typescript@latest
2. npm install -D tailwindcss@latest postcss@latest autoprefixer@latest
3. npm install @clerk/nextjs@latest
4. npx @clerk/upgrade
5. npm install drizzle-orm@latest
-------------------------------------------------------------------
Para La Instalacion Dependencias En Devs

--save-dev

Forzar Dependencias

--force
--legacy-peer-deps
-------------------------------------------------------------------
Tutorial de Comandos Para El Fomateo Eslint, Prettier y Typescript:

1. `npm run lint`: Ejecuta ESLint para identificar problemas en el código sin corregirlos.|
2. `npm run lint:fix`: Ejecuta ESLint y corrige automáticamente los problemas que pueda solucionar.
3. `npm run format:check`: Verifica si el código está formateado correctamente según Prettier, sin hacer cambios.
4. `npm run format:write`: Formatea automáticamente el código del proyecto usando Prettier.
5. `npm run typecheck`: Ejecuta el verificador de tipos de TypeScript sin generar archivos de salida.
6. `npm run build`: Ejecuta el verificador de despliegue

Archivos:
- eslint.config.mjs .js
- eslintrc.cjs
- prettier.config.js .mjs
- prettierrc.cjs,
- settings.json
-------------------------------------------------------------------
