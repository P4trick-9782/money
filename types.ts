export type TxType = "expense" | "income" | "saving" | "recurring";

export type Txn = {
  id: string;
  type: TxType;
  category: string;
  amount: number;
  note?: string;
  date: string;
  ccy?: string;
  createdAt: string;
};

export type Recurring = {
  id: string;
  name: string;
  amount: number;
  category: string;
  freq: "monthly" | "quarterly" | "yearly";
  day: number;
  month?: number;
  paidMonths?: number;
  totalMonths?: number;
  subType?: string;
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  category: string;
  createdAt: string;
};

export type Asset = {
  id: string;
  name: string;
  type: string;
  amount: number;
  ccy: string;
  linkedCard?: string;
  createdAt: string;
};

export type PendingTxn = Partial<Txn> & {
  id: string;
  raw?: string;
};

export type SyncSettings = {
  url: string;
  token: string;
  lastSync: string | null;
  autoMins: number;
};

export type AppData = {
  txns: Txn[];
  recurring: Recurring[];
  goals: Goal[];
  pending: PendingTxn[];
  assets: Asset[];
  sync: SyncSettings;
  binance: { apiKey: string; apiSecret: string; data: unknown; lastFetch: string | null };
  invest: unknown[];
  budgets: Record<string, number>;
  networth: { date: string; value: number }[];
};
