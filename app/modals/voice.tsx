import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Audio } from "expo-av";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { DEFAULT_CATS } from "@/constants/categories";
import { colors, common, spacing } from "@/constants/theme";
import { useAppDataContext } from "@/hooks/AppDataContext";
import { today } from "@/hooks/useAppData";
import { isValidDate } from "./add-tx";

function formatDuration(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function VoiceModal() {
  const router = useRouter();
  const { actions } = useAppDataContext();
  const [permission, requestPermission] = Audio.usePermissions();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(DEFAULT_CATS.expense[0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());

  async function startRecording() {
    try {
      if (!permission?.granted) {
        const nextPermission = await requestPermission();
        if (!nextPermission.granted) return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const created = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.isRecording) setDuration(status.durationMillis);
        },
        250,
      );
      setRecording(created.recording);
      setRecordingUri(null);
      setDuration(0);
    } catch (error) {
      Alert.alert("錄音失敗", error instanceof Error ? error.message : "請稍後再試。");
    }
  }

  async function stopRecording() {
    if (!recording) return;
    try {
      const status = await recording.getStatusAsync();
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      setDuration(status.durationMillis ?? duration);
      setRecordingUri(recording.getURI());
      setRecording(null);
    } catch (error) {
      Alert.alert("停止錄音失敗", error instanceof Error ? error.message : "請稍後再試。");
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
      note: note.trim() || "語音輸入",
      date,
      ccy: "TWD",
    });
    Alert.alert("已新增支出", "語音輸入已存入記帳紀錄。", [{ text: "完成", onPress: () => router.back() }]);
  }

  if (!permission) {
    return (
      <ScrollView style={common.screen} contentContainerStyle={common.content}>
        <Text style={common.title}>語音輸入</Text>
        <Text style={common.subtitle}>正在確認麥克風權限。</Text>
      </ScrollView>
    );
  }

  if (!permission.granted) {
    return (
      <ScrollView style={common.screen} contentContainerStyle={common.content}>
        <Text style={common.title}>語音輸入</Text>
        <Text style={common.subtitle}>需要麥克風權限才能記錄語音。</Text>
        <Pressable style={common.button} onPress={requestPermission}>
          <Text style={common.buttonText}>允許麥克風權限</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={common.title}>語音輸入</Text>
        <Text style={common.subtitle}>先錄下備註，再手動確認金額與類別。</Text>
      </View>

      <View style={common.card}>
        <Text style={styles.timer}>{formatDuration(duration)}</Text>
        {recording ? (
          <Pressable style={[common.button, styles.stopButton]} onPress={stopRecording}>
            <Text style={common.buttonText}>停止錄音</Text>
          </Pressable>
        ) : (
          <Pressable style={common.button} onPress={startRecording}>
            <Text style={common.buttonText}>{recordingUri ? "重新錄音" : "開始錄音"}</Text>
          </Pressable>
        )}
        {recordingUri ? <Text style={styles.uriText}>錄音已暫存：{recordingUri.split("/").pop()}</Text> : null}
      </View>

      {recordingUri ? (
        <View style={common.card}>
          <Text style={common.h2}>建立支出</Text>
          <TextInput style={common.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="金額" />
          <View style={styles.pickerWrap}>
            <Picker selectedValue={category} onValueChange={setCategory}>
              {DEFAULT_CATS.expense.map((item) => <Picker.Item key={item} label={item} value={item} />)}
            </Picker>
          </View>
          <TextInput style={common.input} value={note} onChangeText={setNote} placeholder="備註，例如語音內容摘要" />
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
  timer: {
    color: colors.text,
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: spacing.md,
  },
  stopButton: {
    backgroundColor: colors.danger,
  },
  uriText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.sm,
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
