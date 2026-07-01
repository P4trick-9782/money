import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LOCK } from "@/constants/categories";
import { exportVerifiedKeyBytes } from "@/services/crypto";

export async function bioSupported() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && enrolled;
}

export async function bioUnlock() {
  if (!(await bioSupported())) return false;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "解鎖我的記帳",
    cancelLabel: "改用 PIN",
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function bioStoreKey(key: string) {
  await SecureStore.setItemAsync(LOCK.biowrap, key, {
    requireAuthentication: true,
    authenticationPrompt: "確認身份以儲存生物辨識解鎖",
  });
}

export async function bioDeleteEnrollment() {
  await SecureStore.deleteItemAsync(LOCK.biowrap).catch(() => {});
  await AsyncStorage.removeItem(LOCK.bioenrolled);
}

export type BioRestoreResult =
  | { status: "success"; key: string }
  | { status: "cancelled" }
  | { status: "invalidated" }
  | { status: "error"; message?: string };

export async function bioRestoreKey(): Promise<BioRestoreResult> {
  try {
    const key = await SecureStore.getItemAsync(LOCK.biowrap, {
      requireAuthentication: true,
      authenticationPrompt: "使用生物辨識解鎖",
    });
    if (key !== null) return { status: "success", key };

    const enrolled = await AsyncStorage.getItem(LOCK.bioenrolled);
    if (enrolled === "1") {
      await bioDeleteEnrollment();
      return { status: "invalidated" };
    }
    return { status: "cancelled" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/cancel/i.test(message)) return { status: "cancelled" };
    if (/invalidat|permanently/i.test(message)) {
      await bioDeleteEnrollment();
      return { status: "invalidated" };
    }
    return { status: "error", message };
  }
}

export async function bioEnroll(pin: string) {
  const result = await exportVerifiedKeyBytes(pin);
  if (result.status === "invalidated") throw new Error("PIN 不正確");
  if (result.status === "error") throw new Error("無法驗證 PIN");
  await bioStoreKey(result.key);
  await AsyncStorage.setItem(LOCK.bioenrolled, "1");
}
