import React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/utils';

/** Vertical stack of settings cells (same rhythm as Account tab lists). */
export const SETTINGS_MENU_LIST_CLASS = 'flex flex-col gap-3';

/**
 * Base classes for a standalone settings card (matches original Account MenuRow).
 * Used when an item is not in a group.
 */
export const SETTINGS_MENU_CARD_CLASS =
  'flex-row items-center rounded-xl border border-border bg-background px-5 py-3.5';

/**
 * Container for a group of linked settings items.
 * Use with SETTINGS_MENU_ITEM_CLASS and SETTINGS_MENU_SEPARATOR.
 */
export const SETTINGS_GROUP_CONTAINER_CLASS =
  'overflow-hidden rounded-xl border border-border bg-background';

/**
 * Individual item inside a group (no outer borders/bg, rounded only at ends via container).
 */
export const SETTINGS_MENU_ITEM_CLASS = 'flex-row items-center px-5 py-3.5';

/**
 * Separator line inside a group.
 */
export const SETTINGS_MENU_SEPARATOR_CLASS = 'mx-5 border-b border-border';

export function cnSettingsMenuCard(...extra: (string | undefined | false | null)[]) {
  return cn(SETTINGS_MENU_CARD_CLASS, ...extra);
}

export function cnSettingsMenuGroup(...extra: (string | undefined | false | null)[]) {
  return cn(SETTINGS_GROUP_CONTAINER_CLASS, ...extra);
}

export function cnSettingsMenuItem(...extra: (string | undefined | false | null)[]) {
  return cn(SETTINGS_MENU_ITEM_CLASS, ...extra);
}

export function SettingsGroup({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const childrenArray = React.Children.toArray(children).filter(Boolean);

  return (
    <View className={cn(SETTINGS_GROUP_CONTAINER_CLASS, className)}>
      {childrenArray.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < childrenArray.length - 1 && <View className={SETTINGS_MENU_SEPARATOR_CLASS} />}
        </React.Fragment>
      ))}
    </View>
  );
}
