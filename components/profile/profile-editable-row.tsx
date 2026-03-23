import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/store/theme-store';
import dayjs from 'dayjs';
import { Check, ChevronRight, Eye, EyeOff, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import DateTimePicker from 'react-native-ui-datepicker';

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
  type?: 'text' | 'date';
  isLast?: boolean;
  isSensitive?: boolean;
}

export const ProfileEditableRow = React.memo(
  ({
    icon: Icon,
    title,
    value,
    editable = true,
    onSave,
    placeholder = 'Not set',
    type = 'text',
    isLast = false,
    isSensitive = false,
  }: ProfileRowProps) => {
    const { brandColor, isDark } = useAppTheme();

    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value || '');
    const [showDatePicker, setShowDatePicker] = useState(false);
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
      if (localValue !== (value || '') && onSave) onSave(localValue);
      if (isMounted.current) setIsEditing(false);
    };

    const handleCancel = () => {
      setLocalValue(value || '');
      if (isMounted.current) setIsEditing(false);
    };

    const openEditor = () => {
      if (!editable) return;
      setIsEditing(true);
      if (type === 'date') setShowDatePicker(true);
    };

    const pickerStyles = useMemo(
      () => getDatePickerStyles(isDark, brandColor),
      [isDark, brandColor]
    );

    return (
      <View className={`w-full ${!isLast ? 'border-b border-border/5' : ''}`}>
        {!isEditing ? (
          <TouchableOpacity
            activeOpacity={editable ? 0.6 : 1}
            onPress={openEditor}
            className="flex-row items-center px-3 py-4">
            <View className="mr-4 w-8 items-center">
              <Icon size={18} color={brandColor} strokeWidth={2} />
            </View>

            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {title}
                  </Text>
                  <Text className="text-[16px] font-semibold text-foreground">
                    {!isVisible ? '••••••••••••' : localValue || placeholder}
                  </Text>
                </View>

                {isSensitive && (
                  <TouchableOpacity
                    onPress={() => setIsVisible(!isVisible)}
                    className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-brand/10"
                    activeOpacity={0.7}>
                    {isVisible ? (
                      <EyeOff size={16} color={brandColor} strokeWidth={2} />
                    ) : (
                      <Eye size={16} color={brandColor} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                )}

                {editable && (
                  <ChevronRight size={14} color={isDark ? '#27272a' : '#e5e5e5'} strokeWidth={2} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View className="flex-row items-start px-3 py-4">
            <View className="mr-4 w-8 items-center pt-1">
              <Icon size={18} color={brandColor} strokeWidth={2} />
            </View>

            <View className="flex-1">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-brand">
                    {title}
                  </Text>

                  {type === 'text' && (
                    <TextInput
                      className="m-0 p-0 text-[16px] font-semibold text-foreground"
                      style={{
                        color: isDark ? '#ffffff' : '#0a0a0a',
                        minHeight: title === 'Bio' ? 80 : 24,
                        textAlignVertical: 'top',
                      }}
                      value={localValue}
                      onChangeText={setLocalValue}
                      placeholder={placeholder}
                      placeholderTextColor={isDark ? '#27272a' : '#d4d4d8'}
                      autoFocus
                      multiline={title === 'Bio'}
                      numberOfLines={title === 'Bio' ? 4 : 1}
                      returnKeyType={title === 'Bio' ? 'default' : 'done'}
                      onSubmitEditing={title === 'Bio' ? undefined : handleSave}
                      cursorColor={brandColor}
                      onBlur={handleSave}
                    />
                  )}
                </View>

                <View className="ml-2 flex-row gap-3 pt-0.5">
                  <TouchableOpacity onPress={handleCancel} hitSlop={10}>
                    <X size={18} color={isDark ? '#71717a' : '#a1a1aa'} strokeWidth={2} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} hitSlop={10}>
                    <Check size={18} color={brandColor} strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowDatePicker(false);
            setIsEditing(false);
          }}>
          <TouchableWithoutFeedback
            onPress={() => {
              setShowDatePicker(false);
              setIsEditing(false);
            }}>
            <View className="flex-1 justify-end bg-black/40">
              <TouchableWithoutFeedback>
                <View className="rounded-t-[32px] bg-background p-6 pb-10 shadow-2xl">
                  <View className="mb-6 h-1 w-12 self-center rounded-full bg-muted" />
                  <Text className="mb-6 text-center text-lg font-semibold">Select {title}</Text>
                  <DateTimePicker
                    mode="single"
                    date={localValue ? dayjs(localValue).toDate() : dayjs().toDate()}
                    maxDate={dayjs().toDate()}
                    onChange={(params) => {
                      if (params.date) {
                        const formattedDate = dayjs(params.date).format('YYYY-MM-DD');
                        setLocalValue(formattedDate);
                        if (formattedDate !== (value || '') && onSave) onSave(formattedDate);
                      }
                      if (isMounted.current) {
                        setShowDatePicker(false);
                        setIsEditing(false);
                      }
                    }}
                    styles={pickerStyles}
                  />
                  <TouchableOpacity
                    className="mt-6 w-full items-center rounded-2xl bg-brand py-4 shadow-lg"
                    onPress={() => {
                      setShowDatePicker(false);
                      setIsEditing(false);
                    }}>
                    <Text className="text-base font-semibold text-white">Done</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  }
);
