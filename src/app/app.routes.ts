import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.page').then((m) => m.LandingPage),
    title: 'Leno Borges · Professor de Programação Particular'
  },
  {
    path: 'comunidade',
    loadComponent: () => import('./pages/comunidade/comunidade.page').then((m) => m.ComunidadePage),
    title: 'Seita Dev · Comunidade de programação do Leno Borges'
  },
  { path: '**', redirectTo: '' }
];
