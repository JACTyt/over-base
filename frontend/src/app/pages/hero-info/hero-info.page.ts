import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

type RoleFilter = 'all' | 'tank' | 'damage' | 'support';

interface HeroInfo {
  id: number;
  name: string;
  role: 'tank' | 'damage' | 'support';
  side: string;
  bio: string;
  appearance: string;
  skills: string[];
  ultimate: string | null;
}

@Component({
  selector: 'app-hero-info-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './hero-info.page.html',
  styleUrl: './hero-info.page.css',
})
export class HeroInfoPage implements OnInit, OnDestroy {
  private readonly apiBase = 'http://localhost:8000';
  private routeSub: Subscription | null = null;

  heroes = signal<HeroInfo[]>([]);
  selectedHero = signal<HeroInfo | null>(null);
  roleFilter = signal<RoleFilter>('all');
  searchTerm = signal('');
  loading = signal(false);
  errorMessage = signal('');

  filteredHeroes = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.heroes();
    }

    return this.heroes().filter((hero) => hero.name.toLowerCase().includes(term));
  });

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const heroId = this.parseHeroId(params.get('id'));
      if (heroId !== null) {
        this.fetchHero(heroId);
      }
    });

    this.fetchHeroes();
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  onRoleChange(value: RoleFilter): void {
    this.roleFilter.set(value);
    this.fetchHeroes();
  }

  openHero(heroId: number): void {
    this.router.navigate(['/hero-info', heroId]);
  }

  trackById(_: number, hero: HeroInfo): number {
    return hero.id;
  }

  getAvatarPath(heroName: string): string {
    return `/assets/icons/${heroName.replace(':', '')}.png`;
  }

  private parseHeroId(rawId: string | null): number | null {
    if (rawId === null) {
      return null;
    }

    const heroId = Number(rawId);
    return Number.isNaN(heroId) ? null : heroId;
  }

  private fetchHeroes(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const params =
      this.roleFilter() === 'all'
        ? new HttpParams()
        : new HttpParams().set('role', this.roleFilter());

    this.http.get<HeroInfo[]>(`${this.apiBase}/heroes`, { params }).subscribe({
      next: (heroes) => {
        this.heroes.set(heroes);
        this.loading.set(false);

        if (heroes.length === 0) {
          this.selectedHero.set(null);
          this.errorMessage.set('No heroes found for the selected role.');
          return;
        }

        const routeHeroId = this.parseHeroId(this.route.snapshot.paramMap.get('id'));
        const currentHeroId = this.selectedHero()?.id ?? routeHeroId;
        const hasCurrentHero = currentHeroId !== null && heroes.some((hero) => hero.id === currentHeroId);

        if (hasCurrentHero && currentHeroId !== null) {
          this.fetchHero(currentHeroId);
          return;
        }

        void this.router.navigate(['/hero-info', heroes[0].id], { replaceUrl: true });
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Unable to load heroes. Make sure backend API is running on port 8000.');
      },
    });
  }

  private fetchHero(heroId: number): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.http.get<HeroInfo>(`${this.apiBase}/heroes/${heroId}`).subscribe({
      next: (hero) => {
        this.selectedHero.set(hero);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set(`Hero with id ${heroId} is not available.`);
      },
    });
  }
}
