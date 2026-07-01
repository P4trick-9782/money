import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { KEYS, LOCK } from "@/constants/categories";
import { colors, common, spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/AuthContext";
import { lockApp } from "@/services/crypto";

const lockKeys = [LOCK.salt, LOCK.verifier, LOCK.fails, LOCK.until, LOCK.bioenrolled];

export default function DevResetScreen() {
  if (!__DEV__) return null;

  const router = useRouter();
  const { refreshPinState } = useAuth();

  async function resetAuthState() {
    await AsyncStorage.multiRemove(lockKeys);
    await SecureStore.deleteItemAsync(LOCK.biowrap).catch(() => {});
    lockApp();
    await refreshPinState();
    router.replace("/(auth)/unlock");
  }

  function resetAll() {
    Alert.alert("確認清除", "會清除所有資料與 PIN，無法復原。", [
      { text: "取消", style: "cancel" },
      {
        text: "清除",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([...lockKeys, ...Object.values(KEYS)]);
          await SecureStore.deleteItemAsync(LOCK.biowrap).catch(() => {});
          lockApp();
          await refreshPinState();
          router.replace("/(auth)/unlock");
        },
      },
    ]);
  }

  async function resetPinOnly() {
    await resetAuthState();
  }

  async function showStorage() {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    console.log("[Dev] AsyncStorage:", JSON.stringify(pairs, null, 2));
    Alert.alert("Storage Keys", keys.length ? keys.join("\n") : "No keys");
  }

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content}>
      <Text style={common.title}>Dev Reset</Text>
      <Text style={common.subtitle}>測試用工具，只會在開發模式顯示。</Text>

      <Pressable style={[common.button, styles.dangerButton]} onPress={resetAll}>
        <Text style={common.buttonText}>清除所有資料 + PIN</Text>
      </Pressable>

      <Pressable style={[common.button, styles.warningButton]} onPress={resetPinOnly}>
        <Text style={common.buttonText}>只清除 PIN（保留資料）</Text>
      </Pressable>

      <Pressable style={common.button} onPress={showStorage}>
        <Text style={common.buttonText}>Log AsyncStorage 內容</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dangerButton: { backgroundColor: colors.danger },
  warningButton: { backgroundColor: colors.warning, marginTop: spacing.sm },
});
