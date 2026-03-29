import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/store/theme-store';
import dayjs from 'dayjs';
import { Check, ChevronRight, Eye, EyeOff, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TextInput, TouchableOpacity, View, Keyboard } from 'react-native';
import DateTimePicker from 'react-native-ui-datepicker';
import { SETTINGS_MENU_ITEM_CLASS } from '@/lib/settings-ui';
import { cn } from '@/lib/utils';
import { Drawer } from '@/components/ui/drawer';
import { Haptic } from '@/lib/haptic-utils';
import * as Haptics from 'expo-haptics';

const getDatePickerStyles = (isDark: boolean, brandColor: string) => ({
  day_label: { color: isDark ? '#e4e4e7' : '#18181b' },
  month_selector_label: { color: isDark ? '#e4e4e7' : '#18181b', fontWeight: '600' as const },
  year_selector_label: { color: isDark ? '#e4e4e7' : '#18181b', fontWeight: '600' as const },
  weekday_label: { color: isDark ? '#71717a' : '#52525b' },
  selected: { backgroundColor: brandColor, borderRadius: 100 },
  selected_label: { color: '#ffffff' },
  today: { borderColor: brandColor, borderWidth: 1, borderRadius: 100 },
  today_label: { color: brandColor, fontWeight: '600' as const },
  month_label: { color: isDark ? '#e4e4e7' : '#18181b' },
  year_label: { color: isDark ? '#e4e4e7' : '#18181b' },
  selected_month_label: { color: '#ffffff' },
  selected_year_label: { color: '#ffffff' },
});

interface ProfileRowProps {
  icon: any;
  title: string;
  value: string | null | undefined;
  editable?: boolean;
  onSave?: (newVal: string) => void;
  placeholder?: string;
  type?: 'text' | 'date' | 'bio';
  isLast?: boolean;
  isSensitive?: boolean;
  maxLength?: number;
}

/**
 * 🛠️ Profile Editable Row (Matched to SettingsRow style)
 * Supports Drawer for both Dates and Bio (RE-LABELED AS BIO).
 */
