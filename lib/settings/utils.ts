import { Href } from 'expo-router';
import { SETTINGS_DIRECTORY } from './data';
import { SettingsDirectoryEntry, SettingsMenuPlacement, AccountMenuSection } from './types';

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

export function suppressParentHubsWhenChildMatches(
  results: readonly SettingsDirectoryEntry[]
): SettingsDirectoryEntry[] {
  const parentTitlesToHide = new Set(
    results.map((e) => e.searchContext).filter((s): s is string => Boolean(s))
  );
  if (parentTitlesToHide.size === 0) return [...results];
  return results.filter((e) => !parentTitlesToHide.has(e.title));
}

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
