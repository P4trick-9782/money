import { LOCK, LOCKOUT_MS, MAX_FAILS } from "@/constants/categories";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

type CryptoKeyLike = CryptoKey;

const subtle = globalThis.crypto?.subtle;
let cryptoKey: CryptoKeyLike | null = null;

const enc = new TextEncoder();
const dec = new TextDecoder();

function getCrypto() {
  if (!globalThis.crypto?.subtle) {
    throw new Error("目前環境缺少 Web Crypto。請在 native build 中安裝 react-native-quick-crypto polyfill。");
  }
  return globalThis.crypto;
}

export function hasCryptoKey() {
  return !!cryptoKey;
}

export function lockApp() {
  cryptoKey = null;
}

export async function importKeyBytes(bytes: Uint8Array) {
  cryptoKey = await getCrypto().subtle.importKey(
    "raw",
    bytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export type ExportKeyResult =
  | { status: "success"; key: string }
  | { status: "invalidated" }
  | { status: "error" };

export async function exportVerifiedKeyBytes(pin: string): Promise<ExportKeyResult> {
  try {
    const saltRaw = await AsyncStorage.getItem(LOCK.salt);
    const verifier = await AsyncStorage.getItem(LOCK.verifier);
    if (!saltRaw || !verifier) return { status: "error" };

    const candidate = await deriveKey(pin, unb64(saltRaw), true);
    try {
      if ((await decWith(candidate, verifier)) !== "FIN_OK") return { status: "invalidated" };
    } catch {
      return { status: "invalidated" };
    }

    const raw = await getCrypto().subtle.exportKey("raw", candidate);
    return { status: "success", key: b64(new Uint8Array(raw)) };
  } catch {
    return { status: "error" };
  }
}

export function b64(buf: ArrayBuffer | Uint8Array) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return globalThis.btoa(binary);
}

export function unb64(str: string) {
  const binary = globalThis.atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function deriveKey(pin: string, salt: Uint8Array, exportable = false) {
  const crypto = getCrypto();
  const base = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveBits"]);
  const rawKey = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" },
    base,
    256,
  );
  return crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM", length: 256 },
    exportable,
    ["encrypt", "decrypt"],
  );
}

async function encWith(key: CryptoKeyLike, plain: string) {
  const crypto = getCrypto();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plain));
  return JSON.stringify({ iv: b64(iv), ct: b64(ct) });
}

async function decWith(key: CryptoKeyLike, payload: string) {
  const { iv, ct } = JSON.parse(payload);
  const pt = await getCrypto().subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, key, unb64(ct));
  return dec.decode(pt);
}

export async function encryptStr(plain: string) {
  if (!cryptoKey) throw new Error("尚未解鎖");
  return encWith(cryptoKey, plain);
}

export async function decryptStr(payload: string) {
  if (!cryptoKey) throw new Error("尚未解鎖");
  return decWith(cryptoKey, payload);
}

export async function hasPIN() {
  return !!(await AsyncStorage.getItem(LOCK.verifier));
}

export async function setupPIN(pin: string) {
  const salt = getCrypto().getRandomValues(new Uint8Array(16));
  cryptoKey = await deriveKey(pin, salt);
  const verifier = await encryptStr("FIN_OK");
  await AsyncStorage.setItem(LOCK.salt, b64(salt));
  await AsyncStorage.setItem(LOCK.verifier, verifier);
  await clearFails();
}

export async function rotatePIN(pin: string, values: Record<string, unknown>) {
  const salt = getCrypto().getRandomValues(new Uint8Array(16));
  const nextKey = await deriveKey(pin, salt);
  const verifier = await encWith(nextKey, "FIN_OK");
  const encryptedValues = await Promise.all(
    Object.entries(values).map(async ([key, value]) => [key, await encWith(nextKey, JSON.stringify(value))] as [string, string]),
  );

  await AsyncStorage.multiSet([
    [LOCK.salt, b64(salt)],
    [LOCK.verifier, verifier],
    ...encryptedValues,
  ]);
  cryptoKey = nextKey;
  await clearFails();
  await SecureStore.deleteItemAsync(LOCK.biowrap).catch(() => {});
  await AsyncStorage.removeItem(LOCK.bioenrolled);
}

export async function unlockPIN(pin: string) {
  if ((await lockoutRemaining()) > 0) return false;
  const saltRaw = await AsyncStorage.getItem(LOCK.salt);
  const verifier = await AsyncStorage.getItem(LOCK.verifier);
  if (!saltRaw || !verifier) return false;
  cryptoKey = await deriveKey(pin, unb64(saltRaw));
  try {
    const value = await decryptStr(verifier);
    if (value !== "FIN_OK") throw new Error("Verifier mismatch");
    await clearFails();
    return true;
  } catch {
    cryptoKey = null;
    await registerFail();
    return false;
  }
}

export async function registerFail() {
  const n = Number(await AsyncStorage.getItem(LOCK.fails)) + 1 || 1;
  await AsyncStorage.setItem(LOCK.fails, String(n));
  if (n >= MAX_FAILS) {
    const extra = n - MAX_FAILS;
    await AsyncStorage.setItem(LOCK.until, String(Date.now() + LOCKOUT_MS * Math.pow(2, extra)));
  }
}

export async function clearFails() {
  await AsyncStorage.removeItem(LOCK.fails);
  await AsyncStorage.removeItem(LOCK.until);
}

export async function failCount() {
  return Number(await AsyncStorage.getItem(LOCK.fails)) || 0;
}

export async function lockoutRemaining() {
  const until = Number(await AsyncStorage.getItem(LOCK.until)) || 0;
  return Math.max(0, until - Date.now());
}

export function cryptoAvailable() {
  return !!subtle;
}
