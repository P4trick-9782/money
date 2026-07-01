import { act, renderHook } from "@testing-library/react-native";
import { useAppData } from "../hooks/useAppData";

it("updates a transaction while preserving unchanged fields", () => {
  const { result } = renderHook(() => useAppData(false));
  act(() => result.current.actions.addTxn({
    type: "expense",
    amount: 100,
    category: "餐飲",
    date: "2026-06-23",
    ccy: "TWD",
  }));
  const id = result.current.data.txns[0].id;
  act(() => result.current.actions.updateTxn(id, { amount: 200, note: "updated" }));
  expect(result.current.data.txns[0]).toMatchObject({ id, amount: 200, note: "updated", category: "餐飲" });
});

it("deletes a transaction by id", () => {
  const { result } = renderHook(() => useAppData(false));
  act(() => result.current.actions.addTxn({
    type: "expense",
    amount: 50,
    category: "交通",
    date: "2026-06-23",
    ccy: "TWD",
  }));
  act(() => result.current.actions.deleteTxn(result.current.data.txns[0].id));
  expect(result.current.data.txns).toHaveLength(0);
});

it("imports transaction data in bulk", () => {
  const { result } = renderHook(() => useAppData(false));
  const txns = [{
    id: "t1",
    type: "expense" as const,
    amount: 999,
    category: "測試",
    date: "2026-01-01",
    ccy: "TWD",
    createdAt: "2026-01-01T00:00:00Z",
  }];
  act(() => result.current.actions.importAll({ txns }));
  expect(result.current.data.txns).toEqual(txns);
});
