import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ASSET_TYPES, BASE_CCY, CURRENCIES } from "@/constants/categories";
import { common, colors } from "@/constants/theme";
import { useAppDataContext } from "@/hooks/AppDataContext";

export default function AssetFormModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { data, actions } = useAppDataContext();
  const existing = id ? data.assets.find((asset) => asset.id === id) : undefined;
  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [type, setType] = useState(existing?.type ?? ASSET_TYPES[0].key);
  const [ccy, setCcy] = useState(existing?.ccy ?? BASE_CCY);

  function submit() {
    const value = Number(amount);
    if (!name.trim() || !Number.isFinite(value) || value < 0) {
      Alert.alert("資料不完整", "請填寫名稱與正確金額。");
      return;
    }
    const item = { name: name.trim(), amount: value, type, ccy };
    if (existing) actions.updateAsset(existing.id, item);
    else actions.addAsset(item);
    router.back();
  }

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content}>
      <Text style={common.title}>{existing ? "編輯資產" : "新增資產"}</Text>
      <TextInput style={common.input} value={name} onChangeText={setName} placeholder="資產名稱" />
      <TextInput style={common.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="金額" />
      <View style={common.card}>
        <Picker selectedValue={type} onValueChange={setType}>
          {ASSET_TYPES.map((item) => <Picker.Item key={item.key} label={`${item.icon} ${item.label}`} value={item.key} />)}
        </Picker>
      </View>
      <View style={common.card}>
        <Picker selectedValue={ccy} onValueChange={setCcy}>
          {CURRENCIES.map((item) => <Picker.Item key={item.code} label={`${item.name} ${item.sym}`} value={item.code} />)}
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
