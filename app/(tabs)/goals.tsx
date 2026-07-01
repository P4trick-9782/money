import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { Empty } from "@/components/Empty";
import { ICONS } from "@/constants/categories";
import { common, colors, spacing } from "@/constants/theme";
import { useAppDataContext } from "@/hooks/AppDataContext";
import { formatMoney } from "@/hooks/useAppData";

export default function GoalsScreen() {
  const { data, actions } = useAppDataContext();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  function confirmDelete(id: string, name: string) {
    Alert.alert("刪除目標", `確定刪除「${name}」？`, [
      { text: "取消", style: "cancel" },
      { text: "刪除", style: "destructive", onPress: () => actions.deleteGoal(id) },
    ]);
  }

  function toggleContribution(id: string) {
    setActiveId((current) => (current === id ? null : id));
    setAmount("");
  }

  function contribute(id: string, direction: 1 | -1) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert("金額錯誤", "請輸入大於 0 的金額。");
      return;
    }
    actions.contributeGoal(id, direction * value);
    setActiveId(null);
    setAmount("");
  }

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content}>
      <View>
        <Text style={common.title}>存款目標</Text>
        <Text style={common.subtitle}>共 {data.goals.length} 個目標</Text>
      </View>
      <Link href="/modals/goal-form" asChild>
        <Pressable style={common.button}><Text style={common.buttonText}>新增目標</Text></Pressable>
      </Link>
      {data.goals.length === 0 ? <Empty title="尚無存款目標" /> : null}
      {data.goals.map((goal) => {
        const progress = goal.target > 0 ? Math.min(1, goal.current / goal.target) : 0;
        const active = activeId === goal.id;
        return (
          <View key={goal.id} style={common.card}>
            <View style={styles.header}>
              <Text style={[common.h2, { flex: 1 }]}>
                {ICONS[goal.category] ?? "🎯"} {goal.name}{progress === 1 ? " ✓" : ""}
              </Text>
              <View style={styles.actions}>
                <Link href={`/modals/goal-form?id=${encodeURIComponent(goal.id)}`} asChild>
                  <Pressable><Text style={{ color: colors.primary }}>編輯</Text></Pressable>
                </Link>
                <Pressable onPress={() => confirmDelete(goal.id, goal.name)}>
                  <Text style={{ color: colors.danger }}>刪除</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.meta}>{formatMoney(goal.current)} / {formatMoney(goal.target)}</Text>
            <View style={styles.bar}><View style={[styles.fill, { width: `${progress * 100}%` }]} /></View>
            <Pressable onPress={() => toggleContribution(goal.id)} style={styles.toggle}>
              <Text style={{ color: colors.primary }}>{active ? "收起" : "存入或提領"}</Text>
            </Pressable>
            {active ? (
              <View style={styles.contribution}>
                <TextInput
                  style={[common.input, { flex: 1 }]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="金額"
                />
                <Pressable style={[styles.smallButton, { backgroundColor: colors.success }]} onPress={() => contribute(goal.id, 1)}>
                  <Text style={styles.smallButtonText}>存入</Text>
                </Pressable>
                <Pressable style={[styles.smallButton, { backgroundColor: colors.danger }]} onPress={() => contribute(goal.id, -1)}>
                  <Text style={styles.smallButtonText}>提領</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  actions: { flexDirection: "row", gap: spacing.md },
  meta: { color: colors.muted, marginTop: spacing.sm },
  bar: { height: 10, borderRadius: 8, backgroundColor: colors.surfaceAlt, marginTop: spacing.md, overflow: "hidden" },
  fill: { height: 10, borderRadius: 8, backgroundColor: colors.primary },
  toggle: { paddingVertical: spacing.md },
  contribution: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  smallButton: { minHeight: 48, minWidth: 56, alignItems: "center", justifyContent: "center", borderRadius: 8, paddingHorizontal: spacing.sm },
  smallButtonText: { color: "#FFFFFF", fontWeight: "700" },
});
