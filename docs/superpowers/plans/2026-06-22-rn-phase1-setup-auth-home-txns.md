# 記帳 RN Phase 1: Setup + Auth + Home + Txns

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get the 記帳 app running in Expo Go with PIN/biometric auth, home screen summary, and the ability to add + list transactions.

**Architecture:** Expo Router v4 (file-based routing) with a Service Layer pattern — `services/` hold all business logic (crypto, storage, biometric), screens only render. Root layout gates the app behind PIN/biometric; after unlock all data lives in `useAppData` hook. Storage keys are identical to the web app (`fin_txns`, etc.) so a JSON export from the web version can be imported directly.

**Tech Stack:** Expo SDK 56, Expo Router v4, react-native-quick-crypto (PBKDF2 + AES-GCM), @react-native-async-storage/async-storage, expo-local-authentication, expo-secure-store

## Global Constraints

- All work is in `C:\Users\lyc02\jizhang-app\` (cwd for every command)
- Expo SDK: `~56.0.x` — run `npx expo install <pkg>` (NOT `npm install`) for all Expo-managed packages to get version-pinned installs
- TypeScript strict mode on
- Storage keys are IDENTICAL to web app: `fin_txns`, `fin_recurring`, `fin_goals`, `fin_pending`, `fin_assets`, `fin_rates`, `fin_binance`, `fin_invest`, `fin_budgets`, `fin_networth`, `fin_sync`
- Lock keys use SecureStore (not AsyncStorage): `fin_lock_v`, `fin_lock_salt`, `fin_lock_fails`, `fin_lock_until`, `fin_bio_cred`, `fin_bio_wrap`
- PIN is 6 digits; MAX_FAILS = 5; lockout uses exponential backoff (same as web app)
- `react-native-quick-crypto` must be imported BEFORE any crypto usage — put `import 'react-native-quick-crypto'` at the very top of `app/_layout.tsx`
- No Supabase / Binance / AI / voice / camera in this phase (P10-14 are separate plan)
- Read Expo v56 docs at https://docs.expo.dev/versions/v56.0.0/ if in doubt

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | Change `main` to `expo-router/entry` |
| `app.json` | Modify | Add `scheme`, `expo-router` plugin, `typedRoutes` |
| `tsconfig.json` | Modify | Add `expo-env.d.ts` include |
| `expo-env.d.ts` | Create | Expo Router type reference |
| `metro.config.js` | Create | Metro bundler config for Expo Router |
| `App.tsx` | Delete | Replaced by `app/_layout.tsx` |
| `index.ts` | Delete | Replaced by `expo-router/entry` main |
| `constants/theme.ts` | Create | Colors, typography, spacing |
| `constants/categories.ts` | Create | DEFAULT_CATS, ICONS, TYPE_COLOR, TYPE_LABEL, ASSET_TYPES, etc. |
| `services/storage.ts` | Create | AsyncStorage wrapper (app data, unencrypted keys) |
| `services/crypto.ts` | Create | PIN setup/verify, AES-GCM encrypt/decrypt, SecureStore keys |
| `services/biometric.ts` | Create | expo-local-authentication wrapper |
| `app/_layout.tsx` | Create | Root layout: crypto polyfill import + auth gate |
| `app/(auth)/unlock.tsx` | Create | PIN keypad + biometric trigger |
| `hooks/useAppData.ts` | Create | Main state hook: load/save all fin_ data |
| `hooks/useToast.ts` | Create | Toast queue state |
| `components/Toast.tsx` | Create | Floating toast notification |
| `components/Section.tsx` | Create | Section header row |
| `components/Empty.tsx` | Create | Empty-state placeholder |
| `components/TxRow.tsx` | Create | Single transaction list row |
| `components/MonthNav.tsx` | Create | Month ← / → navigation bar |
| `app/(tabs)/_layout.tsx` | Create | Bottom tab navigator (7 tabs) |
| `app/(tabs)/index.tsx` | Create | Home screen (summary card + recent txns) |
| `app/(tabs)/txns.tsx` | Create | Transaction list with month nav |
| `app/(tabs)/recurring.tsx` | Create | Placeholder screen |
| `app/(tabs)/goals.tsx` | Create | Placeholder screen |
| `app/(tabs)/assets.tsx` | Create | Placeholder screen |
| `app/(tabs)/stats.tsx` | Create | Placeholder screen |
| `app/(tabs)/more.tsx` | Create | Placeholder screen |
| `app/modals/add-tx.tsx` | Create | Add transaction modal (full form) |

---

### Task 1: Expo Router Migration + Package Install

**Files:**
- Modify: `package.json`
- Modify: `app.json`
- Modify: `tsconfig.json`
- Create: `expo-env.d.ts`
- Create: `metro.config.js`
- Delete: `App.tsx`, `index.ts`

**Interfaces:**
- Produces: working Expo Router project skeleton; `npx expo start` shows Expo Router 404 screen (expected before adding `app/` files)

- [ ] **Step 1: Install expo-router and remaining packages**

```powershell
cd C:\Users\lyc02\jizhang-app
npx expo install expo-router
npx expo install @react-native-picker/picker
npx expo install expo-camera expo-av
```

Expected: packages added to `node_modules/` and pinned versions written to `package.json`.

- [ ] **Step 2: Update `package.json` — change entry point**

Open `package.json`. Change line:
```json
"main": "index.ts",
```
to:
```json
"main": "expo-router/entry",
```

- [ ] **Step 3: Update `app.json` — add scheme, plugins, typedRoutes**

Replace the entire `app.json` with:
```json
{
  "expo": {
    "name": "記帳",
    "slug": "jizhang-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "jizhang",
    "userInterfaceStyle": "automatic",
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.lyc02.jizhang"
    },
    "android": {
      "package": "com.lyc02.jizhang",
      "adaptiveIcon": {
        "backgroundColor": "#007AFF",
        "foregroundImage": "./assets/android-icon-foreground.png"
      }
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-camera",
        { "cameraPermission": "Allow 記帳 to access your camera to scan receipts." }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "splash": {
      "image": "./assets/splash-icon.png",
      "backgroundColor": "#007AFF"
    }
  }
}
```

- [ ] **Step 4: Update `tsconfig.json`**

Replace `tsconfig.json`:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.d.ts",
    "expo-env.d.ts"
  ]
}
```

- [ ] **Step 5: Create `expo-env.d.ts`**

```ts
/// <reference types="expo-router/types" />
```

- [ ] **Step 6: Create `metro.config.js`**

```js
const { getDefaultConfig } = require('expo/metro-config');
module.exports = getDefaultConfig(__dirname);
```

- [ ] **Step 7: Delete `App.tsx` and `index.ts`**

```powershell
Remove-Item App.tsx
Remove-Item index.ts
```

- [ ] **Step 8: Verify the project loads**

```powershell
npx expo start --clear
```

Expected: Metro bundler starts. Expo Go on phone (scan QR) shows "Unmatched Route" — this is correct, the `app/` directory doesn't exist yet.

- [ ] **Step 9: Commit**

```powershell
git add -A
git commit -m "feat: migrate to expo-router, install packages"
```

---

### Task 2: constants/theme.ts + constants/categories.ts

**Files:**
- Create: `constants/theme.ts`
- Create: `constants/categories.ts`

