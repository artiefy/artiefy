const express = require('express');
const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

app.post('/video2text', async (req, res) => {
  console.log('[API] Petición recibida en /video2text', req.body);
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL requerida' });
  }

  const videoPath = path.join(__dirname, 'temp_video.mp4');
  const audioPath = path.join(__dirname, 'temp_audio.wav');

  try {
    // Descargar video
    console.log('[API] Descargando video:', url);
    const response = await axios({ url, responseType: 'stream' });
    const writer = fs.createWriteStream(videoPath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Extraer audio
    console.log('[API] Extrayendo audio con ffmpeg...');
    await new Promise((resolve, reject) => {
      exec(
        `ffmpeg -y -i "${videoPath}" -ac 1 -ar 16000 "${audioPath}"`,
        (err, stdout, stderr) => {
          if (err) {
            console.error('[API] Error en ffmpeg:', stderr);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });

    // Ejecutar Whisper
    console.log('[API] Ejecutando Whisper...');
    exec(`python transcribe.py "${audioPath}"`, (err, stdout, stderr) => {
      if (err) {
        console.error('[API] Error en Whisper:', stderr);
        res.status(500).json({ error: 'Error en Whisper', details: stderr });
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        return;
      }
      try {
        const transcription = JSON.parse(stdout);
        res.json(transcription);
      } catch (e) {
        console.error('[API] Error parseando transcripción:', stdout);
        res.status(500).json({
          error: 'Error en formato de transcripción',
          details: stdout,
        });
      }
      // Limpieza
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    });
  } catch (error) {
    console.error('[API] Error general:', error);
    res
      .status(500)
      .json({ error: 'Error procesando el video', details: error.message });
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
  }
});

// Manejo global de errores no capturados
process.on('uncaughtException', (err) => {
  console.error('[API] uncaughtException:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[API] unhandledRejection:', reason);
});

app.listen(8000, () => {
  console.log('API de transcripción lista en puerto 8000');
});
