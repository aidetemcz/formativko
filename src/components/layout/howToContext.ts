import { createContext, useContext } from "react";

/** Opens the "Jak na to" dialog; provided by HowToProvider in AppLayout. */
export const HowToContext = createContext<() => void>(() => {});

export function useOpenHowTo() {
  return useContext(HowToContext);
}