**Interfaces:**
- Produces: `THEME` (colors, font sizes, spacing), `DEFAULT_CATS`, `ICONS`, `TYPE_COLOR`, `TYPE_LABEL`, `FREQ_LABEL`, `GOAL_CATS`, `ASSET_TYPES`, `ASSET_META`

- [ ] **Step 1: Create `constants/theme.ts`**

```ts
import { Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

export const THEME = {
  colors: {
    primary: '#007AFF',
    danger:  '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    purple:  '#5856D6',
    pink:    '#FF2D55',
    bg:      '#F2F2F7',
    surface: '#FFFFFF',
    text:    '#000000',
    textSec: '#8E8E93',
    sep:     '#C6C6C8',
    border:  '#E5E5EA',
  },
  font: {
    xs:  11,
    sm:  13,
    md:  15,
    lg:  17,
    xl:  20,
    xxl: 28,
    h1:  34,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm:  8,
    md:  12,
    lg:  16,
    full: 9999,
  },
  screen: { width: SCREEN_W },
} as const;
```

- [ ] **Step 2: Create `constants/categories.ts`**

```ts
export const DEFAULT_CATS = {
  expense:   ['餐飲','交通','購物','娛樂','醫療','教育','住房','水電','其他'],
  income:    ['薪資','獎金','投資','副業','其他收入'],
  saving:    ['定存','基金','股票','緊急備用金'],
  recurring: ['車貸','房貸','保險','訂閱服務','電信費','水費','電費','稅金','其他固定'],
} as const;

export const ICONS: Record<string, string> = {
  餐飲:'🍜', 交通:'🚌', 購物:'🛍', 娛樂:'🎬', 醫療:'💊', 教育:'📚', 住房:'🏠', 水電:'💡', 其他:'📦',
  薪資:'💼', 獎金:'🎁', 投資:'📈', 副業:'💻', 其他收入:'💰',
  定存:'🏦', 基金:'📊', 股票:'📉', 緊急備用金:'🛡',
  車貸:'🚗', 房貸:'🏡', 保險:'🔒', 訂閱服務:'📱', 電信費:'📡', 水費:'💧', 電費:'⚡', 稅金:'🧾', 其他固定:'🔁',
  旅遊金:'✈️', 緊急金:'🛟', 買車:'🚙', 買房:'🏘', 教育金:'🎓', 退休金:'🌴', 其他目標:'🎯',
};

export const TYPE_COLOR: Record<string, { bg: string; light: string }> = {
  expense:   { bg: '#FF3B30', light: '#FFF1F0' },
  income:    { bg: '#34C759', light: '#F0FFF4' },
  saving:    { bg: '#007AFF', light: '#EFF6FF' },
  recurring: { bg: '#FF9500', light: '#FFF8EE' },
};

export const TYPE_LABEL: Record<string, string> = {
  expense: '支出', income: '收入', saving: '儲蓄', recurring: '固定扣款',
};

export const FREQ_LABEL: Record<string, string> = {
  monthly: '每月', yearly: '每年', quarterly: '每季',
};

export const GOAL_CATS = ['旅遊金','緊急金','買車','買房','教育金','退休金','其他目標'] as const;

export const ASSET_TYPES = [
  { key: 'bank',       label: '銀行存款', icon: '🏦', color: '#007AFF' },
  { key: 'cash',       label: '現金',     icon: '💵', color: '#34C759' },
  { key: 'invest',     label: '投資',     icon: '📈', color: '#FF9500' },
  { key: 'realestate', label: '不動產',   icon: '🏠', color: '#5856D6' },
  { key: 'insurance',  label: '保單價值', icon: '🛡', color: '#FF2D55' },
  { key: 'other',      label: '其他資產', icon: '💎', color: '#8E8E93' },
] as const;

export const ASSET_META = Object.fromEntries(ASSET_TYPES.map(a => [a.key, a]));
```

- [ ] **Step 3: Commit**

```powershell
git add constants/
git commit -m "feat: add theme and category constants"
```

---

### Task 3: services/storage.ts

**Files:**
- Create: `services/storage.ts`

**Interfaces:**
- Consumes: `@react-native-async-storage/async-storage`
- Produces:
  - `KEYS: Record<string, string>` — app data keys
  - `loadRaw(key: string): Promise<string | null>` — raw string from AsyncStorage
  - `saveRaw(key: string, val: string): Promise<void>` — save raw string
  - `loadJson<T>(key: string): Promise<T | null>` — parse JSON or return null
  - `saveJson(key: string, data: unknown): Promise<void>` — JSON.stringify + save
  - `removeKey(key: string): Promise<void>`

- [ ] **Step 1: Create `services/storage.ts`**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  txns:     'fin_txns',
  recurring:'fin_recurring',
  goals:    'fin_goals',
  pending:  'fin_pending',
  assets:   'fin_assets',
  rates:    'fin_rates',
  binance:  'fin_binance',
  invest:   'fin_invest',
  budgets:  'fin_budgets',
  networth: 'fin_networth',
  sync:     'fin_sync',
  sbAuth:   'fin_sb_session',
} as const;

export async function loadRaw(key: string): Promise<string | null> {
  try { return await AsyncStorage.getItem(key); }
  catch { return null; }
}

export async function saveRaw(key: string, val: string): Promise<void> {
  await AsyncStorage.setItem(key, val);
}

export async function loadJson<T>(key: string): Promise<T | null> {
  const raw = await loadRaw(key);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; }
  catch { return null; }
}

export async function saveJson(key: string, data: unknown): Promise<void> {
  await saveRaw(key, JSON.stringify(data));
}

export async function removeKey(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
```

- [ ] **Step 2: Commit**

```powershell
git add services/storage.ts
git commit -m "feat: add AsyncStorage service"
```

---

### Task 4: services/crypto.ts

**Files:**
- Create: `services/crypto.ts`

**Interfaces:**
- Consumes: `react-native-quick-crypto` (patched global.crypto), `expo-secure-store`
- Produces:
  - `LOCK_KEYS` — SecureStore key names
  - `hasPIN(): Promise<boolean>`
  - `setupPIN(pin: string): Promise<void>` — PBKDF2 derive key, store salt+verifier in SecureStore
  - `verifyPIN(pin: string): Promise<CryptoKey | null>` — returns AES-GCM CryptoKey on success, null on failure
  - `recordFail(): Promise<number>` — increment fail counter, return new count
  - `clearFails(): Promise<void>`
  - `failCount(): Promise<number>`
  - `lockUntil(): Promise<number>` — timestamp ms; 0 if not locked
  - `encryptStr(key: CryptoKey, plain: string): Promise<string>` — returns `iv_b64.data_b64`
  - `decryptStr(key: CryptoKey, cipher: string): Promise<string>`
  - `enableBiometric(key: CryptoKey): Promise<void>` — wrap the raw key bytes in SecureStore
  - `biometricEnabled(): Promise<boolean>`
  - `loadBiometricKey(): Promise<CryptoKey | null>` — unwrap and return AES-GCM key

Note: `react-native-quick-crypto` must be imported (via side-effect) before calling `crypto.subtle`. Do this in `app/_layout.tsx`. This service assumes the polyfill is already active.

- [ ] **Step 1: Create `services/crypto.ts`**

```ts
import * as SecureStore from 'expo-secure-store';

export const LOCK_KEYS = {
  verifier: 'fin_lock_v',
  salt:     'fin_lock_salt',
  fails:    'fin_lock_fails',
  until:    'fin_lock_until',
  rawKey:   'fin_bio_rawkey',  // stores raw key bytes in SecureStore
} as const;

const MAX_FAILS = 5;

// ── helpers ──────────────────────────────────────────────────────────

function b64(buf: ArrayBuffer | Uint8Array): string {
  return Buffer.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf)).toString('base64');
}