export const ProfileEditableRow = React.memo(
  ({
    icon: Icon,
    title,
    value,
    editable = true,
    onSave,
    placeholder = 'Not set',
    type = 'text',
    isSensitive = false,
    maxLength = 150,
  }: ProfileRowProps) => {
    const { brandColor, isDark } = useAppTheme();

    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value || '');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showBioDrawer, setShowBioDrawer] = useState(false);
    const [isVisible, setIsVisible] = useState(!isSensitive);
    const isMounted = useRef(true);

    useEffect(() => {
      isMounted.current = true;
      return () => {
        isMounted.current = false;
      };
    }, []);

    useEffect(() => {
      setLocalValue(value || '');
    }, [value, isEditing]);

    const handleSave = () => {
      Keyboard.dismiss();
      Haptic.notification(Haptics.NotificationFeedbackType.Success);

      if (localValue !== (value || '') && onSave) onSave(localValue);
      if (isMounted.current) {
        setIsEditing(false);
        setShowBioDrawer(false);
      }
    };

    const handleCancel = () => {
      Haptic.impact(Haptics.ImpactFeedbackStyle.Light);
      setLocalValue(value || '');
      if (isMounted.current) {
        setIsEditing(false);
        setShowBioDrawer(false);
      }
    };

    const openEditor = () => {
      if (!editable) return;
      Haptic.selection();
      if (type === 'date') {
        setShowDatePicker(true);
      } else if (type === 'bio' || title === 'Bio' || title === 'Biography') {
        setShowBioDrawer(true);
      } else {
        setIsEditing(true);
      }
    };

    const toggleVisibility = () => {
      Haptic.selection();
      setIsVisible(!isVisible);
    };

    const pickerStyles = useMemo(
      () => getDatePickerStyles(isDark, brandColor),
      [isDark, brandColor]
    );

    const isBio = title === 'Bio' || title === 'Biography';

    return (
      <View className="w-full">
        {!isEditing ? (
          <TouchableOpacity
            activeOpacity={editable ? 0.7 : 1}
            onPress={openEditor}
            disabled={!editable}
            className={cn(SETTINGS_MENU_ITEM_CLASS)}>
            {/* Left: Icon Container */}
            <View className="mr-3.5 h-9 w-9 items-center justify-center rounded-lg bg-brand/5">
              <Icon size={18} color={brandColor} strokeWidth={2} />
            </View>

            {/* Middle: Labels */}
            <View className="mr-3 flex-1">
              <Text numberOfLines={1} className="text-[14px] font-semibold text-foreground">
                {title}
              </Text>
              <Text
                numberOfLines={isBio ? 2 : 1}
                className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                {!isVisible ? '••••••••••••' : localValue || placeholder}
              </Text>
            </View>

            {/* Right: Indicators */}
            <View className="flex-row items-center justify-end">
              {isSensitive && (
                <TouchableOpacity
                  onPress={toggleVisibility}
                  className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-brand/10"
                  activeOpacity={0.7}>
                  {isVisible ? (
                    <EyeOff size={14} color={brandColor} strokeWidth={2} />
                  ) : (
                    <Eye size={14} color={brandColor} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              )}
              {editable && (
                <ChevronRight
                  size={14}
                  color={brandColor}
                  strokeWidth={3}
                  style={{ opacity: 0.8 }}
                />
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View className={cn(SETTINGS_MENU_ITEM_CLASS)}>
            {/* Left: Icon Container */}
            <View className="mr-3.5 h-9 w-9 items-center justify-center rounded-lg bg-brand/5">
              <Icon size={18} color={brandColor} strokeWidth={2} />
            </View>

            <View className="flex-1">
              <Text className="font-semibol text-[10px] uppercase tracking-wider text-brand">
                Editing {title}
              </Text>
              <TextInput
                className="mt-1 p-0 text-[15px] font-semibold text-foreground"
                style={{
                  color: isDark ? '#ffffff' : '#0a0a0a',
                  minHeight: 20,
                  textAlignVertical: 'top',
                }}
                value={localValue}
                onChangeText={setLocalValue}
                placeholder={placeholder}
                placeholderTextColor={isDark ? '#3f3f46' : '#d4d4d8'}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSave}
                cursorColor={brandColor}
              />
            </View>

            <View className="ml-2 flex-row gap-3 pt-0.5">
              <TouchableOpacity
                onPress={handleCancel}
                hitSlop={10}
                className="h-8 w-8 items-center justify-center rounded-lg bg-muted/10">
                <X size={16} color={isDark ? '#71717a' : '#a1a1aa'} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                hitSlop={10}
                className="h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                <Check size={16} color={brandColor} strokeWidth={3} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Date Picker Drawer */}
        <Drawer
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          title="Select Date">
          <View className="pt-2">
            <DateTimePicker
              mode="single"
              date={localValue ? dayjs(localValue).toDate() : dayjs().toDate()}
              maxDate={dayjs().toDate()}
              onChange={(params) => {
                if (params.date) {
                  const formattedDate = dayjs(params.date).format('YYYY-MM-DD');
                  setLocalValue(formattedDate);
                  if (formattedDate !== (value || '') && onSave) onSave(formattedDate);
                  Haptic.notification(Haptics.NotificationFeedbackType.Success);
                }
                setShowDatePicker(false);
              }}
              styles={pickerStyles}
            />
          </View>
        </Drawer>

        {/* Bio Drawer - REFINED UX */}
        <Drawer visible={showBioDrawer} onClose={handleCancel} title={`Edit ${title}`}>
          <View className="pt-2">
            <View className="rounded-2xl border border-brand/10 bg-brand/5 p-4">
              <TextInput
                className="text-[16px] font-medium leading-6 text-foreground"
                style={{
                  color: isDark ? '#ffffff' : '#0a0a0a',
                  minHeight: 120,
                  textAlignVertical: 'top',
                }}
                value={localValue}
                onChangeText={(text) => text.length <= maxLength && setLocalValue(text)}
                placeholder={placeholder}
                placeholderTextColor={isDark ? '#3f3f46' : '#d4d4d8'}
                autoFocus
                multiline
                numberOfLines={6}
                cursorColor={brandColor}
              />

              {/* Character Limit Counter */}
              <View className="mt-3 flex-row items-center justify-between border-t border-brand/10 pt-3">
                <Text className="font-semibol text-[11px] uppercase tracking-widest text-muted-foreground/60">
                  Character Limit
                </Text>
                <Text
                  className={cn(
                    'text-[12px] font-black',
                    localValue.length >= maxLength ? 'text-destructive' : 'text-brand'
                  )}>
                  {localValue.length}/{maxLength}
                </Text>
              </View>
            </View>

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                onPress={handleCancel}
                className="flex-1 items-center justify-center rounded-xl bg-muted/10 py-4">
                <Text className="font-semibol text-base text-muted-foreground">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={localValue === (value || '')}
                className={cn(
                  'flex-1 items-center justify-center rounded-xl py-4',
                  localValue === (value || '') ? 'bg-brand/20 opacity-50' : 'bg-brand'
                )}>
                <Text className="font-semibol text-base text-white">Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Drawer>
      </View>
    );
  }
);
