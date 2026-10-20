'use client';

import { useEffect, useRef, useState } from 'react';

import { toast } from 'sonner';

// The Web Speech API is not in TypeScript's DOM lib, and Chromium and Safari
// still expose it prefixed, so only the members used here are typed.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
  if (typeof window === 'undefined') return null;
  const speechWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return (
    speechWindow.SpeechRecognition ??
    speechWindow.webkitSpeechRecognition ??
    null
  );
};

/**
 * Voice typing for the Artie composer: what the learner says is transcribed
 * in the browser and handed to `onText`, one finished phrase at a time. No
 * audio leaves the page through Artiefy; the browser's own speech service
 * does the transcription.
 *
 * `onText` is captured when dictation starts, so it should only rely on
 * functional state updates.
 */
export function useSpeechDictation(onText: (text: string) => void) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Stop listening when the composer unmounts mid-dictation.
  useEffect(() => () => recognitionRef.current?.abort(), []);

  const stop = () => recognitionRef.current?.stop();

  const start = () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      toast.error(
        'Tu navegador no permite dictar por voz. Prueba con Chrome o Edge.'
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result?.[0].transcript.trim();
        if (result?.isFinal && transcript) onText(transcript);
      }
    };
    recognition.onerror = (event) => {
      if (
        event.error === 'not-allowed' ||
        event.error === 'service-not-allowed'
      ) {
        toast.error('Permite el acceso al micrófono para dictar tu idea.');
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toast.error('No pudimos escucharte. Intenta de nuevo.');
      }
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const toggle = () => (isListening ? stop() : start());

  return { isListening, toggle, stop };
}
