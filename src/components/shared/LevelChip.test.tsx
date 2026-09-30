import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LevelChip } from "./LevelChip";

describe("LevelChip", () => {
  it("shows the Czech letter for a stored ASCII code", () => {
    render(<LevelChip level="U" withLabel />);
    expect(screen.getByLabelText("Úplně osvojeno").textContent).toContain("Ú");
  });

  it("marks a missing level", () => {
    render(<LevelChip level={null} />);
    expect(screen.getByLabelText("Bez úrovně")).toBeTruthy();
  });

  it("never paints a step in traffic-light colours", () => {
    const { container } = render(<><LevelChip level="J" /><LevelChip level="U" /></>);
    expect(container.innerHTML).not.toMatch(/red|green/);
  });
});
