import { Stack } from "expo-router/stack";
import { Platform } from "react-native";

export default function ProtectedLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Ürünler",
         /*  headerLargeTitle: true,
          headerTransparent: Platform.select({
            ios: true,
            web: true,
            android: false,
          }), */
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
