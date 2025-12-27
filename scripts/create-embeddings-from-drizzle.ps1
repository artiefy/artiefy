<#
  create-embeddings-from-drizzle.ps1
  Lee un JSON de cursos exportado (drizzle-data-*.json) y para cada curso
  llama al endpoint local /api/update-course-embedding para crear el embedding.

   Uso:
    pwsh -File .\scripts\create-embeddings-from-drizzle.ps1 -FilePath .\scripts\drizzle-data-2025-11-04T18_29_55.559Z.json -ServerUrl http://localhost:3000 -DelaySeconds 1

  Parámetros:
    -FilePath     Ruta al JSON de cursos (por defecto busca scripts/drizzle-data-*.json)
    -ServerUrl    URL del servidor que expone /api/update-course-embedding (por defecto http://localhost:3000)
    -DelaySeconds Segundos de espera entre peticiones (por defecto 1)

  Requisitos:
    - Tener el servidor (Next.js / API) corriendo en ServerUrl y con la ruta /api/update-course-embedding que reciba { courseId, text }
    - (Opcional) Ajustar permisos de ejecución de PowerShell si es necesario
#>

param (
  [string]$FilePath = "./scripts/drizzle-data-2025-11-04T18_29_55.559Z.json",
  [string]$ServerUrl = "http://localhost:3000",
  [int]$DelaySeconds = 1,
  [switch]$DryRun,
  [string]$LogFile
)

Write-Host "Leer archivo:" $FilePath

if (-Not (Test-Path $FilePath)) {
  Write-Error "El archivo especificado no existe: $FilePath"
  exit 1
}

try {
  $jsonText = Get-Content $FilePath -Raw
  $data = $null
  $data = $jsonText | ConvertFrom-Json
}
catch {
  Write-Error "Error leyendo o parseando JSON: $_"
  exit 1
}

if ($null -eq $data) {
  Write-Error "JSON vacío o inválido"
  exit 1
}

# Robust JSON shapes handling
$courses = $null

if ($data -is [System.Array]) {
  if ($data.Count -eq 1) {
    # Caso común: [{ "json_agg": [ {..}, {..} ] }]
    $first = $data[0]
    # Buscar propiedades que sean arrays y tomar la primera
    foreach ($prop in $first.psobject.Properties) {
      if ($prop.Value -is [System.Collections.IEnumerable] -and -not ($prop.Value -is [string])) {
        $courses = $prop.Value
        break
      }
    }

    # Si no encontramos, quizá el primer elemento ya es el curso
    if (-not $courses -and ($first -is [System.Collections.IEnumerable] -and -not ($first -is [string]))) {
      $courses = $first
    }
  }
  else {
    # Top-level array de cursos
    $courses = $data
  }
}
elseif ($data -is [PSObject]) {
  if ($data.courses -ne $null) {
    $courses = $data.courses
  }
  else {
    foreach ($prop in $data.psobject.Properties) {
      if ($prop.Value -is [System.Collections.IEnumerable] -and -not ($prop.Value -is [string])) {
        $courses = $prop.Value
        break
      }
    }
  }
}

if (-not $courses) {
  Write-Error "No se encontró un array de cursos en el JSON. Ajusta el archivo o pasa un JSON que sea un array de cursos."
  exit 1
}

Write-Host "Usando" ($courses.Count) "cursos detectados desde el JSON."

Write-Host "Cursos detectados:" ($courses.Count)

# Función para construir el texto a enviar para embedding
function Build-EmbeddingText($course) {
  $title = $null
  $description = $null

  if ($course.title -ne $null) { $title = $course.title } elseif ($course.name -ne $null) { $title = $course.name }
  if ($course.description -ne $null) { $description = $course.description }

  if (-not $title) { $title = "" }
  if (-not $description) { $description = "" }

  return "$title. $description"
}

# Iterar y hacer POST
# Preparar log
if ($LogFile) {
  "timestamp,courseId,status,message" | Out-File -FilePath $LogFile -Encoding utf8
}

$i = 0
foreach ($c in $courses) {
  $i++
  # Intentar obtener un id robusto
  $courseId = $null
  if ($c.id -ne $null) { $courseId = $c.id }
  elseif ($c.courseId -ne $null) { $courseId = $c.courseId }

  if (-not $courseId) {
    Write-Warning "Curso #$i sin id detectable. Se saltará. Objeto: $(($c | ConvertTo-Json -Depth 2))"
    continue
  }

  $text = Build-EmbeddingText $c

  # Evitar texto vacio extremo
  if ([string]::IsNullOrWhiteSpace($text)) {
    Write-Warning "Curso id=$courseId tiene título y descripción vacíos; se saltará."
    continue
  }

  $payload = @{ courseId = $courseId; text = $text } | ConvertTo-Json
  $url = "$ServerUrl/api/update-course-embedding"

  Write-Host "[$i/$($courses.Count)] -> courseId=$courseId"

  if ($DryRun) {
    Write-Host "  DryRun: would POST to $url with payload:" $payload
    if ($LogFile) { "$((Get-Date).ToString('o')),$courseId,DRYRUN,${payload//`n/ }" | Out-File -FilePath $LogFile -Append -Encoding utf8 }
  }
  else {
    try {
      $resp = Invoke-RestMethod -Uri $url -Method Post -Body $payload -ContentType 'application/json' -TimeoutSec 120
      Write-Host "  OK:" ($resp | ConvertTo-Json -Depth 2)
      if ($LogFile) { "$((Get-Date).ToString('o')),$courseId,OK,$(($resp | ConvertTo-Json -Depth 1) -replace '[\r\n]+',' ')" | Out-File -FilePath $LogFile -Append -Encoding utf8 }
    }
    catch {
      # Usar ${courseId} dentro de la cadena para evitar ambigüedad con ':' seguido de variables como $_
      Write-Error "  ERROR al procesar courseId=${courseId}: $_"
      if ($LogFile) { "$((Get-Date).ToString('o')),$courseId,ERROR,$($_ -replace '[\r\n]+',' ')" | Out-File -FilePath $LogFile -Append -Encoding utf8 }
    }
  }

  Start-Sleep -Seconds $DelaySeconds
}

Write-Host "Proceso finalizado. Total intentados: $i"
