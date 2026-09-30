import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, BookmarkPlus, Loader2, MessageSquare, Plus, Sparkles, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { BuddyComposer } from "@/components/buddy/BuddyComposer";
import { BuddyText } from "@/components/buddy/BuddyText";
import { HitList } from "@/components/buddy/HitList";
import { ProposalCard } from "@/components/buddy/ProposalCard";
import { SaveToLessonDialog } from "@/components/buddy/SaveToLessonDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useBuddyConversation,
  useBuddyConversations,
  useDeleteConversation,
  useDiscardProposal,
  useSaveProposal,
} from "@/hooks/useBuddy";
import { useBuddyChat } from "@/hooks/useBuddyChat";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useProfile } from "@/hooks/useProfile";
import { CONTEXT_LABELS, type BuddyContext, type BuddyMessageData, type Proposal } from "@/lib/buddy";
import { greeting, vocative } from "@/lib/greeting";
import { depseudonymizeAll } from "@/lib/pseudonym";

const SUGGESTIONS = [
  "Naplánovat hodinu",
  "Najít žáka",
  "Kdo mi chybí k hodnocení?",
  "Které lekce tento měsíc ještě nemají kritéria?",
];

const TOOL_LABELS: Record<string, string> = {
  search: "Hledám v aplikaci…",
  list_plans: "Procházím plány…",
  list_classes: "Procházím třídy…",
  get_plan: "Čtu plán…",
  get_lesson: "Čtu lekci…",
  get_class_levels: "Dívám se na úrovně třídy…",
  get_methodology: "Hledám v metodice…",
  propose_lesson_update: "Připravuji návrh úpravy…",
  propose_lesson_create: "Připravuji návrh lekce…",
  propose_plan_update: "Připravuji návrh plánu…",
};

function when(iso: string) {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "dnes";
  if (days === 1) return "včera";
  return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" });
}

/**
 * The welcome page with TinyBuddy (zadání kap. 5). Without a conversation it
 * greets the teacher, offers the field with direct search results, quick
 * suggestions and earlier conversations; `?konverzace=` shows one
 * conversation, where Buddy's answers stream in.
 */
