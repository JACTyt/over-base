import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

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
          this.heroSummaries.update((list) => [...list, summary]);
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
      });
  }
}
