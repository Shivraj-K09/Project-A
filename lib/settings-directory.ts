import type { Href } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import {
  Activity,
  Bell,
  BookOpen,
  Database,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LifeBuoy,
  Lock,
  MessageCircle,
  MessageSquare,
  Monitor,
  Plus,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserCheck,
  UserCircle,
  UserMinus,
} from 'lucide-react-native';

/**
 * Single source of truth for settings navigation: Account tab menu, search, and stack header meta.
 * When you add a screen under app/(settings)/, add one entry here — menu + search + titles stay in sync.
 *
 * Expo Router does not expose a runtime list of file routes; typed routes (Href) are compile-derived.
 * @see https://docs.expo.dev/router/reference/typed-routes
 */
export type SettingsMenuPlacement = {
  /** Section heading on the Account tab */
  groupLabel: string;
  /** Sort order of sections (lower first) */
  groupOrder: number;
  /** Sort order within the section */
  itemOrder: number;
};

export type SettingsDirectoryEntry = {
  /** Stable id for lists / React keys */
  id: string;
  /** Must match Stack `route.name` from app/(settings)/ _layout (used for headers). */
  stackScreenKey: string;
  href: Href;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** Extra tokens for search (synonyms, etc.) */
  keywords?: string[];
  /** If set, row appears in the grouped Account menu when not searching. */
  menu?: SettingsMenuPlacement;
  /** Shown as a second line in search results (e.g. parent area). */
  searchContext?: string;
  /** Exclude from search (e.g. transient modal routes). Default true. */
  searchable?: boolean;
  destructive?: boolean;
};

const G = {
  security: { groupLabel: 'Security & Privacy', groupOrder: 0 },
  app: { groupLabel: 'App Settings', groupOrder: 1 },
  help: { groupLabel: 'Help & Management', groupOrder: 2 },
} as const;

/**
 * All discoverable settings destinations. Order in the array is not significant; use menu.*.order.
 */
