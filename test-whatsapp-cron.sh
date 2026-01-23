#!/bin/bash

# Script para probar el envío manual de WhatsApp programado
# Uso: ./test-whatsapp-cron.sh

echo "🔹 Testeando CRON de WhatsApp..."
echo ""

# Configuración
BASE_URL="http://localhost:3000"
CRON_SECRET="tu_cron_secret_aqui" # 👈 Cambia esto

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📍 URL: ${BASE_URL}/api/cron/whatsapp${NC}"
echo -e "${YELLOW}🔐 Secret: ${CRON_SECRET:0:10}...${NC}"
echo ""

# Ejecutar request
response=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "${BASE_URL}/api/cron/whatsapp")

# Separar body y status code
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "📥 Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" -eq 200 ]; then
  echo -e "${GREEN}✅ Success (HTTP $http_code)${NC}"
else
  echo -e "${RED}❌ Error (HTTP $http_code)${NC}"
fi

echo ""
echo "📊 Ver monitor:"
echo "curl ${BASE_URL}/api/admin/whatsapp-monitor | jq '.'"
