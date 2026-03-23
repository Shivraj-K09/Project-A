import { LucideIcon } from 'lucide-react-native';
import { SETTINGS_DIRECTORY } from './settings/data';

export * from './settings/types';
export * from './settings/data';
export * from './settings/utils';

/** 
 * Stack header maps derived from directory for app/(settings)/_layout.tsx 
 * These are kept here for consumption by the root settings layout.
 */
export const SETTINGS_STACK_ROUTE_TITLES: Record<string, string> = Object.fromEntries(
  SETTINGS_DIRECTORY.map((e) => [e.stackScreenKey, e.title])
);

export const SETTINGS_STACK_ROUTE_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  SETTINGS_DIRECTORY.map((e) => [e.stackScreenKey, e.icon])
);
