import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { ICONS, TYPE_COLOR, TYPE_LABEL } from "@/constants/categories";
import { colors, spacing } from "@/constants/theme";
import { Txn } from "@/types";
import { formatMoney } from "@/hooks/useAppData";

type Props = {
  tx: Txn;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
};

export function TxRow({ tx, onDelete, onEdit }: Props) {
  const tone = TYPE_COLOR[tx.type] ?? TYPE_COLOR.expense;

  function confirmDelete() {
    if (!onDelete) return;
    if (Platform.OS === "web") {
      if (globalThis.confirm("確定要刪除這筆記帳嗎？")) onDelete(tx.id);
      return;
    }
    Alert.alert("確認刪除", "確定要刪除這筆記帳嗎？", [
      { text: "取消", style: "cancel" },
      { text: "刪除", style: "destructive", onPress: () => onDelete(tx.id) },
    ]);
  }

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: tone.light }]}>
        <Text style={styles.iconText}>{ICONS[tx.category] ?? "•"}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{tx.category}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {TYPE_LABEL[tx.type]} · {tx.date}{tx.note ? ` · ${tx.note}` : ""}
        </Text>
      </View>
      <Text style={[styles.amount, { color: tone.bg }]}>{formatMoney(tx.amount)}</Text>
      {onEdit ? (
        <Pressable accessibilityLabel="編輯" style={styles.edit} onPress={() => onEdit(tx.id)}>
          <Text style={styles.editText}>編輯</Text>
        </Pressable>
      ) : null}
      {onDelete ? (
        <Pressable
          accessibilityLabel="刪除"
          style={styles.delete}
          onPress={confirmDelete}
        >
          <Text style={styles.deleteText}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 20,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  amount: {
    fontWeight: "700",
    minWidth: 88,
    textAlign: "right",
  },
  edit: {
    minWidth: 40,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  editText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  delete: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
  },
  deleteText: {
    color: colors.muted,
    fontSize: 22,
    lineHeight: 24,
  },
});
