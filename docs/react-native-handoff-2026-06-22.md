# React Native Rewrite Handoff - 2026-06-22

## Current Status

This repo originally contained a single-file React web/PWA app in `index.html`.
The React Native rewrite has been scaffolded as an Expo Router project in the same repo.

The existing `index.html` was not modified and remains the production/stable version.

Phase 2 from `.claude/plans/velvet-wishing-reddy.md` has now been implemented with repo-specific safety corrections.

## Phase 2 Update

Implemented:

- Split crypto polyfills into `polyfills.native.ts` and `polyfills.web.ts`; Expo Web no longer loads `react-native-quick-crypto`.
- Added `expo-dev-client` for custom native development builds.
- Added edit/delete for recurring payments, goals, and assets.
- Added goal deposits and withdrawals.
- Added expense category and budget comparison statistics.
- Replaced the More stub with JSON export/import, encrypted Supabase sync, budget editing, PIN rotation, and app lock.
- Added input validation to Phase 2 forms and imports.

Safety corrections made after checking the real repo:

- `AppDataProvider` stays mounted for Expo Router, but does not read or write storage until the PIN has restored the crypto key. This prevents encrypted data from being replaced by empty fallback values before unlock.
- Automatic biometric entry was disabled. The existing biometric wrapper authenticates the device user but cannot restore the in-memory AES key, so treating it as a complete unlock would make encrypted data unreadable. Secure biometric key wrapping remains Phase 3 work.
- Supabase receives an encrypted blob, not the plaintext JSON shown in Claude's sample implementation.
- PIN changes atomically prepare new encrypted values and replace the verifier plus all local app data using `AsyncStorage.multiSet`.
- JSON export intentionally excludes sync tokens and Binance credentials.

Verification completed:

```powershell
npm run typecheck
npx expo export --platform web --output-dir dist-web-test
```

Both commands pass. Browser smoke test on `http://localhost:8082` also passed:

- PIN setup screen renders without QuickCrypto errors.
- A six-digit PIN can be created.
- The auth gate enters the Home screen after crypto initialization.
- A transaction survives lock, PIN unlock, and encrypted storage reload (test record removed afterward).

EAS project linking and cloud builds were not run because they require the owner's interactive Expo login. After login, run:

```powershell
npx eas-cli build:configure
npx eas-cli build --platform android --profile development
# or use --platform ios with an Apple Developer account
```

## Phase 3 Update - 2026-06-23

Implemented the approved `zazzy-splashing-peach.md` v5 plan:

- Added verified biometric key export: a PIN-derived candidate key must decrypt `fin_lock_v` to `FIN_OK` before raw key material can enter SecureStore.
- Added biometric enrollment in More settings and biometric unlock on the lock screen.
- Added explicit SecureStore restore states for success, cancellation, invalidation, and technical errors.
- Added `services/bioAuth.ts` so production restore/import/verifier/cleanup behavior is directly testable.
- PIN rotation now invalidates biometric enrollment.
- Added timestamp-based five-minute background locking with an auxiliary timer.
- `saveJson` now refuses every write when no crypto key is loaded.
- Added transaction editing, delete confirmation, currency selection, and strict calendar-date validation.
- Changed `today()` and `monthKey()` from UTC slicing to local calendar values so Asia/Taipei transactions are not assigned to the previous day before 08:00.
- Added Jest Expo infrastructure with deterministic WebCrypto, SecureStore, and AsyncStorage mocks.

Installed compatible test versions:

```txt
react                    18.3.1
react-test-renderer      18.3.1
jest                     29.7.0
jest-expo                52.0.6
@testing-library/react-native 13.3.3
```

Verification:

```powershell
npm run typecheck
npm test
npx expo export --platform web --output-dir dist-phase3-test
```

Results: TypeScript passed, all 24 Jest tests passed across 5 suites, and Expo Web bundled successfully. Browser smoke testing also passed PIN setup/unlock, local-date prefill, USD transaction creation, edit prefill, amount update, and Web delete confirmation. Native SecureStore authentication and platform-specific invalidation messages still require final EAS Development Build tests on Android/iOS hardware.

## Implemented

### Project Setup

- Added Expo SDK 52-style project config:
  - `package.json`
  - `package-lock.json`
  - `app.json`
  - `eas.json`
  - `tsconfig.json`
  - `.gitignore`
- Installed dependencies:
  - `expo`
  - `expo-router`
  - `react`
  - `react-native`
  - `@react-native-async-storage/async-storage`
  - `@react-native-picker/picker`
  - `expo-local-authentication`
  - `expo-camera`
  - `expo-av`
  - `expo-asset`
  - `react-native-quick-crypto`
  - `react-native-web`
  - `react-dom`
  - `buffer`