function unb64(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, 'base64'));
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 210_000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,       // extractable=true so we can export for biometric wrap
    ['encrypt', 'decrypt']
  );
}

// ── PIN setup / verify ───────────────────────────────────────────────

export async function hasPIN(): Promise<boolean> {
  return !!(await SecureStore.getItemAsync(LOCK_KEYS.verifier));
}

export async function setupPIN(pin: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key  = await deriveKey(pin, salt);
  // Encrypt a known verifier string so we can check PIN correctness later
  const verifier = await encryptStr(key, 'jizhang-ok');
  await SecureStore.setItemAsync(LOCK_KEYS.salt,     b64(salt));
  await SecureStore.setItemAsync(LOCK_KEYS.verifier, verifier);
  await clearFails();
}

export async function verifyPIN(pin: string): Promise<CryptoKey | null> {
  const saltB64 = await SecureStore.getItemAsync(LOCK_KEYS.salt);
  const cipher  = await SecureStore.getItemAsync(LOCK_KEYS.verifier);
  if (!saltB64 || !cipher) return null;
  try {
    const key = await deriveKey(pin, unb64(saltB64));
    await decryptStr(key, cipher); // throws if wrong PIN
    return key;
  } catch {
    return null;
  }
}

// ── fail / lockout ───────────────────────────────────────────────────

export async function failCount(): Promise<number> {
  return Number(await SecureStore.getItemAsync(LOCK_KEYS.fails) ?? '0');
}

export async function lockUntil(): Promise<number> {
  return Number(await SecureStore.getItemAsync(LOCK_KEYS.until) ?? '0');
}

export async function recordFail(): Promise<number> {
  const n = (await failCount()) + 1;
  await SecureStore.setItemAsync(LOCK_KEYS.fails, String(n));
  if (n >= MAX_FAILS) {
    const wait = Math.pow(2, n - MAX_FAILS) * 30_000; // 30s, 60s, 120s…
    await SecureStore.setItemAsync(LOCK_KEYS.until, String(Date.now() + wait));
  }
  return n;
}

export async function clearFails(): Promise<void> {
  await SecureStore.deleteItemAsync(LOCK_KEYS.fails).catch(() => {});
  await SecureStore.deleteItemAsync(LOCK_KEYS.until).catch(() => {});
}

// ── encrypt / decrypt ────────────────────────────────────────────────

export async function encryptStr(key: CryptoKey, plain: string): Promise<string> {
  const iv  = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const buf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
  return b64(iv) + '.' + b64(buf);
}

export async function decryptStr(key: CryptoKey, cipher: string): Promise<string> {
  const [ivB64, dataB64] = cipher.split('.');
  const dec = new TextDecoder();
  const buf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unb64(ivB64) }, key, unb64(dataB64)
  );
  return dec.decode(buf);
}

// ── biometric key wrap ───────────────────────────────────────────────

export async function biometricEnabled(): Promise<boolean> {
  return !!(await SecureStore.getItemAsync(LOCK_KEYS.rawKey));
}

export async function enableBiometric(key: CryptoKey): Promise<void> {
  const raw = await crypto.subtle.exportKey('raw', key);
  await SecureStore.setItemAsync(LOCK_KEYS.rawKey, b64(raw));
}

export async function disableBiometric(): Promise<void> {
  await SecureStore.deleteItemAsync(LOCK_KEYS.rawKey).catch(() => {});
}

