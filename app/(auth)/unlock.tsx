import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { common, colors, spacing } from "@/constants/theme";
import { LOCK, MAX_FAILS, PIN_LEN } from "@/constants/categories";
import { cryptoAvailable, failCount, lockoutRemaining, setupPIN, unlockPIN } from "@/services/crypto";
import { bioSupported } from "@/services/biometric";
import { unlockWithBiometric } from "@/services/bioAuth";
import { useAuth } from "@/hooks/AuthContext";

export default function UnlockScreen() {
  const router = useRouter();
  const { pinExists, markUnlocked, refreshPinState } = useAuth();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isSetup = !pinExists;

  useEffect(() => {
    failCount().then(setErr);
    lockoutRemaining().then(setRemaining);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function checkBiometric() {
      if (!pinExists || !(await bioSupported())) return;
      const enrolled = await AsyncStorage.getItem(LOCK.bioenrolled);
      if (mounted) setBioAvailable(enrolled === "1");
    }
    checkBiometric();
    return () => { mounted = false; };
  }, [pinExists]);

  async function handleBioUnlock() {
    setBusy(true);
    try {
      const result = await unlockWithBiometric();
      if (result.status === "success") {
        markUnlocked();
        router.replace("/(tabs)");
      } else if (result.status === "cancelled") {
        Alert.alert("生物辨識已取消", "請使用 PIN 解鎖。");
      } else {
        setBioAvailable(false);
        Alert.alert(
          "無法使用生物辨識",
          result.status === "invalidated"
            ? "生物辨識金鑰已失效，請用 PIN 解鎖後重新啟用。"
            : "發生技術錯誤，請使用 PIN 解鎖。",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setMessage(null);
    if (pin.length !== PIN_LEN) {
      setMessage(`請輸入 ${PIN_LEN} 位數 PIN。`);
      return;
    }
    if (isSetup && confirm.length !== PIN_LEN) {
      setMessage(`請再次輸入 ${PIN_LEN} 位數 PIN。`);
      return;
    }
    if (isSetup && pin !== confirm) {
      setMessage("兩次輸入的 PIN 不一致。");
      return;
    }

    setBusy(true);
    try {
      if (isSetup) {
        await setupPIN(pin);
        await refreshPinState();
        markUnlocked();
        router.replace("/(tabs)");
        return;
      }
      const ok = await unlockPIN(pin);
      if (ok) {
        markUnlocked();
        router.replace("/(tabs)");
      } else {
        setPin("");
        setErr(await failCount());
        setRemaining(await lockoutRemaining());
      }
    } catch (error) {
      console.error(isSetup ? "PIN setup failed" : "PIN unlock failed", error);
      setMessage(isSetup ? "無法建立 PIN，請稍後再試。" : "無法解鎖，請稍後再試。");
    } finally {
      setBusy(false);
    }
  }

  const locked = remaining > 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <View style={styles.panel}>
        <Text style={common.title}>{isSetup ? "設定 6 位數 PIN" : "解鎖我的記帳"}</Text>
        <Text style={common.subtitle}>
          {cryptoAvailable() ? "本機資料會沿用 PBKDF2 + AES-GCM 加密。" : "目前環境缺少 Web Crypto polyfill，請使用 native build。"}
        </Text>
        <TextInput
          value={pin}
          onChangeText={(value) => setPin(value.replace(/\D/g, "").slice(0, PIN_LEN))}
          keyboardType="number-pad"
          secureTextEntry
          placeholder="PIN"
          style={common.input}
          editable={!locked && !busy}
        />
        {isSetup ? (
          <TextInput
            value={confirm}
            onChangeText={(value) => setConfirm(value.replace(/\D/g, "").slice(0, PIN_LEN))}
            keyboardType="number-pad"
            secureTextEntry
            placeholder="再次輸入 PIN"
            style={common.input}
            editable={!busy}
          />
        ) : null}
        {err > 0 ? <Text style={styles.error}>密碼錯誤（{err}/{MAX_FAILS} 次）</Text> : null}
        {locked ? <Text style={styles.error}>請等待 {Math.ceil(remaining / 1000)} 秒後再試</Text> : null}
        {message ? <Text style={styles.error}>{message}</Text> : null}
        <Pressable style={[common.button, (busy || locked) && styles.disabled]} onPress={submit} disabled={busy || locked}>
          <Text style={common.buttonText}>{isSetup ? "建立並進入" : "解鎖"}</Text>
        </Pressable>
        {!isSetup && bioAvailable ? (
          <Pressable
            style={[common.button, styles.bioButton, (busy || locked) && styles.disabled]}
            onPress={handleBioUnlock}
            disabled={busy || locked}
          >
            <Text style={common.buttonText}>使用生物辨識解鎖</Text>
          </Pressable>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  panel: {
    gap: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.5,
  },
  bioButton: {
    backgroundColor: colors.muted,
  },
});
