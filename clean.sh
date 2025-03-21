#!/bin/bash

echo -e "\e[33m=== Iniciando limpieza profunda del proyecto ===\e[0m"
echo -e "\e[31mPresiona CTRL+C para cancelar o ENTER para continuar...\e[0m"
read

# Hacer backup del package-lock.json
echo -e "\e[36mHaciendo backup de package-lock.json...\e[0m"
cp package-lock.json package-lock.backup.json 2>/dev/null

echo -e "\e[36m1. Limpiando directorios de build y cache...\e[0m"
rm -rf node_modules 2>/dev/null
rm -rf .next 2>/dev/null
rm -rf .turbo 2>/dev/null
rm -rf dist 2>/dev/null
rm -rf out 2>/dev/null
rm -rf build 2>/dev/null
rm -rf .swc 2>/dev/null
rm -rf .cache 2>/dev/null

echo -e "\e[36m2. Eliminando archivos de cache y configuracion...\e[0m"
rm -f package-lock.json 2>/dev/null
rm -f next-env.d.ts 2>/dev/null
rm -f tsconfig.tsbuildinfo 2>/dev/null
rm -f .tsbuildinfo 2>/dev/null
rm -f .eslintcache 2>/dev/null
rm -f .prettiercache 2>/dev/null

echo -e "\e[36m3. Inspeccionando y limpiando caches...\e[0m"
# Verificar caché de npm
echo -e "\e[36mVerificando caché de npm...\e[0m"
npm cache verify

# Listar paquetes en caché de npx
echo -e "\e[36mListando paquetes en caché de npx...\e[0m"
npm cache npx ls

# Limpiar caché y optimizar
echo -e "\e[36mLimpiando y optimizando...\e[0m"
npm cache clean --force
npm cache npx rm "*" # Limpia todo el caché de npx
npm dedupe
npm prune

# Reconstruir paquetes
echo -e "\e[36mReconstruyendo paquetes...\e[0m"
npm rebuild

echo -e "\e[36m4. Reinstalación de dependencias...\e[0m"
# Primero regenerar package-lock.json
echo -e "\e[36mRegenerando package-lock.json...\e[0m"
npm install --package-lock-only

# Intentar usar el backup si la regeneración falla
if [ $? -ne 0 ] && [ -f package-lock.backup.json ]; then
    echo -e "\e[33mUsando backup de package-lock.json...\e[0m"
    cp package-lock.backup.json package-lock.json
fi

# Instalar dependencias
echo -e "\e[36mInstalando dependencias...\e[0m"
npm install

# Limpiar caché de Next.js
echo -e "\e[36m5. Limpiando caché de Next.js...\e[0m"
npx next clean 2>/dev/null

# Limpiar backup
rm package-lock.backup.json 2>/dev/null

echo -e "\e[32m=== Limpieza completada! ===\e[0m"
echo -e "\e[36mSe realizaron las siguientes acciones:\e[0m"
echo -e "✓ Limpieza de directorios y archivos"
echo -e "✓ Verificación del entorno npm"
echo -e "✓ Optimización de dependencias"
echo -e "✓ Reconstrucción de paquetes"
echo -e "✓ Instalación limpia con npm ci"
echo -e "✓ Limpieza de caché de Next.js"

read -p "Presiona ENTER para salir..."
