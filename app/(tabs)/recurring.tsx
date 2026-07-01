import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { Empty } from "@/components/Empty";
import { Section } from "@/components/Section";
import { FREQ_LABEL, ICONS } from "@/constants/categories";
import { common, colors, spacing } from "@/constants/theme";
import { useAppDataContext } from "@/hooks/AppDataContext";
import { formatMoney } from "@/hooks/useAppData";

export default function RecurringScreen() {
  const { data, actions } = useAppDataContext();

  function confirmDelete(id: string, name: string) {
    Alert.alert("刪除固定扣款", `確定刪除「${name}」？`, [
      { text: "取消", style: "cancel" },
      { text: "刪除", style: "destructive", onPress: () => actions.deleteRecurring(id) },
    ]);
  }

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content}>
      <View>
        <Text style={common.title}>固定扣款</Text>
        <Text style={common.subtitle}>訂閱、貸款、保險與固定帳單</Text>
      </View>
      <Link href="/modals/recurring-form" asChild>
        <Pressable style={common.button}><Text style={common.buttonText}>新增固定扣款</Text></Pressable>
      </Link>
      <Section title="項目">
        {data.recurring.length === 0 ? <Empty title="尚無固定扣款" /> : null}
        {data.recurring.map((item) => (
          <View key={item.id} style={[common.card, { marginBottom: spacing.sm }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
              <Text style={[common.h2, { flex: 1 }]}>{ICONS[item.category] ?? "🔁"} {item.name}</Text>
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <Link href={`/modals/recurring-form?id=${encodeURIComponent(item.id)}`} asChild>
                  <Pressable><Text style={{ color: colors.primary }}>編輯</Text></Pressable>
                </Link>
                <Pressable onPress={() => confirmDelete(item.id, item.name)}>
                  <Text style={{ color: colors.danger }}>刪除</Text>
                </Pressable>
              </View>
            </View>
            <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
              {FREQ_LABEL[item.freq]} · 每月 {item.day} 日 · {item.category}
            </Text>
            <Text style={{ color: colors.text, fontWeight: "800", marginTop: spacing.sm }}>
              {formatMoney(item.amount)}
            </Text>
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}
