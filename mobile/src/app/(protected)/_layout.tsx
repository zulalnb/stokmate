import { Stack } from "expo-router/stack";

import { LogoutButton } from "@/components/logout-button";

export default function ProtectedLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Ürünler",
          headerRight: () => <LogoutButton />,
        }}
      />
      <Stack.Screen name="product/[id]" />
      <Stack.Screen
        name="filter"
        options={{
          presentation: "formSheet",
          title: "Filtrele",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.6, 1],
        }}
      />
    </Stack>
  );
}
