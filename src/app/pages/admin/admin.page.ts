import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Índice da Administração.
 *
 * Quatro portas, e nada mais: usuários, mural, conteúdo da trilha e e-mails.
 * Uma tela de índice parece pouco, e continua sendo o que evita empilhar
 * administração de naturezas diferentes num menu lateral que é do aluno — o
 * argumento estava certo com duas portas e continua certo com quatro.
 *
 * **Nenhuma delas vai para o `dashboard-aside`**: o aside é a navegação de quem
 * estuda, e a Administração inteira entra por uma porta só.
 */
@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <header>
        <p class="u-mono page__eyebrow">Administração</p>
        <h1 class="page__title">O que você quer administrar?</h1>
      </header>

      <ul class="cards">
        <li>
          <a routerLink="/dashboard/admin/usuarios" class="card">
            <span class="card__title">Usuários</span>
            <span class="card__text">
              Quem se cadastrou, quem concluiu o onboarding e em que etapa da trilha cada um está.
            </span>
          </a>
        </li>
        <li>
          <a routerLink="/dashboard/admin/mural" class="card">
            <span class="card__title">Mural de Perguntas</span>
            <span class="card__text">
              Moderar as perguntas das duas semanas vivas e ver a vencedora que virou pauta.
            </span>
          </a>
        </li>
        <li>
          <a routerLink="/dashboard/admin/emails" class="card">
            <span class="card__title">E-mails</span>
            <span class="card__text">
              Escrever e disparar para a comunidade, com a contagem na frente e o histórico do
              que já saiu.
            </span>
          </a>
        </li>
        <li>
          <a routerLink="/dashboard/admin/trilha" class="card">
            <span class="card__title">Conteúdo da trilha</span>
            <span class="card__text">
              Publicar vídeos por insígnia, dar título de plataforma e definir a ordem.
            </span>
          </a>
        </li>
      </ul>
    </section>
  `,
  styles: `
    .page {
      display: grid;
      gap: 1.5rem;
      padding: 1.25rem 1rem 4rem;
    }

    .page__eyebrow {
      color: var(--accent-deep);
      font-size: var(--step--1);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .page__title {
      font-family: var(--font-display);
      font-size: var(--step-3);
      line-height: 1.05;
      margin: 0.2rem 0 0;
    }

    .cards {
      display: grid;
      gap: 1rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    @media (min-width: 48rem) {
      .cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .card {
      display: grid;
      gap: 0.4rem;
      height: 100%;
      min-height: 7rem;
      padding: 1.25rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--paper);
      color: var(--ink);
      text-decoration: none;
      box-shadow: var(--shadow-hard-sm);
    }

    .card__title {
      font-family: var(--font-display);
      font-size: var(--step-1);
    }

    .card__text {
      color: var(--ink-soft);
      line-height: 1.5;
    }

    @media (hover: hover) {
      .card:hover {
        border-color: var(--accent-deep);
      }
    }
  `
})
export class AdminPage {}
