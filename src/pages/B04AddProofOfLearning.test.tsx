import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const TEACHER = "11111111-1111-1111-1111-111111111111";

const upload = vi.fn().mockResolvedValue({ error: null });
const createProof = vi.fn().mockResolvedValue({});
const toast = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { storage: { from: () => ({ upload }) } },
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: TEACHER } }) }));
vi.mock("@/hooks/useToast", () => ({}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));
vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));
vi.mock("@/hooks/useStudents", () => ({
  useStudent: () => ({ data: { id: "s1", first_name: "Jan", last_name: "Novák" }, isLoading: false }),
  useStudents: () => ({ data: [{ id: "s1", first_name: "Jan", last_name: "Novák" }] }),
  getStudentDisplayName: () => "Jan Novák",
}));
vi.mock("@/hooks/useProofs", () => ({
  useCreateProof: () => ({ mutateAsync: createProof, isPending: false }),
}));
vi.mock("@/hooks/useClasses", () => ({ useStudentClasses: () => ({ data: [] }) }));
vi.mock("@/hooks/useGoals", () => ({ useGoalsForClass: () => ({ data: [] }) }));
vi.mock("@/components/layout/AppLayout", () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/layout/AppBreadcrumb", () => ({ AppBreadcrumb: () => null }));

const { default: B04AddProofOfLearning } = await import("./B04AddProofOfLearning");

function renderPage() {
  // Nested fields (lesson picker, goal picker) reach for React Query.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/student-profiles/s1/add-proof"]}>
        <Routes>
          <Route path="/student-profiles/:id/add-proof" element={<B04AddProofOfLearning />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Reach the hidden input the visible button is meant to drive. */
function fileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]:not([capture])') as HTMLInputElement;
}

const png = () => new File(["fake-bytes"], "diktát.png", { type: "image/png" });

beforeEach(() => {
  upload.mockClear();
  createProof.mockClear();
  toast.mockClear();
});

describe("attaching a file to a proof of learning", () => {
  it("offers a file input once the file type is chosen", () => {
    const { container } = renderPage();
    fireEvent.click(screen.getByText("Nahrát soubor"));
    expect(fileInput(container)).toBeTruthy();
  });

  it("shows the chosen file and prefills the title from its name", async () => {
    const { container } = renderPage();
    fireEvent.click(screen.getByText("Nahrát soubor"));
    fireEvent.change(fileInput(container), { target: { files: [png()] } });

    expect(await screen.findByText(/diktát\.png/)).toBeTruthy();
    expect(screen.getByPlaceholderText("Pojmenujte důkaz o učení...")).toHaveValue("diktát");
  });

  it("uploads into the teacher's folder and stores the path, not a URL", async () => {
    const { container } = renderPage();
    fireEvent.click(screen.getByText("Nahrát soubor"));
    fireEvent.change(fileInput(container), { target: { files: [png()] } });
    fireEvent.click(await screen.findByRole("button", { name: "Uložit" }));

    await waitFor(() => expect(upload).toHaveBeenCalled());

    const [path, uploaded] = upload.mock.calls[0];
    // The delete policy matches on this leading segment.
    expect(path).toMatch(new RegExp(`^${TEACHER}/[0-9a-f-]{36}\\.png$`));
    expect(uploaded).toBeInstanceOf(File);

    await waitFor(() => expect(createProof).toHaveBeenCalled());
    const saved = createProof.mock.calls[0][0];
    expect(saved.fileUrl).toBe(path);
    expect(saved.fileName).toBe("diktát.png");
    // Buckets are private — a public URL must never be persisted again.
    expect(saved.fileUrl).not.toContain("http");
  });

  it("refuses to save a file proof with no file attached", async () => {
    renderPage();
    fireEvent.click(screen.getByText("Nahrát soubor"));
    fireEvent.change(screen.getByPlaceholderText("Pojmenujte důkaz o učení..."), {
      target: { value: "Bez přílohy" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Uložit" }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Vyberte soubor" })),
    );
    expect(upload).not.toHaveBeenCalled();
    expect(createProof).not.toHaveBeenCalled();
  });

  it("keeps the proof out of the database when the upload fails", async () => {
    upload.mockResolvedValueOnce({ error: new Error("storage down") });
    const { container } = renderPage();
    fireEvent.click(screen.getByText("Nahrát soubor"));
    fireEvent.change(fileInput(container), { target: { files: [png()] } });
    fireEvent.click(await screen.findByRole("button", { name: "Uložit" }));

    await waitFor(() => expect(upload).toHaveBeenCalled());
    // A row pointing at a file that was never stored would render as a broken
    // attachment forever.
    expect(createProof).not.toHaveBeenCalled();
  });

  it("asks a phone for the camera when capturing a photo", () => {
    const { container } = renderPage();
    fireEvent.click(screen.getByText("Vyfotit obrázek"));
    const camera = container.querySelector('input[type="file"][capture]') as HTMLInputElement;
    expect(camera).toBeTruthy();
    expect(camera.accept).toBe("image/*");
  });
});
