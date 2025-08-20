import { Stack } from "expo-router";
import { theme } from "@/constants/theme";

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '600' as const,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="[eventId]" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}