export async function loadBiometricKey(): Promise<CryptoKey | null> {
  const rawB64 = await SecureStore.getItemAsync(LOCK_KEYS.rawKey);
  if (!rawB64) return null;
  try {
    return await crypto.subtle.importKey(
      'raw', unb64(rawB64),
      { name: 'AES-GCM', length: 256 },
      false, ['encrypt', 'decrypt']
    );
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Commit**

```powershell
git add services/crypto.ts
git commit -m "feat: add PIN/crypto service (PBKDF2+AES-GCM)"
```

---

### Task 5: services/biometric.ts

**Files:**
- Create: `services/biometric.ts`

**Interfaces:**
- Consumes: `expo-local-authentication`
- Produces:
  - `isBiometricAvailable(): Promise<boolean>`
  - `authenticate(reason?: string): Promise<boolean>`

- [ ] **Step 1: Create `services/biometric.ts`**

```ts
import * as LocalAuth from 'expo-local-authentication';

export async function isBiometricAvailable(): Promise<boolean> {
  const [compatible, enrolled] = await Promise.all([
    LocalAuth.hasHardwareAsync(),
    LocalAuth.isEnrolledAsync(),
  ]);
  return compatible && enrolled;
}

export async function authenticate(reason = '驗證身份以進入記帳'): Promise<boolean> {
  const result = await LocalAuth.authenticateAsync({
    promptMessage: reason,
    disableDeviceFallback: false,
  });
  return result.success;
}
```

- [ ] **Step 2: Commit**

```powershell
git add services/biometric.ts
git commit -m "feat: add biometric service"
```

---

### Task 6: app/_layout.tsx + app/(auth)/unlock.tsx

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/(auth)/unlock.tsx`

**Interfaces:**
- Consumes: `services/crypto.ts`, `services/biometric.ts`
- Produces: root navigation stack with auth gate; app-wide `CryptoKeyContext` holding the unlocked AES key

- [ ] **Step 1: Create `app/_layout.tsx`**

```tsx
// MUST be first — patches global.crypto before any crypto calls
import 'react-native-quick-crypto';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { hasPIN } from '../services/crypto';

type KeyCtx = { cryptoKey: CryptoKey | null; setCryptoKey: (k: CryptoKey) => void };
const KeyContext = createContext<KeyCtx>({ cryptoKey: null, setCryptoKey: () => {} });

export function useCryptoKey() { return useContext(KeyContext); }

export default function RootLayout() {
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hasPIN().then(has => {
      if (!has) router.replace('/(auth)/unlock?setup=1');
      else      router.replace('/(auth)/unlock');
    }).finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <KeyContext.Provider value={{ cryptoKey, setCryptoKey }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/unlock" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modals/add-tx" options={{ presentation: 'modal' }} />
        <Stack.Screen name="modals/add-recurring" options={{ presentation: 'modal' }} />
        <Stack.Screen name="modals/add-goal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="modals/add-asset" options={{ presentation: 'modal' }} />
      </Stack>
    </KeyContext.Provider>
  );
}
```

- [ ] **Step 2: Create `app/(auth)/unlock.tsx`**

```tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, Vibration,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  verifyPIN, setupPIN, recordFail, clearFails,
  failCount, lockUntil, biometricEnabled, enableBiometric, loadBiometricKey,
} from '../../services/crypto';
import { isBiometricAvailable, authenticate } from '../../services/biometric';
import { useCryptoKey } from '../_layout';
import { THEME as T } from '../../constants/theme';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
const PIN_LEN = 6;

export default function UnlockScreen() {
  const { setup } = useLocalSearchParams<{ setup?: string }>();
  const isSetup = setup === '1';
  const { setCryptoKey } = useCryptoKey();

  const [digits, setDigits]   = useState('');
  const [confirm, setConfirm] = useState('');   // only in setup: second entry
  const [stage, setStage]     = useState<'enter'|'confirm'>('enter');
  const [locked, setLocked]   = useState(false);
  const [lockMsg, setLockMsg] = useState('');

  // Check lockout on mount
  useEffect(() => {
    lockUntil().then(until => {
      if (until > Date.now()) {
        setLocked(true);
        setLockMsg(`請等待 ${Math.ceil((until - Date.now()) / 1000)} 秒`);
      }
    });
  }, []);

  // Auto-trigger biometric on unlock screen (not setup)
  useEffect(() => {
    if (!isSetup) tryBiometric();
  }, []);

  async function tryBiometric() {
    const available = await isBiometricAvailable();
    const enabled   = await biometricEnabled();
    if (!available || !enabled) return;
    const ok = await authenticate();
    if (ok) {
      const key = await loadBiometricKey();
      if (key) unlock(key);
    }
  }

  function press(k: string) {
    if (locked) return;
    if (k === '⌫') {
      setDigits(d => d.slice(0, -1));
      return;
    }
    if (k === '') return;
    const next = digits + k;
    if (next.length > PIN_LEN) return;
    setDigits(next);
    if (next.length === PIN_LEN) handleComplete(next);
  }

  async function handleComplete(pin: string) {
    if (isSetup) {
      if (stage === 'enter') {
        setConfirm(pin);
        setDigits('');
        setStage('confirm');
      } else {
        if (pin !== confirm) {
          Alert.alert('PIN 不一致', '請重新輸入');
          setDigits(''); setConfirm(''); setStage('enter');
          return;
        }
        await setupPIN(pin);
        const key = await verifyPIN(pin);
        if (key) unlock(key);
      }
    } else {
      const until = await lockUntil();
      if (until > Date.now()) {
        setDigits('');
        setLocked(true);
        setLockMsg(`請等待 ${Math.ceil((until - Date.now()) / 1000)} 秒`);
        return;
      }
      const key = await verifyPIN(pin);
      if (key) {
        await clearFails();
        const available = await isBiometricAvailable();
        const enabled   = await biometricEnabled();
        if (available && !enabled) {
          Alert.alert('啟用生物辨識', '下次使用 Face ID / Touch ID 解鎖？', [
            { text: '不用', style: 'cancel' },
            { text: '啟用', onPress: () => enableBiometric(key) },
          ]);
        }
        unlock(key);
      } else {
        Vibration.vibrate(200);
        const n = await recordFail();
        setDigits('');
        if (n >= 5) {
          const until2 = await lockUntil();
          setLocked(true);
          setLockMsg(`請等待 ${Math.ceil((until2 - Date.now()) / 1000)} 秒`);
        } else {
          Alert.alert('PIN 錯誤', `剩餘 ${5 - n} 次嘗試`);
        }
      }
    }
  }

  function unlock(key: CryptoKey) {
    setCryptoKey(key);
    router.replace('/(tabs)');
  }

  const dots = Array.from({ length: PIN_LEN }, (_, i) => digits.length > i);

  return (
    <View style={s.container}>
      <Text style={s.title}>
        {isSetup
          ? stage === 'enter' ? '設定 PIN 碼' : '再次輸入確認'
          : '輸入 PIN 碼'}
      </Text>

      {/* Dot indicators */}
      <View style={s.dots}>
        {dots.map((filled, i) => (
          <View key={i} style={[s.dot, filled && s.dotFilled]} />
        ))}
      </View>

      {locked && <Text style={s.lockMsg}>{lockMsg}</Text>}

      {/* Keypad */}
      <View style={s.keypad}>
        {KEYS.map((k, i) => (
          <Pressable
            key={i}
            style={({ pressed }) => [s.key, k === '' && s.keyHidden, pressed && s.keyPressed]}
            onPress={() => press(k)}
            disabled={k === ''}
          >
            <Text style={s.keyText}>{k}</Text>
          </Pressable>
        ))}
      </View>

      {!isSetup && (
        <Pressable onPress={tryBiometric} style={s.bioBtn}>
          <Text style={s.bioText}>使用 Face ID / Touch ID</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex:1, backgroundColor:T.colors.bg, alignItems:'center', justifyContent:'center' },
  title:      { fontSize:T.font.xl, fontWeight:'600', color:T.colors.text, marginBottom:T.space.xl },
  dots:       { flexDirection:'row', gap:T.space.lg, marginBottom:T.space.xl },
  dot:        { width:14, height:14, borderRadius:7, borderWidth:2, borderColor:T.colors.primary },
  dotFilled:  { backgroundColor:T.colors.primary },
  lockMsg:    { color:T.colors.danger, marginBottom:T.space.md },
  keypad:     { flexDirection:'row', flexWrap:'wrap', width:270 },
  key:        { width:90, height:72, alignItems:'center', justifyContent:'center' },
  keyHidden:  { opacity:0 },
  keyPressed: { backgroundColor:T.colors.border, borderRadius:T.radius.full },
  keyText:    { fontSize:T.font.xxl, color:T.colors.text },
  bioBtn:     { marginTop:T.space.xl },
  bioText:    { color:T.colors.primary, fontSize:T.font.md },
});
```

Note: `expo-haptics` is part of expo — if it's missing run `npx expo install expo-haptics`.

- [ ] **Step 3: Verify auth screens render**

```powershell
npx expo start
```

In Expo Go: should see PIN setup screen (6 dots + keypad). Enter a 6-digit PIN twice, should navigate to tabs (which shows 404 until Task 9). 

- [ ] **Step 4: Commit**

```powershell
git add app/
git commit -m "feat: add root layout with auth gate and PIN unlock screen"
```

---

### Task 7: hooks/useAppData.ts + hooks/useToast.ts

**Files:**
- Create: `hooks/useAppData.ts`
- Create: `hooks/useToast.ts`

**Interfaces:**
- Consumes: `services/storage.ts`, `services/crypto.ts`, `useCryptoKey()`
- Produces:
  - `AppData` type with all state fields
  - `useAppData()` hook: `{ data, loading, addTxn, deleteTxn, save }`
  - `useToast()` hook: `{ toasts, showToast, dismissToast }`

- [ ] **Step 1: Create `hooks/useToast.ts`**

```ts
import { useState, useCallback } from 'react';

export type Toast = { id: string; msg: string; type: 'success' | 'error' | 'info' };

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((msg: string, type: Toast['type'] = 'success') => {
    const id = Date.now().toString(36);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}
```

- [ ] **Step 2: Define shared data types**

Create `types/app.ts`:

```ts
export type TxType = 'expense' | 'income' | 'saving' | 'recurring';

export interface Txn {
  id: string;
  date: string;        // YYYY-MM-DD
  type: TxType;
  category: string;
  amount: number;
  currency: string;
  note: string;
  ccy_amount?: number; // foreign currency amount if currency !== 'TWD'
}

export interface Recurring {
  id: string;
  name: string;
  category: string;
  amount: number;
  freq: 'monthly' | 'yearly' | 'quarterly';
  nextDate: string;
  note: string;
}

export interface Goal {
  id: string;
  name: string;
  category: string;
  target: number;
  current: number;
  deadline?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  amount: number;
  currency: string;
  note: string;
}

export interface Budget {
  category: string;
  amount: number;
  month: string; // YYYY-MM
}

export interface SyncConfig {
  url: string;
  token: string;
  lastSync: string | null;
  autoMins: number;
}
```

- [ ] **Step 3: Create `hooks/useAppData.ts`**

```ts
import { useState, useEffect, useCallback } from 'react';
import { KEYS, loadRaw, saveRaw, loadJson, saveJson } from '../services/storage';
import { encryptStr, decryptStr } from '../services/crypto';
import { useCryptoKey } from '../app/_layout';
import { Txn, Recurring, Goal, Asset, Budget, SyncConfig } from '../types/app';

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function today() { return new Date().toISOString().slice(0, 10); }

export interface AppData {
  txns:      Txn[];
  recurring: Recurring[];
  goals:     Goal[];
  pending:   Txn[];
  assets:    Asset[];
  budgets:   Budget[];
  sync:      SyncConfig;
}

const DEFAULT: AppData = {
  txns: [], recurring: [], goals: [], pending: [],
  assets: [], budgets: [],
  sync: { url: '', token: '', lastSync: null, autoMins: 0 },
};

async function decryptOrRaw<T>(raw: string | null, key: CryptoKey | null): Promise<T | null> {
  if (!raw) return null;
  if (!key) {
    try { return JSON.parse(raw) as T; } catch { return null; }
  }
  try {
    // Check if it looks like encrypted (has a dot separator)
    if (raw.includes('.')) {
      const plain = await decryptStr(key, raw);
      return JSON.parse(plain) as T;
    }
    return JSON.parse(raw) as T;
  } catch { return null; }
}

async function encryptAndSave(k: string, data: unknown, key: CryptoKey | null) {
  const json = JSON.stringify(data);
  if (key) {
    const cipher = await encryptStr(key, json);
    await saveRaw(k, cipher);
  } else {
    await saveRaw(k, json);
  }
}

export function useAppData() {
  const { cryptoKey } = useCryptoKey();
  const [data, setData] = useState<AppData>(DEFAULT);
  const [loading, setLoading] = useState(true);

  // Load all data on mount (or when key becomes available)
  useEffect(() => {
    if (cryptoKey === null) return; // wait for unlock
    (async () => {
      const [txns, recurring, goals, pending, assets, budgets, sync] = await Promise.all([
        decryptOrRaw<Txn[]>(await loadRaw(KEYS.txns), cryptoKey),
        decryptOrRaw<Recurring[]>(await loadRaw(KEYS.recurring), cryptoKey),
        decryptOrRaw<Goal[]>(await loadRaw(KEYS.goals), cryptoKey),
        decryptOrRaw<Txn[]>(await loadRaw(KEYS.pending), cryptoKey),
        decryptOrRaw<Asset[]>(await loadRaw(KEYS.assets), cryptoKey),
        decryptOrRaw<Budget[]>(await loadRaw(KEYS.budgets), cryptoKey),
        loadJson<SyncConfig>(KEYS.sync),
      ]);
      setData({
        txns:      txns      ?? [],
        recurring: recurring ?? [],
        goals:     goals     ?? [],
        pending:   pending   ?? [],
        assets:    assets    ?? [],
        budgets:   budgets   ?? [],
        sync:      sync      ?? DEFAULT.sync,
      });
      setLoading(false);
    })();
  }, [cryptoKey]);

  const saveTxns = useCallback(async (next: Txn[]) => {
    setData(d => ({ ...d, txns: next }));
    await encryptAndSave(KEYS.txns, next, cryptoKey);
  }, [cryptoKey]);

  const addTxn = useCallback(async (t: Omit<Txn, 'id'>) => {
    const next = [{ ...t, id: uid() }, ...data.txns];
    await saveTxns(next);
  }, [data.txns, saveTxns]);

  const deleteTxn = useCallback(async (id: string) => {
    const next = data.txns.filter(t => t.id !== id);
    await saveTxns(next);
  }, [data.txns, saveTxns]);

  return { data, loading, addTxn, deleteTxn };
}
```

- [ ] **Step 4: Commit**

```powershell
git add hooks/ types/
git commit -m "feat: add useAppData hook and data types"
```

---

### Task 8: Shared Components

**Files:**
- Create: `components/Toast.tsx`
- Create: `components/Section.tsx`
- Create: `components/Empty.tsx`
- Create: `components/TxRow.tsx`
- Create: `components/MonthNav.tsx`

**Interfaces:**
- `Toast`: receives `toasts: Toast[]` + `onDismiss`
- `Section`: receives `title: string`
- `Empty`: receives `label: string`
- `TxRow`: receives `txn: Txn` + `onDelete?: () => void`
- `MonthNav`: receives `month: string` (YYYY-MM) + `onPrev/onNext: () => void`

- [ ] **Step 1: Create `components/Toast.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Toast as ToastT } from '../hooks/useToast';
import { THEME as T } from '../constants/theme';

export function Toast({ toasts }: { toasts: ToastT[] }) {
  if (!toasts.length) return null;
  return (
    <View style={s.wrap} pointerEvents="none">
      {toasts.map(t => (
        <View key={t.id} style={[s.box, t.type === 'error' && s.error, t.type === 'info' && s.info]}>
          <Text style={s.txt}>{t.msg}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { position:'absolute', top:60, left:0, right:0, alignItems:'center', zIndex:999 },
  box:   { backgroundColor:'#323232', paddingHorizontal:T.space.lg, paddingVertical:T.space.sm, borderRadius:T.radius.full, marginBottom:T.space.xs },
  error: { backgroundColor:T.colors.danger },
  info:  { backgroundColor:T.colors.primary },
  txt:   { color:'#fff', fontSize:T.font.sm },
});
```

- [ ] **Step 2: Create `components/Section.tsx`**

```tsx
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { THEME as T } from '../constants/theme';

export function Section({ title }: { title: string }) {
  return <Text style={s.txt}>{title}</Text>;
}

const s = StyleSheet.create({
  txt: { fontSize:T.font.sm, color:T.colors.textSec, fontWeight:'600',
         paddingHorizontal:T.space.lg, paddingTop:T.space.lg, paddingBottom:T.space.xs,
         textTransform:'uppercase', letterSpacing:0.5 },
});
```

- [ ] **Step 3: Create `components/Empty.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME as T } from '../constants/theme';

export function Empty({ label }: { label: string }) {
  return (
    <View style={s.wrap}>
      <Text style={s.icon}>📭</Text>
      <Text style={s.txt}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems:'center', paddingVertical:T.space.xxl },
  icon: { fontSize:40, marginBottom:T.space.sm },
  txt:  { color:T.colors.textSec, fontSize:T.font.md },
});
```

- [ ] **Step 4: Create `components/TxRow.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Txn } from '../types/app';
import { ICONS, TYPE_COLOR } from '../constants/categories';
import { THEME as T } from '../constants/theme';

function fmtMoney(n: number) { return Number(n).toLocaleString('zh-TW', { maximumFractionDigits: 0 }); }
function fmtDate(d: string) { const t = new Date(d); return `${t.getMonth()+1}/${t.getDate()}`; }

export function TxRow({ txn, onDelete }: { txn: Txn; onDelete?: () => void }) {
  const color = TYPE_COLOR[txn.type] ?? TYPE_COLOR.expense;
  const icon  = ICONS[txn.category] ?? '📦';
  const sign  = txn.type === 'income' ? '+' : '-';

  return (
    <Pressable style={s.row} onLongPress={onDelete}>
      <View style={[s.icon, { backgroundColor: color.light }]}>
        <Text style={s.iconTxt}>{icon}</Text>
      </View>
      <View style={s.info}>
        <Text style={s.cat}>{txn.category}</Text>
        {!!txn.note && <Text style={s.note} numberOfLines={1}>{txn.note}</Text>}
      </View>
      <View style={s.right}>
        <Text style={[s.amt, { color: color.bg }]}>
          {sign} NT${fmtMoney(txn.amount)}
        </Text>
        <Text style={s.date}>{fmtDate(txn.date)}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row:     { flexDirection:'row', alignItems:'center', padding:T.space.md, backgroundColor:T.colors.surface },
  icon:    { width:40, height:40, borderRadius:T.radius.sm, alignItems:'center', justifyContent:'center', marginRight:T.space.md },
  iconTxt: { fontSize:20 },
  info:    { flex:1 },
  cat:     { fontSize:T.font.md, fontWeight:'500', color:T.colors.text },
  note:    { fontSize:T.font.sm, color:T.colors.textSec, marginTop:2 },
  right:   { alignItems:'flex-end' },
  amt:     { fontSize:T.font.md, fontWeight:'600' },
  date:    { fontSize:T.font.xs, color:T.colors.textSec, marginTop:2 },
});
```

- [ ] **Step 5: Create `components/MonthNav.tsx`**

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { THEME as T } from '../constants/theme';

export function MonthNav({
  month, onPrev, onNext,
}: { month: string; onPrev: () => void; onNext: () => void }) {
  const [y, m] = month.split('-');
  const label = `${y} 年 ${Number(m)} 月`;
  const isNow = month === new Date().toISOString().slice(0, 7);

  return (
    <View style={s.row}>
      <Pressable onPress={onPrev} style={s.btn}><Text style={s.arrow}>‹</Text></Pressable>
      <Text style={s.label}>{label}</Text>
      <Pressable onPress={onNext} style={[s.btn, isNow && s.btnDisabled]} disabled={isNow}>
        <Text style={[s.arrow, isNow && s.arrowDisabled]}>›</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row:          { flexDirection:'row', alignItems:'center', justifyContent:'center',
                  backgroundColor:T.colors.surface, paddingVertical:T.space.sm, borderBottomWidth:StyleSheet.hairlineWidth, borderColor:T.colors.sep },
  btn:          { paddingHorizontal:T.space.lg, paddingVertical:T.space.sm },
  btnDisabled:  { opacity:0.3 },
  arrow:        { fontSize:T.font.xxl, color:T.colors.primary, lineHeight:30 },
  arrowDisabled:{ color:T.colors.textSec },
  label:        { fontSize:T.font.lg, fontWeight:'600', color:T.colors.text, minWidth:120, textAlign:'center' },
});
```

- [ ] **Step 6: Commit**

```powershell
git add components/
git commit -m "feat: add shared UI components"
```

---

### Task 9: app/(tabs)/_layout.tsx + placeholder tabs

**Files:**
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/recurring.tsx`
- Create: `app/(tabs)/goals.tsx`
- Create: `app/(tabs)/assets.tsx`
- Create: `app/(tabs)/stats.tsx`
- Create: `app/(tabs)/more.tsx`

**Interfaces:**
- Produces: bottom tab bar with 6 tabs (index + 5 placeholders)

- [ ] **Step 1: Create `app/(tabs)/_layout.tsx`**

```tsx
import { Tabs } from 'expo-router';
import { THEME as T } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   T.colors.primary,
        tabBarInactiveTintColor: T.colors.textSec,
        tabBarStyle: { backgroundColor: T.colors.surface, borderTopColor: T.colors.sep },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index"     options={{ title:'首頁',   tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }} />
      <Tabs.Screen name="txns"      options={{ title:'明細',   tabBarIcon: ({ color }) => <TabIcon emoji="📋" color={color} /> }} />
      <Tabs.Screen name="recurring" options={{ title:'固定',   tabBarIcon: ({ color }) => <TabIcon emoji="🔁" color={color} /> }} />
      <Tabs.Screen name="goals"     options={{ title:'目標',   tabBarIcon: ({ color }) => <TabIcon emoji="🎯" color={color} /> }} />
      <Tabs.Screen name="assets"    options={{ title:'資產',   tabBarIcon: ({ color }) => <TabIcon emoji="💰" color={color} /> }} />
      <Tabs.Screen name="stats"     options={{ title:'統計',   tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} /> }} />
      <Tabs.Screen name="more"      options={{ title:'更多',   tabBarIcon: ({ color }) => <TabIcon emoji="⋯" color={color} /> }} />
    </Tabs>
  );
}