export const SETTINGS_DIRECTORY = [
  {
    id: 'privacy',
    stackScreenKey: 'privacy-settings',
    href: '/privacy-settings',
    title: 'Privacy',
    subtitle: 'Last seen, status, visibility',
    icon: ShieldCheck,
    keywords: ['last seen', 'status', 'visibility'],
    menu: { ...G.security, itemOrder: 0 },
  },
  {
    id: 'security',
    stackScreenKey: 'security-settings',
    href: '/security-settings',
    title: 'Security',
    subtitle: 'Biometric lock, device sessions',
    icon: Lock,
    keywords: ['biometric', 'lock', 'sessions', 'device'],
    menu: { ...G.security, itemOrder: 1 },
  },
  {
    id: 'notif',
    stackScreenKey: 'notification-settings',
    href: '/notification-settings',
    title: 'Notifications',
    subtitle: 'Message alerts, quiet hours',
    icon: Bell,
    keywords: ['alerts', 'quiet hours', 'push', 'sounds'],
    menu: { ...G.app, itemOrder: 0 },
  },
  {
    id: 'chat',
    stackScreenKey: 'chat-settings',
    href: '/chat-settings',
    title: 'Chats & Media',
    subtitle: 'Auto-download, wallpaper',
    icon: MessageSquare,
    keywords: ['chat', 'media', 'download', 'storage', 'wallpaper'],
    menu: { ...G.app, itemOrder: 1 },
  },
  {
    id: 'appearance',
    stackScreenKey: 'appearance-settings',
    href: '/appearance-settings',
    title: 'Appearance',
    subtitle: 'Theme & Personalization',
    icon: Monitor,
    keywords: ['theme', 'dark mode', 'light', 'personalization'],
    menu: { ...G.app, itemOrder: 2 },
  },
  {
    id: 'help',
    stackScreenKey: 'support',
    href: '/support',
    title: 'Help & Support',
    subtitle: 'Report a bug, terms of service',
    icon: LifeBuoy,
    keywords: ['bug', 'support', 'help', 'terms'],
    menu: { ...G.help, itemOrder: 0 },
  },
  {
    id: 'account-center',
    stackScreenKey: 'account-center/index',
    href: '/account-center',
    title: 'Account Center',
    subtitle: 'Delete account, personal data',
    icon: UserCircle,
    keywords: ['delete', 'data', 'deactivate', 'gdpr'],
    menu: { ...G.help, itemOrder: 1 },
  },
  {
    id: 'chat-wallpaper',
    stackScreenKey: 'chat-wallpaper',
    href: '/(settings)/chat-wallpaper',
    title: 'Chat Wallpaper',
    subtitle: 'Background for your conversations',
    icon: ImageIcon,
    keywords: ['background', 'theme image', 'custom wallpaper'],
    searchContext: 'Chats & Media',
  },
  {
    id: 'network-usage',
    stackScreenKey: 'network-usage',
    href: '/(settings)/network-usage',
    title: 'Network Usage',
    subtitle: 'Data sent and received in the app',
    icon: Database,
    keywords: ['data', 'bandwidth', 'wifi', 'cellular'],
    searchContext: 'Chats & Media',
  },
  {
    id: 'manage-storage',
    stackScreenKey: 'manage-storage',
    href: '/(settings)/manage-storage',
    title: 'Manage Storage',
    subtitle: 'Clear caches and free space',
    icon: Trash2,
    keywords: ['cache', 'clear', 'space', 'storage'],
    searchContext: 'Chats & Media',
  },
  {
    id: 'support-chat',
    stackScreenKey: 'support-chat',
    href: '/(settings)/support-chat',
    title: 'Direct Support',
    subtitle: 'Talk to our team',
    icon: MessageCircle,
    keywords: ['agent', 'human', 'ticket'],
    searchContext: 'Help & Support',
  },
  {
    id: 'knowledge-base',
    stackScreenKey: '(knowledge)/base',
    href: '/(settings)/(knowledge)/base',
    title: 'Knowledge Base',
    subtitle: 'Guides and tutorials',
    icon: BookOpen,
    keywords: ['faq', 'docs', 'how to', 'learn'],
    searchContext: 'Help & Support',
  },
  {
    id: 'feature-request',
    stackScreenKey: 'feature-request',
    href: '/(settings)/feature-request',
    title: 'Feature Request',
    subtitle: 'Vote and suggest improvements',
    icon: ExternalLink,
    keywords: ['roadmap', 'vote', 'feedback', 'suggest'],
    searchContext: 'Help & Support',
  },
  {
    id: 'propose-feature',
    stackScreenKey: 'propose-feature',
    href: '/(settings)/propose-feature',
    title: 'Propose Feature',
    subtitle: 'Submit a new idea',
    icon: Plus,
    keywords: ['new idea', 'suggestion', 'submit'],
    searchContext: 'Feature Request',
  },
  {
    id: 'terms-privacy',
    stackScreenKey: 'terms-privacy',
    href: '/(settings)/terms-privacy',
    title: 'Terms & Privacy',
    subtitle: 'Legal and data policies',
    icon: FileText,
    keywords: ['legal', 'policy', 'tos', 'privacy policy'],
    searchContext: 'Help & Support',
  },
  {
    id: 'network-diagnostic',
    stackScreenKey: 'network-diagnostic',
    href: '/(settings)/network-diagnostic',
    title: 'Network Diagnostic',
    subtitle: 'Connection health checks',
    icon: Activity,
    keywords: ['connection', 'ping', 'debug', 'internet'],
    searchContext: 'Help & Support',
  },
  {
    id: 'change-number',
    stackScreenKey: 'account-center/change-number',
    href: '/account-center/change-number',
    title: 'Change Phone Number',
    subtitle: 'Migrate account to a new number',
    icon: Smartphone,
    keywords: ['phone', 'migrate', 'sim', 'number'],
    searchContext: 'Account Center',
  },
  {
    id: 'request-info',
    stackScreenKey: 'account-center/request-info',
    href: '/account-center/request-info',
    title: 'Request Account Info',
    subtitle: 'Export your personal data report',
    icon: FileText,
    keywords: ['export', 'gdpr', 'download data', 'report'],
    searchContext: 'Account Center',
  },
  {
    id: 'deactivate',
    stackScreenKey: 'account-center/deactivate',
    href: '/account-center/deactivate',
    title: 'Deactivate Account',
    subtitle: 'Temporarily hide your profile',
    icon: UserMinus,
    keywords: ['pause', 'hide', 'temporary'],
    searchContext: 'Account Center',
  },
  {
    id: 'reactivate',
    stackScreenKey: 'account-center/reactivate',
    href: '/account-center/reactivate',
    title: 'Reactivate Account',
    subtitle: 'Make your profile visible again',
    icon: UserCheck,
    keywords: ['restore', 'undo deactivate'],
    searchContext: 'Account Center',
  },
  {
    id: 'delete-account',
    stackScreenKey: 'account-center/delete',
    href: '/account-center/delete',
    title: 'Delete My Account',
    subtitle: 'Permanently remove all data',
    icon: Trash2,
    keywords: ['erase', 'remove', 'forever'],
    searchContext: 'Account Center',
    destructive: true,
  },
] satisfies SettingsDirectoryEntry[];

