import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';

interface BattleTag {
  name: string;
  icon: string;
}

interface BattleLogEntry {
  id: string;
  timestamp: string;
  story: string;
  winner: string;
  isFavorite: boolean;
  favoriteIcon: string;
  tags: BattleTag[];
  lists: string[];
  heroOne: {
    name: string;
    avatar: string;
  };
  heroTwo: {
    name: string;
    avatar: string;
  };
}

const BATTLE_LOGS_KEY = 'overbase.battleLogs';
const BATTLE_LISTS_KEY = 'overbase.battleLists';
const BATTLE_TAG_LIBRARY_KEY = 'overbase.battleTagLibrary';

type SortMode = 'newest' | 'oldest' | 'favorites-first';
type FavoriteFilter = 'all' | 'favorites' | 'non-favorites';

const TAG_FILTER_TAGGED = '__tagged__';
const TAG_FILTER_UNTAGGED = '__untagged__';
const LIST_FILTER_LISTED = '__listed__';
const LIST_FILTER_UNLISTED = '__unlisted__';

@Component({
  selector: 'app-battle-logs-page',
  imports: [CommonModule],
  templateUrl: './battle-logs.page.html',
  styleUrl: './battle-logs.page.css',
})
export class BattleLogsPage implements OnInit {
  readonly favoriteIconOptions = ['★', '❤', '🔥', '⚡', '👑', '🏆', '✨'];
  readonly tagIconOptions = ['🏷️', '⚔️', '🛡️', '🔥', '🧠', '🎯', '💥', '🌟'];

  battleLogs = signal<BattleLogEntry[]>([]);
  battleLists = signal<string[]>([]);
  battleTagLibrary = signal<BattleTag[]>([]);
  expandedBattle = signal<Record<string, boolean>>({});
  selectedBattleId = signal<string | null>(null);
  contextMenuBattleId = signal<string | null>(null);
  rightSidebarHidden = signal(false);
  quickTagMenuOpen = signal(false);

  listNameInput = signal('');
  pendingTagInput = signal<Record<string, string>>({});
  pendingTagIconChoice = signal<Record<string, string>>({});
  pendingTagCustomIcon = signal<Record<string, string>>({});
  pendingFavoriteCustomIcon = signal<Record<string, string>>({});
  toolbarTagInput = signal('');
  toolbarTagIconChoice = signal('🏷️');
  toolbarTagCustomIcon = signal('');

  favoriteFilter = signal<FavoriteFilter>('all');
  tagFilter = signal('all');
  listFilter = signal('all');
  sortMode = signal<SortMode>('newest');

  readonly availableTags = computed(() => {
    const tags = [
      ...this.battleLogs().flatMap((log) => log.tags.map((tag) => tag.name)),
      ...this.battleTagLibrary().map((tag) => tag.name),
    ];
    return Array.from(new Set(tags)).sort((a, b) => a.localeCompare(b));
  });

