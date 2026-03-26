import { Routes } from '@angular/router';
import { DraftPage } from './pages/draft/draft.page';
import { CompositionsPage } from './pages/compositions/compositions.page';
import { SkillsLabPage } from './pages/skills-lab/skills-lab.page';
import { BattleLogsPage } from './pages/battle-logs/battle-logs.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'draft' },
  { path: 'draft', component: DraftPage },
  { path: 'compositions', component: CompositionsPage },
  { path: 'skills-lab', component: SkillsLabPage },
  { path: 'battle-logs', component: BattleLogsPage },
  { path: '**', redirectTo: 'draft' },
];