import { Text } from 'react-native';
function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 20, opacity: color === '#007AFF' ? 1 : 0.6 }}>{emoji}</Text>;
}
```

- [ ] **Step 2: Create placeholder screens**

`app/(tabs)/recurring.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function Recurring() {
  return <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><Text>固定扣款（開發中）</Text></View>;
}
```

Same pattern for `goals.tsx`, `assets.tsx`, `stats.tsx`, `more.tsx` — change the label text.

- [ ] **Step 3: Verify tab bar appears**

Run `npx expo start`, scan in Expo Go. After PIN unlock, should see 7-tab navigation bar. Tabs 3-7 show placeholder text.

- [ ] **Step 4: Commit**

```powershell
git add app/\(tabs\)/
git commit -m "feat: add tab navigator and placeholder screens"
```

---

### Task 10: app/(tabs)/index.tsx — Home Screen

**Files:**
- Create: `app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `useAppData()`, `useToast()`, `MonthNav`, `TxRow`, `Section`, `Empty`, `Toast`
- Produces: home screen with monthly income/expense summary card, current month recent txns (last 5), FAB to open add-tx modal

- [ ] **Step 1: Create `app/(tabs)/index.tsx`**

```tsx
import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useAppData } from '../../hooks/useAppData';
import { useToast } from '../../hooks/useToast';
import { MonthNav } from '../../components/MonthNav';
import { TxRow } from '../../components/TxRow';
import { Section } from '../../components/Section';
import { Empty } from '../../components/Empty';
import { Toast } from '../../components/Toast';
import { THEME as T } from '../../constants/theme';
import { Txn } from '../../types/app';

function fmtMoney(n: number) { return Number(n).toLocaleString('zh-TW', { maximumFractionDigits: 0 }); }

function prevMonth(m: string) {
  const d = new Date(m + '-01');
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}
function nextMonth(m: string) {
  const d = new Date(m + '-01');
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 7);
}

export default function HomeScreen() {
  const { data, loading, deleteTxn } = useAppData();
  const { toasts, showToast } = useToast();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const monthTxns = useMemo(
    () => data.txns.filter(t => t.date.startsWith(month)),
    [data.txns, month]
  );

  const income  = useMemo(() => monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTxns]);
  const expense = useMemo(() => monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthTxns]);
  const balance = income - expense;

  const recent = monthTxns.slice(0, 5);

  async function handleDelete(t: Txn) {
    await deleteTxn(t.id);
    showToast('已刪除');
  }

  if (loading) return (
    <SafeAreaView style={s.safe}><Text style={s.loading}>載入中…</Text></SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <MonthNav month={month} onPrev={() => setMonth(prevMonth(month))} onNext={() => setMonth(nextMonth(month))} />

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Summary card */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <View style={s.cardItem}>
              <Text style={s.cardLabel}>收入</Text>
              <Text style={[s.cardAmt, { color: T.colors.success }]}>NT${fmtMoney(income)}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.cardItem}>
              <Text style={s.cardLabel}>支出</Text>
              <Text style={[s.cardAmt, { color: T.colors.danger }]}>NT${fmtMoney(expense)}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.cardItem}>
              <Text style={s.cardLabel}>結餘</Text>
              <Text style={[s.cardAmt, { color: balance >= 0 ? T.colors.text : T.colors.danger }]}>
                NT${fmtMoney(Math.abs(balance))}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent txns */}
        <Section title={`本月記錄（${monthTxns.length}）`} />
        {recent.length === 0
          ? <Empty label="本月尚無記錄" />
          : recent.map(t => (
              <TxRow key={t.id} txn={t} onDelete={() => handleDelete(t)} />
            ))
        }
        {monthTxns.length > 5 && (
          <Pressable style={s.more} onPress={() => router.push('/(tabs)/txns')}>
            <Text style={s.moreText}>查看全部 {monthTxns.length} 筆 →</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable style={s.fab} onPress={() => router.push('/modals/add-tx')}>
        <Text style={s.fabText}>＋</Text>
      </Pressable>

      <Toast toasts={toasts} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex:1, backgroundColor:T.colors.bg },
  loading:   { textAlign:'center', marginTop:T.space.xxl, color:T.colors.textSec },
  scroll:    { paddingBottom:100 },
  card:      { margin:T.space.lg, backgroundColor:T.colors.surface, borderRadius:T.radius.lg, padding:T.space.lg },
  cardRow:   { flexDirection:'row' },
  cardItem:  { flex:1, alignItems:'center' },
  divider:   { width:StyleSheet.hairlineWidth, backgroundColor:T.colors.sep },
  cardLabel: { fontSize:T.font.sm, color:T.colors.textSec, marginBottom:T.space.xs },
  cardAmt:   { fontSize:T.font.lg, fontWeight:'700' },
  more:      { alignItems:'center', padding:T.space.md },
  moreText:  { color:T.colors.primary, fontSize:T.font.sm },
  fab:       { position:'absolute', right:T.space.xl, bottom:T.space.xl, width:56, height:56,
               borderRadius:28, backgroundColor:T.colors.primary, alignItems:'center', justifyContent:'center',
               shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.25, shadowRadius:4, elevation:5 },
  fabText:   { color:'#fff', fontSize:T.font.xxl, lineHeight:56, textAlign:'center' },
});
```

