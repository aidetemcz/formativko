import { useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Audio formats in order of preference; Safari records MP4, others WebM. */
const MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_TYPES.find((t) => MediaRecorder.isTypeSupported?.(t));
}

function recordingSupported(): boolean {
  return typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

/**
 * Record a voice note in the browser (zadání kap. 3, bod 4). The recording is
 * handed back as a File; the caller uploads it as an audio proof.
 */
export function AudioRecorder({ onChange }: { onChange: (file: File | null) => void }) {
  const [state, setState] = useState<"idle" | "recording" | "done">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearInterval(timer.current);
      recorder.current?.stream.getTracks().forEach((t) => t.stop());
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  if (!recordingSupported()) {
    return <p className="text-sm text-muted-foreground">Tento prohlížeč neumí nahrávat zvuk.</p>;
  }

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = rec.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type });
        const ext = type.includes("mp4") ? "m4a" : "webm";
        const file = new File([blob], `nahravka-${new Date().toISOString().slice(0, 16).replace(":", "-")}.${ext}`, { type });
        setUrl(URL.createObjectURL(blob));
        setState("done");
        onChange(file);
      };
      recorder.current = rec;
      rec.start();
      setSeconds(0);
      timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
      setState("recording");
    } catch {
      setError("Mikrofon se nepodařilo zapnout. Povolte ho prohlížeči.");
    }
  };

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    recorder.current?.stop();
  };

  const reset = () => {
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
    setState("idle");
    onChange(null);
  };

  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-2">
      {state === "idle" && (
        <Button type="button" variant="outline" className="h-14 w-full text-base" onClick={start}>
          <Mic />
          Nahrát hlasovou poznámku
        </Button>
      )}
      {state === "recording" && (
        <Button type="button" variant="destructive" className="h-14 w-full text-base" onClick={stop}>
          <Square />
          Zastavit · {time}
        </Button>
      )}
      {state === "done" && url && (
        <div className="flex items-center gap-2">
          <audio controls src={url} className="h-10 flex-1" />
          <Button type="button" variant="ghost" size="icon" title="Nahrát znovu" onClick={reset}>
            <RotateCcw />
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
