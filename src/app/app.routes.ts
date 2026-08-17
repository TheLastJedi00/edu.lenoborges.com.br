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
    title: 'Liga Dev · Comunidade de programação do Leno Borges'
  },
  // Não existe rota `definir-senha`, e a ausência é proposital.
  //
  // O Firebase hospeda a própria tela de definição de senha, e o link do e-mail
  // leva direto para lá. O usuário volta para cá pelo `?entrar=1` da landing,
  // que abre o diálogo de login. Ver a decisão 3 da spec 007 no repositório do
  // backend.
  {
    path: 'completar-perfil',
    canActivate: [authGuard, onboardingPendingGuard],
    loadComponent: () => import('./pages/completar-perfil/completar-perfil.page').then((m) => m.CompletarPerfilPage),
    title: 'Completar Perfil · Liga Dev'
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, profileCompleteGuard],
    loadComponent: () => import('./pages/dashboard/dashboard-shell').then((m) => m.DashboardShell),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
        title: 'Painel do Membro · Liga Dev'
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
