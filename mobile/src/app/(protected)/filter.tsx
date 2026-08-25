import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { FilterPicker, type FilterPickerOption } from '@/components/ui/filter-picker';
import { useBrands } from '@/hooks/use-brands';
import { useCategories } from '@/hooks/use-categories';
import { useProductFilters } from '@/hooks/use-product-filters';
import {
  productFiltersStore,
  type ProductFilters,
  type ProductSort,
} from '@/lib/product-filters-store';
import { PRODUCT_STATUS_CONFIG } from '@/lib/product-status';
import { cn } from '@/lib/utils';

const EMPTY_FILTERS: ProductFilters = { categoryId: null, brandId: null, status: null, sort: null };

const SORT_FIELDS: { value: ProductSort['sort']; label: string }[] = [
  { value: 'name', label: 'Ad' },
  { value: 'price', label: 'Fiyat' },
  { value: 'stock', label: 'Stok' },
  { value: 'updatedAt', label: 'Güncellenme' },
];

const SORT_DIRECTIONS: { value: ProductSort['dir']; label: string }[] = [
  { value: 'asc', label: 'Artan' },
  { value: 'desc', label: 'Azalan' },
];

const STATUS_OPTIONS: FilterPickerOption[] = Object.entries(PRODUCT_STATUS_CONFIG).map(
  ([value, config]) => ({ value: Number(value), label: config.label }),
);

type ChipProps = { selected: boolean; label: string; onPress: () => void; className?: string };

function Chip({ selected, label, onPress, className }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'h-10 items-center justify-center rounded-full border px-4 active:opacity-70',
        selected
          ? 'border-accent bg-accent'
          : 'border-background-selected dark:border-background-selected-dark',
        className,
      )}
      style={{ borderCurve: 'continuous' }}>
      <ThemedText type="small" className={selected ? 'text-white dark:text-white' : undefined}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

export default function FilterScreen() {
  const insets = useSafeAreaInsets();
  const applied = useProductFilters();
  const [draft, setDraft] = useState<ProductFilters>(applied);

  const { data: categories, isPending: isCategoriesPending } = useCategories();
  const { data: brands, isPending: isBrandsPending } = useBrands();

  const categoryOptions: FilterPickerOption[] =
    categories?.map((category) => ({ value: category.id, label: category.name })) ?? [];
  const brandOptions: FilterPickerOption[] =
    brands?.map((brand) => ({ value: brand.id, label: brand.name })) ?? [];

  const handleSortField = (field: ProductSort['sort']) => {
    setDraft((current) => ({
      ...current,
      sort: current.sort?.sort === field ? null : { sort: field, dir: current.sort?.dir ?? 'asc' },
    }));
  };

  const handleSortDir = (dir: ProductSort['dir']) => {
    setDraft((current) => (current.sort ? { ...current, sort: { ...current.sort, dir } } : current));
  };

  const handleApply = () => {
    productFiltersStore.setFilters(draft);
    router.back();
  };

  return (
    <ThemedView className="flex-1 p-5 pt-20">
      <View className="flex-1 gap-6 p-4">
        <Section title="Sıralama">
          <View className="flex-row flex-wrap gap-2">
            {SORT_FIELDS.map((field) => (
              <Chip
                key={field.value}
                label={field.label}
                selected={draft.sort?.sort === field.value}
                onPress={() => handleSortField(field.value)}
              />
            ))}
          </View>

          <View
            className={cn('flex-row gap-2', !draft.sort && 'opacity-40')}
            pointerEvents={draft.sort ? 'auto' : 'none'}>
            {SORT_DIRECTIONS.map((direction) => (
              <Chip
                key={direction.value}
                label={direction.label}
                selected={draft.sort?.dir === direction.value}
                onPress={() => handleSortDir(direction.value)}
                className="flex-1"
              />
            ))}
          </View>
        </Section>

        <Section title="Filtreler">
          <FilterPicker
            label="Kategori"
            value={draft.categoryId}
            options={categoryOptions}
            enabled={!isCategoriesPending}
            onChange={(categoryId) => setDraft((current) => ({ ...current, categoryId }))}
          />
          <FilterPicker
            label="Marka"
            value={draft.brandId}
            options={brandOptions}
            enabled={!isBrandsPending}
            onChange={(brandId) => setDraft((current) => ({ ...current, brandId }))}
          />
          <FilterPicker
            label="Durum"
            value={draft.status}
            options={STATUS_OPTIONS}
            onChange={(status) => setDraft((current) => ({ ...current, status }))}
          />
        </Section>
      </View>

      <View
        className="flex-row gap-3 border-t border-background-selected px-4 pt-4 dark:border-background-selected-dark"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <Button
          title="Temizle"
          variant="secondary"
          className="flex-1"
          onPress={() => setDraft(EMPTY_FILTERS)}
        />
        <Button title="Uygula" className="flex-1" onPress={handleApply} />
      </View>
    </ThemedView>
  );
}