- [ ] **Step 2: Verify home screen**

Run in Expo Go: after unlock, home screen should show 0/0 summary and empty state. Tapping FAB navigates to (missing) add-tx modal — shows 404 until Task 11.

- [ ] **Step 3: Commit**

```powershell
git add "app/(tabs)/index.tsx"
git commit -m "feat: add home screen with monthly summary"
```

---

### Task 11: app/modals/add-tx.tsx

**Files:**
- Create: `app/modals/add-tx.tsx`

**Interfaces:**
- Consumes: `useAppData().addTxn`, `DEFAULT_CATS`, `TYPE_COLOR`, `TYPE_LABEL`
- Produces: full-screen modal to add a transaction (type, category, amount, date, note)

- [ ] **Step 1: Create `app/modals/add-tx.tsx`**

```tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable,
  SafeAreaView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAppData } from '../../hooks/useAppData';
import { DEFAULT_CATS, TYPE_COLOR, TYPE_LABEL, ICONS } from '../../constants/categories';
import { THEME as T } from '../../constants/theme';
import { TxType } from '../../types/app';

const TYPES: TxType[] = ['expense', 'income', 'saving'];

function today() { return new Date().toISOString().slice(0, 10); }

export default function AddTxModal() {
  const { addTxn } = useAppData();
  const [type, setType]       = useState<TxType>('expense');
  const [category, setCategory] = useState(DEFAULT_CATS.expense[0]);
  const [amount, setAmount]   = useState('');
  const [date, setDate]       = useState(today());
  const [note, setNote]       = useState('');
  const [saving, setSaving]   = useState(false);

  const cats = DEFAULT_CATS[type] as readonly string[];
  const color = TYPE_COLOR[type];

  function handleTypeChange(t: TxType) {
    setType(t);
    setCategory((DEFAULT_CATS[t] as readonly string[])[0]);
  }

  async function handleSave() {
    const n = parseFloat(amount);
    if (!n || n <= 0) { Alert.alert('請輸入金額'); return; }
    setSaving(true);
    await addTxn({ type, category, amount: n, date, note, currency: 'TWD' });
    router.back();
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':'height'}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.cancelBtn}>
            <Text style={s.cancel}>取消</Text>
          </Pressable>
          <Text style={s.title}>新增記帳</Text>
          <Pressable onPress={handleSave} style={[s.saveBtn, { backgroundColor: color.bg }]} disabled={saving}>
            <Text style={s.save}>儲存</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.body}>
          {/* Type selector */}
          <View style={s.typeRow}>
            {TYPES.map(t => (
              <Pressable
                key={t}
                style={[s.typeBtn, type === t && { backgroundColor: TYPE_COLOR[t].bg }]}
                onPress={() => handleTypeChange(t)}
              >
                <Text style={[s.typeTxt, type === t && s.typeTxtActive]}>
                  {TYPE_LABEL[t]}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Amount */}
          <View style={s.field}>
            <Text style={s.label}>金額 (NT$)</Text>
            <TextInput
              style={s.amtInput}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={T.colors.sep}
            />
          </View>

          {/* Category */}
          <View style={s.field}>
            <Text style={s.label}>類別</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll}>
              {cats.map(c => (
                <Pressable
                  key={c}
                  style={[s.catBtn, category === c && { backgroundColor: color.bg }]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={s.catIcon}>{ICONS[c] ?? '📦'}</Text>
                  <Text style={[s.catTxt, category === c && s.catTxtActive]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Date */}
          <View style={s.field}>
            <Text style={s.label}>日期</Text>
            <TextInput
              style={s.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={T.colors.sep}
            />
          </View>

          {/* Note */}
          <View style={s.field}>
            <Text style={s.label}>備注</Text>
            <TextInput
              style={[s.input, s.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder="選填"
              placeholderTextColor={T.colors.sep}
              multiline
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex:1, backgroundColor:T.colors.bg },
  header:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
                  padding:T.space.lg, backgroundColor:T.colors.surface, borderBottomWidth:StyleSheet.hairlineWidth, borderColor:T.colors.sep },
  cancelBtn:    { minWidth:60 },
  cancel:       { color:T.colors.primary, fontSize:T.font.md },
  title:        { fontSize:T.font.lg, fontWeight:'600' },
  saveBtn:      { paddingHorizontal:T.space.md, paddingVertical:6, borderRadius:T.radius.sm, minWidth:60, alignItems:'center' },
  save:         { color:'#fff', fontWeight:'600' },
  body:         { padding:T.space.lg, gap:T.space.lg },
  typeRow:      { flexDirection:'row', gap:T.space.sm },
  typeBtn:      { flex:1, paddingVertical:T.space.sm, borderRadius:T.radius.sm,
                  backgroundColor:T.colors.surface, alignItems:'center', borderWidth:1, borderColor:T.colors.sep },
  typeTxt:      { fontSize:T.font.sm, color:T.colors.textSec, fontWeight:'500' },
  typeTxtActive:{ color:'#fff' },
  field:        { gap:T.space.xs },
  label:        { fontSize:T.font.sm, color:T.colors.textSec, fontWeight:'500' },
  amtInput:     { fontSize:T.font.h1, fontWeight:'700', color:T.colors.text,
                  backgroundColor:T.colors.surface, borderRadius:T.radius.md, padding:T.space.lg },
  input:        { fontSize:T.font.md, backgroundColor:T.colors.surface, borderRadius:T.radius.md,
                  padding:T.space.md, color:T.colors.text },
  noteInput:    { minHeight:80, textAlignVertical:'top' },
  catScroll:    { marginHorizontal:-T.space.lg },
  catBtn:       { alignItems:'center', paddingHorizontal:T.space.md, paddingVertical:T.space.sm,
                  borderRadius:T.radius.sm, marginLeft:T.space.sm, backgroundColor:T.colors.surface,
                  borderWidth:1, borderColor:T.colors.sep },
  catIcon:      { fontSize:22 },
  catTxt:       { fontSize:T.font.xs, color:T.colors.textSec, marginTop:2 },
  catTxtActive: { color:'#fff' },
});
```

