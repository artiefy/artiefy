# ============================================
# Script para configurar variables de entorno de n8n MCP en Windows
# ============================================
# Ejecutar como administrador o agregar al perfil de PowerShell

# Variables de entorno para n8n MCP
$env:N8N_MCP_TOKEN = "nmcp_3d8db29d597abe90b557f383f620c6e3c99533d588d9649456712ffd4135199a"
$env:N8N_API_KEY = "nmcp_436c3344b1add6df5c48b429f7f5a196a5e898d7a80d08f3fb2b2fc7fb7699bb"
$env:NEON_API_KEY = "napi_in4xzzd1ulhrb3ic79j2wjtsk6d9p4akp785dhvvey83dm2po2cqch67wh31hnhb"
$env:CONTEXT7_API_KEY = "ctx7sk-0f50cb11-abb4-41c6-84ac-2671ca5e647e"
$env:SNYK_TOKEN = "8c879f69-5b4c-4558-be06-05962e7198ac"

Write-Host "✅ Variables de entorno configuradas para la sesión actual" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Para hacerlas permanentes, agrégalas a tu perfil de PowerShell:" -ForegroundColor Yellow
Write-Host "   - PowerShell: $env:USERPROFILE\Documents\PowerShell\Microsoft.PowerShell_profile.ps1" -ForegroundColor Cyan
Write-Host "   - VS Code: $env:USERPROFILE\Documents\PowerShell\Microsoft.VSCode_profile.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "O establécelas como variables de sistema con:" -ForegroundColor Yellow
Write-Host '   [System.Environment]::SetEnvironmentVariable("N8N_MCP_TOKEN", "tu_token", "User")' -ForegroundColor Gray
