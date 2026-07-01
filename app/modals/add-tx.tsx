import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CURRENCIES, DEFAULT_CATS, TYPE_COLOR, TYPE_LABEL } from "@/constants/categories";
import { common, colors, spacing } from "@/constants/theme";
import { useAppDataContext } from "@/hooks/AppDataContext";
import { today } from "@/hooks/useAppData";
import { TxType } from "@/types";

const txTypes: TxType[] = ["expense", "income", "saving"];

export function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return year >= 1000
    && date.getFullYear() === year
    && date.getMonth() + 1 === month
    && date.getDate() === day;
}

export default function AddTxModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { data, actions } = useAppDataContext();
  const existing = id ? data.txns.find((txn) => txn.id === id) : undefined;
  const [type, setType] = useState<TxType>(existing?.type ?? "expense");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [category, setCategory] = useState<string>(existing?.category ?? DEFAULT_CATS.expense[0]);
  const [note, setNote] = useState(existing?.note ?? "");
  const [date, setDate] = useState(existing?.date ?? today());
  const [ccy, setCcy] = useState(existing?.ccy ?? "TWD");

  function changeType(next: TxType) {
    setType(next);
    setCategory(DEFAULT_CATS[next][0]);
  }

  function submit() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert("金額錯誤", "請輸入大於 0 的金額。");
      return;
    }
    if (!isValidDate(date)) {
      Alert.alert("日期錯誤", "請輸入有效日期，例如 2026-01-15。");
      return;
    }
    if (!category) {
      Alert.alert("請選擇類別");
      return;
    }

    const item = { type, amount: value, category, note: note.trim(), date, ccy };
    if (existing) actions.updateTxn(existing.id, item);
    else actions.addTxn(item);
    router.back();
  }

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content} keyboardShouldPersistTaps="handled">
      <Text style={common.title}>{existing ? "編輯記帳" : "新增記帳"}</Text>
      <View style={styles.segment}>
        {txTypes.map((item) => (
          <Pressable key={item} style={[styles.segmentBtn, type === item && { backgroundColor: TYPE_COLOR[item].bg }]} onPress={() => changeType(item)}>
            <Text style={[styles.segmentText, type === item && styles.segmentTextActive]}>{TYPE_LABEL[item]}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput style={common.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="金額" />
      <View style={styles.pickerWrap}>
        <Picker selectedValue={category} onValueChange={setCategory}>
          {DEFAULT_CATS[type].map((cat) => <Picker.Item key={cat} label={cat} value={cat} />)}
        </Picker>
      </View>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={ccy} onValueChange={setCcy}>
          {CURRENCIES.map((currency) => (
            <Picker.Item key={currency.code} label={`${currency.sym} ${currency.name}`} value={currency.code} />
          ))}
        </Picker>
      </View>
      <TextInput style={common.input} value={note} onChangeText={setNote} placeholder="備註" />
      <TextInput style={common.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
      <Pressable style={common.button} onPress={submit}>
        <Text style={common.buttonText}>{existing ? "儲存修改" : "新增"}</Text>
      </Pressable>
      <Pressable style={[common.button, styles.cancel]} onPress={() => router.back()}>
        <Text style={[common.buttonText, { color: colors.text }]}>取消</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: "row", gap: spacing.sm },
  segmentBtn: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  segmentText: { color: colors.muted, fontWeight: "700" },
  segmentTextActive: { color: "#FFFFFF" },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  cancel: { backgroundColor: colors.surfaceAlt },
});
