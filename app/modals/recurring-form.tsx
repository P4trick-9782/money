import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DEFAULT_CATS, FREQ_LABEL } from "@/constants/categories";
import { common, colors } from "@/constants/theme";
import { useAppDataContext } from "@/hooks/AppDataContext";
import { Recurring } from "@/types";

const FREQUENCIES = Object.keys(FREQ_LABEL) as Recurring["freq"][];

export default function RecurringFormModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { data, actions } = useAppDataContext();
  const existing = id ? data.recurring.find((item) => item.id === id) : undefined;
  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [category, setCategory] = useState<string>(existing?.category ?? DEFAULT_CATS.recurring[0]);
  const [freq, setFreq] = useState<Recurring["freq"]>(existing?.freq ?? "monthly");
  const [day, setDay] = useState(existing ? String(existing.day) : "1");

  function submit() {
    const value = Number(amount);
    const billingDay = Number(day);
    if (!name.trim() || !Number.isFinite(value) || value <= 0) {
      Alert.alert("資料不完整", "請填寫名稱與正確金額。");
      return;
    }
    if (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 31) {
      Alert.alert("日期錯誤", "扣款日必須介於 1 到 31。");
      return;
    }
    const item = { name: name.trim(), amount: value, category, freq, day: billingDay };
    if (existing) actions.updateRecurring(existing.id, item);
    else actions.addRecurring(item);
    router.back();
  }

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content}>
      <Text style={common.title}>{existing ? "編輯固定扣款" : "新增固定扣款"}</Text>
      <TextInput style={common.input} value={name} onChangeText={setName} placeholder="名稱" />
      <TextInput style={common.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="金額" />
      <View style={common.card}>
        <Picker selectedValue={category} onValueChange={setCategory}>
          {DEFAULT_CATS.recurring.map((cat) => <Picker.Item key={cat} label={cat} value={cat} />)}
        </Picker>
      </View>
      <View style={common.card}>
        <Picker selectedValue={freq} onValueChange={(value) => setFreq(value as Recurring["freq"])}>
          {FREQUENCIES.map((key) => <Picker.Item key={key} label={FREQ_LABEL[key]} value={key} />)}
        </Picker>
      </View>
      <TextInput style={common.input} value={day} onChangeText={setDay} keyboardType="number-pad" placeholder="扣款日" maxLength={2} />
      <Pressable style={common.button} onPress={submit}>
        <Text style={common.buttonText}>{existing ? "儲存修改" : "新增"}</Text>
      </Pressable>
      <Pressable style={[common.button, { backgroundColor: colors.surfaceAlt }]} onPress={() => router.back()}>
        <Text style={[common.buttonText, { color: colors.text }]}>取消</Text>
      </Pressable>
    </ScrollView>
  );
}