- [ ] **Step 2: Verify add-tx flow**

In Expo Go:
1. Unlock with PIN
2. Home screen shows summary
3. Tap "＋" FAB → add-tx modal slides up
4. Select type, enter amount, pick category, tap 儲存
5. Returns to home screen; new txn appears in "近期記錄"

- [ ] **Step 3: Commit**

```powershell
git add app/modals/
git commit -m "feat: add transaction modal"
```

---

### Task 12: app/(tabs)/txns.tsx — Transaction List

**Files:**
- Create: `app/(tabs)/txns.tsx`

**Interfaces:**
- Consumes: `useAppData()`, `MonthNav`, `TxRow`, `Section`, `Empty`

- [ ] **Step 1: Create `app/(tabs)/txns.tsx`**

```tsx
import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, Text, SafeAreaView } from 'react-native';
import { useAppData } from '../../hooks/useAppData';
import { MonthNav } from '../../components/MonthNav';
import { TxRow } from '../../components/TxRow';
import { Empty } from '../../components/Empty';
import { THEME as T } from '../../constants/theme';
import { Txn } from '../../types/app';

function prevMonth(m: string) { const d=new Date(m+'-01'); d.setMonth(d.getMonth()-1); return d.toISOString().slice(0,7); }
function nextMonth(m: string) { const d=new Date(m+'-01'); d.setMonth(d.getMonth()+1); return d.toISOString().slice(0,7); }
function fmtMoney(n: number) { return Number(n).toLocaleString('zh-TW',{maximumFractionDigits:0}); }

export default function TxnsScreen() {
  const { data, loading, deleteTxn } = useAppData();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const monthTxns = useMemo(
    () => [...data.txns.filter(t => t.date.startsWith(month))].sort((a,b) => b.date.localeCompare(a.date)),
    [data.txns, month]
  );

  const income  = useMemo(() => monthTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0), [monthTxns]);
  const expense = useMemo(() => monthTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0), [monthTxns]);

  if (loading) return <SafeAreaView style={s.safe}><Text style={{textAlign:'center',marginTop:40}}>載入中…</Text></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <MonthNav month={month} onPrev={()=>setMonth(prevMonth(month))} onNext={()=>setMonth(nextMonth(month))} />
      <View style={s.summary}>
        <Text style={[s.sumAmt, {color:T.colors.success}]}>收入 NT${fmtMoney(income)}</Text>
        <Text style={s.sumSep}> / </Text>
        <Text style={[s.sumAmt, {color:T.colors.danger}]}>支出 NT${fmtMoney(expense)}</Text>
      </View>
      <FlatList<Txn>
        data={monthTxns}
        keyExtractor={t => t.id}
        renderItem={({ item }) => <TxRow txn={item} onDelete={() => deleteTxn(item.id)} />}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={<Empty label="本月尚無記錄" />}
        contentContainerStyle={monthTxns.length===0 ? {flex:1} : undefined}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex:1, backgroundColor:T.colors.bg },
  summary: { flexDirection:'row', alignItems:'center', justifyContent:'center',
             backgroundColor:T.colors.surface, paddingVertical:T.space.sm, borderBottomWidth:StyleSheet.hairlineWidth, borderColor:T.colors.sep },
  sumAmt:  { fontSize:T.font.sm, fontWeight:'600' },
  sumSep:  { color:T.colors.textSec },
  sep:     { height:StyleSheet.hairlineWidth, backgroundColor:T.colors.sep, marginLeft:56+T.space.md*2 },
});
```

