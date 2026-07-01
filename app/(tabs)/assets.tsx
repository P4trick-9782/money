import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { Empty } from "@/components/Empty";
import { ASSET_TYPES } from "@/constants/categories";
import { common, colors, spacing } from "@/constants/theme";
import { useAppDataContext } from "@/hooks/AppDataContext";
import { formatMoney } from "@/hooks/useAppData";

export default function AssetsScreen() {
  const { data, actions } = useAppDataContext();
  const total = data.assets.reduce((sum, asset) => sum + asset.amount, 0);

  function confirmDelete(id: string, name: string) {
    Alert.alert("刪除資產", `確定刪除「${name}」？`, [
      { text: "取消", style: "cancel" },
      { text: "刪除", style: "destructive", onPress: () => actions.deleteAsset(id) },
    ]);
  }

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content}>
      <View>
        <Text style={common.title}>資產</Text>
        <Text style={common.subtitle}>總資產 {formatMoney(total)}</Text>
      </View>
      <Link href="/modals/asset-form" asChild>
        <Pressable style={common.button}><Text style={common.buttonText}>新增資產</Text></Pressable>
      </Link>
      {data.assets.length === 0 ? <Empty title="尚無資產帳戶" /> : null}
      {data.assets.map((asset) => {
        const type = ASSET_TYPES.find((item) => item.key === asset.type);
        return (
          <View key={asset.id} style={[common.card, { marginBottom: spacing.sm }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
              <Text style={[common.h2, { flex: 1 }]}>{type?.icon ?? "💼"} {asset.name}</Text>
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <Link href={`/modals/asset-form?id=${encodeURIComponent(asset.id)}`} asChild>
                  <Pressable><Text style={{ color: colors.primary }}>編輯</Text></Pressable>
                </Link>
                <Pressable onPress={() => confirmDelete(asset.id, asset.name)}>
                  <Text style={{ color: colors.danger }}>刪除</Text>
                </Pressable>
              </View>
            </View>
            <Text style={{ color: colors.muted, marginTop: spacing.sm }}>{type?.label ?? asset.type} · {asset.ccy}</Text>
            <Text style={{ color: type?.color ?? colors.text, fontWeight: "800", marginTop: spacing.sm }}>
              {formatMoney(asset.amount)}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}
