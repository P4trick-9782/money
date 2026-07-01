import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { hasPIN, lockApp } from "@/services/crypto";

const BG_LOCK_MS = 5 * 60 * 1000;

type AuthContextValue = {
  ready: boolean;
  pinExists: boolean;
  unlocked: boolean;
  markUnlocked: () => void;
  refreshPinState: () => Promise<void>;
  lock: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [pinExists, setPinExists] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const isUnlockedRef = useRef(false);
  const backgroundAtRef = useRef<number | null>(null);
  const backgroundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearBackgroundTimer = useCallback(() => {
    if (backgroundTimerRef.current) clearTimeout(backgroundTimerRef.current);
    backgroundTimerRef.current = null;
  }, []);

  const doLock = useCallback(() => {
    clearBackgroundTimer();
    backgroundAtRef.current = null;
    isUnlockedRef.current = false;
    lockApp();
    setUnlocked(false);
  }, [clearBackgroundTimer]);

  const markUnlocked = useCallback(() => {
    isUnlockedRef.current = true;
    setUnlocked(true);
  }, []);

  const refreshPinState = useCallback(async () => {
    const exists = await hasPIN();
    setPinExists(exists);
    setReady(true);
    if (!exists) doLock();
  }, [doLock]);

  useEffect(() => {
    refreshPinState();
  }, [refreshPinState]);

  useEffect(() => {
    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState === "background" || nextState === "inactive") {
        if (!isUnlockedRef.current) return;
        if (backgroundAtRef.current === null) backgroundAtRef.current = Date.now();
        clearBackgroundTimer();
        backgroundTimerRef.current = setTimeout(doLock, BG_LOCK_MS);
        return;
      }

      if (nextState === "active") {
        clearBackgroundTimer();
        if (backgroundAtRef.current === null) return;
        const elapsed = Date.now() - backgroundAtRef.current;
        backgroundAtRef.current = null;
        if (elapsed >= BG_LOCK_MS && isUnlockedRef.current) doLock();
      }
    }

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
      clearBackgroundTimer();
    };
  }, [clearBackgroundTimer, doLock]);

  const value = useMemo<AuthContextValue>(
    () => ({ ready, pinExists, unlocked, markUnlocked, refreshPinState, lock: doLock }),
    [doLock, markUnlocked, pinExists, ready, refreshPinState, unlocked],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
