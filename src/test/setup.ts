import "@testing-library/jest-dom";

// Server-side tests (api/) opt into the node environment, where there is no
// window to patch.
if (typeof window !== "undefined") {
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
}

// jsdom implements neither of these, so any component that previews a picked
// file — an image attached to a proof of learning, for one — throws on render.
if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = () => "blob:test";
  URL.revokeObjectURL = () => {};
}
