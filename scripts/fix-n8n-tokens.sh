#!/bin/bash
# Script para corregir los tokens de n8n en Linux/Git Bash

N8N_MCP_TOKEN_CORRECTO="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MmZiYzg3Yy0zZGViLTRjMGUtOTA5NS1kZjU4ZWQzN2E1OTkiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjhkNGE1NDc4LTkzN2UtNDZiNS1hMTQ0LWMzM2IyMDdlYzM2MiIsImlhdCI6MTc2OTgwMzYxOX0.sLVE0l5xppjhSXzkl7gzgTw2O55bnkkob5r1BU8uRo8"
N8N_API_KEY_CORRECTO="nmcp_436c3344b1add6df5c48b429f7f5a196a5e898d7a80d08f3fb2b2fc7fb7699bb"

echo "🔄 Actualizando tokens de n8n en ~/.bashrc..."

# Backup del bashrc
cp ~/.bashrc ~/.bashrc.backup

# Eliminar las líneas viejas de N8N_MCP_TOKEN y N8N_API_KEY
sed -i '/export N8N_MCP_TOKEN=/d' ~/.bashrc
sed -i '/export N8N_API_KEY=/d' ~/.bashrc

# Agregar los valores correctos al final
cat >> ~/.bashrc << EOF

# n8n MCP tokens (corregidos)
export N8N_MCP_TOKEN="$N8N_MCP_TOKEN_CORRECTO"
export N8N_API_KEY="$N8N_API_KEY_CORRECTO"
EOF

# Aplicar cambios en la sesión actual
export N8N_MCP_TOKEN="$N8N_MCP_TOKEN_CORRECTO"
export N8N_API_KEY="$N8N_API_KEY_CORRECTO"

echo "✅ Tokens actualizados en ~/.bashrc"
echo ""
echo "Verificación:"
echo "N8N_MCP_TOKEN = ${N8N_MCP_TOKEN_CORRECTO:0:20}..."
echo "N8N_API_KEY = nmcp...99bb"
echo ""
echo "📝 Ejecuta: source ~/.bashrc"
echo "O reinicia la terminal"
