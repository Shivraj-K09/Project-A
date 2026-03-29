import { Text } from '@/components/ui/text';
import { SETTINGS_MENU_ITEM_CLASS } from '@/lib/settings-ui';
import { cn } from '@/lib/utils';
import { useAppTheme } from '@/store/theme-store';
import { ChevronRight } from 'lucide-react-native';
import React, { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Haptic } from '@/lib/haptic-utils';

export interface SettingsRowProps {
  /** Lucide icon component */
  icon: any;
  /** Primary label */
  title: string;
  /** Optional secondary label (shown below title) */
  subtitle?: string;
  /** Optional right-side value (e.g. "Everyone", "On/Off") */
  value?: string;
  /** If true, applies destructive styling (red colors) */
  destructive?: boolean;
  /** Interaction handler */
  onPress?: () => void;
  /** If true, removes outer padding/borders (use within SettingsGroup) */
  isGrouped?: boolean;
  /** Optional custom right element (replaces chevron/value) */
  rightContent?: React.ReactNode;
  /** Optional custom background color for the icon container (overrides brand/destructive defaults) */
  iconBgColor?: string;
  /** Optional custom class for the container */
  className?: string;
}

/**
 * 🛠️ Standardized Settings Menu Row
 * Consolidates the "Account Tab" look with "Settings Detail" functionality.
 * Supports icons, subtitles, values, and grouped/standalone layouts.
 */
export const SettingsRow = memo(
  ({
    icon: Icon,
    title,
    subtitle,
    value,
    destructive,
    onPress,
    isGrouped = true,
    rightContent,
    iconBgColor,
    className,
  }: SettingsRowProps) => {
    const { brandColor } = useAppTheme();

    const handlePress = () => {
      if (onPress) {
        Haptic.selection();
        onPress();
      }
    };

    const Content = (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        disabled={!onPress}
        className={cn(
          isGrouped
            ? SETTINGS_MENU_ITEM_CLASS
            : 'rounded-xl border border-border bg-background px-5 py-3.5',
          className
        )}>
        {/* Left: Icon Container */}
        <View
          style={iconBgColor ? { backgroundColor: iconBgColor + '15' } : undefined}
          className={cn(
            'mr-3.5 h-9 w-9 items-center justify-center rounded-lg',
            !iconBgColor && (destructive ? 'bg-destructive/10' : 'bg-brand/5')
          )}>
          <Icon size={18} color={destructive ? '#ef4444' : (iconBgColor || brandColor)} strokeWidth={2} />
        </View>

        {/* Middle: Labels */}
        <View className="flex-1 mr-3">
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className={cn(
              'text-[15px] font-semibold',
              destructive ? 'text-destructive' : 'text-foreground'
            )}>
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} ellipsizeMode="tail" className="mt-0.5 text-[11px] font-medium text-muted-foreground">{subtitle}</Text>
          ) : null}
        </View>
 
        {/* Right: Indicators/Content */}
        <View className="flex-row items-center justify-end max-w-[40%]">
          {rightContent ? (
            rightContent
          ) : (
            <>
              {value && (
                <Text 
                  numberOfLines={1} 
                  ellipsizeMode="tail" 
                  className="mr-2 text-[13px] font-medium text-muted-foreground"
                >
                  {value}
                </Text>
              )}
              {!destructive && (
                <ChevronRight 
                  size={14} 
                  color={brandColor} 
                  strokeWidth={3} 
                  style={{ opacity: 0.8 }} 
                />
              )}
            </>
          )}
        </View>
      </TouchableOpacity>
    );

    if (isGrouped) return Content;

    // Standalone rows get padding by default to match section look
    return <View className="px-5">{Content}</View>;
  }
);
