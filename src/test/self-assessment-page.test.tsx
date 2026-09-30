/**
 * The online exit ticket as a pupil sees it: pick your name, a step for each
 * criterion, send.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SebehodnoceniVerejne from "@/pages/SebehodnoceniVerejne";

vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));

const LOADED = {
  lesson: { title: "Části rostliny", goal: "Popíšu části rostliny." },
  criteria: [
    { id: "c1", text: "Ukážu kořen.", scale: { J: "Kořen ještě nenajdu.", C: "", T: "", U: "Kořen ukážu vždycky." } },
    { id: "c2", text: "Pojmenuji květ.", scale: null },
  ],
  pupils: [{ id: "s1", label: "Adam B." }],
};

function renderPage(fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter initialEntries={["/s/abc"]}>
      <Routes>
        <Route path="/s/:token" element={<SebehodnoceniVerejne />} />
      </Routes>
    </MemoryRouter>,
  );
}

const reply = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

afterEach(() => vi.unstubAllGlobals());

describe("online exit ticket", () => {
  it("sends the chosen steps and the comment", async () => {
    const fetchMock = vi.fn().mockImplementationOnce(() => reply(LOADED)).mockImplementationOnce(() => reply({ ok: true }));
    renderPage(fetchMock);

    fireEvent.click(await screen.findByRole("button", { name: "Adam B." }));
    // The criterion's own sentence, and the general one where it has none.
    expect(screen.getByText("Kořen ukážu vždycky.")).toBeInTheDocument();
    expect(screen.getAllByText("Ještě mi to nejde a stále se učím.")).toHaveLength(1);

    const send = screen.getByRole("button", { name: "Odeslat" });
    expect(send).toBeDisabled();
    fireEvent.click(screen.getByText("Kořen ukážu vždycky."));
    // c1 has no sentence of its own for Č either, so the general one shows twice.
    fireEvent.click(screen.getAllByText("Trochu mi to jde, ale dělám chyby.")[1]);
    fireEvent.change(screen.getByLabelText(/Chceš něco dodat/), { target: { value: "Baví mě to." } });
    fireEvent.click(send);

    expect(await screen.findByText("Díky, Adam B.!")).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      action: "submit",
      token: "abc",
      studentId: "s1",
      levels: { c1: "U", c2: "C" },
      comment: "Baví mě to.",
    });
  });

  it("explains a closed exit ticket", async () => {
    renderPage(vi.fn(() => reply({ error: "Tahle exitka už je uzavřená." }, 400)));
    await waitFor(() => expect(screen.getByText("Tahle exitka už je uzavřená.")).toBeInTheDocument());
  });
});
