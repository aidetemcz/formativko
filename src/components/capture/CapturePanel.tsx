import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateProof } from "@/hooks/useProofs";
import { AudioRecorder } from "@/components/shared/AudioRecorder";
import { CriterionLevelPanel } from "@/components/capture/CriterionLevelPanel";
import type { LessonCriterion } from "@/hooks/usePlanLessons";
import type { JctuCode } from "@/constants/jctu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { buildUploadPath } from "@/lib/storage";
import type { ProofTypeRow, ProofFieldKind } from "@/constants/proofTypes";

/** The lesson being recorded: its goal and criteria. */
export interface CaptureLesson {
  id: string;
  goalId: string | null;
  criteria: LessonCriterion[];
}

interface CapturePanelProps {
  proofType: ProofTypeRow;
  selectedStudents: string[];
  lesson: CaptureLesson | null;
  /** Teacher's current level per `${studentId}:${criterionId}`. */
  currentLevels: Map<string, JctuCode>;
  onCaptured: (studentIds: string[], proofTypeId: string) => void;
}

export default function CapturePanel({
  proofType,
  selectedStudents,
  lesson,
  currentLevels,
  onCaptured,
}: CapturePanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const createProof = useCreateProof();
  const selectedLesson = lesson?.id ?? null;
  // Proofs captured in a lesson count towards the lesson's goal.
  const lessonGoalIds = lesson?.goalId ? [lesson.goalId] : undefined;

  const fields = proofType.fields as ProofFieldKind[];
  const hasText = fields.includes("text");
  const hasImage = fields.includes("image");
  const hasLevel = fields.includes("level");
  const hasAudio = fields.includes("audio");
  const isInstant = fields.includes("none") || fields.length === 0;
  const dbProofTypeId = proofType.builtin ? undefined : proofType.id;

  // Text state
  const [noteText, setNoteText] = useState("");

  // Image state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioKey, setAudioKey] = useState(0);
  const [saving, setSaving] = useState(false);

  // Instant capture: fire on mount if no fields needed and students selected
  useEffect(() => {
    if (isInstant && selectedStudents.length > 0) {
      handleSave();
    }
  }, []); // only on mount

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (selectedStudents.length === 0) {
      toast({ title: "Vyberte žáky", variant: "destructive" });
      return;
    }

    // Validate based on fields
    if (hasText && !hasLevel && !hasImage && !hasAudio && !noteText.trim()) {
      toast({ title: "Napište poznámku", variant: "destructive" });
      return;
    }
    if (hasImage && !photoFile) {
      toast({ title: "Nejdříve vyfoťte nebo vyberte obrázek", variant: "destructive" });
      return;
    }
    if (hasAudio && !audioFile) {
      toast({ title: "Nejdřív nahrajte hlasovou poznámku", variant: "destructive" });
      return;
    }

    // Optimistically update dots immediately for instant feedback
    const capturedStudents = [...selectedStudents];
    onCaptured(capturedStudents, proofType.id);

    // Reset form state immediately so teacher can keep working
    const savedNote = noteText;
    const savedPhoto = photoFile;
    const savedAudio = audioFile;
    setNoteText("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setAudioFile(null);
    setAudioKey((k) => k + 1);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Save in background
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      // Handle audio field: the recording becomes a voice proof
      if (hasAudio && savedAudio) {
        setUploading(true);
        if (!user) throw new Error("Nahrání souboru vyžaduje přihlášení.");
        const path = buildUploadPath(user.id, savedAudio.name);
        const { error: uploadErr } = await supabase.storage.from("proof-files").upload(path, savedAudio);
        if (uploadErr) throw uploadErr;
        await createProof.mutateAsync({
          title: `${proofType.name} ${today}`,
          type: "voice",
          note: savedNote || "",
          date: today,
          lessonId: selectedLesson,
          studentIds: capturedStudents,
          fileName: savedAudio.name,
          fileUrl: path,
          goalIds: lessonGoalIds,
          proofTypeId: dbProofTypeId,
        });
      }
      // Handle image field
      // Handle image field
      else if (hasImage && savedPhoto) {
        setUploading(true);
        if (!user) throw new Error("Nahrání souboru vyžaduje přihlášení.");
        const path = buildUploadPath(user.id, savedPhoto.name || "photo.jpg");
        const { error: uploadErr } = await supabase.storage
          .from("proof-files")
          .upload(path, savedPhoto);
        if (uploadErr) throw uploadErr;

        await createProof.mutateAsync({
          title: `${proofType.name} ${today}`,
          type: "camera",
          note: savedNote || "",
          date: today,
          lessonId: selectedLesson,
          studentIds: capturedStudents,
          fileName: savedPhoto.name,
          fileUrl: path,
          goalIds: lessonGoalIds,
          proofTypeId: dbProofTypeId,
        });
      }
      // Handle text-only (no level, no image)
      else if (hasText) {
        await createProof.mutateAsync({
          title: `${proofType.name} ${today}`,
          type: "text",
          note: savedNote,
          date: today,
          lessonId: selectedLesson,
          studentIds: capturedStudents,
          goalIds: lessonGoalIds,
          proofTypeId: dbProofTypeId,
        });
      }
      // Handle instant capture (no fields)
      else if (isInstant) {
        await createProof.mutateAsync({
          title: `${proofType.name} ${today}`,
          type: "text",
          note: "",
          date: today,
          lessonId: selectedLesson,
          studentIds: capturedStudents,
          proofTypeId: dbProofTypeId,
        });
      }

      toast({
        title: `${proofType.name} uloženo pro ${capturedStudents.length} žáků`,
      });
    } catch (err) {
      console.error("Chyba při ukládání", err);
      toast({ title: "Chyba při ukládání — důkaz nebyl uložen", variant: "destructive" });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const studentCount = selectedStudents.length;
  const headerText = studentCount > 0
    ? `${proofType.name} pro ${studentCount} žáků`
    : `${proofType.name} — vyberte žáky`;

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-foreground">{headerText}</span>

      {/* Level field: J/Č/T/Ú per criterion of the lesson, saved on tap */}
      {hasLevel &&
        (lesson ? (
          <CriterionLevelPanel
            criteria={lesson.criteria}
            selectedStudents={selectedStudents}
            lessonId={lesson.id}
            current={currentLevels}
            onRecorded={(ids) => onCaptured(ids, proofType.id)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Úrovně se zapisují ke kritériím lekce. Vyberte nahoře lekci, nebo otevřete záznam z detailu lekce.
          </p>
        ))}

      {/* Audio field */}
      {hasAudio && <AudioRecorder key={audioKey} onChange={setAudioFile} />}

      {/* Image field */}
      {hasImage && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelected}
          />
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Náhled"
                className="w-full max-h-48 object-contain rounded-xl border border-border"
              />
              <button
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute top-2 right-2 bg-background/80 rounded-full p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center bg-background hover:bg-accent/50 transition-colors"
            >
              <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Klepněte pro vyfocení nebo výběr obrázku
              </p>
            </button>
          )}
        </>
      )}

      {/* Text field */}
      {hasText && (
        <Textarea
          className="min-h-[80px] bg-background"
          placeholder={hasImage ? "Volitelná poznámka k fotce..." : hasAudio ? "Volitelná poznámka k nahrávce..." : "Napište poznámku..."}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          autoFocus={!hasLevel && !hasImage}
        />
      )}

      {/* Save button (not for instant types, which auto-save, nor for levels, saved on tap) */}
      {!isInstant && !(hasLevel && !hasText && !hasImage && !hasAudio) && (
        <Button
          className="w-full gap-1"
          onClick={handleSave}
          disabled={saving || uploading}
        >
          <Check className="h-4 w-4" />
          {saving || uploading ? "Ukládání…" : `Uložit ${proofType.name.toLowerCase()}`}
        </Button>
      )}
    </div>
  );
}
