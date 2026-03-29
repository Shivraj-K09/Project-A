import React, { memo } from 'react';
import { View, Modal, Pressable, TextInput, FlatList, Text as RNText } from 'react-native';
import { Text } from '@/components/ui/text';
import { X, Search, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Country } from '@/lib/countries';
import { cn } from '@/lib/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CountryPickerModalProps {
  visible: boolean;
  onClose: () => void;
  search: string;
  onSearchChange: (text: string) => void;
  countries: readonly Country[];
  selectedCode: string;
  onSelect: (country: Country) => void;
  isDark: boolean;
}

export const CountryPickerModal = memo(
  ({
    visible,
    onClose,
    search,
    onSearchChange,
    countries,
    selectedCode,
    onSelect,
    isDark,
  }: CountryPickerModalProps) => {
    const insets = useSafeAreaInsets();

    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}>
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center border-b border-border px-4 pb-3">
            <Pressable
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-secondary active:opacity-70">
              <X size={18} color={isDark ? '#a1a1aa' : '#52525b'} strokeWidth={2.5} />
            </Pressable>
            <RNText className="font-semibol flex-1 text-center text-base text-foreground">
              Select Country
            </RNText>
            <View className="w-9" />
          </View>

          <View className="border-b border-border px-4 py-2.5">
            <View className="flex-row items-center gap-2.5 rounded-xl bg-secondary px-3 dark:bg-input/30">
              <Search size={16} color={isDark ? '#52525b' : '#a1a1aa'} />
              <TextInput
                value={search}
                onChangeText={onSearchChange}
                placeholder="Search country or code..."
                placeholderTextColor={isDark ? '#52525b' : '#a1a1aa'}
                className="h-10 flex-1 text-sm text-foreground"
                autoFocus
              />
              {search.length > 0 && (
                <Pressable onPress={() => onSearchChange('')}>
                  <X size={16} color={isDark ? '#71717a' : '#a1a1aa'} />
                </Pressable>
              )}
            </View>
          </View>

          <FlatList
            data={countries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <CountryPickerItem
                item={item}
                isSelected={selectedCode === item.code}
                onSelect={onSelect}
              />
            )}
          />
        </View>
      </Modal>
    );
  }
);

interface CountryPickerItemProps {
  item: Country;
  isSelected: boolean;
  onSelect: (val: Country) => void;
}

const CountryPickerItem = memo(({ item, isSelected, onSelect }: CountryPickerItemProps) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(item);
  };

  return (
    <Pressable
      onPress={handlePress}
      className={cn(
        'flex-row items-center gap-4 border-b border-border/50 px-5 py-3.5 active:bg-accent',
        isSelected && 'bg-primary/5'
      )}>
      <RNText className="text-2xl">{item.flag}</RNText>
      <View className="flex-1">
        <RNText
          className={cn('text-[15px] font-semibold text-foreground', isSelected && 'text-primary')}>
          {item.name}
        </RNText>
        <Text className="text-xs text-muted-foreground">{item.code}</Text>
      </View>
      {isSelected && (
        <View className="h-6 w-6 items-center justify-center rounded-full bg-brand">
          <Check size={14} color="#ffffff" strokeWidth={3} />
        </View>
      )}
    </Pressable>
  );
});
