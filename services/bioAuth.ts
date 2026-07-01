import { Buffer } from "buffer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LOCK } from "@/constants/categories";
import { bioDeleteEnrollment, bioRestoreKey } from "@/services/biometric";
import { decryptStr, importKeyBytes, lockApp } from "@/services/crypto";

export type BioUnlockResult =
  | { status: "success" }
  | { status: "cancelled" }
  | { status: "invalidated" }
  | { status: "error" };

export async function unlockWithBiometric(): Promise<BioUnlockResult> {
  const restored = await bioRestoreKey();
  if (restored.status !== "success") {
    if (restored.status === "error" || restored.status === "invalidated") lockApp();
    return { status: restored.status };
  }

  try {
    await importKeyBytes(Uint8Array.from(Buffer.from(restored.key, "base64")));
    const verifier = await AsyncStorage.getItem(LOCK.verifier);
    if (!verifier || (await decryptStr(verifier)) !== "FIN_OK") {
      lockApp();
      await bioDeleteEnrollment();
      return { status: "invalidated" };
    }
    return { status: "success" };
  } catch {
    lockApp();
    await bioDeleteEnrollment().catch(() => {});
    return { status: "error" };
  }
}
