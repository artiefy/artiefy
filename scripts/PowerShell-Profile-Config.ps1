# ============================================
# Configuración para agregar al perfil de PowerShell
# ============================================
# Copia este contenido en:
# - C:\Users\Usuario\Documents\PowerShell\Microsoft.PowerShell_profile.ps1
# - C:\Users\Usuario\Documents\PowerShell\Microsoft.VSCode_profile.ps1
#
# O ejecuta este script para agregarlo automáticamente
# ============================================

$profileConfig = @'

# ============================================
# Variables de entorno para n8n MCP y otros servicios
# ============================================
$env:N8N_MCP_TOKEN = "nmcp_3d8db29d597abe90b557f383f620c6e3c99533d588d9649456712ffd4135199a"
$env:N8N_API_KEY = "nmcp_436c3344b1add6df5c48b429f7f5a196a5e898d7a80d08f3fb2b2fc7fb7699bb"
$env:NEON_API_KEY = "napi_in4xzzd1ulhrb3ic79j2wjtsk6d9p4akp785dhvvey83dm2po2cqch67wh31hnhb"
$env:CONTEXT7_API_KEY = "ctx7sk-0f50cb11-abb4-41c6-84ac-2671ca5e647e"
$env:SNYK_TOKEN = "8c879f69-5b4c-4558-be06-05962e7198ac"

'@

# Perfiles a actualizar
$profiles = @(
    "$env:USERPROFILE\Documents\PowerShell\Microsoft.PowerShell_profile.ps1",
    "$env:USERPROFILE\Documents\PowerShell\Microsoft.VSCode_profile.ps1"
)

foreach ($profilePath in $profiles) {
    # Crear directorio si no existe
    $profileDir = Split-Path $profilePath -Parent
    if (-not (Test-Path $profileDir)) {
        New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
        Write-Host "✅ Creado directorio: $profileDir" -ForegroundColor Green
    }
    
    # Crear archivo de perfil si no existe
    if (-not (Test-Path $profilePath)) {
        New-Item -ItemType File -Path $profilePath -Force | Out-Null
        Write-Host "✅ Creado perfil: $profilePath" -ForegroundColor Green
    }
    
    # Verificar si la configuración ya existe
    $content = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue
    if ($content -notmatch "N8N_MCP_TOKEN") {
        Add-Content -Path $profilePath -Value $profileConfig
        Write-Host "✅ Configuración agregada a: $profilePath" -ForegroundColor Green
    } else {
        Write-Host "⚠️  La configuración ya existe en: $profilePath" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 ¡Configuración completada!" -ForegroundColor Green
Write-Host "📝 Reinicia PowerShell o VS Code para aplicar los cambios" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔍 Para verificar, ejecuta:" -ForegroundColor Yellow
Write-Host '   $env:N8N_MCP_TOKEN' -ForegroundColor Gray
