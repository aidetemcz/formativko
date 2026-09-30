import { useCallback, useEffect, useRef, useState } from "react";

// The Web Speech API is not in TypeScript's DOM types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Recognition = any;

function recognitionClass(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Dictation in Czech for the Buddy field, where the browser supports it
 * (Chrome, Edge, Safari). `onText` gets the final transcript.
 */
export function useSpeechRecognition(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const supported = !!recognitionClass();
  const callback = useRef(onText);
  callback.current = onText;

  const stop = useCallback(() => {
    recognition.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Rec = recognitionClass();
    if (!Rec) return;
    const rec = new Rec();
    rec.lang = "cs-CZ";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      if (text) callback.current(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognition.current = rec;
    rec.start();
    setListening(true);
  }, []);

  useEffect(() => () => recognition.current?.abort?.(), []);

  return { supported, listening, start, stop };
}
