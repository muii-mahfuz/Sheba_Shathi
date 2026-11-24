"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LOCALE_TAGS, type Locale } from "@/lib/i18n";

/**
 * Dictation through the browser's own speech recognition.
 *
 * Deliberately not a server round-trip: someone describing chest pain should
 * not need a good connection to be heard, and the Web Speech API already speaks
 * bn-BD. Unsupported browsers report `supported: false` so the form can offer
 * typing instead of failing silently.
 */

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechInput(locale: Locale, onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const supported = mounted && recognitionCtor() !== null;
  // Kept in a ref so restarting recognition never re-subscribes a stale handler.
  const callbackRef = useRef(onTranscript);
  useEffect(() => {
    callbackRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = LOCALE_TAGS[locale];
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) text += result[0].transcript;
      }
      if (text.trim()) callbackRef.current(text.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [locale]);

  return { supported, listening, start, stop };
}
