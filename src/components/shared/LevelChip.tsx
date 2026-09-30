import { cn } from "@/lib/utils";
import { getJctuLevel, type JctuCode } from "@/constants/jctu";

/** Spelled out in full so Tailwind finds the classes. */
const LEVEL_CLASSES: Record<JctuCode, string> = {
  J: "bg-jctu-j text-jctu-j-foreground border-jctu-t/60",
  C: "bg-jctu-c text-jctu-c-foreground border-jctu-c",
  T: "bg-jctu-t text-jctu-t-foreground border-jctu-t",
  U: "bg-jctu-u text-jctu-u-foreground border-jctu-u",
};

interface LevelChipProps {
  level: JctuCode | null | undefined;
  /** Show "Téměř osvojeno" next to the letter. */
  withLabel?: boolean;
  className?: string;
}

/**
 * One JČTÚ step as a chip. An empty chip (dashed outline) marks a missing
 * level, so a grid shows at a glance who has not been assessed yet.
 */
export function LevelChip({ level, withLabel = false, className }: LevelChipProps) {
  if (!level) {
    return (
      <span
        className={cn(
          "inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-dashed border-input px-1.5 text-xs text-subtle",
          className,
        )}
        aria-label="Bez úrovně"
      >
        –
      </span>
    );
  }
  const info = getJctuLevel(level);
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center gap-1.5 rounded-md border px-1.5 text-xs font-medium",
        LEVEL_CLASSES[level],
        className,
      )}
      title={info.label}
      aria-label={info.label}
    >
      {info.letter}
      {withLabel && <span className="font-normal">{info.label}</span>}
    </span>
  );
}
