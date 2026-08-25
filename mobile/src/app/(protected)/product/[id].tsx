import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "@/api/errors";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct } from "@/hooks/use-product";
import { useUpdateStock } from "@/hooks/use-update-stock";
import { formatKurus } from "@/lib/money";
import { PRODUCT_STATUS_CONFIG } from "@/lib/product-status";

const HERO_SIZE = 240;

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3 py-1">
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small" className="flex-1 text-right">
        {value}
      </ThemedText>
    </View>
  );
}

function StepperButton({
  icon,
  onPress,
  disabled,
}: {
  icon: "remove" | "add";
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="h-12 w-12 items-center justify-center rounded-xl bg-accent active:opacity-80 disabled:opacity-40"
    >
      <Ionicons name={icon} size={22} color="#ffffff" />
    </Pressable>
  );
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const {
    data: product,
    isPending,
    isError,
    error,
    refetch,
  } = useProduct(productId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stockDraft, setStockDraft] = useState<string | null>(null);
  const updateStock = useUpdateStock(productId);
  const insets = useSafeAreaInsets();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isPending) {
    return (
      <ThemedView className="flex-1">
        <Stack.Screen options={{ title: "Ürün" }} />
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="gap-4 p-4"
        >
          <Skeleton
            className="self-center"
            style={{ width: HERO_SIZE, height: HERO_SIZE }}
          />

          <Skeleton
            className="rounded-full"
            style={{ width: 96, height: 20 }}
          />

          <Skeleton style={{ width: "70%", height: 28 }} />

          <View className="gap-2">
            <Skeleton style={{ width: "50%", height: 30 }} />
            <Skeleton style={{ width: "40%", height: 16 }} />
          </View>

          <View className="gap-2">
            <Skeleton style={{ width: "35%", height: 20 }} />
            <Skeleton style={{ width: "100%", height: 16 }} />
          </View>

          <View className="gap-2">
            <Skeleton style={{ width: "100%", height: 16 }} />
            <Skeleton style={{ width: "100%", height: 16 }} />
            <Skeleton style={{ width: "100%", height: 16 }} />
            <Skeleton style={{ width: "100%", height: 16 }} />
            <Skeleton style={{ width: "100%", height: 16 }} />
            <Skeleton style={{ width: "100%", height: 16 }} />
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <ThemedView className="flex-1 items-center justify-center px-6">
        <Stack.Screen options={{ title: "Ürün" }} />
        <ThemedText type="small" className="text-center text-danger">
          {notFound ? "Ürün bulunamadı" : error.message}
        </ThemedText>
      </ThemedView>
    );
  }

  const statusConfig = PRODUCT_STATUS_CONFIG[product.status];
  const isLowStock = product.stock < product.minStock;
  const hasDescription = product.description.trim().length > 0;

  const parsedStock = stockDraft === null ? product.stock : Number(stockDraft);
  const isStockValid = Number.isInteger(parsedStock) && parsedStock >= 0;
  const isStockChanged = stockDraft !== null && parsedStock !== product.stock;
  const currentStockValue = Number.isFinite(parsedStock)
    ? parsedStock
    : product.stock;
  const decrementStock = () =>
    setStockDraft(String(Math.max(0, currentStockValue - 1)));
  const incrementStock = () => setStockDraft(String(currentStockValue + 1));

  const handleUpdateStock = () => {
    if (!isStockValid || !isStockChanged) return;
    updateStock.mutate(parsedStock, {
      onSuccess: () => {
        setStockDraft(null);
        Keyboard.dismiss();
      },
    });
  };

  return (
    <ThemedView className="flex-1">
      <Stack.Screen options={{ title: product.name }} />
      <KeyboardAwareScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        bottomOffset={100}
        contentContainerClassName="gap-4 px-4 pt-4 pb-safe"
        className="flex-1 bg-white"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View
          className="items-center justify-center self-center overflow-hidden rounded-lg bg-background-selected dark:bg-background-selected-dark"
          style={{ width: HERO_SIZE, height: HERO_SIZE }}
        >
          {product.imageUrl ? (
            <Image
              source={product.imageUrl}
              style={{ width: HERO_SIZE, height: HERO_SIZE }}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <Ionicons name="image-outline" size={48} color="#9CA3AF" />
          )}
        </View>

        {statusConfig && (
          <Badge
            label={statusConfig.label}
            icon={statusConfig.icon}
            variant={statusConfig.variant}
          />
        )}

        <ThemedText type="subtitle">{product.name}</ThemedText>

        <View className="gap-1">
          <ThemedText type="title" className="text-3xl">
            {formatKurus(product.price)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Maliyet: {formatKurus(product.costPrice)}
          </ThemedText>
        </View>

        <View className="gap-2">
          <ThemedText type="small" themeColor="textSecondary">
            Stoğu Güncelle
          </ThemedText>
          <View className="flex-row items-center gap-2 rounded-2xl border border-background-selected p-3 drop-shadow-sm dark:border-background-selected-dark">
            <StepperButton
              icon="remove"
              onPress={decrementStock}
              disabled={currentStockValue <= 0 || updateStock.isPending}
            />
            <Input
              className="flex-1 text-center"
              keyboardType="number-pad"
              value={stockDraft ?? String(product.stock)}
              onChangeText={setStockDraft}
            />
            <StepperButton
              icon="add"
              onPress={incrementStock}
              disabled={updateStock.isPending}
            />
          </View>
          {stockDraft !== null && !isStockValid && (
            <ThemedText type="small" className="text-danger">
              Geçerli bir stok değeri girin
            </ThemedText>
          )}
        </View>

        <View className="gap-1">
          <ThemedText
            type="default"
            className={isLowStock ? "text-danger" : undefined}
          >
            {product.stock} stok
          </ThemedText>
          <DetailRow label="Min. Stok" value={String(product.minStock)} />
        </View>

        <View>
          <DetailRow label="SKU" value={product.sku} />
          <DetailRow label="Barkod" value={product.barcode} />
          <DetailRow label="Kategori" value={product.categoryName} />
          <DetailRow label="Marka" value={product.brandName} />
          <DetailRow label="Tedarikçi" value={`#${product.supplierId}`} />
          <DetailRow
            label="Son güncelleme"
            value={new Date(product.updatedAt).toLocaleDateString("tr-TR")}
          />
        </View>

        {hasDescription && (
          <ThemedText type="default" themeColor="textSecondary">
            {product.description}
          </ThemedText>
        )}
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: -insets.bottom, opened: 0 }}>
        <View className="border-t border-background-selected bg-background px-4 pt-3 pb-safe dark:border-background-selected-dark dark:bg-background-dark">
          <Button
            title="Kaydet"
            loading={updateStock.isPending}
            disabled={!isStockValid || !isStockChanged || updateStock.isPending}
            onPress={handleUpdateStock}
          />
        </View>
      </KeyboardStickyView>
    </ThemedView>
  );
}
