import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.page').then((m) => m.LandingPage),
    title: 'Leno Borges — Desenvolvedor Fullstack e Instrutor Técnico'
  },
  { path: '**', redirectTo: '' }
];
