"""
Servicio de transcripcion de Artiefy (Whisper self-hosted).

Recibe la URL de un video (S3, Teams, lo que sea alcanzable), extrae el audio
con ffmpeg y lo transcribe con faster-whisper. Es agnostico al tipo de
contenido: sirve igual para clases, grabaciones de Teams o proyectos guiados.

El procesamiento es asincrono porque un video de 1 hora puede tardar decenas de
minutos en CPU:

    POST /jobs          -> encola y responde 202 al instante
    GET  /jobs/{job_id} -> estado y, cuando termina, los segmentos

El formato de salida es identico al del backend anterior para no romper nada:
    [{"start": 0.0, "end": 4.2, "text": "..."}]
"""

import json
import logging
import os
import queue
import subprocess
import tempfile
import threading
import uuid
from pathlib import Path
from typing import Any, Optional

import requests
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("artiefy-transcribe")

# --------------------------------------------------------------------------
# Configuracion (todo por variables de entorno)
# --------------------------------------------------------------------------

API_KEY = os.environ.get("TRANSCRIBE_API_KEY", "")
MODEL_SIZE = os.environ.get("WHISPER_MODEL", "small")
COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
LANGUAGE = os.environ.get("WHISPER_LANGUAGE", "es")
DATA_DIR = Path(os.environ.get("DATA_DIR", "/data"))
DOWNLOAD_TIMEOUT = int(os.environ.get("DOWNLOAD_TIMEOUT", "600"))

JOBS_DIR = DATA_DIR / "jobs"
JOBS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Artiefy Transcription Service", version="1.0.0")

_job_queue: "queue.Queue[str]" = queue.Queue()
_model: Optional[Any] = None
_model_ready = threading.Event()


# --------------------------------------------------------------------------
# Persistencia de jobs en disco (sobrevive reinicios del contenedor)
# --------------------------------------------------------------------------


def _job_path(job_id: str) -> Path:
    return JOBS_DIR / f"{job_id}.json"


def read_job(job_id: str) -> Optional[dict]:
    path = _job_path(job_id)
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def write_job(job: dict) -> None:
    # Escritura atomica: primero a un temporal y luego rename, para que un
    # reinicio a mitad de escritura no deje un JSON corrupto.
    path = _job_path(job["jobId"])
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(job, ensure_ascii=False), encoding="utf-8")
    tmp.replace(path)


# --------------------------------------------------------------------------
# Pipeline de transcripcion
# --------------------------------------------------------------------------


def load_model() -> Any:
    global _model
    if _model is None:
        from faster_whisper import WhisperModel

        log.info(
            "Cargando modelo Whisper '%s' (device=%s, compute=%s)...",
            MODEL_SIZE,
            DEVICE,
            COMPUTE_TYPE,
        )
        _model = WhisperModel(
            MODEL_SIZE,
            device=DEVICE,
            compute_type=COMPUTE_TYPE,
            download_root=str(DATA_DIR / "models"),
        )
        log.info("Modelo listo.")
        _model_ready.set()
    return _model


def download_video(url: str, dest: str) -> None:
    with requests.get(url, stream=True, timeout=DOWNLOAD_TIMEOUT) as response:
        response.raise_for_status()
        with open(dest, "wb") as handle:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    handle.write(chunk)


