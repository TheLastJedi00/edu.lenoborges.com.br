import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reveal } from '../../directives/reveal';
import { Logo } from '../../shared/logo/logo';
import { IconGames } from '../../components/icons/icon-games';
import { IconRanking } from '../../components/icons/icon-ranking';
import { IconDuels } from '../../components/icons/icon-duels';

/**
 * O hub de Jogos (spec 022, decisão 1).
 *
 * **Uma rota no aside que abre três portas**, e não três itens de menu. Quem
 * entra em "Jogos" vê o mapa inteiro — inclusive a porta fechada dos Duels, que
 * está desabilitada de propósito: mostrar a terceira porta diz que tem mais
 * coisa vindo sem prometer data, e é um item a menos no menu.
 *
 * **Página burra: nenhuma requisição.** O que ela precisa saber é o que existe,
 * e isso é estático. Quem carrega estado é a tela de desafios e a de ranking.
 */
@Component({
  selector: 'app-jogos-page',
  imports: [RouterLink, Reveal, Logo, IconGames, IconRanking, IconDuels],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './jogos.page.html',
  styleUrl: './jogos.page.scss'
})
export class JogosPage {}
