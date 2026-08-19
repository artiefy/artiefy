# Servicio de transcripción de Artiefy

Whisper self-hosted en Docker. Recibe la URL de un video y devuelve la
transcripción con marcas de tiempo, en el mismo formato que ya consume la app:

```json
[{ "start": 0.0, "end": 4.2, "text": "..." }]
```

Es agnóstico al tipo de contenido: sirve igual para clases, grabaciones de
Teams, proyectos guiados, objetivos y actividades.

## Por qué es asíncrono

Un video de 1 hora puede tardar entre 15 y 45 minutos en CPU. Si la petición
fuera bloqueante, se caería por timeout. Por eso el flujo es:

1. `POST /jobs` encola y responde `202` al instante.
2. El worker procesa de a un video por vez (la transcripción satura la CPU;
   correr varias en paralelo en un VPS modesto las hace más lentas a todas).
3. `GET /jobs/{id}` devuelve el estado y, al terminar, los segmentos.

El estado se guarda en disco, así que un reinicio del contenedor no pierde los
resultados y re-encola lo que quedó a medias.

## Desplegar en el VPS de Hostinger

```bash
# 1. Instalar Docker (Ubuntu)
curl -fsSL https://get.docker.com | sh

# 2. Copiar esta carpeta al VPS
scp -r docker/transcriptions root@TU_IP:/opt/artiefy-transcriptions

# 3. Configurar
cd /opt/artiefy-transcriptions
cp .env.example .env
openssl rand -hex 32   # pega el resultado en TRANSCRIBE_API_KEY dentro de .env
nano .env

# 4. Levantar
docker compose up -d --build

# 5. Verificar (la primera vez tarda: descarga el modelo)
docker compose logs -f
curl http://localhost:8000/health
```

## Exponerlo con HTTPS

El compose publica el puerto **solo en `127.0.0.1`** a propósito: no dejes el
8000 abierto a internet. Poné un nginx delante:

```nginx
server {
    listen 443 ssl;
    server_name transcripciones.tudominio.com;

    # ssl_certificate ... (usá certbot)

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_read_timeout 900s;
        proxy_send_timeout 900s;
    }
}
```

Sin HTTPS la `X-API-Key` viajaría en texto plano.

## API

Todos los endpoints salvo `/health` requieren la cabecera `X-API-Key`.

### `GET /health`

```json
{ "status": "ok", "model": "small", "modelReady": true, "queued": 0 }
```

### `POST /jobs`

```bash
curl -X POST https://transcripciones.tudominio.com/jobs \
  -H "X-API-Key: TU_CLAVE" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://s3.us-east-2.amazonaws.com/artiefy-upload/video.mp4","jobId":"lesson-123"}'
```

`jobId` es opcional pero **recomendado**: si mandás el mismo dos veces no se
duplica el trabajo (es idempotente).

### `GET /jobs/{jobId}`

```json
{
  "jobId": "lesson-123",
  "status": "completed",
  "segmentCount": 412,
  "segments": [{ "start": 0.0, "end": 4.2, "text": "Bienvenidos..." }]
}
```

Estados posibles: `queued`, `processing`, `completed`, `failed`.

## Elegir el modelo

| Modelo   | RAM     | Velocidad en CPU  | Calidad en español  |
| -------- | ------- | ----------------- | ------------------- |
| `base`   | ~0.5 GB | ~4x tiempo real   | Aceptable           |
| `small`  | ~1 GB   | ~2x tiempo real   | Buena (recomendado) |
| `medium` | ~2.5 GB | ~0.7x tiempo real | Muy buena           |

"2x tiempo real" significa que 1 hora de video tarda ~30 minutos. Ajustá
`WHISPER_MODEL` en el `.env` según el plan del VPS y volvé a levantar con
`docker compose up -d`.

## Costo

Cero por minuto transcrito: solo pagás el VPS que ya tenés. Es la diferencia
frente a AWS Transcribe, que cobra ~USD 0,024 por minuto de audio.
