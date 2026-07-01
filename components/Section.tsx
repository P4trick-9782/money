import { PropsWithChildren, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/constants/theme";

export function Section({ title, action, children }: PropsWithChildren<{ title: string; action?: ReactNode }>) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  header: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
});
