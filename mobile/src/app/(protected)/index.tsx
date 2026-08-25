import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, type ListRenderItemInfo, Pressable, View } from 'react-native';
import { KeyboardController, KeyboardGestureArea } from 'react-native-keyboard-controller';
import { useDebounce } from 'use-debounce';

import type { Product } from '@/api/services/products.service';
import { ProductRow, PRODUCT_ROW_HEIGHT } from '@/components/product-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { useProductFilters } from '@/hooks/use-product-filters';
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
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch] = useDebounce(searchText, 700);
  const filters = useProductFilters();
  const hasActiveFilters =
    filters.categoryId !== null || filters.brandId !== null || filters.status !== null || filters.sort !== null;

  const {
    data,
    isPending,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useProducts({
    q: debouncedSearch || undefined,
    categoryId: filters.categoryId,
    brandId: filters.brandId,
    status: filters.status,
    sort: filters.sort?.sort,
    dir: filters.sort?.dir,
  });
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

  return (
    <ThemedView className="flex-1 px-2 pt-5">
      <View className="flex-row items-center gap-2 px-2 pb-3">
        <View className="h-11 flex-1 flex-row items-center gap-2 rounded-full border border-background-selected px-3 dark:border-background-selected-dark">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <Input
            className="h-11 flex-1 border-0 bg-transparent px-0"
            placeholder="Ara"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            submitBehavior="submit"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')} hitSlop={8} className="active:opacity-70">
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
        <Link href="/filter" asChild onPress={() => KeyboardController.dismiss()}>
          <Pressable className="h-11 w-11 items-center justify-center rounded-full border border-background-selected active:opacity-70 dark:border-background-selected-dark">
            <Ionicons name="filter" size={18} color="#9CA3AF" />
            {hasActiveFilters && (
              <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
            )}
          </Pressable>
        </Link>
      </View>

      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-6">
          <ThemedText type="small" className="text-center text-danger">
            {error.message}
          </ThemedText>
        </View>
      ) : (
        <KeyboardGestureArea interpolator="ios" style={{ flex: 1 }}>
          <FlatList
            data={products}
            contentInsetAdjustmentBehavior="automatic"
            keyExtractor={(item) => String(item.id)}
            renderItem={renderProduct}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => KeyboardController.dismiss()}
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
        </KeyboardGestureArea>
      )}
    </ThemedView>
  );
}