- [ ] **Step 2: Verify txns screen**

Tap the "明細" tab — shows all current-month transactions sorted by date, with month navigation. Long-press a row to delete.

- [ ] **Step 3: Final commit**

```powershell
git add "app/(tabs)/txns.tsx"
git commit -m "feat: add txns list screen"
```

---

## Self-Review

### Spec Coverage

| Design doc requirement | Covered in task |
|---|---|
| Expo Router file-based routing | Task 1 |
| constants/theme.ts | Task 2 |
| constants/categories.ts (DEFAULT_CATS, ICONS, TYPE_COLOR…) | Task 2 |
| services/storage.ts (AsyncStorage, KEYS matching web app) | Task 3 |
| services/crypto.ts (PBKDF2 + AES-GCM) | Task 4 |
| services/biometric.ts (expo-local-authentication) | Task 5 |
| Root layout auth gate | Task 6 |
| unlock.tsx (PIN + biometric) | Task 6 |
| MAX_FAILS=5, exponential backoff | Task 6 (crypto.ts recordFail) |
| useAppData.ts | Task 7 |
| useToast.ts | Task 7 |
| Toast, Section, Empty, TxRow, MonthNav components | Task 8 |
| (tabs)/_layout.tsx | Task 9 |
| index.tsx home screen | Task 10 |
| add-tx.tsx modal | Task 11 |
| txns.tsx list | Task 12 |

### NOT in this plan (Phase 2+)
- recurring.tsx, goals.tsx, assets.tsx, stats.tsx, more.tsx full screens
- Supabase cloud sync
- Binance integration
- AI analysis, voice input, receipt scanning
- EAS Build setup
- Dark mode

### Placeholder Scan
All code blocks are complete. No "TODO" or "TBD" present.

### Type Consistency
- `Txn`, `TxType` defined in `types/app.ts` (Task 7), used identically in TxRow (Task 8), index.tsx (Task 10), add-tx.tsx (Task 11), txns.tsx (Task 12).
- `KEYS` from `services/storage.ts` used in `hooks/useAppData.ts` — keys match.
- `useCryptoKey()` exported from `app/_layout.tsx`, imported in `hooks/useAppData.ts` and `app/(auth)/unlock.tsx` — consistent.
