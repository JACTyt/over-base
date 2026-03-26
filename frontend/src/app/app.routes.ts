import { Routes } from '@angular/router';
import { DraftPage } from './pages/draft/draft.page';
import { CompositionsPage } from './pages/compositions/compositions.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'draft' },
  { path: 'draft', component: DraftPage },
  { path: 'compositions', component: CompositionsPage },
  { path: '**', redirectTo: 'draft' },
];
