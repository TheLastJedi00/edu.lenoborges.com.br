import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { onboardingPendingGuard, profileCompleteGuard } from './core/auth/profile.guard';
import { adminGuard } from './core/auth/admin.guard';

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
      },
      {
        path: 'financeiro',
        loadComponent: () =>
          import('./pages/financeiro/financeiro.page').then((m) => m.FinanceiroPage),
        title: 'Financeiro · Liga Dev'
      },
      {
        path: 'trilha',
        loadComponent: () => import('./pages/trilha/trilha.page').then((m) => m.TrilhaPage),
        title: 'Trilha · Liga Dev'
      },
      {
        // Sem guard de progresso: a trilha não é presa, e entrar direto na
        // Insígnia 5 com `grade: 0` é um caminho legítimo. Ver a decisão 6.
        path: 'trilha/:badgeId',
        loadComponent: () =>
          import('./pages/trilha/insignia/insignia.page').then((m) => m.InsigniaPage),
        title: 'Insígnia · Liga Dev'
      },
      // Administração. O `adminGuard` aqui é conveniência — evita o membro comum
      // bater num 403 sem entender por quê. Quem impede de verdade é o
      // AdminGuard do backend, em toda requisição.
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/admin/admin.page').then((m) => m.AdminPage),
        title: 'Administração · Liga Dev'
      },
      {
        path: 'admin/usuarios',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/admin/usuarios/usuarios.page').then((m) => m.AdminUsuariosPage),
        title: 'Usuários · Administração'
      },
      {
        path: 'admin/trilha',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/admin/trilha/trilha-admin.page').then((m) => m.AdminTrilhaPage),
        title: 'Conteúdo da trilha · Administração'
      },
      {
        path: 'admin/trilha/:badgeId',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/admin/trilha/insignia-admin.page').then((m) => m.AdminInsigniaPage),
        title: 'Vídeos da insígnia · Administração'
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
