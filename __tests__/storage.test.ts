import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("../services/crypto", () => {
  let hasKey = false;
  return {
    hasCryptoKey: jest.fn(() => hasKey),
    encryptStr: jest.fn(async (value: string) => `{"iv":"AAAA","ct":"${Buffer.from(value).toString("base64")}"}`),
    decryptStr: jest.fn(async () => { throw new DOMException("Wrong key", "OperationError"); }),
    _setHasKey: (value: boolean) => { hasKey = value; },
  };
});

import * as crypto from "../services/crypto";
import { loadJson, saveJson } from "../services/storage";

const asyncStore = AsyncStorage as typeof AsyncStorage & { _reset: () => void };
const cryptoMock = crypto as typeof crypto & { _setHasKey: (value: boolean) => void };

beforeEach(() => {
  asyncStore._reset();
  cryptoMock._setHasKey(false);
  jest.clearAllMocks();
});

it("refuses every write while no crypto key is loaded", async () => {
  await expect(saveJson("fin_txns", [])).rejects.toThrow("no crypto key");
  await expect(saveJson("fin_txns", [{ id: "1" }])).rejects.toThrow("no crypto key");
  expect(await AsyncStorage.getItem("fin_txns")).toBeNull();
});

it("encrypts writes while a key is loaded", async () => {
  cryptoMock._setHasKey(true);
  await saveJson("fin_txns", []);
  expect(await AsyncStorage.getItem("fin_txns")).toMatch(/^\{"iv":/);
});

it("returns fallback when encrypted data cannot be decrypted", async () => {
  await AsyncStorage.setItem("fin_txns", '{"iv":"AAAA","ct":"bad"}');
  cryptoMock._setHasKey(true);
  await expect(loadJson("fin_txns", [])).resolves.toEqual([]);
});
