import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@/constants/theme";

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const next = new Date(y, m - 1 + delta, 1);
  return next.toISOString().slice(0, 7);
}

export function MonthNav({ month, setMonth }: { month: string; setMonth: (month: string) => void }) {
  return (
    <View style={styles.wrap}>
      <Pressable accessibilityLabel="上一個月" style={styles.iconBtn} onPress={() => setMonth(shiftMonth(month, -1))}>
        <Ionicons name="chevron-back" size={20} color={colors.text} />
      </Pressable>
      <Text style={styles.month}>{month}</Text>
      <Pressable accessibilityLabel="下一個月" style={styles.iconBtn} onPress={() => setMonth(shiftMonth(month, 1))}>
        <Ionicons name="chevron-forward" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  month: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0,
  },
});
