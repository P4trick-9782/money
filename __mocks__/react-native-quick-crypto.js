function hashNumbers(...numbers) {
  let value = 5381;
  numbers.forEach((number) => {
    value = (((value << 5) + value) ^ number) & 0x7fffffff;
  });
  return value || 1;
}

const subtle = {
  importKey: jest.fn(async (format, data, algorithm) => {
    const name = typeof algorithm === "string" ? algorithm : algorithm.name;
    const bytes = data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    if (format === "raw" && name === "AES-GCM") {
      return { _id: new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getInt32(0), algorithm };
    }
    return { _id: hashNumbers(...bytes), algorithm };
  }),
  exportKey: jest.fn(async (_format, key) => {
    const buffer = new ArrayBuffer(32);
    new DataView(buffer).setInt32(0, key._id);
    return buffer;
  }),
  deriveBits: jest.fn(async (algorithm, base, length) => {
    const saltId = algorithm.salt ? hashNumbers(...algorithm.salt) : 0;
    const buffer = new ArrayBuffer(length / 8);
    new DataView(buffer).setInt32(0, hashNumbers(base._id, saltId, algorithm.iterations || 0));
    return buffer;
  }),
  encrypt: jest.fn(async (_algorithm, key, data) => {
    const bytes = data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    return Buffer.from(JSON.stringify({ key: key._id, plain: Buffer.from(bytes).toString("base64") }));
  }),
  decrypt: jest.fn(async (_algorithm, key, data) => {
    const bytes = data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const payload = JSON.parse(Buffer.from(bytes).toString("utf8"));
    if (payload.key !== key._id) throw new DOMException("Decryption failed", "OperationError");
    return Buffer.from(payload.plain, "base64");
  }),
};

module.exports = {
  subtle,
  install: jest.fn(),
  randomBytes: jest.fn((length) => Buffer.alloc(length, 0x42)),
};