### App Structure

Created:

```txt
app/
  _layout.tsx
  (auth)/
    unlock.tsx
  (tabs)/
    _layout.tsx
    index.tsx
    txns.tsx
    recurring.tsx
    goals.tsx
    assets.tsx
    stats.tsx
    more.tsx
  modals/
    add-tx.tsx
    recurring-form.tsx
    goal-form.tsx
    asset-form.tsx
    voice.tsx
    receipt.tsx

components/
  Empty.tsx
  MonthNav.tsx
  PendingRow.tsx
  Section.tsx
  Toast.tsx
  TxRow.tsx

constants/
  categories.ts
  theme.ts

hooks/
  AppDataContext.tsx
  AuthContext.tsx
  useAppData.ts
  useToast.ts

services/
  ai.ts
  biometric.ts
  binance.ts
  crypto.ts
  polyfills.ts
  rates.ts
  storage.ts
  supabase.ts

types.ts
```

### Data Compatibility

The React Native scaffold preserves the existing web app storage key names:

```ts
fin_txns
fin_recurring
fin_goals
fin_sync
fin_pending
fin_assets
fin_rates
fin_binance
fin_invest
fin_budgets
fin_networth
```

Lock/PIN keys also match the existing web version:

```ts
fin_lock_v
fin_lock_salt
fin_lock_fails
fin_lock_until
fin_bio_cred
fin_bio_wrap
```

### Implemented Feature Level

This is a functional scaffold/MVP, not yet full parity with `index.html`.

Implemented:

- PIN setup/unlock route
- Auth gate in root layout
- AsyncStorage load/save wrapper
- AES-GCM/PBKDF2 service shape based on existing web logic
- Basic biometric auth wrapper with `expo-local-authentication`
- App-wide data context for:
  - transactions
  - recurring payments
  - goals
  - assets
  - sync settings
  - Binance settings
  - investments
  - budgets
  - net worth snapshots
- Tabs:
  - Home summary
  - Transaction list
  - Recurring items
  - Goals
  - Assets
  - Stats
  - More/settings
- Modal forms:
  - Add transaction
  - Add recurring payment
  - Add goal
  - Add asset
- Placeholder routes:
  - Voice input
  - Receipt scanning
- Supabase/Binance/AI service wrappers are present but not fully wired into UI.

## Verification

Completed:

```powershell
npm install
npm run typecheck
```

`npm run typecheck` passes.

Note: `tsconfig.json` intentionally excludes existing Deno/Supabase function files from the React Native app typecheck:

```txt
ai-analysis.ts
binance-proxy.ts
price-proxy.ts
supabase/
```

Those files predate the RN scaffold and use Deno globals.

## Resolved: Browser White Screen

Opening `http://localhost:8081` in a normal browser is not the right target for the native app.
That port is Metro/native bundle serving, intended for Expo Go/development builds.

Expo web was retested on `http://localhost:8082` after splitting the polyfills. The web entry now renders the PIN screen and completes PIN setup without loading the native QuickCrypto module.

Native QuickCrypto still requires a custom Expo development build rather than standard Expo Go. `expo-dev-client` and the EAS development profile are present, but the real-device build remains to be created under the owner's Expo account.

## Recommended Next Native Conversion Steps

1. Decide whether the RN rewrite should support Expo Web preview.
   - If yes, add platform-specific crypto/polyfill files.
   - If no, remove `web` script or document that browser preview is unsupported.

2. Decide crypto migration strategy.
   - Current web app encrypts data with PBKDF2 + AES-GCM.
   - RN service mirrors that shape, but compatibility must be tested on a real native build.
   - Safer migration path: export JSON from web app and import into RN app.

3. Build a development client.
   - `react-native-quick-crypto` is native and likely not available in Expo Go.
   - Use EAS development build for iOS/Android.

4. Continue feature parity in priority order:
   - transaction CRUD edit flow
   - recurring edit/delete and due-date logic
   - goal contribution/update flow
   - asset/investment details
   - CSV/JSON import/export via native share/files
   - Supabase login/sync UI
   - Binance UI
   - AI analysis UI
   - voice recording flow
   - receipt camera/OCR flow

5. Add tests once feature behavior stabilizes.
   - Start with service-level tests for storage/data transforms.
   - Add integration/manual QA checklist for unlock/add transaction/month stats.

## Useful Commands

```powershell
cd C:\Users\lyc02\記帳
npm install
npm run typecheck
npx expo start
```

For web preview after fixing platform-specific crypto:

```powershell
npx expo start --web --port 8082
```

## Git Notes

At the time of this handoff, many files are still untracked because this repo did not previously have an RN project.
`docs/` was already untracked before the RN scaffold work began.
