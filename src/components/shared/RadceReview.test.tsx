import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/ai", () => ({ invokeAi: vi.fn() }));
const { RadceReview } = await import("./RadceReview");

const review = { comments: ["Věta o snaze popisuje domněnku."], went_well: [], offers: [] };

describe("RadceReview", () => {
  it("shows the Rádce's comments", () => {
    render(<RadceReview text="Text" mode="feedback" initialReview={review} />);
    expect(screen.getByText("Věta o snaze popisuje domněnku.")).toBeInTheDocument();
  });

  it("lists next steps apart only for a school report", () => {
    const { rerender } = render(
      <RadceReview text="Text" mode="certificate" initialReview={review} recommendationsOutside={["Číst nahlas."]} />,
    );
    expect(screen.getByText("Doporučení mimo vysvědčení")).toBeInTheDocument();
    rerender(<RadceReview text="Text" mode="feedback" initialReview={review} recommendationsOutside={["Číst nahlas."]} />);
    expect(screen.queryByText("Doporučení mimo vysvědčení")).toBeNull();
  });

  it("says so when the text is fine", () => {
    render(<RadceReview text="Text" mode="feedback" initialReview={{ ...review, comments: [] }} />);
    expect(screen.getByText("Rádce nemá k textu připomínky.")).toBeInTheDocument();
  });
});
