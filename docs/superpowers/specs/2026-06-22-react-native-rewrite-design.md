# 記帳 App — React Native 重寫設計文件

**日期：** 2026-06-22  
**目標平台：** iOS + Android  
**工具：** Expo (SDK 52+) + Expo Router + EAS Build  
**參考：** 現有 `index.html`（保留為備份，不納入 RN 專案）

---

## 1. 背景與目標

現有版本是一個 2600+ 行的單檔 React web app（`index.html`），透過 PWA manifest 安裝到手機。功能完整，但受限於 WebView 環境，無法使用真正的原生能力（Face ID/Touch ID 需走 WebAuthn、無法上架 App Store/Play Store）。

目標：用 Expo + React Native 重寫，發佈為 iOS + Android 原生 App，保持所有現有功能，並提升原生體驗（導覽動畫、鍵盤行為、生物辨識）。

---

## 2. 架構策略：B+C（Service Layer + Expo Router + Feature Priority）

- **Service Layer（B）**：把商業邏輯（crypto、storage、API）從 UI 抽出，放在 `services/`，讓畫面只負責呈現
- **Expo Router + 功能優先（C）**：用 file-based routing 建骨架，按重要性順序建功能，可以分批交付

---

## 3. 專案結構

```
記帳App/
├── app/
│   ├── _layout.tsx               # Root layout，auth gate（未解鎖 → unlock）
│   ├── (auth)/
│   │   └── unlock.tsx            # PIN 輸入 / 生物辨識解鎖
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tab navigator
│   │   ├── index.tsx             # 首頁（本月結餘、快速記帳、近期記錄）
│   │   ├── txns.tsx              # 記帳列表
│   │   ├── recurring.tsx         # 固定扣款
│   │   ├── goals.tsx             # 存款目標
│   │   ├── assets.tsx            # 資產 & 投資持倉
│   │   ├── stats.tsx             # 統計 & 預算
│   │   └── more.tsx              # 設定、雲端同步、帳號
│   └── modals/
│       ├── add-tx.tsx            # 新增記帳（手動）
│       ├── voice.tsx             # 語音輸入
│       ├── receipt.tsx           # 掃描收據（expo-camera）
│       ├── recurring-form.tsx    # 新增/編輯固定扣款
│       ├── goal-form.tsx         # 新增存款目標
│       └── asset-form.tsx        # 新增資產帳戶
│
├── services/
│   ├── storage.ts                # AsyncStorage 封裝，與 HTML 的 load/save 對應
│   ├── crypto.ts                 # PIN 設定/驗證、AES-GCM 加密/解密、PBKDF2
│   ├── biometric.ts              # Face ID / Touch ID（expo-local-authentication）
│   ├── supabase.ts               # 帳號（signUp/signIn/refresh）+ 雲端 push/pull
│   ├── binance.ts                # 透過 Supabase Edge Function 抓 Binance 資料
│   ├── rates.ts                  # 匯率抓取與快取（Frankfurter API）
│   └── ai.ts                     # AI 分析（Supabase Edge Function）
│
├── components/
│   ├── TxRow.tsx                 # 單筆記錄列
│   ├── MonthNav.tsx              # 月份切換導覽列
│   ├── Toast.tsx                 # 全域 toast 通知
│   ├── Section.tsx               # 區塊標題
│   ├── Empty.tsx                 # 空狀態提示
│   └── PendingRow.tsx            # 待確認刷卡通知列
│
├── constants/
│   ├── categories.ts             # DEFAULT_CATS、ICONS、TYPE_COLOR、TYPE_LABEL 等
│   └── theme.ts                  # 顏色（含深色模式）、字型大小、間距
│
├── hooks/
│   ├── useAppData.ts             # 主資料狀態（txns、recurring、goals、assets 等）
│   └── useToast.ts               # Toast 狀態管理
│
├── app.json                      # Expo 設定（bundle ID、splash、圖示）
├── eas.json                      # EAS Build 設定（development / preview / production）
└── package.json
```

---

## 4. 技術選型

