import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import { Section } from "@/components/Section";
import { DEFAULT_CATS, ICONS, KEYS, LOCK } from "@/constants/categories";
import { common, colors, spacing } from "@/constants/theme";
import { useAppDataContext } from "@/hooks/AppDataContext";
import { useAuth } from "@/hooks/AuthContext";
import { decryptStr, encryptStr, rotatePIN } from "@/services/crypto";
import { sbPull, sbPush, sbSession, sbSignIn, sbSignOut } from "@/services/supabase";
import { AppData } from "@/types";
import { formatMoney } from "@/hooks/useAppData";
import { bioDeleteEnrollment, bioEnroll, bioSupported } from "@/services/biometric";

type Backup = Pick<AppData, "txns" | "recurring" | "goals" | "assets" | "budgets">;

function isBackup(value: unknown): value is Partial<Backup> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  const arrays = ["txns", "recurring", "goals", "assets"];
  if (arrays.some((key) => key in data && !Array.isArray(data[key]))) return false;
  return !("budgets" in data && (!data.budgets || typeof data.budgets !== "object" || Array.isArray(data.budgets)));
}

export default function MoreScreen() {
  const router = useRouter();
  const { lock } = useAuth();
  const { data, actions } = useAppDataContext();
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cloudUser, setCloudUser] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState<string>(DEFAULT_CATS.expense[0]);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [newPin, setNewPin] = useState("");
  const [bioCapable, setBioCapable] = useState(false);
  const [bioEnrolled, setBioEnrolled] = useState(false);
  const [bioPin, setBioPin] = useState("");

  useEffect(() => {
    let mounted = true;
    sbSession().then((session) => {
      if (mounted) setCloudUser(session?.email ?? null);
    });
    bioSupported().then(async (supported) => {
      if (!mounted) return;
      setBioCapable(supported);
      if (supported) {
        const enrolled = await AsyncStorage.getItem(LOCK.bioenrolled);
        if (mounted) setBioEnrolled(enrolled === "1");
      }
    });
    return () => { mounted = false; };
  }, []);

  const backup: Backup = {
    txns: data.txns,
    recurring: data.recurring,
    goals: data.goals,
    assets: data.assets,
    budgets: data.budgets,
  };

  async function exportData() {
    await Share.share({ title: "記帳備份", message: JSON.stringify(backup, null, 2) });
  }

  function importData(raw: string) {
    const parsed: unknown = JSON.parse(raw);
    if (!isBackup(parsed)) throw new Error("備份內容缺少必要格式");
    actions.importAll(parsed);
    setShowImport(false);
    setImportText("");
  }

  function submitImport() {
    try {
      importData(importText);
      Alert.alert("匯入成功");
    } catch (error) {
      Alert.alert("匯入失敗", error instanceof Error ? error.message : "JSON 格式錯誤");
    }
  }

  async function signIn() {
    if (!email.trim() || !password) {
      Alert.alert("資料不完整", "請輸入 Email 與密碼。");
      return;
    }
    try {
      await sbSignIn(email.trim(), password);
      const session = await sbSession();
      setCloudUser(session?.email ?? email.trim());
      setPassword("");
      Alert.alert("登入成功");
    } catch (error) {
      Alert.alert("登入失敗", String(error));
    }
  }

  async function signOut() {
    await sbSignOut();
    setCloudUser(null);
  }

  async function pushCloud() {
    setSyncing(true);
    try {
      await sbPush(await encryptStr(JSON.stringify(backup)));
      Alert.alert("上傳成功", "雲端備份已使用目前 PIN 金鑰加密。");
    } catch (error) {
      Alert.alert("上傳失敗", String(error));
    } finally {
      setSyncing(false);
    }
  }

  async function pullCloud() {
    setSyncing(true);
    try {
      const encrypted = await sbPull();
      if (!encrypted) {
        Alert.alert("雲端無資料");
        return;
      }
      importData(await decryptStr(encrypted));
      Alert.alert("下載成功");
    } catch (error) {
      Alert.alert("下載失敗", `請確認這份備份使用目前 PIN 建立。\n${String(error)}`);
    } finally {
      setSyncing(false);
    }
  }

  function saveBudget() {
    const amount = Number(budgetAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert("金額錯誤", "請輸入大於 0 的預算。");
      return;
    }
    actions.setBudgets({ ...data.budgets, [budgetCategory]: amount });
    setBudgetAmount("");
    Alert.alert("預算已儲存", `${budgetCategory}每月 ${formatMoney(amount)}`);
  }

  async function changePin() {
    if (!/^\d{6}$/.test(newPin)) {
      Alert.alert("PIN 格式錯誤", "PIN 必須是 6 位數字。");
      return;
    }
    try {
      await rotatePIN(newPin, {
        [KEYS.txns]: data.txns,
        [KEYS.recurring]: data.recurring,
        [KEYS.goals]: data.goals,
        [KEYS.pending]: data.pending,
        [KEYS.assets]: data.assets,
        [KEYS.sync]: data.sync,
        [KEYS.binance]: data.binance,
        [KEYS.invest]: data.invest,
        [KEYS.budgets]: data.budgets,
        [KEYS.networth]: data.networth,
      });
      setNewPin("");
      setBioEnrolled(false);
      Alert.alert("PIN 已更新", "本機資料已使用新 PIN 重新加密。");
    } catch (error) {
      Alert.alert("更新失敗", String(error));
    }
  }

  async function enableBio() {
    if (!/^\d{6}$/.test(bioPin)) {
      Alert.alert("PIN 格式錯誤", "請輸入目前使用的 6 位數 PIN。");
      return;
    }
    try {
      await bioEnroll(bioPin);
      setBioPin("");
      setBioEnrolled(true);
      Alert.alert("生物辨識已啟用");
    } catch (error) {
      Alert.alert("啟用失敗", error instanceof Error ? error.message : "請確認 PIN 正確");
    }
  }

  async function disableBio() {
    await bioDeleteEnrollment();
    setBioEnrolled(false);
    setBioPin("");
  }

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={common.title}>更多</Text>
        <Text style={common.subtitle}>設定、同步與備份</Text>
      </View>

      <Section title="資料備份">
        <View style={common.card}>
          <Pressable style={common.button} onPress={exportData}><Text style={common.buttonText}>匯出 JSON</Text></Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => setShowImport((value) => !value)}>
            <Text style={styles.secondaryButtonText}>{showImport ? "收起匯入" : "匯入 JSON"}</Text>
          </Pressable>
          {showImport ? (
            <View style={styles.block}>
              <TextInput
                style={[common.input, styles.multiline]}
                value={importText}
                onChangeText={setImportText}
                placeholder="貼上 JSON 備份內容"
                multiline
              />
              <Pressable style={common.button} onPress={submitImport}><Text style={common.buttonText}>確認匯入</Text></Pressable>
            </View>
          ) : null}
        </View>
      </Section>

      <Section title="Supabase 雲端同步">
        <View style={common.card}>
          {cloudUser ? (
            <View style={styles.block}>
              <Text style={styles.muted}>已登入：{cloudUser}</Text>
              <Pressable style={common.button} onPress={pushCloud} disabled={syncing}>
                <Text style={common.buttonText}>{syncing ? "同步中" : "上傳加密備份"}</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={pullCloud} disabled={syncing}>
                <Text style={styles.secondaryButtonText}>{syncing ? "同步中" : "下載加密備份"}</Text>
              </Pressable>
              <Pressable style={[common.button, { backgroundColor: colors.danger }]} onPress={signOut}>
                <Text style={common.buttonText}>登出</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.block}>
              <TextInput style={common.input} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
              <TextInput style={common.input} value={password} onChangeText={setPassword} placeholder="密碼" secureTextEntry />
              <Pressable style={common.button} onPress={signIn}><Text style={common.buttonText}>登入</Text></Pressable>
            </View>
          )}
        </View>
      </Section>

      <Section title="月度預算">
        <View style={common.card}>
          <View style={styles.picker}>
            <Picker selectedValue={budgetCategory} onValueChange={setBudgetCategory}>
              {DEFAULT_CATS.expense.map((category) => (
                <Picker.Item key={category} label={`${ICONS[category] ?? ""} ${category}`} value={category} />
              ))}
            </Picker>
          </View>
          {data.budgets[budgetCategory] ? <Text style={styles.muted}>目前：{formatMoney(data.budgets[budgetCategory])}</Text> : null}
          <TextInput style={common.input} value={budgetAmount} onChangeText={setBudgetAmount} placeholder="每月預算" keyboardType="decimal-pad" />
          <Pressable style={common.button} onPress={saveBudget}><Text style={common.buttonText}>儲存預算</Text></Pressable>
        </View>
      </Section>

      <Section title="安全">
        <View style={common.card}>
          <TextInput
            style={common.input}
            value={newPin}
            onChangeText={(value) => setNewPin(value.replace(/\D/g, "").slice(0, 6))}
            placeholder="新 6 位數 PIN"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
          />
          <Pressable style={[common.button, { marginTop: spacing.sm }]} onPress={changePin}><Text style={common.buttonText}>更新 PIN</Text></Pressable>
          <Pressable
            style={[common.button, { backgroundColor: colors.text, marginTop: spacing.sm }]}
            onPress={() => { lock(); router.replace("/(auth)/unlock"); }}
          >
            <Text style={common.buttonText}>鎖定 App</Text>
          </Pressable>
        </View>
      </Section>

      {bioCapable ? (
        <Section title="生物辨識解鎖">
          <View style={common.card}>
            {bioEnrolled ? (
              <Pressable style={styles.secondaryButton} onPress={disableBio}>
                <Text style={styles.secondaryButtonText}>停用生物辨識解鎖</Text>
              </Pressable>
            ) : (
              <View style={styles.block}>
                <Text style={styles.muted}>輸入目前 PIN，啟用後可在鎖定畫面使用生物辨識。</Text>
                <TextInput
                  style={common.input}
                  value={bioPin}
                  onChangeText={(value) => setBioPin(value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="目前 6 位數 PIN"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={6}
                />
                <Pressable style={common.button} onPress={enableBio}>
                  <Text style={common.buttonText}>啟用生物辨識解鎖</Text>
                </Pressable>
              </View>
            )}
          </View>
        </Section>
      ) : null}

      {__DEV__ ? (
        <Section title="開發工具">
          <Link href="/(dev)/reset" asChild>
            <Pressable style={[common.button, { backgroundColor: colors.danger }]}>
              <Text style={common.buttonText}>Dev: Reset All</Text>
            </Pressable>
          </Link>
        </Section>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  muted: { color: colors.muted },
  multiline: { minHeight: 120, paddingVertical: spacing.md, textAlignVertical: "top" },
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: { color: colors.text, fontSize: 16, fontWeight: "700" },
  picker: { borderWidth: 1, borderColor: colors.line, borderRadius: 8, overflow: "hidden", marginBottom: spacing.sm },
});
