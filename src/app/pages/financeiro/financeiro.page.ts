import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TierCard } from '../../components/tier-card/tier-card';
import { Logo } from '../../shared/logo/logo';
import { BillingService } from '../../services/billing.service';
import { BillingTier, TierCatalog } from '../../models/billing.model';
import { ProfileService } from '../../services/profile.service';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * Desliga a troca de plano até existir cobrança. **Uma linha para religar.**
 *
 * Ver a decisão 4 da spec 020. O botão fica, desabilitado e com o rótulo "Em
 * breve": apagá-lo tiraria o rodapé do cartão e deixaria a grade com quatro
 * colunas de alturas diferentes, e o dia de religar viraria reescrever o
 * `TierCard`. Deixá-lo vivo mostrando um aviso no clique seria pior ainda — é
 * a interface prometendo e retirando depois do gesto, quando a pessoa já
 * decidiu.
 *
 * **Vale para todo mundo, admin incluído.** Um caminho vivo que só uma conta
 * percorre é um caminho que ninguém testa, e o admin não tem checkout nenhum a
 * mais que os outros.
 */
const TROCA_DE_PLANO_DISPONIVEL = false;

@Component({
  selector: 'app-financeiro-page',
  standalone: true,
  imports: [TierCard, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './financeiro.page.html',
  styleUrl: './financeiro.page.scss'
})
export class FinanceiroPage implements OnInit {
  private readonly billing = inject(BillingService);
  private readonly profileService = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = signal<LoadState>('loading');
  protected readonly catalog = signal<TierCatalog | null>(null);

  protected readonly tiers = computed(() => this.catalog()?.tiers ?? []);

  /** Exposto ao template porque a constante é de módulo, não de instância. */
  protected readonly trocaDePlanoDisponivel = TROCA_DE_PLANO_DISPONIVEL;

  protected readonly currentTier = computed(() =>
    this.tiers().find((tier) => tier.id === this.catalog()?.currentTierId)
  );

  /**
   * O degrau seguinte ao atual, e só ele.
   *
   * Mostrar "o que você ganharia" de todos os tiers de uma vez devolve o
   * problema que a landing tinha: quatro colunas para comparar. O próximo degrau
   * é uma decisão só, e é a única que a pessoa está de fato tomando agora.
   */
  protected readonly nextTier = computed(() => {
    const tiers = this.tiers();
    const index = tiers.findIndex(
      (tier) => tier.id === this.catalog()?.currentTierId
    );
    return index >= 0 ? tiers[index + 1] : undefined;
  });

  /**
   * O que o próximo degrau acrescenta, sem o "Tudo do anterior".
   *
   * Esse primeiro item é verdadeiro e é ruído aqui: quem está lendo esta seção
   * já tem o anterior.
   */
  protected readonly nextTierGains = computed(() =>
    (this.nextTier()?.perks ?? []).filter((perk) => !perk.startsWith('Tudo do'))
  );

  /** Esqueleto na forma dos cartões, para a tela não saltar quando os dados chegam. */
  protected readonly skeletons = [0, 1, 2, 3];

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');

    this.billing
      .getCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (catalog) => {
          this.catalog.set(catalog);
          this.state.set('ready');
        },
        error: () => this.state.set('error')
      });
  }

  /**
   * O upgrade leva a uma conversa, não a um checkout.
   *
   * **Não há caminho até aqui enquanto `TROCA_DE_PLANO_DISPONIVEL` for falsa**, e
   * o método fica assim mesmo (decisão 5 da spec 020): apagá-lo transformaria
   * "religar a troca de plano" de uma linha em uma tarefa. O teste que o exercita
   * chamando-o direto também fica — é ele que impede o código desligado de
   * apodrecer em silêncio até o dia em que volta a ser vivo.
   */
  protected onUpgrade(tier: BillingTier): void {
    const contato = this.contactHref();
    if (!contato) {
      return;
    }

    // O rótulo do botão já diz o nome do tier ("Quero o Master Dev Tier"), então
    // a pessoa chega à conversa sabendo o que pedir. O `?text=` que a landing
    // passou a usar na spec 020 caberia aqui também, agora que o canal é o
    // WhatsApp — e fica de fora enquanto não houver caminho até esta linha.
    globalThis.open?.(contato, '_blank', 'noopener');
  }

  /**
   * O mesmo canal de contato que a landing usa. Um lugar só para o link mudar.
   *
   * Passou a ser o WhatsApp junto com a landing (decisão 2 da spec 020): quem
   * quer trocar de plano fala com o Leno pelo canal em que a conversa acontece.
   */
  protected readonly contactHref = computed(() => {
    const links = this.profileService.profile().identity.links;
    return links.find((link) => link.icon === 'whatsapp')?.url ?? links[0]?.url ?? '';
  });
}
