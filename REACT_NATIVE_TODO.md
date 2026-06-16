# React Native 轉換備忘錄
> 目標平台：iOS（iPhone）
> 建議工具：Expo + EAS Build（不需 Mac）

---

## 環境設定（從零開始）

```powershell
# 1. 安裝 Node.js（到 https://nodejs.org 下載 LTS 版）

# 2. 建立 Expo 專案
npx create-expo-app@latest 記帳App --template blank-typescript
cd 記帳App

# 3. 安裝必要套件
npx expo install @react-native-async-storage/async-storage
npx expo install expo-local-authentication
npx expo install expo-crypto
npx expo install expo-camera
npx expo install expo-av

# 4. 在 iPhone 安裝 Expo Go App（App Store 搜尋「Expo Go」）

# 5. 啟動開發伺服器，用 iPhone 掃 QR Code
npx expo start
```

---

## 需要替換的 API 對照表

| 現有（Web）| React Native 替換方案 |
|---|---|
| `localStorage` | `@react-native-async-storage/async-storage` |
| `window.crypto.subtle` | `expo-crypto` 或 `react-native-quick-crypto` |
| WebAuthn（生物辨識）| `expo-local-authentication` |
| CSS `style={}` | `StyleSheet.create({})` |
| `<div>` | `<View>` |
| `<p>`, `<span>` | `<Text>` |
| `<button>` | `<TouchableOpacity>` 或 `<Pressable>` |
| `<input>` | `<TextInput>` |
| `<select>` | `@react-native-picker/picker` |
| `position: fixed` | `position: 'absolute'` |
| `fetch()` | 不變（原生支援）|
| `overflow: hidden` + scroll | `<ScrollView>` |
| `vh`, `vw` | `Dimensions.get('window').height/width` |
| Tab Bar（自製）| `@react-navigation/bottom-tabs` |
| Modal | `<Modal>` from react-native |

---

## 主要轉換步驟

### Step 1：Storage 層（最優先，其他功能依賴它）
```javascript
// 舊（Web）
localStorage.setItem('key', value)
localStorage.getItem('key')

// 新（React Native）
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('key', value)
await AsyncStorage.getItem('key')
```

### Step 2：加密（PBKDF2 + AES-GCM）
```javascript
// expo-crypto 支援部分 Web Crypto API
// 但 PBKDF2 需要用 react-native-quick-crypto
npm install react-native-quick-crypto
```

### Step 3：生物辨識（Face ID / Touch ID）
```javascript
import * as LocalAuthentication from 'expo-local-authentication';

const result = await LocalAuthentication.authenticateAsync({
  promptMessage: '解鎖記帳 App',
});
if (result.success) { /* 解鎖成功 */ }
```

### Step 4：導航（取代 tab state）
```javascript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
const Tab = createBottomTabNavigator();
// 每個 tab 頁面獨立成一個 Screen
```

### Step 5：樣式轉換
```javascript
// 舊
const S = { card: { borderRadius: 22, background: '#fff' } }

// 新
import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  card: { borderRadius: 22, backgroundColor: '#fff' }
})
// 注意：background → backgroundColor
// 注意：沒有 box-shadow，改用 elevation（Android）/ shadow*（iOS）
```

---

## Supabase 同步
不需改動，`fetch()` 在 React Native 原生支援，Supabase SDK 也有 React Native 版：
```powershell
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
```

---

## Binance API
不需改動，`fetch()` 呼叫 Supabase Edge Function 方式完全相同。

---

## EAS Build（打包成 iOS App，不需 Mac）

```powershell
# 安裝 EAS CLI
npm install -g eas-cli

# 登入 Expo 帳號
eas login

# 設定專案
eas build:configure

# 打包 iOS（雲端打包，約 15-30 分鐘）
eas build --platform ios

# 提交到 App Store（需要 Apple Developer 帳號，年費 99 USD）
eas submit --platform ios
```

---

## 優先順序建議
1. 先完成 Binance Edge Function 部署（現有 Web 版）
2. 確認 Web 版功能都穩定
3. 再開始 React Native 轉換

---
> 更新日期：2026-06-17
