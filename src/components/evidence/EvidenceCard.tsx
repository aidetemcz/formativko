import { useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Eye, FileText, Mic, Paperclip, Pencil, Trash2, TrendingUp } from "lucide-react";
import { LevelChip } from "@/components/shared/LevelChip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ASSESSMENT_SOURCE_LABELS } from "@/constants/jctu";
import { subjectChipClasses } from "@/constants/subjectColors";
import { EVIDENCE_KIND_LABELS, type EvidenceItem, type EvidenceKind } from "@/lib/evidence";
import { createSignedUrl } from "@/lib/storage";

const KIND_STYLE: Record<EvidenceKind, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  level: { icon: TrendingUp, className: "bg-brand text-brand-foreground" },
  text: { icon: FileText, className: "bg-proof-text text-primary-foreground" },
  camera: { icon: Camera, className: "bg-proof-camera text-primary-foreground" },
  voice: { icon: Mic, className: "bg-proof-voice text-primary-foreground" },
  file: { icon: Paperclip, className: "bg-proof-file text-primary-foreground" },
};

function proofHref(item: EvidenceItem): string | null {
  const pupil = item.pupils[0];
  if (!pupil || item.kind === "level") return null;
  return item.kind === "text"
    ? `/student-profiles/${pupil.id}/proof/${item.id}`
    : `/student-profiles/${pupil.id}/proof-file/${item.id}`;
}

/**
 * One entry of the evidence feed: what kind it is on the left, the content
 * first (the level on a criterion, the note, the photo), the context small
 * underneath.
 */
export function EvidenceCard({
  item,
  hidePupil,
  onDelete,
}: {
  item: EvidenceItem;
  hidePupil?: boolean;
  onDelete: () => void;
}) {
  const style = KIND_STYLE[item.kind];
  const [audio, setAudio] = useState<string | null>(null);
  const href = proofHref(item);

  const openFile = async () => {
    if (!item.file) return;
    const url = await createSignedUrl("proof-files", item.file.url);
    if (!url) return;
    if (item.kind === "voice") setAudio(url);
    else window.open(url, "_blank", "noopener");
  };

  return (
    <div className="flex gap-3 rounded-xl border bg-card p-3 sm:p-4">
      <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5 sm:w-16">
        <span title={EVIDENCE_KIND_LABELS[item.kind]} className={`flex h-9 w-9 items-center justify-center rounded-lg ${style.className}`}>
          <style.icon className="h-4 w-4" />
        </span>
        <span className="hidden text-[0.6875rem] text-muted-foreground sm:block">{EVIDENCE_KIND_LABELS[item.kind]}</span>
      </div>

      <div className="min-w-0 flex-1">
        {!hidePupil && item.pupils.length > 0 && (
          <p className="text-sm font-medium">
            {item.pupils.map((p, i) => (
              <span key={p.id}>
                {i > 0 && ", "}
                <Link to={`/zaci/${p.id}`} className="hover:underline">
                  {p.first_name} {p.last_name}
                </Link>
              </span>
            ))}
          </p>
        )}

        {item.level ? (
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm">
            <span>{item.level.criterion}</span>
            <LevelChip level={item.level.code} withLabel />
            {item.level.source !== "teacher" && (
              <span className="text-xs text-muted-foreground">{ASSESSMENT_SOURCE_LABELS[item.level.source]}</span>
            )}
          </p>
        ) : (
          <p className="mt-0.5 text-sm">
            {item.kind === "text" ? item.note || item.title : item.title}
            {item.kind !== "text" && item.note && <span className="block text-muted-foreground">{item.note}</span>}
          </p>
        )}
        {audio && <audio controls autoPlay src={audio} className="mt-2 h-8 w-full max-w-sm" />}

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {item.lesson?.subjects?.name && (
            <Badge variant="plain" className={subjectChipClasses(item.lesson.subjects.name)}>
              {item.lesson.subjects.name}
            </Badge>
          )}
          {item.lesson && (
            <Link to={`/lekce/${item.lesson.id}`} className="hover:underline">
              {[item.lesson.classes?.name, item.lesson.title].filter(Boolean).join(" · ")}
            </Link>
          )}
          <span>{new Date(item.date).toLocaleDateString("cs-CZ")}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-start gap-0.5">
        {item.file && (
          <Button variant="ghost" size="icon" title={item.kind === "voice" ? "Přehrát nahrávku" : "Otevřít soubor"} onClick={openFile}>
            <Eye />
          </Button>
        )}
        {href && (
          <Button asChild variant="ghost" size="icon" title="Upravit důkaz">
            <Link to={href}>
              <Pencil />
            </Link>
          </Button>
        )}
        <Button variant="ghost" size="icon" title="Odstranit" className="text-muted-foreground hover:text-destructive" onClick={onDelete}>
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