| Web 版（HTML）| React Native 替換 | 套件 |
|---|---|---|
| `localStorage` | AsyncStorage | `@react-native-async-storage/async-storage` |
| `window.crypto.subtle`（PBKDF2 + AES-GCM）| quick-crypto | `react-native-quick-crypto` |
| WebAuthn 生物辨識 | expo-local-authentication | `expo-local-authentication` |
| `<div>/<p>/<button>/<input>` | `View/Text/Pressable/TextInput` | react-native 內建 |
| CSS StyleSheet | `StyleSheet.create()` | react-native 內建 |
| Tab Bar（自製）| Expo Router `(tabs)` | `expo-router` |
| Modal（自製 overlay）| Expo Router modal route | `expo-router` |
| `fetch()` | 不變 | 內建 |
| `<select>` | Picker | `@react-native-picker/picker` |
| 收據掃描 | expo-camera | `expo-camera` |
| 語音輸入 | expo-av | `expo-av` |
| `overflow: scroll` | ScrollView | react-native 內建 |
| `position: fixed` | `position: 'absolute'` | react-native 內建 |
| `vh/vw` | `Dimensions.get('window')` | react-native 內建 |
| 深色模式 `@media` | `useColorScheme()` | react-native 內建 |

### 加密說明

現有 HTML 使用 `window.crypto.subtle` 實作：
- PBKDF2（210,000 iterations）派生 AES-GCM 金鑰
- AES-GCM 256-bit 加密所有本機資料

`react-native-quick-crypto` 提供相同的 Web Crypto API 介面，遷移時可以保持邏輯不變，只需替換 import 來源。

---

## 5. 資料流

```
useAppData (hook)
  ├── 讀：services/storage.ts → AsyncStorage
  ├── 加密：services/crypto.ts → react-native-quick-crypto
  ├── 雲端：services/supabase.ts → Supabase REST API
  └── 狀態：React useState（與 HTML 版相同的 state 結構）
```

資料 key 名稱（`fin_txns`、`fin_recurring` 等）保持不變，若使用者從 web 版匯出 JSON 可直接匯入 RN 版。

---

## 6. 認證 & 鎖定流程

```
App 啟動
  ↓
Root layout (_layout.tsx)
  ↓ 判斷：有沒有設 PIN？
  ├── 沒有 → 引導設定 PIN（6 位數）
  └── 有   → unlock.tsx
              ├── 支援生物辨識 → 自動觸發 Face ID / Touch ID
              └── 失敗 / 無生物辨識 → 顯示 PIN 鍵盤
              ↓ 解鎖成功 → 進入 (tabs)
```

失敗鎖定邏輯（MAX_FAILS = 5，exponential backoff）與 HTML 版相同。

---

## 7. 功能建置優先順序

| 優先 | 功能 | 說明 |
|---|---|---|
| 1 | 基礎設施 | storage、crypto、theme、constants |
| 2 | PIN 解鎖畫面 | unlock.tsx + biometric |
| 3 | 首頁 + 新增記帳 | index.tsx + add-tx modal |
| 4 | 記帳列表 | txns.tsx |
| 5 | 固定扣款 | recurring.tsx + recurring-form modal |
| 6 | 存款目標 | goals.tsx + goal-form modal |
| 7 | 資產 & 投資 | assets.tsx + asset-form modal |
| 8 | 統計 & 預算 | stats.tsx |
| 9 | 設定 & 匯出 | more.tsx |
| 10 | Supabase 雲端同步 | supabase.ts 整合 |
| 11 | Binance 整合 | binance.ts |
| 12 | AI 分析 | ai.ts |
| 13 | 語音輸入 | voice modal |
| 14 | 掃描收據 | receipt modal |

---

## 8. 發佈設定

- **開發測試**：`npx expo start` + Expo Go（iPhone/Android 掃 QR code）
- **內部測試**：EAS Build `preview` profile → TestFlight（iOS）/ 內部測試軌道（Android）
- **正式發佈**：EAS Build `production` → App Store + Google Play
- **需要**：Apple Developer 帳號（$99/年）、Google Play 帳號（$25 一次）

```json
// eas.json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": {}
  }
}
```

---

## 9. 不納入本次範圍

- Web 版（`index.html`）不修改，保留為參考備份
- 不做 React Native Web（不需要維持 web 版）
- 不做推播通知（刷卡通知現在靠捷徑 URL scheme，RN 版維持相同方式）

---

## 10. 風險

| 風險 | 緩解方式 |
|---|---|
| `react-native-quick-crypto` 與現有加密資料不相容 | 先用 HTML 版匯出 JSON，再用 RN 版匯入（不走加密遷移） |
| EAS Build iOS 需要 Apple Developer 帳號 | 開發期間用 Expo Go 測試，帳號可最後再申請 |
| `expo-camera` 收據掃描 OCR 需要後端 | 沿用現有 Supabase Edge Function |
