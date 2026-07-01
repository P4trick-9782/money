import { StyleSheet, Text, View } from "react-native";
import { colors, common, spacing } from "@/constants/theme";

export function PendingRow({ text }: { text: string }) {
  return (
    <View style={[common.card, styles.row]}>
      <Text style={styles.dot}>!</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.warning,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "800",
    lineHeight: 24,
  },
  text: {
    flex: 1,
    color: colors.text,
  },
});
