import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// jsdom implements neither of these, so any component that previews a picked
// file — an image attached to a proof of learning, for one — throws on render.
if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = () => "blob:test";
  URL.revokeObjectURL = () => {};
}
