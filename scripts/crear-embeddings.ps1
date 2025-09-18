# Lee el archivo JSON de cursos
$cursos = Get-Content ".\curso.json" | ConvertFrom-Json

# Cambia la URL si tu servidor está en otra dirección o puerto
$apiUrl = "http://localhost:3000/api/update-course-embedding"

foreach ($curso in $cursos) {
    $id = $curso.id
    $title = $curso.title
    $desc = $curso.description
    # Combina título y descripción para el embedding
    $text = "$title. $desc"
    $body = @{
        courseId = $id
        text = $text
    } | ConvertTo-Json -Compress

    Write-Host "Procesando curso $id: $title"
    try {
        $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $body -ContentType "application/json"
        Write-Host "Resultado: $($response | ConvertTo-Json -Compress)"
    } catch {
        Write-Host "Error procesando curso $id: $_"
    }
}
