import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface BattleLogEntry {
  id: string;
  timestamp: string;
  story: string;
  winner: string;
  isFavorite: boolean;
  favoriteIcon: string;
  tags: Array<{
    name: string;
    icon: string;
  }>;
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

@Component({
  selector: 'app-draft-page',
  imports: [CommonModule],
  templateUrl: './draft.page.html',
  styleUrl: './draft.page.css',
})
export class DraftPage {
  protected readonly title = signal('OverBase');

  heroes = signal<number[]>([]);
  heroSummaries = signal<any[]>([]);
  battleStory = signal('');
  battleWinner = signal('');

  constructor(private http: HttpClient) {}

  sendRequest() {
    this.http.post<number[]>('http://localhost:8000/draft', {}).subscribe((heroIds) => {
      this.heroes.set(heroIds);
      this.heroSummaries.set([]);

      heroIds.forEach((id) => {
        this.http.post<any>('http://localhost:8000/get_hero', { id }).subscribe((summary) => {
          this.heroSummaries.update((list) => [...list, { ...summary, id }]);
        });
      });
    });
  }

  predictBattle() {
    const heroIds = this.heroes();
    if (heroIds.length < 2) {
      console.error('Need at least 2 heroes for battle');
      return;
    }

    this.http
      .post<any>('http://localhost:8000/battle_predict', {
        hero1_id: heroIds[0],
        hero2_id: heroIds[1],
      })
      .subscribe((battle) => {
        this.battleStory.set(battle.story);
        this.battleWinner.set(battle.winner);

        const heroOneSummary = this.heroSummaries().find((hero) => hero.id === heroIds[0]);
        const heroTwoSummary = this.heroSummaries().find((hero) => hero.id === heroIds[1]);
        const heroOneName = heroOneSummary?.name ?? `Hero #${heroIds[0]}`;
        const heroTwoName = heroTwoSummary?.name ?? `Hero #${heroIds[1]}`;

        this.appendBattleLog(battle.story, battle.winner, heroOneName, heroTwoName);
      });
  }

  private appendBattleLog(story: string, winner: string, heroOneName: string, heroTwoName: string) {
    if (typeof window === 'undefined') {
      return;
    }

    const newEntry: BattleLogEntry = {
      id: this.generateBattleId(),
      timestamp: new Date().toISOString(),
      story,
      winner,
      isFavorite: false,
      favoriteIcon: '★',
      tags: [],
      lists: [],
      heroOne: {
        name: heroOneName,
        avatar: this.getAvatarPath(heroOneName),
      },
      heroTwo: {
        name: heroTwoName,
        avatar: this.getAvatarPath(heroTwoName),
      },
    };

    try {
      const rawLogs = localStorage.getItem(BATTLE_LOGS_KEY);
      const existingLogs = rawLogs ? JSON.parse(rawLogs) : [];
      const safeLogs = Array.isArray(existingLogs) ? existingLogs : [];
      const updatedLogs = [newEntry, ...safeLogs].slice(0, 100);
      localStorage.setItem(BATTLE_LOGS_KEY, JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Failed to save battle logs', error);
    }
  }

  private getAvatarPath(heroName: string): string {
    return `/assets/icons/${heroName.replace(':', '')}.png`;
  }

  private generateBattleId(): string {
    return `battle-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
