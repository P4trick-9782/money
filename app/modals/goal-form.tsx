import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { GOAL_CATS } from "@/constants/categories";
import { common, colors } from "@/constants/theme";
import { useAppDataContext } from "@/hooks/AppDataContext";

export default function GoalFormModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { data, actions } = useAppDataContext();
  const existing = id ? data.goals.find((goal) => goal.id === id) : undefined;
  const [name, setName] = useState(existing?.name ?? "");
  const [target, setTarget] = useState(existing ? String(existing.target) : "");
  const [category, setCategory] = useState<string>(existing?.category ?? GOAL_CATS[0]);

  function submit() {
    const value = Number(target);
    if (!name.trim() || !Number.isFinite(value) || value <= 0) {
      Alert.alert("資料不完整", "請填寫名稱與大於 0 的目標金額。");
      return;
    }
    const item = { name: name.trim(), target: value, category };
    if (existing) actions.updateGoal(existing.id, item);
    else actions.addGoal(item);
    router.back();
  }

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content}>
      <Text style={common.title}>{existing ? "編輯存款目標" : "新增存款目標"}</Text>
      <TextInput style={common.input} value={name} onChangeText={setName} placeholder="目標名稱" />
      <TextInput style={common.input} value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="目標金額" />
      <View style={common.card}>
        <Picker selectedValue={category} onValueChange={setCategory}>
          {GOAL_CATS.map((cat) => <Picker.Item key={cat} label={cat} value={cat} />)}
        </Picker>
      </View>
      <Pressable style={common.button} onPress={submit}>
        <Text style={common.buttonText}>{existing ? "儲存修改" : "新增"}</Text>
      </Pressable>
      <Pressable style={[common.button, { backgroundColor: colors.surfaceAlt }]} onPress={() => router.back()}>
        <Text style={[common.buttonText, { color: colors.text }]}>取消</Text>
      </Pressable>
    </ScrollView>
  );
}
