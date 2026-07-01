import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { MonthNav } from "@/components/MonthNav";
import { Section } from "@/components/Section";
import { ICONS, TYPE_COLOR, TYPE_LABEL } from "@/constants/categories";
import { common, colors, spacing } from "@/constants/theme";
import { useAppDataContext } from "@/hooks/AppDataContext";
import { formatMoney, monthKey, sumTxns } from "@/hooks/useAppData";
import { TxType } from "@/types";

const MAIN_TYPES: TxType[] = ["expense", "income", "saving"];

export default function StatsScreen() {
  const { data } = useAppDataContext();
  const [month, setMonth] = useState(monthKey());
  const monthTxns = useMemo(() => data.txns.filter((txn) => txn.date.startsWith(month)), [data.txns, month]);
  const expenseTxns = useMemo(() => monthTxns.filter((txn) => txn.type === "expense"), [monthTxns]);
  const summaryMax = Math.max(...MAIN_TYPES.map((type) => sumTxns(monthTxns, type)), 1);
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    expenseTxns.forEach((txn) => {
      totals[txn.category] = (totals[txn.category] ?? 0) + txn.amount;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [expenseTxns]);
  const categoryMax = categoryTotals[0]?.[1] ?? 1;

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content}>
      <View>
        <Text style={common.title}>統計</Text>
        <Text style={common.subtitle}>月度收支概覽</Text>
      </View>
      <MonthNav month={month} setMonth={setMonth} />
      <Section title="分類總覽">
        <View style={common.card}>
          {MAIN_TYPES.map((type) => {
            const value = sumTxns(monthTxns, type);
            return (
              <View key={type} style={styles.row}>
                <Text style={styles.label}>{TYPE_LABEL[type]}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${(value / summaryMax) * 100}%`, backgroundColor: TYPE_COLOR[type].bg }]} />
                </View>
                <Text style={styles.value}>{formatMoney(value)}</Text>
              </View>
            );
          })}
        </View>
      </Section>
      {categoryTotals.length > 0 ? (
        <Section title="支出分類">
          <View style={common.card}>
            {categoryTotals.map(([category, value]) => (
              <View key={category} style={styles.row}>
                <Text style={styles.label}>{ICONS[category] ?? "📦"} {category}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${(value / categoryMax) * 100}%`, backgroundColor: colors.danger }]} />
                </View>
                <Text style={styles.value}>{formatMoney(value)}</Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}
      {Object.keys(data.budgets).length > 0 ? (
        <Section title="預算對比">
          <View style={common.card}>
            {Object.entries(data.budgets).map(([category, budget]) => {
              const spent = expenseTxns
                .filter((txn) => txn.category === category)
                .reduce((sum, txn) => sum + txn.amount, 0);
              const overBudget = budget > 0 && spent > budget;
              const progress = budget > 0 ? Math.min(1, spent / budget) : 0;
              return (
                <View key={category} style={styles.row}>
                  <Text style={styles.label}>{ICONS[category] ?? "📦"} {category}</Text>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: overBudget ? colors.danger : colors.success }]} />
                  </View>
                  <Text style={[styles.value, overBudget && { color: colors.danger }]}>
                    {formatMoney(spent)} / {formatMoney(budget)}
                  </Text>
                </View>
              );
            })}
          </View>
        </Section>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, marginBottom: spacing.lg },
  label: { color: colors.text, fontWeight: "700" },
  track: { height: 10, borderRadius: 8, backgroundColor: colors.surfaceAlt, overflow: "hidden" },
  fill: { height: 10, borderRadius: 8 },
  value: { color: colors.muted },
});
