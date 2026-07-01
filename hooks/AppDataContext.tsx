import { createContext, PropsWithChildren, useContext } from "react";
import { useAppData } from "./useAppData";

type AppDataContextValue = ReturnType<typeof useAppData>;

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children, enabled = true }: PropsWithChildren<{ enabled?: boolean }>) {
  const value = useAppData(enabled);
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppDataContext() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppDataContext must be used inside AppDataProvider");
  return ctx;
}
