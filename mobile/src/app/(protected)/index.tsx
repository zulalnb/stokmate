import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, type ListRenderItemInfo, Pressable, View } from 'react-native';

import type { Product } from '@/api/services/products.service';
import { PRODUCT_ROW_HEIGHT, ProductRow } from '@/components/product-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/hooks/use-auth';
import { useProducts } from '@/hooks/use-products';

function renderProduct({ item }: ListRenderItemInfo<Product>) {
  return (
    <Link href={{ pathname: '/product/[id]', params: { id: String(item.id) } }} asChild>
      <Pressable className="active:bg-background-selected dark:active:bg-background-selected-dark">
        <ProductRow
          name={item.name}
          barcode={item.barcode}
          stock={item.stock}
          minStock={item.minStock}
          brandName={item.brandName}
          categoryName={item.categoryName}
          status={item.status}
          price={item.price}
          imageUrl={item.imageUrl}
        />
      </Pressable>
    </Link>
  );
}

export default function ProductsScreen() {
  const {
    data,
    isPending,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useProducts();
  const logout = useLogout();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const products = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

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
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (isError) {
    return (
      <ThemedView className="flex-1 items-center justify-center px-6">
        <ThemedText type="small" className="text-center text-danger">
          {error.message}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1 px-2">
      <FlatList
        data={products}
        contentInsetAdjustmentBehavior="automatic"
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProduct}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        getItemLayout={(_, index) => ({
          length: PRODUCT_ROW_HEIGHT,
          offset: PRODUCT_ROW_HEIGHT * index,
          index,
        })}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <ThemedText type="small" themeColor="textSecondary">
              Ürün bulunamadı
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}
