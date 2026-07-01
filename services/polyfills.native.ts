import { Buffer } from "buffer";
import { install } from "react-native-quick-crypto";

install();

const g = globalThis as typeof globalThis & {
  Buffer?: typeof Buffer;
  atob?: (value: string) => string;
  btoa?: (value: string) => string;
};

if (!g.Buffer) g.Buffer = Buffer;
if (!g.atob) g.atob = (value) => Buffer.from(value, "base64").toString("binary");
if (!g.btoa) g.btoa = (value) => Buffer.from(value, "binary").toString("base64");
