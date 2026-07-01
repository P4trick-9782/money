const values = {};
let nextGetError = null;

const api = {
  setItemAsync: jest.fn(async (key, value) => { values[key] = value; }),
  getItemAsync: jest.fn(async (key) => {
    if (nextGetError) {
      const error = nextGetError;
      nextGetError = null;
      throw error;
    }
    return values[key] ?? null;
  }),
  deleteItemAsync: jest.fn(async (key) => { delete values[key]; }),
  _reset() {
    Object.keys(values).forEach((key) => delete values[key]);
    nextGetError = null;
  },
  _simulateCancelled() { nextGetError = new Error("User canceled the operation"); },
  _simulateInvalidated() { nextGetError = new Error("KeyPermanentlyInvalidated"); },
  _simulateError() { nextGetError = new Error("Unexpected SecureStore failure"); },
};

module.exports = api;
