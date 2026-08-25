import { Host, Picker } from '@expo/ui';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

/** Kategori/marka id'leri ve status değerleri 1'den başlar, bu yüzden 0 "Tümü" için güvenli. */
const ALL_VALUE = 0;

export type FilterPickerOption = {
  value: number;
  label: string;
};

export type FilterPickerProps = {
  label: string;
  placeholder?: string;
  value: number | null;
  options: FilterPickerOption[];
  enabled?: boolean;
  onChange: (value: number | null) => void;
};

export function FilterPicker({
  label,
  placeholder = 'Tümü',
  value,
  options,
  enabled = true,
  onChange,
}: FilterPickerProps) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <ThemedText type="small">{label}</ThemedText>
      <Host matchContents={{ vertical: true }} seedColor="#3c87f7" style={{ flex: 1 }}>
        <Picker
          appearance="menu"
          enabled={enabled}
          selectedValue={value ?? ALL_VALUE}
          onValueChange={(next) => onChange(next === ALL_VALUE ? null : next)}>
          <Picker.Item label={placeholder} value={ALL_VALUE} />
          {options.map((option) => (
            <Picker.Item key={option.value} label={option.label} value={option.value} />
          ))}
        </Picker>
      </Host>
    </View>
  );
}
