import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { LegacyRedirect } from "./LegacyRedirect";

function Where() {
  const location = useLocation();
  return <p>{`${location.pathname}${location.search}|${JSON.stringify(location.state)}`}</p>;
}

describe("LegacyRedirect", () => {
  it("keeps params, query and navigation state", () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/evaluations/edit/abc", search: "?x=1", state: { a: 1 } }]}>
        <Routes>
          <Route path="/evaluations/edit/:id" element={<LegacyRedirect to="/hodnoceni/:id" />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('/hodnoceni/abc?x=1|{"a":1}')).toBeInTheDocument();
  });
});
