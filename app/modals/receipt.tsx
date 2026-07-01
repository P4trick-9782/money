import { useRef, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CameraCapturedPicture, CameraView, useCameraPermissions } from "expo-camera";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { DEFAULT_CATS } from "@/constants/categories";
import { colors, common, spacing } from "@/constants/theme";
import { useAppDataContext } from "@/hooks/AppDataContext";
import { today } from "@/hooks/useAppData";
import { isValidDate } from "./add-tx";

export default function ReceiptModal() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { actions } = useAppDataContext();
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const [taking, setTaking] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(DEFAULT_CATS.expense[0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());

  async function takePhoto() {
    if (!cameraRef.current || taking) return;
    setTaking(true);
    try {
      const nextPhoto = await cameraRef.current.takePictureAsync({ quality: 0.75, exif: false });
      if (nextPhoto) setPhoto(nextPhoto);
    } catch (error) {
      Alert.alert("拍照失敗", error instanceof Error ? error.message : "請稍後再試。");
    } finally {
      setTaking(false);
    }
  }

  function saveExpense() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert("金額錯誤", "請輸入大於 0 的金額。");
      return;
    }
    if (!isValidDate(date)) {
      Alert.alert("日期錯誤", "請輸入有效日期，例如 2026-01-15。");
      return;
    }

    actions.addTxn({
      type: "expense",
      amount: value,
      category,
      note: note.trim() || "收據",
      date,
      ccy: "TWD",
    });
    Alert.alert("已新增支出", "收據資料已存入記帳紀錄。", [{ text: "完成", onPress: () => router.back() }]);
  }

  if (!permission) {
    return (
      <ScrollView style={common.screen} contentContainerStyle={common.content}>
        <Text style={common.title}>掃描收據</Text>
        <Text style={common.subtitle}>正在確認相機權限。</Text>
      </ScrollView>
    );
  }

  if (!permission.granted) {
    return (
      <ScrollView style={common.screen} contentContainerStyle={common.content}>
        <Text style={common.title}>掃描收據</Text>
        <Text style={common.subtitle}>需要相機權限才能拍攝收據。</Text>
        <Pressable style={common.button} onPress={requestPermission}>
          <Text style={common.buttonText}>允許相機權限</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={common.title}>掃描收據</Text>
        <Text style={common.subtitle}>拍下收據後，先手動確認金額與類別。</Text>
      </View>

      {photo ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: photo.uri }} style={styles.preview} resizeMode="cover" />
          <Pressable style={[common.button, styles.secondaryButton]} onPress={() => setPhoto(null)}>
            <Text style={[common.buttonText, styles.secondaryButtonText]}>重新拍攝</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.cameraWrap}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          <Pressable style={[common.button, styles.shutter]} onPress={takePhoto} disabled={taking}>
            <Text style={common.buttonText}>{taking ? "拍攝中" : "拍攝收據"}</Text>
          </Pressable>
        </View>
      )}

      {photo ? (
        <View style={common.card}>
          <Text style={common.h2}>建立支出</Text>
          <TextInput style={common.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="金額" />
          <View style={styles.pickerWrap}>
            <Picker selectedValue={category} onValueChange={setCategory}>
              {DEFAULT_CATS.expense.map((item) => <Picker.Item key={item} label={item} value={item} />)}
            </Picker>
          </View>
          <TextInput style={common.input} value={note} onChangeText={setNote} placeholder="備註，例如店名" />
          <TextInput style={common.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          <Pressable style={common.button} onPress={saveExpense}>
            <Text style={common.buttonText}>新增到記帳</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cameraWrap: {
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: colors.text,
  },
  camera: {
    aspectRatio: 3 / 4,
    width: "100%",
  },
  shutter: {
    margin: spacing.md,
  },
  previewWrap: {
    gap: spacing.sm,
  },
  preview: {
    aspectRatio: 3 / 4,
    width: "100%",
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceAlt,
  },
  secondaryButtonText: {
    color: colors.text,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.surface,
    marginVertical: spacing.sm,
  },
});
