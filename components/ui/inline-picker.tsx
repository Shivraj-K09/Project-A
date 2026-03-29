import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Portal } from '@rn-primitives/portal';
import { Check, ChevronDown, LucideIcon } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface Option {
  label: string;
  value: string;
  icon: LucideIcon;
}

interface InlinePickerProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  label?: string;
}

export function InlinePicker({
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  className,
  label,
}: InlinePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const triggerRef = React.useRef<View>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const measureTrigger = useCallback(() => {
    triggerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setLayout({ x: pageX, y: pageY, width, height });
    });
  }, []);

  const handleOpen = useCallback(() => {
    measureTrigger();
    setIsOpen(true);
  }, [measureTrigger]);

  const handleSelect = useCallback(
    (val: string) => {
      onValueChange(val);
      setIsOpen(false);
    },
    [onValueChange]
  );

  return (
    <View className={cn('gap-3', className)}>
      {label && (
        <Text className="font-semibol ml-1 text-xs uppercase tracking-wider text-foreground">
          {label}
        </Text>
      )}

      <View ref={triggerRef} collapsable={false} className="relative">
        {/* Trigger */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleOpen}
          className={cn(
            'h-14 flex-row items-center justify-between border border-border !bg-transparent px-4',
            isOpen ? 'rounded-t-lg border-b-transparent' : 'rounded-lg'
          )}>
          <View className="flex-row items-center gap-3">
            {selectedOption ? (
              <>
                {React.createElement(selectedOption.icon, {
                  size: 18,
                  className: 'text-foreground',
                  strokeWidth: 2.5,
                })}
                <Text className="font-semibol text-base text-foreground">
                  {selectedOption.label}
                </Text>
              </>
            ) : (
              <Text className="text-base text-muted-foreground">{placeholder}</Text>
            )}
          </View>
          <Animated.View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
            <ChevronDown size={20} className="text-muted-foreground" strokeWidth={2.5} />
          </Animated.View>
        </TouchableOpacity>

        {/* Portal-based Dropdown Menu - Positioned EXACTLY below trigger */}
        {isOpen && (
          <Portal name="picker-portal">
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setIsOpen(false)}
              className="z-[100] bg-transparent"
            />

            <View
              style={{
                position: 'absolute',
                top: layout.y + layout.height,
                left: layout.x,
                width: layout.width,
                zIndex: 1000,
              }}
              pointerEvents="box-none">
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                className="rounded-b-lg border-x border-b border-border bg-background p-1 shadow-xl"
                style={{ marginTop: -1 }}>
                <View className="gap-0.5">
                  {options.map((opt) => {
                    const isSelected = value === opt.value;
                    const Icon = opt.icon;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        activeOpacity={0.6}
                        onPress={() => handleSelect(opt.value)}
                        className={cn(
                          'flex-row items-center justify-between rounded-md p-3',
                          isSelected ? 'bg-secondary' : 'active:bg-secondary/40'
                        )}>
                        <View className="flex-row items-center gap-3">
                          <Icon
                            size={18}
                            className={cn(isSelected ? 'text-brand' : 'text-muted-foreground')}
                            strokeWidth={isSelected ? 2.5 : 2}
                          />
                          <Text
                            className={cn(
                              'text-sm font-semibold',
                              isSelected ? 'text-foreground' : 'text-muted-foreground'
                            )}>
                            {opt.label}
                          </Text>
                        </View>
                        {isSelected && <Check size={16} className="text-brand" strokeWidth={3} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>
            </View>
          </Portal>
        )}
      </View>
    </View>
  );
}