export default function Uvod() {
  usePageTitle("Úvod");
  const { displayName } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const conversationId = params.get("konverzace");

  const [context, setContext] = useState<BuddyContext | null>(
    (location.state as { buddyContext?: BuddyContext } | null)?.buddyContext ?? null,
  );
  useEffect(() => {
    const incoming = (location.state as { buddyContext?: BuddyContext } | null)?.buddyContext;
    if (incoming) setContext(incoming);
  }, [location.state]);

  const openConversation = useCallback(
    (id: string) => setParams({ konverzace: id }, { replace: false }),
    [setParams],
  );
  const chat = useBuddyChat({ onConversation: openConversation });
  const { data: conversations = [] } = useBuddyConversations();
  const { data: current } = useBuddyConversation(conversationId);
  const removeConversation = useDeleteConversation();
  const saveProposal = useSaveProposal();
  const discardProposal = useDiscardProposal();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveToLesson, setSaveToLesson] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  const people = chat.students;
  const show = useCallback((text: string) => depseudonymizeAll(text, people), [people]);

  // Leaving a conversation for the home page forgets an unfinished answer.
  const { reset } = chat;
  useEffect(() => {
    if (!conversationId) reset();
  }, [conversationId, reset]);

  const messages = useMemo(() => current?.messages ?? [], [current]);
  useEffect(() => {
    bottom.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages.length, chat.pending?.answer, chat.pending?.data.proposals?.length]);

  const conversationContext = current?.conversation?.context && "kind" in current.conversation.context ? current.conversation.context : null;

  const send = (text: string) => chat.send(text, conversationId, conversationId ? null : context);

  const save = async (messageId: string | null, proposal: Proposal) => {
    setSavingId(proposal.id);
    try {
      const lessonId = await saveProposal.mutateAsync({ messageId, proposal });
      toast({
        title: "Uloženo",
        description: lessonId ? "Změnu najdete v lekci a vrátíte ji v historii změn." : undefined,
      });
    } catch (e) {
      toast({ title: "Nepodařilo se uložit", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const renderExtras = (data: BuddyMessageData, messageId: string | null) => (
    <>
      {(data.results?.length ?? 0) > 0 && <HitList hits={data.results!} compact className="mt-2" />}
      {(data.proposals ?? []).map((p) => (
        <div key={p.id} className="mt-3">
          <ProposalCard
            proposal={p}
            saving={savingId === p.id || !messageId}
            onSave={() => save(messageId, p)}
            onDiscard={() => messageId && discardProposal.mutate({ messageId, proposalId: p.id })}
          />
        </div>
      ))}
    </>
  );

  // ─── Home ──────────────────────────────────────────────────────────────────
  if (!conversationId) {
    const hello = greeting(new Date().getHours());
    return (
      <AppLayout>
        <div className="mx-auto max-w-3xl pt-6">
          <h1 className="text-3xl font-medium">
            {hello}
            {displayName ? `, ${vocative(displayName)}` : ""}.
          </h1>

          <div className="mt-6">
            <BuddyComposer
              withSearch
              hitsPlacement="below"
              autoFocus
              sending={chat.sending}
              context={context}
              onRemoveContext={() => setContext(null)}
              value={draft}
              onValueChange={setDraft}
              onSend={send}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Button key={s} variant="outline" size="sm" className="rounded-full" onClick={() => send(s)} disabled={chat.sending}>
                <Sparkles className="text-brand" />
                {s}
              </Button>
            ))}
          </div>

          {conversations.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">Předešlé konverzace</h2>
              <ul className="divide-y rounded-xl border bg-card">
                {conversations.map((c) => (
                  <li key={c.id} className="group flex items-center gap-2 pr-2">
                    <Link to={`/?konverzace=${c.id}`} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent/40">
                      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">
                        {show(c.title) || "Konverzace"}
                        {"kind" in c.context && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {CONTEXT_LABELS[c.context.kind]} {show(c.context.label)}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{when(c.updated_at)}</span>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Smazat konverzaci"
                      onClick={() => removeConversation.mutate(c.id)}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </AppLayout>
    );
  }

  // ─── Conversation ──────────────────────────────────────────────────────────
  const pending = chat.pending;
  return (
    <AppLayout>
      <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-3xl flex-col">
        <div className="mb-4 flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            {current?.conversation ? show(current.conversation.title) : ""}
            {conversationContext && ` · ${CONTEXT_LABELS[conversationContext.kind]} ${show(conversationContext.label)}`}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setContext(null);
              navigate("/");
            }}
          >
            <Plus />
            Nová konverzace
          </Button>
        </div>

        <div className="flex-1 space-y-5">
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="ml-auto max-w-[85%] rounded-2xl bg-secondary px-4 py-2.5 text-[0.9375rem]">
                {show(m.content)}
              </div>
            ) : (
              <div key={m.id}>
                <BuddyText text={show(m.content)} />
                {renderExtras(m.data ?? {}, m.id)}
                {m.content.length > 200 && (
                  <Button variant="ghost" size="sm" className="mt-1 text-muted-foreground" onClick={() => setSaveToLesson(show(m.content))}>
                    <BookmarkPlus />
                    Uložit do lekce
                  </Button>
                )}
              </div>
            ),
          )}

          {pending && (
            <>
              {!(pending.error && messages[messages.length - 1]?.role === "user") && (
                <div className="ml-auto max-w-[85%] rounded-2xl bg-secondary px-4 py-2.5 text-[0.9375rem]">{pending.question}</div>
              )}
              <div>
                {pending.answer ? (
                  <BuddyText text={show(pending.answer)} />
                ) : (
                  !pending.error && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {TOOL_LABELS[pending.data.tools?.[pending.data.tools.length - 1] ?? ""] ?? "Buddy přemýšlí…"}
                    </p>
                  )
                )}
                {renderExtras(pending.data, null)}
                {pending.error && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {pending.error}
                  </p>
                )}
              </div>
            </>
          )}
          <div ref={bottom} />
        </div>

        <div className="sticky bottom-0 mt-6 bg-background pb-2 pt-2">
          <BuddyComposer sending={chat.sending} onSend={send} placeholder="Napište Buddymu…" />
          <p className="mt-1.5 text-center text-xs text-muted-foreground">
            Buddy vidí žáky jen pod přezdívkou. Změny ukáže jako návrh a uloží je, až je potvrdíte.
          </p>
        </div>
      </div>
      <SaveToLessonDialog open={!!saveToLesson} onOpenChange={(o) => !o && setSaveToLesson(null)} text={saveToLesson ?? ""} />
    </AppLayout>
  );
}
