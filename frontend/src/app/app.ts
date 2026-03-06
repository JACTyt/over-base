import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
/*
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
*/

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('OverBase');

  heroes = signal<number[]>([]); // IDs
  heroSummaries = signal<any[]>([]); // full hero info

  constructor(private http: HttpClient) {}

  sendRequest() {
    // Step 1: Call /draft
    this.http.post<number[]>('http://localhost:8000/draft', {}).subscribe((heroIds) => {
      // Save IDs
      this.heroes.set(heroIds);

      // Step 2: Call /get_hero for each ID
      this.heroSummaries.set([]); // clear previous summaries
      heroIds.forEach((id) => {
        this.http.post<any>('http://localhost:8000/get_hero', { id }).subscribe((summary) => {
          this.heroSummaries.update((list) => [...list, summary]);
        });
      });
    });
  }
}
