import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Empty } from "@/components/Empty";
import { MonthNav } from "@/components/MonthNav";
import { TxRow } from "@/components/TxRow";
import { TYPE_LABEL } from "@/constants/categories";
import { common, colors, spacing } from "@/constants/theme";
import { monthKey } from "@/hooks/useAppData";
import { useAppDataContext } from "@/hooks/AppDataContext";
import { TxType } from "@/types";

const filters: Array<"all" | TxType> = ["all", "expense", "income", "saving"];

export default function TxnsScreen() {
  const router = useRouter();
  const { data, actions } = useAppDataContext();
  const [month, setMonth] = useState(monthKey());
  const [filter, setFilter] = useState<"all" | TxType>("all");
  const list = data.txns.filter((t) => t.date.startsWith(month) && (filter === "all" || t.type === filter));

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content}>
      <View style={styles.header}>
        <View>
          <Text style={common.title}>記帳明細</Text>
          <Text style={common.subtitle}>{list.length} 筆紀錄</Text>
        </View>
        <Link href="/modals/add-tx" asChild>
          <Pressable style={styles.addBtn}><Text style={styles.addText}>＋</Text></Pressable>
        </Link>
      </View>
      <MonthNav month={month} setMonth={setMonth} />
      <View style={styles.filters}>
        {filters.map((f) => (
          <Pressable key={f} style={[styles.filter, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f === "all" ? "全部" : TYPE_LABEL[f]}</Text>
          </Pressable>
        ))}
      </View>
      <View style={common.card}>
        {list.map((tx) => (
          <TxRow
            key={tx.id}
            tx={tx}
            onDelete={actions.deleteTxn}
            onEdit={(id) => router.push(`/modals/add-tx?id=${encodeURIComponent(id)}`)}
          />
        ))}
        {list.length === 0 ? <Empty title="沒有符合條件的紀錄" /> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: {
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "700",
  },
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filter: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.muted,
    fontWeight: "700",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
});
