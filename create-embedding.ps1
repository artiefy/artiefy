# Lee el archivo curso.json y obtiene el id, title y description
$curso = Get-Content ".\curso.json" | ConvertFrom-Json
$courseId = $curso[0].id
$title = $curso[0].title
$description = $curso[0].description

# Construye el texto para el embedding (puedes ajustar esto si quieres solo title, solo description, etc.)
$text = "$title. $description"

# Llama al endpoint local para crear el embedding y guardarlo en la base de datos
# Cambia la URL si tu servidor corre en otro puerto o dominio
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/update-course-embedding" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{ courseId = $courseId; text = $text } | ConvertTo-Json)

# Muestra la respuesta
$response
