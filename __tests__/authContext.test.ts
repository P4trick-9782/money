import { act, renderHook } from "@testing-library/react-native";
import { AppState } from "react-native";
import { AuthProvider, useAuth } from "../hooks/AuthContext";

jest.mock("../services/crypto", () => ({
  hasPIN: jest.fn().mockResolvedValue(true),
  lockApp: jest.fn(),
}));

const BG_LOCK_MS = 5 * 60 * 1000;

function mockAppState() {
  const listeners: Array<(state: string) => void> = [];
  jest.spyOn(AppState, "addEventListener").mockImplementation((_event, listener) => {
    listeners.push(listener as (state: string) => void);
    return { remove: jest.fn() };
  });
  return (state: string) => act(() => listeners.forEach((listener) => listener(state)));
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it("locks on active after five minutes elapsed without advancing timers", async () => {
  const fire = mockAppState();
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
  await act(async () => {});
  act(() => result.current.markUnlocked());

  const now = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
  fire("background");
  now.mockReturnValue(1_000_000 + BG_LOCK_MS + 1);
  fire("active");
  expect(result.current.unlocked).toBe(false);
});

it("stays unlocked when backgrounded for less than five minutes", async () => {
  const fire = mockAppState();
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
  await act(async () => {});
  act(() => result.current.markUnlocked());

  const now = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
  fire("background");
  now.mockReturnValue(1_060_000);
  fire("active");
  expect(result.current.unlocked).toBe(true);
});

it("does not reset the first background timestamp on repeated events", async () => {
  const fire = mockAppState();
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
  await act(async () => {});
  act(() => result.current.markUnlocked());

  const now = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
  fire("inactive");
  now.mockReturnValue(1_060_000);
  fire("background");
  now.mockReturnValue(1_000_000 + BG_LOCK_MS + 1);
  fire("active");
  expect(result.current.unlocked).toBe(false);
});

it("locks through the auxiliary timer without an active event", async () => {
  const fire = mockAppState();
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
  await act(async () => {});
  act(() => result.current.markUnlocked());
  fire("background");
  act(() => jest.advanceTimersByTime(BG_LOCK_MS + 1));
  expect(result.current.unlocked).toBe(false);
});
