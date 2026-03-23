import type { Href } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';

export type SettingsMenuPlacement = {
  groupLabel: string;
  groupOrder: number;
  itemOrder: number;
};

export type SettingsDirectoryEntry = {
  id: string;
  stackScreenKey: string;
  href: Href;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  keywords?: string[];
  menu?: SettingsMenuPlacement;
  searchContext?: string;
  searchable?: boolean;
  destructive?: boolean;
};

export type AccountMenuSection = {
  title: string;
  items: {
    id: string;
    icon: LucideIcon;
    title: string;
    subtitle: string;
    href: Href;
    destructive?: boolean;
  }[];
};