def extract_audio(video_path: str, audio_path: str) -> None:
    # 16 kHz mono es exactamente lo que espera Whisper; convertir aqui evita
    # sorpresas con contenedores de video raros.
    result = subprocess.run(
        [
            "ffmpeg", "-y", "-i", video_path,
            "-vn", "-ac", "1", "-ar", "16000",
            "-f", "wav", audio_path,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError("ffmpeg fallo: " + result.stderr[-800:])


def transcribe_file(audio_path: str) -> list:
    model = load_model()
    segments, _info = model.transcribe(
        audio_path,
        language=LANGUAGE,
        vad_filter=True,
        beam_size=5,
    )
    return [
        {
            "start": round(segment.start, 3),
            "end": round(segment.end, 3),
            "text": segment.text.strip(),
        }
        for segment in segments
        if segment.text.strip()
    ]


def process_job(job_id: str) -> None:
    job = read_job(job_id)
    if not job:
        log.warning("Job %s desaparecio antes de procesarse", job_id)
        return

    job["status"] = "processing"
    write_job(job)

    workdir = tempfile.mkdtemp(prefix="artiefy-")
    video_path = os.path.join(workdir, "source")
    audio_path = os.path.join(workdir, "audio.wav")

    try:
        log.info("[%s] Descargando %s", job_id, job["url"])
        download_video(job["url"], video_path)

        log.info("[%s] Extrayendo audio", job_id)
        extract_audio(video_path, audio_path)

        log.info("[%s] Transcribiendo", job_id)
        segments = transcribe_file(audio_path)

        job["status"] = "completed"
        job["segments"] = segments
        job["segmentCount"] = len(segments)
        log.info("[%s] Listo: %d segmentos", job_id, len(segments))
    except Exception as exc:  # noqa: BLE001 - el error se reporta al cliente
        job["status"] = "failed"
        job["error"] = str(exc)[:1000]
        log.exception("[%s] Fallo", job_id)
    finally:
        write_job(job)
        for path in (video_path, audio_path):
            try:
                if os.path.exists(path):
                    os.remove(path)
            except OSError:
                pass
        try:
            os.rmdir(workdir)
        except OSError:
            pass


def worker() -> None:
    # Un solo worker: la transcripcion satura la CPU, y correr varias en
    # paralelo en un VPS modesto las hace mas lentas a todas.
    try:
        load_model()
    except Exception:  # noqa: BLE001
        log.exception("No se pudo cargar el modelo al arrancar")

    while True:
        job_id = _job_queue.get()
        try:
            process_job(job_id)
        finally:
            _job_queue.task_done()


# --------------------------------------------------------------------------
# API
# --------------------------------------------------------------------------


class JobRequest(BaseModel):
    url: str
    jobId: Optional[str] = None


def check_auth(x_api_key: Optional[str]) -> None:
    if not API_KEY:
        raise HTTPException(500, "TRANSCRIBE_API_KEY no configurada en el servidor")
    if x_api_key != API_KEY:
        raise HTTPException(401, "API key invalida")


@app.on_event("startup")
def on_startup() -> None:
    # Re-encolar lo que quedo a medias si el contenedor se reinicio.
    requeued = 0
    for path in JOBS_DIR.glob("*.json"):
        try:
            job = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        if job.get("status") in ("queued", "processing"):
            job["status"] = "queued"
            write_job(job)
            _job_queue.put(job["jobId"])
            requeued += 1
    if requeued:
        log.info("Re-encolados %d jobs pendientes tras reinicio", requeued)

    threading.Thread(target=worker, daemon=True).start()


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "model": MODEL_SIZE,
        "device": DEVICE,
        "computeType": COMPUTE_TYPE,
        "language": LANGUAGE,
        "modelReady": _model_ready.is_set(),
        "queued": _job_queue.qsize(),
    }


@app.post("/jobs", status_code=202)
def create_job(
    payload: JobRequest,
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
) -> dict:
    check_auth(x_api_key)

    if not payload.url.startswith(("http://", "https://")):
        raise HTTPException(400, "url debe ser http(s)")

    job_id = payload.jobId or str(uuid.uuid4())

    existing = read_job(job_id)
    if existing and existing.get("status") in ("queued", "processing", "completed"):
        # Idempotente: reenviar el mismo jobId no duplica trabajo ni CPU.
        return {"jobId": job_id, "status": existing["status"], "duplicate": True}

    job = {"jobId": job_id, "url": payload.url, "status": "queued"}
    write_job(job)
    _job_queue.put(job_id)

    return {"jobId": job_id, "status": "queued", "queued": _job_queue.qsize()}


@app.get("/jobs/{job_id}")
def get_job(
    job_id: str,
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
) -> dict:
    check_auth(x_api_key)

    job = read_job(job_id)
    if not job:
        raise HTTPException(404, "Job no encontrado")
    return job


@app.delete("/jobs/{job_id}")
def delete_job(
    job_id: str,
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
) -> dict:
    check_auth(x_api_key)

    path = _job_path(job_id)
    if path.exists():
        path.unlink()
        return {"deleted": True}
    raise HTTPException(404, "Job no encontrado")
