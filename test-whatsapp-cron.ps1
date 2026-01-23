# Script para probar el envío manual de WhatsApp programado (PowerShell)
# Uso: .\test-whatsapp-cron.ps1

$baseUrl = "http://localhost:3000"
$cronSecret = "tu_cron_secret_aqui"  # 👈 Cambia esto

Write-Host "🔹 Testeando CRON de WhatsApp..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 URL: $baseUrl/api/cron/whatsapp" -ForegroundColor Yellow
Write-Host "🔐 Secret: $($cronSecret.Substring(0, 10))..." -ForegroundColor Yellow
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $cronSecret"
    }
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/cron/whatsapp" -Headers $headers -Method Get
    
    Write-Host "📥 Response:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    Write-Host ""
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Success (HTTP $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Status: HTTP $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Ver monitor:" -ForegroundColor Cyan
Write-Host "curl $baseUrl/api/admin/whatsapp-monitor | jq '.'"
