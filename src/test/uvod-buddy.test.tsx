/**
 * The welcome page with TinyBuddy: the teacher's message leaves the browser
 * pseudonymised, the streamed answer shows real names again, and a proposal
 * is saved only on click.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const saveProposal = vi.fn().mockResolvedValue("l1");
const stream = vi.fn();

vi.mock("@/components/layout/AppLayout", () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));
vi.mock("@/hooks/useProfile", () => ({ useProfile: () => ({ displayName: "Jana" }) }));
vi.mock("@/hooks/useStudents", () => ({
  useStudents: () => ({ data: [{ id: "s1", first_name: "Adam", last_name: "Bílý", nickname: "Modrá vydra" }] }),
}));
vi.mock("@/lib/ai", () => ({ streamAi: (...args: unknown[]) => stream(...args) }));
vi.mock("@/hooks/useBuddy", () => ({
  useBuddyConversations: () => ({ data: [] }),
  useBuddyConversation: () => ({ data: { conversation: null, messages: [] } }),
  useDeleteConversation: () => ({ mutate: vi.fn() }),
  useSaveProposal: () => ({ mutateAsync: saveProposal }),
  useDiscardProposal: () => ({ mutate: vi.fn() }),
  useSearchEverything: () => ({ data: [], isFetching: false }),
}));

import Uvod from "@/pages/Uvod";

const PROPOSAL = {
  id: "p1",
  type: "plan_update",
  status: "pending",
  summary: "Posunout zlomky na listopad",
  plan_id: "k1",
  plan_name: "Matematika 7.B",
  items: [{ lesson_id: "l1", before: { title: "Zlomky", month: "říjen" }, after: { title: "Zlomky", month: "listopad" } }],
};

function renderPage() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Uvod />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  stream.mockReset();
  saveProposal.mockClear();
});

describe("TinyBuddy on the welcome page", () => {
  it("sends a pseudonymised question and shows the answer with names", async () => {
    let finish: () => void = () => {};
    stream.mockImplementation(async (_name: string, _body: unknown, onEvent: (e: unknown) => void) => {
      onEvent({ type: "conversation", id: "conv1" });
      onEvent({ type: "text", delta: "Modrá vydra má úroveň T. " });
      onEvent({ type: "proposal", proposal: PROPOSAL });
      await new Promise<void>((resolve) => (finish = resolve));
    });
    renderPage();
    expect(screen.getByText(/Jano/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Dotaz pro Buddyho"), { target: { value: "Jak je na tom Adam Bílý?" } });
    fireEvent.keyDown(screen.getByLabelText("Dotaz pro Buddyho"), { key: "Enter" });

    await waitFor(() => expect(stream).toHaveBeenCalled());
    expect(stream.mock.calls[0][0]).toBe("buddy-chat");
    expect(stream.mock.calls[0][1]).toMatchObject({ message: "Jak je na tom Modrá vydra?", conversationId: null });

    expect(await screen.findByText("Adam Bílý má úroveň T.")).toBeInTheDocument();
    expect(screen.getByText("Posunout zlomky na listopad")).toBeInTheDocument();
    // While the answer is still coming, the proposal cannot be saved yet.
    expect(screen.getByRole("button", { name: /Uložit/ })).toBeDisabled();
    expect(saveProposal).not.toHaveBeenCalled();
    finish();
  });
});
