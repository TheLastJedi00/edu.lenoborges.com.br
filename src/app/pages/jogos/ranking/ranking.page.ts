import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { Logo } from '../../../shared/logo/logo';
import { Reveal } from '../../../directives/reveal';
import { PositionDelta } from '../../../components/position-delta/position-delta';
import { RankingService } from '../../../services/ranking.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { RankingEntry } from '../../../models/games.model';

/**
 * O Ranking da Liga (spec 022, decisão 6).
 *
 * **Lista, e não grid.** O pódio é destaque visual dos três primeiros; do quarto
 * em diante é uma tabela, porque o que se procura numa lista ordenada é a
 * própria posição e a de quem está perto.
 *
 * **Todos os nomes exibidos são o `nickname`.** O nome real não vem nesta rota, e
 * essa é a razão de o campo existir.
 *
 * Paginação por "Carregar mais" com cursor, e nunca por número de página: com XP
 * mudando a toda hora, a página 3 de agora não é a página 3 de daqui a um
 * minuto.
 */
@Component({
  selector: 'app-ranking-page',
  imports: [Logo, Reveal, PositionDelta],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ranking.page.html',
  styleUrl: './ranking.page.scss'
})
export class RankingPage {
  private readonly ranking = inject(RankingService);
  private readonly authStore = inject(AuthStore);

  protected readonly entries = signal<readonly RankingEntry[]>([]);
  protected readonly myPosition = signal<number | null>(null);
  protected readonly myEntry = signal<RankingEntry | null>(null);
  protected readonly cursor = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly error = signal(false);

  /** O uid de quem está olhando: é o que destaca a própria linha na lista. */
  protected readonly meuUid = computed(() => this.authStore.profile()?.id ?? '');

  protected readonly podio = computed(() => this.entries().slice(0, 3));

  /** Do quarto em diante. O pódio já mostrou os três primeiros. */
  protected readonly lista = computed(() => this.entries().slice(3));

  protected readonly temMais = computed(() => this.cursor() !== null);

  constructor() {
    this.carregar();
  }

  protected carregar(): void {
    this.loading.set(true);
    this.error.set(false);

    this.ranking.page().subscribe({
      next: (page) => {
        this.entries.set(page.entries);
        this.myPosition.set(page.myPosition);
        this.myEntry.set(page.myEntry);
        this.cursor.set(page.nextCursor);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  /**
   * A próxima página, acumulada no fim da lista.
   *
   * O cursor vem do servidor e volta intacto. **`null` significa fim**, e o
   * botão some — um "Carregar mais" no fim da lista que traz vazio é pior do
   * que não ter botão.
   */
  protected carregarMais(): void {
    const after = this.cursor();

    if (!after || this.loadingMore()) {
      return;
    }

    this.loadingMore.set(true);

    this.ranking.page(after).subscribe({
      next: (page) => {
        this.entries.update((current) => [...current, ...page.entries]);
        this.cursor.set(page.nextCursor);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
        this.error.set(true);
      }
    });
  }

  /** O rótulo do pódio: ouro, prata e bronze, na ordem. */
  protected medalha(position: number): string {
    return position === 1 ? 'gold' : position === 2 ? 'silver' : 'bronze';
  }
}
