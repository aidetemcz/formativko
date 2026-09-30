import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOpenHowTo } from "./howToContext";

/**
 * The "?" next to a page title: a plain-language explanation of the page, and
 * a way into the "Jak na to" guide.
 */
export function PageHelp({ text }: { text: string }) {
  const openHowTo = useOpenHowTo();
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <Popover>
        <PopoverTrigger
          aria-label="Vysvětlivka"
          className="ml-2 flex h-5 w-5 items-center justify-center rounded-full border border-input text-xs font-normal text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          ?
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-80 border-0 bg-primary text-sm leading-relaxed text-primary-foreground"
        >
          {text}
        </PopoverContent>
      </Popover>
      <button
        type="button"
        onClick={openHowTo}
        className="rounded-full border border-input px-2.5 py-0.5 text-xs font-normal text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        Jak na to
      </button>
    </span>
  );
}
