#!/usr/bin/env bash
#
# Instala y levanta el servicio de transcripción en un VPS Ubuntu/Debian.
#
# Uso (dentro del VPS, en la carpeta que contiene este script):
#     chmod +x deploy.sh && sudo ./deploy.sh
#
# Es idempotente: se puede volver a correr para actualizar el servicio.

set -euo pipefail

log() { echo -e "\n\033[1;36m==> $*\033[0m"; }
warn() { echo -e "\033[1;33m!! $*\033[0m"; }
die() { echo -e "\033[1;31mXX $*\033[0m" >&2; exit 1; }

cd "$(dirname "$0")"

# --------------------------------------------------------------------
log "Comprobando recursos del VPS"
# --------------------------------------------------------------------
TOTAL_MB=$(free -m | awk '/^Mem:/{print $2}')
DISK_GB=$(df -BG --output=avail / | tail -1 | tr -dc '0-9')

echo "RAM total : ${TOTAL_MB} MB"
echo "Disco libre: ${DISK_GB} GB"

if [ "$TOTAL_MB" -lt 1800 ]; then
  warn "Menos de ~2 GB de RAM. El modelo 'small' puede quedar justo."
  warn "Si el contenedor muere solo, bajá a WHISPER_MODEL=base en .env"
fi

if [ "$DISK_GB" -lt 5 ]; then
  die "Menos de 5 GB libres. El modelo pesa ~500 MB y los videos se bajan a disco temporalmente."
fi

# --------------------------------------------------------------------
log "Instalando Docker (si hace falta)"
# --------------------------------------------------------------------
if command -v docker >/dev/null 2>&1; then
  echo "Docker ya está instalado: $(docker --version)"
else
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

docker compose version >/dev/null 2>&1 || die "Falta el plugin docker compose"

# --------------------------------------------------------------------
log "Configurando el .env"
# --------------------------------------------------------------------
if [ -f .env ]; then
  echo ".env ya existe, se respeta el actual."
else
  cp .env.example .env
  GENERATED_KEY=$(openssl rand -hex 32)
  sed -i "s|^TRANSCRIBE_API_KEY=.*|TRANSCRIBE_API_KEY=${GENERATED_KEY}|" .env
  echo "Se generó una TRANSCRIBE_API_KEY nueva."
fi

API_KEY=$(grep '^TRANSCRIBE_API_KEY=' .env | cut -d= -f2-)
[ -n "$API_KEY" ] || die "TRANSCRIBE_API_KEY vacía en .env"

# --------------------------------------------------------------------
log "Construyendo y levantando el contenedor"
# --------------------------------------------------------------------
docker compose up -d --build

# --------------------------------------------------------------------
log "Esperando a que el servicio responda"
# --------------------------------------------------------------------
# La primera vez descarga el modelo (~500 MB), así que puede tardar.
for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1; then
    echo "El servicio responde."
    break
  fi
  [ "$i" -eq 60 ] && die "No respondió en 5 minutos. Revisá: docker compose logs"
  sleep 5
done

curl -s http://127.0.0.1:8000/health
echo

# --------------------------------------------------------------------
log "Listo"
# --------------------------------------------------------------------
cat <<EOF

El servicio corre en 127.0.0.1:8000 (solo local, como debe ser).

Tu API key es:

    ${API_KEY}

Guardala: la vas a necesitar en las variables de entorno de Artiefy
(TRANSCRIBE_API_KEY) junto con la URL pública (TRANSCRIBE_API_URL).

FALTA exponerlo con HTTPS. Sin eso, la key viajaría en texto plano.
Ver la sección "Exponerlo con HTTPS" del README.md

Comandos útiles:
    docker compose logs -f       # ver el progreso en vivo
    docker compose restart       # reiniciar
    docker compose down          # apagar
EOF
