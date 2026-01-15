'use client';

import { useEffect,useRef, useState } from 'react';

import { Mic, Play, Square, Trash2, Upload } from 'lucide-react';

interface AudioRecorderProps {
  onAudioSelect: (file: File) => void;
  onClose?: () => void;
}

export function AudioRecorder({ onAudioSelect, onClose }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        setRecordedBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      alert(
        'No se pudo acceder al micrófono. Por favor, verifica los permisos.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (recordedBlob && audioRef.current) {
      const url = URL.createObjectURL(recordedBlob);
      audioRef.current.src = url;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const deleteRecording = () => {
    setRecordedBlob(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.src = '';
    }
  };

  const handleSubmit = () => {
    if (recordedBlob) {
      const timestamp = Date.now();
      const uuid = Math.random().toString(36).substring(2, 15);
      const fileName = `audio-${timestamp}-${uuid}.mp3`;
      const file = new File([recordedBlob], fileName, { type: 'audio/mp3' });
      onAudioSelect(file);
      onClose?.();
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, []);

  return (
    <div className="space-y-4 rounded-lg border border-cyan-700/30 bg-slate-900/50 p-6">
      <div className="flex flex-col gap-4">
        {/* Controles de grabación */}
        <div className="flex gap-2">
          {!recordedBlob ? (
            <>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                  isRecording
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-cyan-700 text-white hover:bg-cyan-600'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="h-4 w-4" />
                    Detener
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Grabar
                  </>
                )}
              </button>
              {isRecording && (
                <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                  Grabando...
                </div>
              )}
            </>
          ) : (
            <>
              <button
                onClick={playRecording}
                disabled={isPlaying}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {isPlaying ? 'Reproduciendo...' : 'Escuchar'}
              </button>
              <button
                onClick={deleteRecording}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Borrar
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
              >
                <Upload className="h-4 w-4" />
                Usar Audio
              </button>
            </>
          )}
        </div>

        {/* Visualizador de ondas (simple) */}
        {isRecording && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-8 w-1 bg-cyan-500 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        )}

        {/* Elemento de audio oculto */}
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
}
