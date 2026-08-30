import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { onboardingPendingGuard, profileCompleteGuard } from './core/auth/profile.guard';
import { adminGuard } from './core/auth/admin.guard';
import { unsavedChangesGuard } from './core/unsaved-changes.guard';
import { nicknameGuard } from './core/games/nickname.guard';

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
  {
    // **Pública, sem guard nenhum e fora do `dashboard-shell`.** É aonde o
    // rodapé de todo e-mail leva, e ela precisa funcionar para quem nunca
    // entrou naquele navegador. Ver a decisão 11 da spec 014.
    path: 'descadastro',
    loadComponent: () =>
      import('./pages/descadastro/descadastro.page').then((m) => m.DescadastroPage),
    title: 'Cancelar inscrição · Liga Dev'
  },
  // Os documentos legais (spec 018, decisão 10).
  //
  // **Públicas, sem guard nenhum e fora do `dashboard-shell`**, pela mesma razão
  // do `/descadastro` logo acima: quem lê pelo rodapé da landing não tem conta,
  // e é justamente a pessoa que mais precisa ler antes. Uma página de contrato
  // atrás de login é um contrato que só se lê depois de assinar.
  //
  // O `documentId` vem em `data` e não como `:id`: são duas rotas fixas, e um
  // parâmetro aberto convidaria a tratar documento inexistente como caso de
  // tela em vez de rota que não existe.
  {
    path: 'termos-de-uso',
    data: { documentId: 'termos-de-uso' },
    loadComponent: () =>
      import('./pages/legal/legal-document.page').then((m) => m.LegalDocumentPage),
    title: 'Termos de Uso · Liga Dev'
  },
  {
    path: 'politica-de-privacidade',
    data: { documentId: 'politica-de-privacidade' },
    loadComponent: () =>
      import('./pages/legal/legal-document.page').then((m) => m.LegalDocumentPage),
    title: 'Política de Privacidade · Liga Dev'
  },
  // A tela de senha voltou a ser nossa (spec 020).
  //
  // Ela morreu como `/definir-senha` na decisão 3 da spec 007, quando o link do
  // e-mail passou a levar para a tela hospedada pelo Google. Volta como
  // `/acesso`, e **o que não volta é o front falando com o Firebase**: o
  // `oobCode` vai para a nossa API, que fala com o Identity Toolkit. O SDK web
  // do Firebase aqui seria menos código e um segundo caminho de login instalado
  // ao lado do primeiro, para sempre.
  //
  // **Uma rota para todos os modos**, porque o console do Firebase tem um campo
  // só: ele manda todo link de ação para um endereço, com o `mode` na query.
  // Quatro rotas exigiriam que o console soubesse rotear, e ele não sabe.
  //
  // Pública, sem guard e fora do `dashboard-shell`, como o `/descadastro` e as
  // páginas legais: quem está nela ainda não tem sessão — é a tela onde a
  // sessão passa a ser possível.
  {
    path: 'acesso',
    loadComponent: () => import('./pages/acesso/acesso.page').then((m) => m.AcessoPage),
    title: 'Acesso · Liga Dev'
  },
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
      {
        // Do próprio membro, e só. Sem `:id`, sem lista de membros e sem
        // visualização pública: a rota lê o AuthStore e o GET /me, e não aceita
        // parâmetro nenhum. O `profileCompleteGuard` fica — quem ainda não fez o
        // onboarding tem `/completar-perfil`, que é a mesma edição com outro
        // propósito, e duas telas de edição abertas para a mesma pessoa ao
        // mesmo tempo é confusão sem ganho.
        path: 'perfil',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./pages/perfil/perfil.page').then((m) => m.PerfilPage),
        title: 'Meu Perfil · Liga Dev'
      },
      {
        path: 'mural',
        loadComponent: () => import('./pages/mural/mural.page').then((m) => m.MuralPage),
        title: 'Mural de Perguntas · Liga Dev'
      },
      {
        // Sem guard de tier: quem nao pode escrever ve o bloqueio explicado na
        // propria tela, com o caminho para o Financeiro. Redirecionar daria um
        // "nao" sem contexto -- e esta e a unica tela onde a restricao aparece no
        // momento em que o valor esta visivel.
        path: 'mural/nova',
        loadComponent: () =>
          import('./pages/mural/nova-pergunta/nova-pergunta.page').then(
            (m) => m.NovaPerguntaPage
          ),
        title: 'Escrever no Mural · Liga Dev'
      },
      // Jogos (spec 022).
      //
      // **Um nó com filhas, e o `nicknameGuard` no nó** — não repetido em cada
      // uma. Quem não tem gamertag não entra em lugar nenhum de Jogos, e a regra
      // mora num arquivo só: quatro `if` dentro de quatro páginas seriam quatro
      // cópias, e a quinta página nasceria sem ela.
      //
      // O `authGuard` e o `profileCompleteGuard` vêm do pai `dashboard`, e a
      // ordem importa: o guard da gamertag lê o perfil que aquele já garantiu.
      {
        path: 'jogos',
        canActivate: [nicknameGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/jogos/jogos.page').then((m) => m.JogosPage),
            title: 'Jogos · Liga Dev'
          },
          {
            path: 'desafios',
            loadComponent: () =>
              import('./pages/jogos/desafios/desafios.page').then(
                (m) => m.DesafiosPage
              ),
            title: 'GYM Challenge · Liga Dev'
          },
          {
            path: 'desafio/:badgeId',
            loadComponent: () =>
              import('./pages/jogos/desafio/desafio.page').then(
                (m) => m.DesafioPage
              ),
            title: 'GYM Challenge · Liga Dev'
          },
          {
            path: 'ranking',
            loadComponent: () =>
              import('./pages/jogos/ranking/ranking.page').then(
                (m) => m.RankingPage
              ),
            title: 'Ranking da Liga · Liga Dev'
          }
        ]
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
        path: 'admin/mural',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/admin/mural/mural-admin.page').then((m) => m.AdminMuralPage),
        title: 'Mural · Administração'
      },
      {
        path: 'admin/usuarios',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/admin/usuarios/usuarios.page').then((m) => m.AdminUsuariosPage),
        title: 'Usuários · Administração'
      },
      {
        path: 'admin/emails',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/admin/emails/emails.page').then((m) => m.AdminEmailsPage),
        title: 'E-mails · Administração'
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
      },
      // Banco de questões do GYM Challenge (spec 022, decisão 9). Mesmo par de
      // rotas de `admin/trilha`: escolher a insígnia, depois administrá-la.
      {
        path: 'admin/questoes',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/admin/questoes/questoes-admin.page').then(
            (m) => m.AdminQuestoesPage
          ),
        title: 'Banco de questões · Administração'
      },
      {
        path: 'admin/questoes/:badgeId',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/admin/questoes/insignia-questoes.page').then(
            (m) => m.AdminInsigniaQuestoesPage
          ),
        title: 'Questões da insígnia · Administração'
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
