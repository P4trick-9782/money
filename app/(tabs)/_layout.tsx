import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "home",
  txns: "list",
  recurring: "repeat",
  goals: "flag",
  assets: "wallet",
  stats: "stats-chart",
  more: "settings",
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { borderTopColor: colors.line, backgroundColor: colors.surface },
        tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name] ?? "ellipse"} color={color} size={size} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: "首頁" }} />
      <Tabs.Screen name="txns" options={{ title: "明細" }} />
      <Tabs.Screen name="recurring" options={{ title: "固定" }} />
      <Tabs.Screen name="goals" options={{ title: "目標" }} />
      <Tabs.Screen name="assets" options={{ title: "資產" }} />
      <Tabs.Screen name="stats" options={{ title: "統計" }} />
      <Tabs.Screen name="more" options={{ title: "更多" }} />
    </Tabs>
  );
}
