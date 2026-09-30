import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/hooks/useProfile", () => ({ useProfile: () => ({ displayName: "Jana" }) }));

const { AppSidebar } = await import("./AppSidebar");
const { SidebarProvider } = await import("@/components/ui/sidebar");

describe("the menu of the new version", () => {
  it("lists the sections and entries from the brief, in order", () => {
    render(
      <MemoryRouter>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>,
    );
    const links = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(links).toEqual(["/", "/predmety", "/tridy", "/dukazy", "/napady", "/hodnoceni", "/nastaveni"]);
    expect(screen.getByText("Vaše výuka")).toBeInTheDocument();
    expect(screen.getByText("Jak na to")).toBeInTheDocument();
    expect(screen.getByText("Jana")).toBeInTheDocument();
  });
});
