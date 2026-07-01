import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { LOCK } from "../constants/categories";
import { unlockWithBiometric } from "../services/bioAuth";
import { bioEnroll, bioRestoreKey } from "../services/biometric";
import {
  decryptStr,
  exportVerifiedKeyBytes,
  hasCryptoKey,
  lockApp,
  rotatePIN,
  setupPIN,
  unlockPIN,
} from "../services/crypto";

const asyncStore = AsyncStorage as typeof AsyncStorage & { _reset: () => void };
const secureStore = SecureStore as typeof SecureStore & {
  _reset: () => void;
  _simulateCancelled: () => void;
  _simulateInvalidated: () => void;
  _simulateError: () => void;
};

beforeEach(() => {
  asyncStore._reset();
  secureStore._reset();
  jest.clearAllMocks();
  lockApp();
});

describe("PIN key handling", () => {
  it("clears the in-memory key when locked", async () => {
    await setupPIN("123456");
    expect(hasCryptoKey()).toBe(true);
    lockApp();
    expect(hasCryptoKey()).toBe(false);
  });

  it("exports only a key verified by the current PIN", async () => {
    await setupPIN("123456");
    expect((await exportVerifiedKeyBytes("123456")).status).toBe("success");
    expect((await exportVerifiedKeyBytes("999999")).status).toBe("invalidated");
  });

  it("keeps the current key usable after a wrong enrollment PIN", async () => {
    await setupPIN("123456");
    const verifier = await AsyncStorage.getItem(LOCK.verifier);
    await expect(bioEnroll("999999")).rejects.toThrow("PIN 不正確");
    expect(await decryptStr(verifier!)).toBe("FIN_OK");
    expect(await SecureStore.getItemAsync(LOCK.biowrap)).toBeNull();
    expect(await AsyncStorage.getItem(LOCK.bioenrolled)).toBeNull();
  });

  it("invalidates biometric enrollment after PIN rotation", async () => {
    await setupPIN("111111");
    await bioEnroll("111111");
    await rotatePIN("999999", {});
    expect(await SecureStore.getItemAsync(LOCK.biowrap)).toBeNull();
    expect(await AsyncStorage.getItem(LOCK.bioenrolled)).toBeNull();
  });
});

describe("biometric restore states", () => {
  it("returns success for an enrolled key", async () => {
    await setupPIN("123456");
    await bioEnroll("123456");
    expect((await bioRestoreKey()).status).toBe("success");
  });

  it("preserves enrollment when the user cancels", async () => {
    await setupPIN("123456");
    await bioEnroll("123456");
    secureStore._simulateCancelled();
    expect((await bioRestoreKey()).status).toBe("cancelled");
    expect(await AsyncStorage.getItem(LOCK.bioenrolled)).toBe("1");
  });

  it("deletes enrollment when the protected key is invalidated", async () => {
    await setupPIN("123456");
    await bioEnroll("123456");
    secureStore._simulateInvalidated();
    expect((await bioRestoreKey()).status).toBe("invalidated");
    expect(await AsyncStorage.getItem(LOCK.bioenrolled)).toBeNull();
  });

  it("returns error for an unexpected SecureStore failure", async () => {
    secureStore._simulateError();
    expect((await bioRestoreKey()).status).toBe("error");
  });
});

describe("production biometric unlock", () => {
  it("restores the correct key and verifies FIN_OK", async () => {
    await setupPIN("123456");
    await bioEnroll("123456");
    lockApp();
    expect(await unlockWithBiometric()).toEqual({ status: "success" });
    expect(hasCryptoKey()).toBe(true);
  });

  it("rejects stale key bytes and deletes enrollment", async () => {
    await setupPIN("123456");
    await bioEnroll("123456");
    await SecureStore.setItemAsync(LOCK.biowrap, Buffer.alloc(32, 0xff).toString("base64"));
    lockApp();
    expect((await unlockWithBiometric()).status).not.toBe("success");
    expect(hasCryptoKey()).toBe(false);
    expect(await AsyncStorage.getItem(LOCK.bioenrolled)).toBeNull();
  });

  it("keeps the app locked on technical failure", async () => {
    await setupPIN("123456");
    lockApp();
    secureStore._simulateError();
    expect(await unlockWithBiometric()).toEqual({ status: "error" });
    expect(hasCryptoKey()).toBe(false);
  });

  it("allows PIN unlock after biometric invalidation", async () => {
    await setupPIN("123456");
    await bioEnroll("123456");
    lockApp();
    secureStore._simulateInvalidated();
    expect(await unlockWithBiometric()).toEqual({ status: "invalidated" });
    expect(await unlockPIN("123456")).toBe(true);
  });
});
