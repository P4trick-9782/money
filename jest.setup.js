const { TextDecoder, TextEncoder } = require("util");
const { subtle, randomBytes } = require("./__mocks__/react-native-quick-crypto");

jest.mock("@react-native-async-storage/async-storage");
jest.mock("expo-secure-store");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
Object.defineProperty(globalThis, "crypto", {
  configurable: true,
  value: {
    subtle,
    getRandomValues(buffer) {
      buffer.set(randomBytes(buffer.byteLength));
      return buffer;
    },
  },
});
globalThis.atob = (value) => Buffer.from(value, "base64").toString("binary");
globalThis.btoa = (value) => Buffer.from(value, "binary").toString("base64");
