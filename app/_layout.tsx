import "@/services/polyfills";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "@/hooks/AuthContext";
import { AppDataProvider } from "@/hooks/AppDataContext";
import { colors } from "@/constants/theme";

function AuthGate() {
  const { ready, unlocked } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === "(auth)";
    if (!unlocked && !inAuth) router.replace("/(auth)/unlock");
    if (unlocked && inAuth) router.replace("/(tabs)");
  }, [ready, router, segments, unlocked]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const navigator = (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        {__DEV__ ? <Stack.Screen name="(dev)" /> : null}
        <Stack.Screen name="modals/add-tx" options={{ presentation: "modal" }} />
        <Stack.Screen name="modals/recurring-form" options={{ presentation: "modal" }} />
        <Stack.Screen name="modals/goal-form" options={{ presentation: "modal" }} />
        <Stack.Screen name="modals/asset-form" options={{ presentation: "modal" }} />
        <Stack.Screen name="modals/voice" options={{ presentation: "modal" }} />
        <Stack.Screen name="modals/receipt" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );

  return <AppDataProvider enabled={unlocked}>{navigator}</AppDataProvider>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
