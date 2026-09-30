import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStudents } from "@/hooks/useStudents";
import { streamAi } from "@/lib/ai";
import type { BuddyContext, BuddyMessageData, Proposal, SearchHit } from "@/lib/buddy";
import { pseudonymize } from "@/lib/pseudonym";

export interface PendingExchange {
  question: string;
  answer: string;
  data: BuddyMessageData;
  error: string | null;
}

/**
 * Sending a message to Buddy and following the streamed answer. The
 * teacher's text is pseudonymised here, before it leaves the browser
 * (zadání kap. 5.3); the answer keeps nicknames until it is shown.
 */
export function useBuddyChat({ onConversation }: { onConversation: (id: string) => void }) {
  const queryClient = useQueryClient();
  const { data: students = [] } = useStudents();
  const [pending, setPending] = useState<PendingExchange | null>(null);
  const [sending, setSending] = useState(false);
  const abort = useRef<AbortController | null>(null);

  const send = useCallback(
    async (message: string, conversationId: string | null, context: BuddyContext | null) => {
      const text = message.trim();
      if (!text || sending) return;
      setSending(true);
      setPending({ question: text, answer: "", data: { results: [], proposals: [], tools: [] }, error: null });
      const controller = new AbortController();
      abort.current = controller;
      let conversation = conversationId;
      const update = (fn: (p: PendingExchange) => PendingExchange) => setPending((p) => (p ? fn(p) : p));
      try {
        await streamAi(
          "buddy-chat",
          { conversationId, message: pseudonymize(text, students), context: conversationId ? null : context },
          (event) => {
            switch (event.type) {
              case "conversation":
                conversation = event.id as string;
                if (!conversationId) onConversation(conversation);
                break;
              case "text":
                update((p) => ({ ...p, answer: p.answer + (event.delta as string) }));
                break;
              case "tool":
                update((p) => ({ ...p, data: { ...p.data, tools: [...(p.data.tools ?? []), event.name as string] } }));
                break;
              case "results":
                update((p) => ({ ...p, data: { ...p.data, results: [...(p.data.results ?? []), ...(event.items as SearchHit[])] } }));
                break;
              case "proposal":
                update((p) => ({ ...p, data: { ...p.data, proposals: [...(p.data.proposals ?? []), event.proposal as Proposal] } }));
                break;
              case "error":
                update((p) => ({ ...p, error: (event.message as string) || "Buddy teď neodpovídá." }));
                break;
            }
          },
          controller.signal,
        );
        await queryClient.invalidateQueries({ queryKey: ["buddy_conversation", conversation] });
        queryClient.invalidateQueries({ queryKey: ["buddy_conversations"] });
        setPending((p) => (p?.error ? p : null));
      } catch (e) {
        if (!controller.signal.aborted) {
          update((p) => ({ ...p, error: e instanceof Error ? e.message : "Buddy teď neodpovídá." }));
        }
      } finally {
        setSending(false);
      }
    },
    [sending, students, onConversation, queryClient],
  );

  const reset = useCallback(() => {
    abort.current?.abort();
    setPending(null);
    setSending(false);
  }, []);

  return { send, pending, sending, reset, students };
}
