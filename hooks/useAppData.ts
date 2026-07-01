import { useCallback, useEffect, useMemo, useState } from "react";
import { KEYS } from "@/constants/categories";
import { AppData, Asset, Goal, Recurring, Txn } from "@/types";
import { loadJson, saveJson } from "@/services/storage";

const emptySync = { url: "", token: "", lastSync: null, autoMins: 0 };
const emptyBinance = { apiKey: "", apiSecret: "", data: null, lastFetch: null };

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function today() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 }).format(value || 0);
}

export function sumTxns(txns: Txn[], type?: Txn["type"]) {
  return txns.filter((t) => !type || t.type === type).reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
}

export function useAppData(enabled = true) {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [pending, setPending] = useState<AppData["pending"]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sync, setSync] = useState<AppData["sync"]>(emptySync);
  const [binance, setBinance] = useState<AppData["binance"]>(emptyBinance);
  const [invest, setInvest] = useState<unknown[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [networth, setNetworth] = useState<AppData["networth"]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    async function loadAll() {
      const values = await Promise.all([
        loadJson(KEYS.txns, [] as Txn[]),
        loadJson(KEYS.recurring, [] as Recurring[]),
        loadJson(KEYS.goals, [] as Goal[]),
        loadJson(KEYS.pending, [] as AppData["pending"]),
        loadJson(KEYS.assets, [] as Asset[]),
        loadJson(KEYS.sync, emptySync),
        loadJson(KEYS.binance, emptyBinance),
        loadJson(KEYS.invest, [] as unknown[]),
        loadJson(KEYS.budgets, {} as Record<string, number>),
        loadJson(KEYS.networth, [] as AppData["networth"]),
      ]);
      if (!alive) return;
      setTxns(values[0]);
      setRecurring(values[1]);
      setGoals(values[2]);
      setPending(values[3]);
      setAssets(values[4]);
      setSync(values[5]);
      setBinance(values[6]);
      setInvest(values[7]);
      setBudgets(values[8]);
      setNetworth(values[9]);
      setLoaded(true);
    }
    loadAll();
    return () => {
      alive = false;
    };
  }, [enabled]);

  useEffect(() => {
    if (loaded) saveJson(KEYS.txns, txns);
  }, [loaded, txns]);
  useEffect(() => {
    if (loaded) saveJson(KEYS.recurring, recurring);
  }, [loaded, recurring]);
  useEffect(() => {
    if (loaded) saveJson(KEYS.goals, goals);
  }, [loaded, goals]);
  useEffect(() => {
    if (loaded) saveJson(KEYS.pending, pending);
  }, [loaded, pending]);
  useEffect(() => {
    if (loaded) saveJson(KEYS.assets, assets);
  }, [loaded, assets]);
  useEffect(() => {
    if (loaded) saveJson(KEYS.sync, sync);
  }, [loaded, sync]);
  useEffect(() => {
    if (loaded) saveJson(KEYS.binance, binance);
  }, [loaded, binance]);
  useEffect(() => {
    if (loaded) saveJson(KEYS.invest, invest);
  }, [loaded, invest]);
  useEffect(() => {
    if (loaded) saveJson(KEYS.budgets, budgets);
  }, [loaded, budgets]);
  useEffect(() => {
    if (loaded) saveJson(KEYS.networth, networth);
  }, [loaded, networth]);

  const addTxn = useCallback((tx: Omit<Txn, "id" | "createdAt">) => {
    setTxns((prev) => [{ ...tx, id: uid(), createdAt: new Date().toISOString() }, ...prev]);
  }, []);

  const deleteTxn = useCallback((id: string) => {
    setTxns((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTxn = useCallback((id: string, patch: Partial<Omit<Txn, "id" | "createdAt">>) => {
    setTxns((prev) => prev.map((txn) => (txn.id === id ? { ...txn, ...patch } : txn)));
  }, []);

  const addRecurring = useCallback((item: Omit<Recurring, "id">) => {
    setRecurring((prev) => [{ ...item, id: uid() }, ...prev]);
  }, []);

  const addGoal = useCallback((item: Omit<Goal, "id" | "createdAt" | "current">) => {
    setGoals((prev) => [{ ...item, id: uid(), current: 0, createdAt: new Date().toISOString() }, ...prev]);
  }, []);

  const addAsset = useCallback((item: Omit<Asset, "id" | "createdAt">) => {
    setAssets((prev) => [{ ...item, id: uid(), createdAt: new Date().toISOString() }, ...prev]);
  }, []);

  const updateRecurring = useCallback((id: string, patch: Partial<Omit<Recurring, "id">>) => {
    setRecurring((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const deleteRecurring = useCallback((id: string) => {
    setRecurring((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateGoal = useCallback((id: string, patch: Partial<Omit<Goal, "id" | "createdAt">>) => {
    setGoals((prev) => prev.map((goal) => (goal.id === id ? { ...goal, ...patch } : goal)));
  }, []);

  const contributeGoal = useCallback((id: string, delta: number) => {
    if (!Number.isFinite(delta)) return;
    setGoals((prev) => prev.map((goal) => (
      goal.id === id ? { ...goal, current: Math.max(0, goal.current + delta) } : goal
    )));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
  }, []);

  const updateAsset = useCallback((id: string, patch: Partial<Omit<Asset, "id" | "createdAt">>) => {
    setAssets((prev) => prev.map((asset) => (asset.id === id ? { ...asset, ...patch } : asset)));
  }, []);

  const deleteAsset = useCallback((id: string) => {
    setAssets((prev) => prev.filter((asset) => asset.id !== id));
  }, []);

  const importAll = useCallback((value: Partial<AppData>) => {
    if (Array.isArray(value.txns)) setTxns(value.txns);
    if (Array.isArray(value.recurring)) setRecurring(value.recurring);
    if (Array.isArray(value.goals)) setGoals(value.goals);
    if (Array.isArray(value.pending)) setPending(value.pending);
    if (Array.isArray(value.assets)) setAssets(value.assets);
    if (value.sync && typeof value.sync === "object") setSync(value.sync);
    if (value.binance && typeof value.binance === "object") setBinance(value.binance);
    if (Array.isArray(value.invest)) setInvest(value.invest);
    if (value.budgets && typeof value.budgets === "object" && !Array.isArray(value.budgets)) {
      setBudgets(value.budgets);
    }
    if (Array.isArray(value.networth)) setNetworth(value.networth);
  }, []);

  const data = useMemo(
    () => ({ txns, recurring, goals, pending, assets, sync, binance, invest, budgets, networth }),
    [assets, binance, budgets, goals, invest, networth, pending, recurring, sync, txns],
  );

  return {
    data,
    loaded,
    actions: {
      addTxn,
      deleteTxn,
      updateTxn,
      addRecurring,
      addGoal,
      addAsset,
      updateRecurring,
      deleteRecurring,
      updateGoal,
      contributeGoal,
      deleteGoal,
      updateAsset,
      deleteAsset,
      importAll,
      setSync,
      setBudgets,
      setPending,
      setBinance,
      setInvest,
      setNetworth,
    },
  };
}
