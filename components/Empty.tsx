import { StyleSheet, Text, View } from "react-native";
import { colors, common, spacing } from "@/constants/theme";

export function Empty({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={[common.card, styles.empty]}>
      <Text style={styles.title}>{title}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontWeight: "700",
  },
  detail: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
