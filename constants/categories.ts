export const KEYS = {
  txns: "fin_txns",
  recurring: "fin_recurring",
  goals: "fin_goals",
  sync: "fin_sync",
  pending: "fin_pending",
  assets: "fin_assets",
  rates: "fin_rates",
  binance: "fin_binance",
  invest: "fin_invest",
  budgets: "fin_budgets",
  networth: "fin_networth",
} as const;

export const LOCK = {
  verifier: "fin_lock_v",
  salt: "fin_lock_salt",
  fails: "fin_lock_fails",
  until: "fin_lock_until",
  bio: "fin_bio_cred",
  biowrap: "fin_bio_wrap",
  bioenrolled: "fin_bio_enrolled",
} as const;

export const PIN_LEN = 6;
export const MAX_FAILS = 5;
export const LOCKOUT_MS = 60 * 1000;
export const BASE_CCY = "TWD";

export const CURRENCIES = [
  { code: "TWD", sym: "NT$", name: "台幣" },
  { code: "USD", sym: "$", name: "美金" },
  { code: "JPY", sym: "¥", name: "日幣" },
  { code: "KRW", sym: "₩", name: "韓圜" },
  { code: "EUR", sym: "€", name: "歐元" },
  { code: "CNY", sym: "¥", name: "人民幣" },
  { code: "HKD", sym: "HK$", name: "港幣" },
  { code: "GBP", sym: "£", name: "英鎊" },
] as const;

export const DEFAULT_CATS = {
  expense: ["餐飲", "交通", "購物", "娛樂", "醫療", "教育", "住房", "水電", "其他"],
  income: ["薪資", "獎金", "投資", "副業", "其他收入"],
  saving: ["定存", "基金", "股票", "緊急備用金"],
  recurring: ["車貸", "房貸", "保險", "訂閱服務", "電信費", "水費", "電費", "稅金", "其他固定"],
} as const;

export const ICONS: Record<string, string> = {
  餐飲: "🍜", 交通: "🚌", 購物: "🛍", 娛樂: "🎬", 醫療: "💊", 教育: "📚", 住房: "🏠", 水電: "💡", 其他: "📦",
  薪資: "💼", 獎金: "🎁", 投資: "📈", 副業: "💻", 其他收入: "💰", 定存: "🏦", 基金: "📊", 股票: "📉", 緊急備用金: "🛡",
  車貸: "🚗", 房貸: "🏡", 保險: "🔒", 訂閱服務: "📱", 電信費: "📡", 水費: "💧", 電費: "⚡", 稅金: "🧾", 其他固定: "🔁",
  旅遊金: "✈️", 緊急金: "🛟", 買車: "🚙", 買房: "🏘", 教育金: "🎓", 退休金: "🌴", 其他目標: "🎯",
};

export const TYPE_COLOR = {
  expense: { bg: "#FF3B30", light: "#FFF1F0" },
  income: { bg: "#34C759", light: "#F0FFF4" },
  saving: { bg: "#007AFF", light: "#EFF6FF" },
  recurring: { bg: "#FF9500", light: "#FFF8EE" },
} as const;

export const TYPE_LABEL = { expense: "支出", income: "收入", saving: "儲蓄", recurring: "固定扣款" } as const;
export const FREQ_LABEL = { monthly: "每月", yearly: "每年", quarterly: "每季" } as const;
export const GOAL_CATS = ["旅遊金", "緊急金", "買車", "買房", "教育金", "退休金", "其他目標"] as const;

export const ASSET_TYPES = [
  { key: "bank", label: "銀行存款", icon: "🏦", color: "#007AFF" },
  { key: "cash", label: "現金", icon: "💵", color: "#34C759" },
  { key: "invest", label: "投資", icon: "📈", color: "#FF9500" },
  { key: "realestate", label: "不動產", icon: "🏠", color: "#5856D6" },
  { key: "insurance", label: "保單價值", icon: "🛡", color: "#FF2D55" },
] as const;
