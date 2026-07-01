const values = {};

const api = {
  setItem: jest.fn(async (key, value) => { values[key] = value; }),
  getItem: jest.fn(async (key) => values[key] ?? null),
  removeItem: jest.fn(async (key) => { delete values[key]; }),
  multiSet: jest.fn(async (pairs) => { pairs.forEach(([key, value]) => { values[key] = value; }); }),
  multiGet: jest.fn(async (keys) => keys.map((key) => [key, values[key] ?? null])),
  clear: jest.fn(async () => { Object.keys(values).forEach((key) => delete values[key]); }),
  _reset() { Object.keys(values).forEach((key) => delete values[key]); },
};

module.exports = api;
