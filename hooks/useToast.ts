import { useCallback, useState } from "react";

export type ToastState = { message: string; tone?: "info" | "warn" | "success" } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback((message: string, tone: "info" | "warn" | "success" = "info") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 2200);
  }, []);

  return { toast, showToast, clearToast: () => setToast(null) };
}
