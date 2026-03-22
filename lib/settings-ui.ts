import { cn } from '@/lib/utils';

/** Vertical stack of settings cells (same rhythm as Account tab lists). */
export const SETTINGS_MENU_LIST_CLASS = 'flex flex-col gap-2';

/**
 * Border + radius + padding for settings menu rows (matches Account `MenuRow` card).
 * Pair with `flex-row items-center` or `flex-row items-center justify-between`.
 */
export const SETTINGS_MENU_CARD_CLASS = 'rounded-xl border border-border bg-background px-5 py-5';

export function cnSettingsMenuCard(...extra: (string | undefined | false | null)[]) {
  return cn(SETTINGS_MENU_CARD_CLASS, ...extra);
}
