import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { Empty } from "@/components/Empty";
import { MonthNav } from "@/components/MonthNav";
import { Section } from "@/components/Section";
import { TxRow } from "@/components/TxRow";
import { common, colors, spacing } from "@/constants/theme";
import { formatMoney, monthKey, sumTxns } from "@/hooks/useAppData";
import { useAppDataContext } from "@/hooks/AppDataContext";
import { useState } from "react";

export default function HomeScreen() {
  const { data, actions } = useAppDataContext();
  const [month, setMonth] = useState(monthKey());
  const mTx = data.txns.filter((t) => t.date.startsWith(month));
  const income = sumTxns(mTx, "income");
  const expense = sumTxns(mTx, "expense");
  const saving = sumTxns(mTx, "saving");
  const balance = income - expense - saving;

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content}>
      <View>
        <Text style={common.title}>我的記帳</Text>
        <Text style={common.subtitle}>本月收支、快速記帳與近期紀錄</Text>
      </View>
      <MonthNav month={month} setMonth={setMonth} />
      <View style={styles.summary}>
        <View style={[common.card, styles.metric]}>
          <Text style={common.subtitle}>本月結餘</Text>
          <Text style={[styles.money, { color: balance >= 0 ? colors.success : colors.danger }]}>{formatMoney(balance)}</Text>
        </View>
        <View style={[common.card, styles.metric]}>
          <Text style={common.subtitle}>支出</Text>
          <Text style={styles.money}>{formatMoney(expense)}</Text>
        </View>
        <View style={[common.card, styles.metric]}>
          <Text style={common.subtitle}>收入</Text>
          <Text style={styles.money}>{formatMoney(income)}</Text>
        </View>
      </View>
      <View style={styles.quickActions}>
        <Link href="/modals/add-tx" asChild>
          <Pressable style={[common.button, styles.quickButton]}>
            <Text style={common.buttonText}>新增記帳</Text>
          </Pressable>
        </Link>
        <Link href="/modals/receipt" asChild>
          <Pressable style={[common.button, styles.quickButton, styles.secondaryQuickButton]}>
            <Text style={[common.buttonText, styles.secondaryQuickButtonText]}>掃描收據</Text>
          </Pressable>
        </Link>
        <Link href="/modals/voice" asChild>
          <Pressable style={[common.button, styles.quickButton, styles.secondaryQuickButton]}>
            <Text style={[common.buttonText, styles.secondaryQuickButtonText]}>語音輸入</Text>
          </Pressable>
        </Link>
      </View>
      <Section title="近期紀錄">
        <View style={common.card}>
          {mTx.slice(0, 5).map((tx) => (
            <TxRow key={tx.id} tx={tx} onDelete={actions.deleteTxn} />
          ))}
          {mTx.length === 0 ? <Empty title="這個月還沒有資料" detail="新增一筆記帳後會出現在這裡。" /> : null}
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    minHeight: 96,
    justifyContent: "center",
    gap: spacing.xs,
  },
  money: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickButton: {
    flexGrow: 1,
    flexBasis: 104,
  },
  secondaryQuickButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  secondaryQuickButtonText: {
    color: colors.text,
  },
});
