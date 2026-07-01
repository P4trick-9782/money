import { StyleSheet } from "react-native";

export const colors = {
  bg: "#F7F8FA",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF1F5",
  text: "#16181D",
  muted: "#68707D",
  line: "#DDE2EA",
  primary: "#0A84FF",
  danger: "#FF3B30",
  success: "#34C759",
  warning: "#FF9500",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const common = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
  },
  h2: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  button: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
