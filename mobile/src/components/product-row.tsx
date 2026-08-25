import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { View } from "react-native";

import type { Product } from "@/api/services/products.service";
import { ThemedText } from "@/components/themed-text";
import {
  Badge,
  type BadgeIcon,
  type BadgeVariant,
} from "@/components/ui/badge";
import { formatKurus } from "@/lib/money";

export const PRODUCT_ROW_HEIGHT = 120;
const THUMBNAIL_SIZE = 80;

const PRODUCT_STATUS_CONFIG: Record<
  number,
  { label: string; variant: BadgeVariant; icon: BadgeIcon }
> = {
  1: {
    label: "Aktif",
    variant: "success",
    icon: { sfSymbol: "checkmark.circle.fill", ionicon: "checkmark-circle" },
  },
  2: {
    label: "Pasif",
    variant: "neutral",
    icon: { sfSymbol: "pause.circle.fill", ionicon: "pause-circle" },
  },
  3: {
    label: "Üretim Durduruldu",
    variant: "danger",
    icon: { sfSymbol: "xmark.circle.fill", ionicon: "close-circle" },
  },
};

export type ProductRowProps = Pick<
  Product,
  | "name"
  | "barcode"
  | "stock"
  | "minStock"
  | "brandName"
  | "categoryName"
  | "status"
  | "price"
  | "imageUrl"
>;

export function ProductRow({
  name,
  barcode,
  stock,
  minStock,
  brandName,
  categoryName,
  status,
  price,
  imageUrl,
}: ProductRowProps) {
  const statusConfig = PRODUCT_STATUS_CONFIG[status];
  const infoLine = [barcode, brandName, categoryName]
    .filter(Boolean)
    .join(" • ");
  const isLowStock = stock < minStock;

  return (
    <View
      className="flex-row items-center gap-3 border-b border-background-selected px-4 dark:border-background-selected-dark"
      style={{ height: PRODUCT_ROW_HEIGHT }}
    >
      <View
        className="items-center justify-center overflow-hidden rounded-lg bg-background-selected dark:bg-background-selected-dark"
        style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE }}
      >
        {imageUrl ? (
          <Image
            source={imageUrl}
            style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE }}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <Ionicons name="image-outline" size={24} color="#9CA3AF" />
        )}
      </View>

      <View className="flex-1 gap-1.5">
        {statusConfig && (
          <Badge
            label={statusConfig.label}
            icon={statusConfig.icon}
            variant={statusConfig.variant}
          />
        )}

        <ThemedText type="default" numberOfLines={1}>
          {name}
        </ThemedText>

        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} selectable>
          <ThemedText type="smallBold" themeColor="text" className="text-base">
            {formatKurus(price)}
          </ThemedText>
          {" • "}
          {infoLine}
        </ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          className={isLowStock ? "text-danger" : undefined}
        >
          {stock} stok
        </ThemedText>
      </View>
    </View>
  );
}
