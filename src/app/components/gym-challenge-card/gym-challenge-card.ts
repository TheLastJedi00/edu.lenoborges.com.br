import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RoundDots } from '../round-dots/round-dots';
import { IconCheck } from '../icons/icon-check';
import { ChallengeState } from '../../models/games.model';

/**
 * O card do GYM Challenge, nos seus quatro estados (spec 022, decisões 3 e 7).
 *
 * **Componente burro: recebe o estado pronto e emite o clique.** Ele aparece em
 * dois lugares — a lista de desafios e o fim da trilha da insígnia — e é por
 * isso que ele não faz requisição nenhuma: duas telas com o mesmo card fazendo
 * cada uma a sua chamada seriam duas verdades sobre o mesmo desafio.
 *
 * **Nenhum número desta tela é calculado aqui.** A barra de progresso usa
 * `currentXp` e `requiredXp` que o servidor mandou; o "faltam X XP" é uma
 * subtração de dois números recebidos, e não uma regra. O status vem pronto —
 * ele não é derivado de `badgeUnlocked` mais `ready` mais XP, porque essa
 * derivação é do servidor e uma segunda cópia dela divergiria.
 */
@Component({
  selector: 'app-gym-challenge-card',
  imports: [RoundDots, IconCheck],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gym-challenge-card.html',
  styleUrl: './gym-challenge-card.scss'
})
export class GymChallengeCard {
  readonly state = input.required<ChallengeState>();

  /**
   * Se o card está no fim da trilha, onde ele brilha mais (decisão 7).
   *
   * Na lista de desafios o brilho pulsa uma vez a cada três segundos; na trilha
   * ele é contínuo, porque ali o membro **acabou de consumir o conteúdo** e é o
   * momento de dizer "agora prove". É o mesmo card com um argumento a mais, e
   * não dois componentes.
   */
  readonly emphasis = input(false);

  /** O card inteiro é o alvo, e um `em-breve` não é clicável. */
  protected readonly clicavel = computed(
    () => this.state().status !== 'em-breve'
  );

  /**
   * Quanto XP falta.
   *
   * Nunca negativo: se o servidor mandar um estado em que `currentXp` já passou
   * do mínimo mas o status ainda é `xp-insuficiente` — uma resposta em cache,
   * uma aba velha —, "faltam -40 XP" seria pior do que zero.
   */
  protected readonly xpFaltante = computed(() =>
    Math.max(0, this.state().requiredXp - this.state().currentXp)
  );

  /**
   * A largura da barra, em porcentagem.
   *
   * `requiredXp` zero significa "sem exigência", e nesse caso não há barra a
   * desenhar — mas a conta ainda é feita, e uma divisão por zero viraria `NaN`
   * na string do `style`, que o navegador ignora deixando a barra cheia.
   */
  protected readonly progressoXp = computed(() => {
    const { currentXp, requiredXp } = this.state();

    if (requiredXp <= 0) {
      return 100;
    }

    return Math.min(100, Math.round((currentXp / requiredXp) * 100));
  });

  /** "Continuar" quando há rodada aberta; "Iniciar" no resto (decisão 3). */
  protected readonly rotuloDoBotao = computed(() =>
    this.state().hasActiveRound
      ? 'Continuar GYM Challenge'
      : 'Iniciar GYM Challenge'
  );
}
