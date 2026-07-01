import AsyncStorage from "@react-native-async-storage/async-storage";
import { decryptStr, encryptStr, hasCryptoKey } from "./crypto";

export async function getRaw(key: string) {
  return AsyncStorage.getItem(key);
}

export async function setRaw(key: string, value: string) {
  await AsyncStorage.setItem(key, value);
}

export async function removeRaw(key: string) {
  await AsyncStorage.removeItem(key);
}

export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    if (hasCryptoKey() && raw.startsWith("{\"iv\"")) {
      return JSON.parse(await decryptStr(raw)) as T;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function saveJson<T>(key: string, value: T) {
  if (!hasCryptoKey()) throw new Error(`saveJson: no crypto key; refusing write to "${key}"`);
  await AsyncStorage.setItem(key, await encryptStr(JSON.stringify(value)));
}
