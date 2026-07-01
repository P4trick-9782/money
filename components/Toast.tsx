import { StyleSheet, Text } from "react-native";
import { colors } from "@/constants/theme";
import { ToastState } from "@/hooks/useToast";

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  const bg = toast.tone === "warn" ? colors.warning : toast.tone === "success" ? colors.success : colors.text;
  return <Text style={[styles.toast, { backgroundColor: bg }]}>{toast.message}</Text>;
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    minHeight: 44,
    borderRadius: 8,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "700",
  },
});
