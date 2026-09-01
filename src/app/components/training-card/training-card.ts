import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconCheck } from '../icons/icon-check';
import { Training } from '../../models/training.model';

/**
 * O card de um desafio da Arena de Treinamento (spec 023, decisão 1).
 *
 * **Componente burro: recebe o desafio pronto e emite o clique.** Ele não faz
 * requisição nenhuma, pelo mesmo motivo do `gym-challenge-card` — a página é
 * quem fala com a API, e um card que buscasse os próprios dados numa lista de
 * seis desafios seriam seis requisições para pintar uma seção.
 *
 * **O XP vem do desafio, e não de uma constante daqui.** O admin pode ter
 * escrito 80 num exercício longo, e um 30 gravado no template mentiria no card
 * — em silêncio, e só para quem lesse a tela.
 */
@Component({
  selector: 'app-training-card',
  imports: [IconCheck],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './training-card.html',
  styleUrl: './training-card.scss',
})
export class TrainingCard {
  readonly training = input.required<Training>();

  /**
   * O clique, com o elemento que o originou.
   *
   * O elemento vai junto para a página devolver o foco a ele quando o modal
   * fechar. Sem isso o foco cai no `body` e quem navega por teclado recomeça a
   * lista do topo — o mesmo cuidado do modal de resposta da spec 021.
   */
  readonly abrir = output<HTMLElement>();
}