  readonly visibleLogs = computed(() => {
    let result = [...this.battleLogs()];

    if (this.favoriteFilter() === 'favorites') {
      result = result.filter((log) => log.isFavorite);
    } else if (this.favoriteFilter() === 'non-favorites') {
      result = result.filter((log) => !log.isFavorite);
    }

    if (this.tagFilter() === TAG_FILTER_TAGGED) {
      result = result.filter((log) => log.tags.length > 0);
    } else if (this.tagFilter() === TAG_FILTER_UNTAGGED) {
      result = result.filter((log) => log.tags.length === 0);
    } else if (this.tagFilter() !== 'all') {
      result = result.filter((log) => log.tags.some((tag) => tag.name === this.tagFilter()));
    }

    if (this.listFilter() === LIST_FILTER_LISTED) {
      result = result.filter((log) => log.lists.length > 0);
    } else if (this.listFilter() === LIST_FILTER_UNLISTED) {
      result = result.filter((log) => log.lists.length === 0);
    } else if (this.listFilter() !== 'all') {
      result = result.filter((log) => log.lists.includes(this.listFilter()));
    }

    const selectedSort = this.sortMode();
    if (selectedSort === 'oldest') {
      result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } else if (selectedSort === 'favorites-first') {
      result.sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite));
    } else {
      result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    return result;
  });

  ngOnInit() {
    this.loadBattleLogs();
    this.loadBattleTagLibrary();
    this.loadBattleLists();
  }

  toggleBattle(battleId: string) {
    this.expandedBattle.update((current) => ({
      ...current,
      [battleId]: current[battleId] === false,
    }));
    this.selectedBattleId.set(battleId);
    this.contextMenuBattleId.set(null);
  }

  toggleBattleMenu(battleId: string, event: Event) {
    event.stopPropagation();
    this.selectedBattleId.set(battleId);
    this.contextMenuBattleId.update((current) => (current === battleId ? null : battleId));
  }

  isBattleMenuOpen(battleId: string): boolean {
    return this.contextMenuBattleId() === battleId;
  }

  toggleFavoriteFromMenu(battleId: string, event: Event) {
    event.stopPropagation();
    this.toggleFavorite(battleId);
    this.selectedBattleId.set(battleId);
    this.contextMenuBattleId.set(null);
  }

  addExistingTagFromMenu(battleId: string, tagName: string, event: Event) {
    event.stopPropagation();
    const normalizedTag = tagName.trim().toLowerCase();
    if (!normalizedTag) {
      return;
    }

    this.updateBattle(battleId, (battle) => {
      if (battle.tags.some((tag) => tag.name === normalizedTag)) {
        return battle;
      }

      return {
        ...battle,
        tags: [...battle.tags, { name: normalizedTag, icon: this.getKnownTagIcon(normalizedTag) }].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      };
    });

    this.selectedBattleId.set(battleId);
    this.contextMenuBattleId.set(null);
  }

  isTagAlreadyOnBattle(battle: BattleLogEntry, tagName: string): boolean {
    return battle.tags.some((tag) => tag.name === tagName);
  }

  removeBattleFromMenu(battleId: string, event: Event) {
    event.stopPropagation();
    this.contextMenuBattleId.set(null);
    this.removeBattle(battleId);
  }

  toggleRightSidebar() {
    this.rightSidebarHidden.update((hidden) => !hidden);
  }

  isBattleExpanded(battleId: string): boolean {
    return this.expandedBattle()[battleId] !== false;
  }

  getSelectedBattle(): BattleLogEntry | null {
    const id = this.selectedBattleId();
    if (!id) {
      return null;
    }
    return this.battleLogs().find((log) => log.id === id) || null;
  }

  formatTimestamp(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString();
  }

  setListNameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.listNameInput.set(input.value);
  }

  createBattleList() {
    const newListName = this.listNameInput().trim();
    if (!newListName) {
      return;
    }

    const exists = this.battleLists().some((list) => list.toLowerCase() === newListName.toLowerCase());
    if (exists) {
      return;
    }

    this.battleLists.update((lists) => [...lists, newListName].sort((a, b) => a.localeCompare(b)));
    this.persistBattleLists();
    this.listNameInput.set('');
  }

  removeBattleList(listName: string) {
    this.battleLists.update((lists) => lists.filter((list) => list !== listName));
    this.persistBattleLists();

    this.battleLogs.update((logs) => logs.map((log) => ({ ...log, lists: log.lists.filter((list) => list !== listName) })));
    this.persistBattleLogs();

    if (this.listFilter() === listName) {
      this.listFilter.set('all');
    }
  }

  toggleFavorite(battleId: string) {
    this.updateBattle(battleId, (battle) => ({
      ...battle,
      isFavorite: !battle.isFavorite,
    }));
  }

  setFavoriteIcon(battleId: string, event: Event) {
    const select = event.target as HTMLSelectElement;
    const icon = select.value.trim();
    if (!icon) {
      return;
    }

    this.updateBattle(battleId, (battle) => ({
      ...battle,
      favoriteIcon: icon,
    }));
  }

  setPendingFavoriteCustomIcon(battleId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.pendingFavoriteCustomIcon.update((current) => ({
      ...current,
      [battleId]: input.value,
    }));
  }

  applyCustomFavoriteIcon(battleId: string) {
    const customIcon = (this.pendingFavoriteCustomIcon()[battleId] || '').trim();
    if (!customIcon) {
      return;
    }

    this.updateBattle(battleId, (battle) => ({
      ...battle,
      favoriteIcon: customIcon,
    }));

    this.pendingFavoriteCustomIcon.update((current) => ({
      ...current,
      [battleId]: '',
    }));
  }

  pendingFavoriteIconForBattle(battleId: string): string {
    return this.pendingFavoriteCustomIcon()[battleId] || '';
  }

  setPendingTagInput(battleId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.pendingTagInput.update((current) => ({
      ...current,
      [battleId]: input.value,
    }));
  }

  pendingTagForBattle(battleId: string): string {
    return this.pendingTagInput()[battleId] || '';
  }

  setPendingTagIconChoice(battleId: string, event: Event) {
    const select = event.target as HTMLSelectElement;
    this.pendingTagIconChoice.update((current) => ({
      ...current,
      [battleId]: select.value,
    }));
  }

  setPendingTagCustomIcon(battleId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.pendingTagCustomIcon.update((current) => ({
      ...current,
      [battleId]: input.value,
    }));
  }

  pendingTagCustomIconForBattle(battleId: string): string {
    return this.pendingTagCustomIcon()[battleId] || '';
  }

  addTag(battleId: string) {
    const tag = (this.pendingTagInput()[battleId] ?? '').trim();
    if (!tag) {
      return;
    }

    const iconChoice = this.pendingTagIconChoice()[battleId] || this.tagIconOptions[0];
    const customIcon = (this.pendingTagCustomIcon()[battleId] || '').trim();
    const finalIcon = iconChoice === 'custom' ? customIcon || this.tagIconOptions[0] : iconChoice;

    this.updateBattle(battleId, (battle) => {
      const normalizedTag = tag.toLowerCase();
      if (battle.tags.some((existing) => existing.name === normalizedTag)) {
        return battle;
      }
      return {
        ...battle,
        tags: [...battle.tags, { name: normalizedTag, icon: finalIcon }].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      };
    });

    this.pendingTagInput.update((current) => ({
      ...current,
      [battleId]: '',
    }));
    this.pendingTagCustomIcon.update((current) => ({
      ...current,
      [battleId]: '',
    }));
  }

  removeTag(battleId: string, tagName: string) {
    this.updateBattle(battleId, (battle) => ({
      ...battle,
      tags: battle.tags.filter((item) => item.name !== tagName),
    }));

    if (this.tagFilter() === tagName) {
      this.tagFilter.set('all');
    }
  }

  isBattleInList(battle: BattleLogEntry, listName: string): boolean {
    return battle.lists.includes(listName);
  }

  onBattleListToggle(battleId: string, listName: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.updateBattle(battleId, (battle) => {
      if (input.checked) {
        if (battle.lists.includes(listName)) {
          return battle;
        }
        return {
          ...battle,
          lists: [...battle.lists, listName].sort((a, b) => a.localeCompare(b)),
        };
      }

      return {
        ...battle,
        lists: battle.lists.filter((list) => list !== listName),
      };
    });
  }

  removeBattle(battleId: string) {
    const battleToRemove = this.battleLogs().find((battle) => battle.id === battleId);
    if (!battleToRemove) {
      return;
    }

    if (typeof window !== 'undefined') {
      const shouldRemove = window.confirm(
        `Remove this battle log?\n${battleToRemove.heroOne.name} vs ${battleToRemove.heroTwo.name}`,
      );
      if (!shouldRemove) {
        return;
      }
    }

    this.battleLogs.update((logs) => logs.filter((battle) => battle.id !== battleId));
    this.persistBattleLogs();

    this.expandedBattle.update((current) => {
      const next = { ...current };
      delete next[battleId];
      return next;
    });

    if (this.selectedBattleId() === battleId) {
      this.selectedBattleId.set(null);
    }

    if (this.contextMenuBattleId() === battleId) {
      this.contextMenuBattleId.set(null);
    }

    this.pendingTagInput.update((current) => {
      const next = { ...current };
      delete next[battleId];
      return next;
    });

    this.pendingTagIconChoice.update((current) => {
      const next = { ...current };
      delete next[battleId];
      return next;
    });

    this.pendingTagCustomIcon.update((current) => {
      const next = { ...current };
      delete next[battleId];
      return next;
    });

    this.pendingFavoriteCustomIcon.update((current) => {
      const next = { ...current };
      delete next[battleId];
      return next;
    });
  }

  setFavoriteFilter(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.favoriteFilter.set((select.value as FavoriteFilter) ?? 'all');
  }

  setTagFilter(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.tagFilter.set(select.value || 'all');
  }

  setListFilter(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.listFilter.set(select.value || 'all');
  }

  setSortMode(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.sortMode.set((select.value as SortMode) ?? 'newest');
  }

  applyQuickFilter(filter: 'all' | 'favorites' | string) {
    if (filter === 'all') {
      this.favoriteFilter.set('all');
      this.tagFilter.set('all');
      return;
    }

    if (filter === 'favorites') {
      this.favoriteFilter.set('favorites');
      this.tagFilter.set('all');
      return;
    }

    this.favoriteFilter.set('all');
    this.tagFilter.set(filter);
  }

  isQuickFilterActive(filter: 'all' | 'favorites' | string): boolean {
    if (filter === 'all') {
      return this.favoriteFilter() === 'all' && this.tagFilter() === 'all';
    }
    if (filter === 'favorites') {
      return this.favoriteFilter() === 'favorites';
    }
    return this.favoriteFilter() === 'all' && this.tagFilter() === filter;
  }

  addTagToSelectedBattle() {
    const selected = this.getTagTargetBattle();
    const tagName = this.toolbarTagInput().trim().toLowerCase();

    if (!selected || !tagName) {
      return;
    }

    this.updateBattle(selected.id, (battle) => {
      if (battle.tags.some((tag) => tag.name === tagName)) {
        return battle;
      }

      return {
        ...battle,
        tags: [...battle.tags, { name: tagName, icon: '🏷️' }].sort((a, b) => a.name.localeCompare(b.name)),
      };
    });

    this.toolbarTagInput.set('');
  }

  removeTagFromSelectedBattle(tagName: string) {
    const selected = this.getTagTargetBattle();
    if (!selected) {
      return;
    }
    this.removeTag(selected.id, tagName);
  }

  getTagTargetBattle(): BattleLogEntry | null {
    return this.getSelectedBattle() || this.visibleLogs()[0] || this.battleLogs()[0] || null;
  }

  setToolbarTagInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.toolbarTagInput.set(input.value);
  }

  toggleQuickTagMenu(event: Event) {
    event.stopPropagation();
    this.quickTagMenuOpen.update((open) => !open);
  }

  setToolbarTagIconChoice(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.toolbarTagIconChoice.set(select.value || '🏷️');
  }

  setToolbarTagCustomIcon(event: Event) {
    const input = event.target as HTMLInputElement;
    this.toolbarTagCustomIcon.set(input.value);
  }

  createTagFromQuickMenu() {
    const tagName = this.toolbarTagInput().trim().toLowerCase();
    if (!tagName) {
      return;
    }

    const iconChoice = this.toolbarTagIconChoice();
    const customIcon = this.toolbarTagCustomIcon().trim();
    const finalIcon = iconChoice === 'custom' ? customIcon || '🏷️' : iconChoice;

    const alreadyExists = this.availableTags().includes(tagName);
    if (alreadyExists) {
      return;
    }

    this.battleTagLibrary.update((tags) =>
      [...tags, { name: tagName, icon: finalIcon }].sort((a, b) => a.name.localeCompare(b.name)),
    );
    this.persistBattleTagLibrary();

    this.toolbarTagInput.set('');
    this.toolbarTagCustomIcon.set('');
    this.toolbarTagIconChoice.set('🏷️');
    this.quickTagMenuOpen.set(false);
  }

  private getKnownTagIcon(tagName: string): string {
    const fromLibrary = this.battleTagLibrary().find((tag) => tag.name === tagName);
    if (fromLibrary) {
      return fromLibrary.icon;
    }

    const foundTag = this.battleLogs()
      .flatMap((battle) => battle.tags)
      .find((tag) => tag.name === tagName);

    return foundTag?.icon || '🏷️';
  }

  private loadBattleLogs() {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const rawLogs = localStorage.getItem(BATTLE_LOGS_KEY);
      const parsedLogs: unknown = rawLogs ? JSON.parse(rawLogs) : [];
      const safeLogs: unknown[] = Array.isArray(parsedLogs) ? parsedLogs : [];

      const normalizedLogs = safeLogs
        .filter((log: any) => log && typeof log.story === 'string' && typeof log.winner === 'string')
        .map((log: any, index: number) => ({
          id: typeof log.id === 'string' ? log.id : this.generateBattleId(index),
          timestamp: typeof log.timestamp === 'string' ? log.timestamp : new Date().toISOString(),
          story: log.story,
          winner: log.winner,
          isFavorite: Boolean(log.isFavorite),
          favoriteIcon: this.normalizeIcon(log.favoriteIcon, '★'),
          tags: this.normalizeTags(log.tags),
          lists: Array.isArray(log.lists)
            ? log.lists.filter((list: unknown): list is string => typeof list === 'string')
            : [],
          heroOne: {
            name: typeof log.heroOne?.name === 'string' ? log.heroOne.name : 'Unknown Hero',
            avatar:
              typeof log.heroOne?.avatar === 'string'
                ? log.heroOne.avatar
                : this.getAvatarPath(log.heroOne?.name),
          },
          heroTwo: {
            name: typeof log.heroTwo?.name === 'string' ? log.heroTwo.name : 'Unknown Hero',
            avatar:
              typeof log.heroTwo?.avatar === 'string'
                ? log.heroTwo.avatar
                : this.getAvatarPath(log.heroTwo?.name),
          },
        }));

      this.battleLogs.set(normalizedLogs);
      this.persistBattleLogs();
    } catch (error) {
      console.error('Failed to read battle logs', error);
      this.battleLogs.set([]);
    }
  }

  private loadBattleLists() {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const rawLists = localStorage.getItem(BATTLE_LISTS_KEY);
      const parsedLists: unknown = rawLists ? JSON.parse(rawLists) : [];
      const safeLists = Array.isArray(parsedLists)
        ? parsedLists.filter((list: unknown): list is string => typeof list === 'string')
        : [];

      const fromBattles = Array.from(new Set(this.battleLogs().flatMap((log) => log.lists))).filter(
        (list) => typeof list === 'string',
      );

      const mergedLists = Array.from(new Set([...safeLists, ...fromBattles])).sort((a, b) => a.localeCompare(b));
      this.battleLists.set(mergedLists);
      this.persistBattleLists();
    } catch (error) {
      console.error('Failed to read battle lists', error);
      this.battleLists.set([]);
    }
  }

  private loadBattleTagLibrary() {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const rawTags = localStorage.getItem(BATTLE_TAG_LIBRARY_KEY);
      const parsedTags: unknown = rawTags ? JSON.parse(rawTags) : [];
      const safeTags = this.normalizeTags(parsedTags);

      const fromBattles = this.battleLogs().flatMap((battle) => battle.tags);
      const merged = new Map<string, BattleTag>();
      [...safeTags, ...fromBattles].forEach((tag) => {
        merged.set(tag.name, tag);
      });

      this.battleTagLibrary.set(Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name)));
      this.persistBattleTagLibrary();
    } catch (error) {
      console.error('Failed to read battle tag library', error);
      this.battleTagLibrary.set([]);
    }
  }

  private updateBattle(battleId: string, updater: (battle: BattleLogEntry) => BattleLogEntry) {
    this.battleLogs.update((logs) => logs.map((battle) => (battle.id === battleId ? updater(battle) : battle)));
    this.persistBattleLogs();
  }

  private persistBattleLogs() {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(BATTLE_LOGS_KEY, JSON.stringify(this.battleLogs()));
  }

  private persistBattleLists() {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(BATTLE_LISTS_KEY, JSON.stringify(this.battleLists()));
  }

  private persistBattleTagLibrary() {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(BATTLE_TAG_LIBRARY_KEY, JSON.stringify(this.battleTagLibrary()));
  }

  private getAvatarPath(heroName: unknown): string {
    const safeName = typeof heroName === 'string' && heroName.length > 0 ? heroName : 'Unknown Hero';
    return `/assets/icons/${safeName.replace(':', '')}.png`;
  }

  private normalizeTags(rawTags: unknown): BattleTag[] {
    if (!Array.isArray(rawTags)) {
      return [];
    }

    const normalized = rawTags
      .map((tag): BattleTag | null => {
        if (typeof tag === 'string') {
          return { name: tag.toLowerCase(), icon: '🏷️' };
        }

        if (tag && typeof tag === 'object') {
          const tagRecord = tag as Record<string, unknown>;
          const name = typeof tagRecord['name'] === 'string' ? tagRecord['name'].toLowerCase() : '';
          if (!name) {
            return null;
          }
          return {
            name,
            icon: this.normalizeIcon(tagRecord['icon'], '🏷️'),
          };
        }

        return null;
      })
      .filter((tag): tag is BattleTag => tag !== null);

    const uniqueByName = new Map<string, BattleTag>();
    normalized.forEach((tag) => {
      uniqueByName.set(tag.name, tag);
    });

    return Array.from(uniqueByName.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  private normalizeIcon(rawIcon: unknown, fallback: string): string {
    if (typeof rawIcon !== 'string') {
      return fallback;
    }
    const trimmed = rawIcon.trim();
    return trimmed || fallback;
  }

  private generateBattleId(index: number): string {
    return `legacy-battle-${Date.now()}-${index}`;
  }
}
