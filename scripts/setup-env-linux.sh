#!/bin/bash

# ============================================
# Script para configurar variables de entorno de n8n MCP en Linux/macOS
# ============================================
# Ejecutar: chmod +x setup-env-linux.sh && ./setup-env-linux.sh

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Variables de entorno
export N8N_MCP_TOKEN="nmcp_3d8db29d597abe90b557f383f620c6e3c99533d588d9649456712ffd4135199a"
export N8N_API_KEY="nmcp_436c3344b1add6df5c48b429f7f5a196a5e898d7a80d08f3fb2b2fc7fb7699bb"
export NEON_API_KEY="napi_in4xzzd1ulhrb3ic79j2wjtsk6d9p4akp785dhvvey83dm2po2cqch67wh31hnhb"
export CONTEXT7_API_KEY="ctx7sk-0f50cb11-abb4-41c6-84ac-2671ca5e647e"
export SNYK_TOKEN="8c879f69-5b4c-4558-be06-05962e7198ac"

echo -e "${GREEN}✅ Variables de entorno configuradas para la sesión actual${NC}"
echo ""
echo -e "${YELLOW}📝 Para hacerlas permanentes, agrégalas a tu archivo de perfil:${NC}"

# Detectar shell
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
    echo -e "${CYAN}   Detected: zsh${NC}"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
    echo -e "${CYAN}   Detected: bash${NC}"
else
    SHELL_CONFIG="$HOME/.profile"
    echo -e "${CYAN}   Using: .profile${NC}"
fi

echo -e "${CYAN}   Archivo: $SHELL_CONFIG${NC}"
echo ""

# Configuración a agregar
CONFIG_BLOCK='
# ============================================
# Variables de entorno para n8n MCP y otros servicios
# ============================================
export N8N_MCP_TOKEN="nmcp_3d8db29d597abe90b557f383f620c6e3c99533d588d9649456712ffd4135199a"
export N8N_API_KEY="nmcp_436c3344b1add6df5c48b429f7f5a196a5e898d7a80d08f3fb2b2fc7fb7699bb"
export NEON_API_KEY="napi_in4xzzd1ulhrb3ic79j2wjtsk6d9p4akp785dhvvey83dm2po2cqch67wh31hnhb"
export CONTEXT7_API_KEY="ctx7sk-0f50cb11-abb4-41c6-84ac-2671ca5e647e"
export SNYK_TOKEN="8c879f69-5b4c-4558-be06-05962e7198ac"
'

# Preguntar si agregar al perfil
read -p "¿Deseas agregar las variables al archivo $SHELL_CONFIG? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if grep -q "N8N_MCP_TOKEN" "$SHELL_CONFIG" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Las variables ya existen en $SHELL_CONFIG${NC}"
    else
        echo "$CONFIG_BLOCK" >> "$SHELL_CONFIG"
        echo -e "${GREEN}✅ Variables agregadas a $SHELL_CONFIG${NC}"
        echo -e "${CYAN}📝 Ejecuta: source $SHELL_CONFIG${NC}"
    fi
else
    echo -e "${GRAY}Puedes agregar manualmente las variables a $SHELL_CONFIG${NC}"
fi

echo ""
echo -e "${GREEN}🎉 ¡Configuración completada!${NC}"
echo -e "${YELLOW}🔍 Para verificar, ejecuta:${NC}"
echo -e "${GRAY}   echo \$N8N_MCP_TOKEN${NC}"
