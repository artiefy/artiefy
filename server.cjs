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

    // Obtener duración del audio
    console.log('[API] Obteniendo duración del audio...');
    const getDuration = () =>
      new Promise((resolve, reject) => {
        exec(
          `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`,
          (err, stdout) => {
            if (err) reject(err);
            else resolve(parseFloat(stdout));
          }
        );
      });
    const duration = await getDuration();
    const chunkSeconds = 300; // 5 minutos
    const numChunks = Math.ceil(duration / chunkSeconds);
    let allTranscriptions = [];

    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSeconds;
      const chunkPath = path.join(__dirname, `temp_chunk_${i}.wav`);
      // Extraer fragmento
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -i "${audioPath}" -ss ${start} -t ${chunkSeconds} -acodec copy "${chunkPath}"`,
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      // Transcribir fragmento
      console.log(`[API] Transcribiendo fragmento ${i + 1}/${numChunks}...`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Pequeña pausa
      await new Promise((resolve, reject) => {
        exec(`python transcribe.py "${chunkPath}"`, (err, stdout, stderr) => {
          if (err) {
            console.error(`[API] Error en Whisper (chunk ${i}):`, stderr);
            reject(err);
            return;
          }
          try {
            const transcription = JSON.parse(stdout);
            // Ajustar los tiempos de cada fragmento
            transcription.forEach((item) => {
              item.start += start;
              item.end += start;
            });
            allTranscriptions = allTranscriptions.concat(transcription);
          } catch (e) {
            console.error(
              `[API] Error parseando transcripción (chunk ${i}):`,
              stdout
            );
          }
          // Limpieza del fragmento
          if (fs.existsSync(chunkPath)) fs.unlinkSync(chunkPath);
          resolve();
        });
      });
    }
    // Responder con la transcripción completa
    res.json(allTranscriptions);
    // Limpieza
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
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