/** Stack header maps for app/(settings)/_layout.tsx */
export const SETTINGS_STACK_ROUTE_TITLES: Record<string, string> = Object.fromEntries(
  SETTINGS_DIRECTORY.map((e) => [e.stackScreenKey, e.title])
);

export const SETTINGS_STACK_ROUTE_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  SETTINGS_DIRECTORY.map((e) => [e.stackScreenKey, e.icon])
);

function hrefToSearchBlob(href: Href): string {
  const path = typeof href === 'string' ? href : String((href as { pathname?: string }).pathname ?? '');
  return path
    .replace(/^\//, '')
    .replace(/\([^)]+\)\//g, '')
    .split(/[/]+/)
    .filter(Boolean)
    .join(' ')
    .replace(/-/g, ' ');
}

/**
 * When a sub-page is in the result list, drop its parent hub row (same title as the child's
 * `searchContext`) so users don't see redundant entries — e.g. hide "Chats & Media" if
 * "Chat Wallpaper" already matched.
 */
export function suppressParentHubsWhenChildMatches(
  results: readonly SettingsDirectoryEntry[]
): SettingsDirectoryEntry[] {
  const parentTitlesToHide = new Set(
    results.map((e) => e.searchContext).filter((s): s is string => Boolean(s))
  );
  if (parentTitlesToHide.size === 0) return [...results];
  return results.filter((e) => !parentTitlesToHide.has(e.title));
}

/** Multi-word queries: every token must appear somewhere in the combined haystack. */
export function searchSettingsDirectory(
  query: string,
  entries: readonly SettingsDirectoryEntry[] = SETTINGS_DIRECTORY
): SettingsDirectoryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const terms = q.split(/\s+/).filter(Boolean);
  const matched = entries.filter((e) => {
    if (e.searchable === false) return false;
    const hay = [
      e.title,
      e.subtitle,
      e.searchContext,
      ...(e.keywords ?? []),
      hrefToSearchBlob(e.href),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
  return suppressParentHubsWhenChildMatches(matched);
}

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

/** Grouped rows for the Account tab when the user is not searching. */
export function buildAccountMenuFromDirectory(
  entries: readonly SettingsDirectoryEntry[] = SETTINGS_DIRECTORY
): AccountMenuSection[] {
  const withMenu = entries.filter(
    (e): e is SettingsDirectoryEntry & { menu: SettingsMenuPlacement } => Boolean(e.menu)
  );
  const byGroup = new Map<string, { order: number; label: string; items: typeof withMenu }>();

  for (const e of withMenu) {
    const m = e.menu;
    const key = `${m.groupOrder}:${m.groupLabel}`;
    if (!byGroup.has(key)) {
      byGroup.set(key, { order: m.groupOrder, label: m.groupLabel, items: [] });
    }
    byGroup.get(key)!.items.push(e);
  }

  return [...byGroup.values()]
    .sort((a, b) => a.order - b.order)
    .map((g) => ({
      title: g.label,
      items: [...g.items]
        .sort((a, b) => a.menu!.itemOrder - b.menu!.itemOrder)
        .map((e) => ({
          id: e.id,
          icon: e.icon,
          title: e.title,
          subtitle: e.subtitle,
          href: e.href,
          destructive: e.destructive,
        })),
    }));
}
