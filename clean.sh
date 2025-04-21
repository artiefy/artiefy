#!/bin/bash

echo -e "\e[33m=== Iniciando limpieza profunda del proyecto Next.js 15 ===\e[0m"
echo -e "\e[31mPresiona CTRL+C para cancelar o ENTER para continuar...\e[0m"
read

# Backup del package-lock.json
echo -e "\e[36mHaciendo backup de package-lock.json...\e[0m"
cp package-lock.json package-lock.backup.json 2>/dev/null

echo -e "\e[36m1. Limpiando directorios de Next.js y cache...\e[0m"
rm -rf .next        # Cache de Next.js
rm -rf node_modules # Módulos de Node
rm -rf .turbo       # Cache de Turbo

echo -e "\e[36m2. Limpiando archivos temporales...\e[0m"
rm -f package-lock.json
rm -f .eslintcache
rm -f .prettiercache
rm -f tsconfig.tsbuildinfo
rm -f next-env.d.ts

echo -e "\e[36m3. Limpiando caches de npm...\e[0m"
npm cache clean --force
npm cache verify

echo -e "\e[36m4. Reinstalación limpia de dependencias...\e[0m"
# Usar npm ci para instalación consistente
if [ -f package-lock.json ]; then
  npm ci
else
  # Si no existe package-lock.json, restaurar desde backup
  if [ -f package-lock.backup.json ]; then
    cp package-lock.backup.json package-lock.json
    npm ci
  else
    npm install
  fi
fi

echo -e "\e[36m5. Limpiando y optimizando Next.js...\e[0m"
npx next clean
npm run build

# Limpiar backup
rm package-lock.backup.json 2>/dev/null

echo -e "\e[32m=== Limpieza completada! ===\e[0m"
echo -e "\e[36mAcciones realizadas:\e[0m"
echo -e "✓ Limpieza de caches de Next.js"
echo -e "✓ Limpieza de node_modules"
echo -e "✓ Instalación limpia con npm ci"
echo -e "✓ Reconstrucción del proyecto"

read -p "Presiona ENTER para salir..."
