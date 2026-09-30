import { useEffect, useState } from "react";
import { ArrowUp, Loader2, Mic, MicOff, Search, X } from "lucide-react";
import { HitList } from "@/components/buddy/HitList";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSearchEverything } from "@/hooks/useBuddy";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { CONTEXT_LABELS, type BuddyContext } from "@/lib/buddy";
import { cn } from "@/lib/utils";

function useDebounced(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * The Buddy field (zadání kap. 5.1–5.2): typing shows direct results from the
 * teacher's data, Enter asks Buddy. A context chip names the page the
 * conversation started from and can be removed.
 */
export function BuddyComposer({
  onSend,
  sending,
  context,
  onRemoveContext,
  withSearch,
  hitsPlacement = "above",
  autoFocus,
  placeholder = "Zeptejte se Buddyho nebo hledejte…",
  value: controlled,
  onValueChange,
}: {
  onSend: (text: string) => void;
  sending?: boolean;
  context?: BuddyContext | null;
  onRemoveContext?: () => void;
  withSearch?: boolean;
  /** Where direct results open: above the field (spec) or below it near the top of a page. */
  hitsPlacement?: "above" | "below";
  autoFocus?: boolean;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const [own, setOwn] = useState("");
  const value = controlled ?? own;
  const setValue = onValueChange ?? setOwn;
  const [focused, setFocused] = useState(false);
  const query = useDebounced(withSearch ? value : "", 250);
  const { data: hits = [], isFetching } = useSearchEverything(query);
  const speech = useSpeechRecognition((text) => setValue(value ? `${value} ${text}` : text));

  const submit = () => {
    if (!value.trim() || sending) return;
    onSend(value.trim());
    setValue("");
  };

  const showHits = withSearch && focused && query.trim().length >= 2;

  return (
    <div className="relative">
      {showHits && (hits.length > 0 || isFetching) && (
        <div
          className={cn(
            "absolute inset-x-0 z-20 max-h-80 overflow-y-auto rounded-xl border bg-card py-1 shadow-lg",
            hitsPlacement === "above" ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          <p className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            {isFetching && hits.length === 0 ? "Hledám…" : "Přímo v aplikaci · Enter se zeptá Buddyho"}
          </p>
          <HitList hits={hits} />
        </div>
      )}
      <div className="rounded-2xl border bg-card px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-ring/30">
        {context && (
          <span className="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs text-brand-strong">
            <span className="truncate">
              {CONTEXT_LABELS[context.kind]}: {context.label}
            </span>
            {onRemoveContext && (
              <button type="button" aria-label="Odebrat kontext" onClick={onRemoveContext} className="rounded-full hover:bg-brand/10">
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            aria-label="Dotaz pro Buddyho"
            autoFocus={autoFocus}
            rows={1}
            placeholder={placeholder}
            className="max-h-40 min-h-[2.5rem] flex-1 resize-none border-0 bg-transparent p-1.5 shadow-none focus-visible:ring-0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          {speech.supported && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={speech.listening ? "Zastavit diktování" : "Diktovat"}
              className={cn(speech.listening && "text-brand")}
              onClick={speech.listening ? speech.stop : speech.start}
            >
              {speech.listening ? <MicOff /> : <Mic />}
            </Button>
          )}
          <Button type="button" size="icon" title="Zeptat se Buddyho" disabled={!value.trim() || sending} onClick={submit}>
            {sending ? <Loader2 className="animate-spin" /> : <ArrowUp />}
          </Button>
        </div>
      </div>
    </div>
  );
}
