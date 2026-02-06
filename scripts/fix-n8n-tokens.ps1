# Script para corregir los tokens de n8n en Windows
# Ejecutar en PowerShell

$N8N_MCP_TOKEN_CORRECTO = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MmZiYzg3Yy0zZGViLTRjMGUtOTA5NS1kZjU4ZWQzN2E1OTkiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjhkNGE1NDc4LTkzN2UtNDZiNS1hMTQ0LWMzM2IyMDdlYzM2MiIsImlhdCI6MTc2OTgwMzYxOX0.sLVE0l5xppjhSXzkl7gzgTw2O55bnkkob5r1BU8uRo8"
$N8N_API_KEY_CORRECTO = "nmcp_436c3344b1add6df5c48b429f7f5a196a5e898d7a80d08f3fb2b2fc7fb7699bb"

Write-Host "🔄 Actualizando tokens de n8n en Windows..." -ForegroundColor Cyan

# Establecer en variables del sistema (permanente)
[System.Environment]::SetEnvironmentVariable("N8N_MCP_TOKEN", $N8N_MCP_TOKEN_CORRECTO, "User")
[System.Environment]::SetEnvironmentVariable("N8N_API_KEY", $N8N_API_KEY_CORRECTO, "User")

# Establecer en sesión actual
$env:N8N_MCP_TOKEN = $N8N_MCP_TOKEN_CORRECTO
$env:N8N_API_KEY = $N8N_API_KEY_CORRECTO

Write-Host "✅ Tokens actualizados en Windows" -ForegroundColor Green
Write-Host ""
Write-Host "Verificación:" -ForegroundColor Yellow
Write-Host "N8N_MCP_TOKEN = $($N8N_MCP_TOKEN_CORRECTO.Substring(0,20))..." -ForegroundColor Gray
Write-Host "N8N_API_KEY = nmcp...99bb" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Reinicia VS Code para aplicar los cambios" -ForegroundColor Cyan
