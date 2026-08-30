import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { Reveal } from '../../../directives/reveal';
import { Logo } from '../../../shared/logo/logo';
import { GymChallengeCard } from '../../../components/gym-challenge-card/gym-challenge-card';
import { GamesService } from '../../../services/games.service';
import { ChallengeState } from '../../../models/games.model';

/**
 * A lista de GYM Challenges (spec 022, decisão 2).
 *
 * **Não é uma cópia da trilha.** A trilha mostra vídeos e progresso de conteúdo;
 * aqui são desafios e progresso de conquista, e são as mesmas oito insígnias
 * vistas por outra pergunta.
 *
 * Smart page: faz a requisição e passa o estado pronto para o card, que é burro.
 */
@Component({
  selector: 'app-desafios-page',
  imports: [Reveal, Logo, GymChallengeCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './desafios.page.html',
  styleUrl: './desafios.page.scss'
})
export class DesafiosPage {
  private readonly games = inject(GamesService);
  private readonly router = inject(Router);

  protected readonly challenges = signal<readonly ChallengeState[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  constructor() {
    this.carregar();
  }

  protected carregar(): void {
    this.loading.set(true);
    this.error.set(false);

    this.games.listChallenges().subscribe({
      next: (list) => {
        this.challenges.set(list);
        this.loading.set(false);
      },
      // **Lista vazia não passa por aqui.** A API responde 200 com as oito
      // insígnias sempre; um erro aqui é a rede ou a sessão, e a tela precisa
      // dizer isso em vez de mostrar oito cards fantasmas.
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  /**
   * O card "em breve" não navega, e a decisão é do card.
   *
   * Ele não emite clique nenhum nesse estado, então este método não precisa
   * conferir de novo — mas confere: a rota `/desafio/:badgeId` de uma insígnia
   * sem questões responderia com a mesma tela de "em breve", e navegar para lá
   * seria uma viagem para lugar nenhum.
   */
  protected abrir(challenge: ChallengeState): void {
    if (challenge.status === 'em-breve') {
      return;
    }

    void this.router.navigate([
      '/dashboard/jogos/desafio',
      challenge.badgeId
    ]);
  }
}
