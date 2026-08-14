import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { onboardingPendingGuard, profileCompleteGuard } from './core/auth/profile.guard';

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
  {
    path: 'definir-senha',
    loadComponent: () => import('./pages/definir-senha/definir-senha.page').then((m) => m.DefinirSenhaPage),
    title: 'Definir Senha · Seita Dev'
  },
  {
    path: 'completar-perfil',
    canActivate: [authGuard, onboardingPendingGuard],
    loadComponent: () => import('./pages/completar-perfil/completar-perfil.page').then((m) => m.CompletarPerfilPage),
    title: 'Completar Perfil · Seita Dev'
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, profileCompleteGuard],
    loadComponent: () => import('./pages/dashboard/dashboard-shell').then((m) => m.DashboardShell),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
        title: 'Painel do Membro · Seita Dev'
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
