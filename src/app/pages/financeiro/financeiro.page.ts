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
   * Não existe cobrança no produto (decisão 4 da spec 009 do backend), e um botão
   * "Assinar" que não assina é pior que a ausência dele: promete um fluxo que
   * não existe, e a pessoa descobre no clique.
   */
  protected onUpgrade(tier: BillingTier): void {
    const contato = this.contactHref();
    if (!contato) {
      return;
    }

    // O rótulo do botão já diz o nome do tier ("Quero o Master Dev Tier"), então
    // a pessoa chega à conversa sabendo o que pedir. Uma mensagem pré-preenchida
    // exigiria um canal que aceite texto na URL, e o contato de hoje é o
    // LinkedIn — inventar um `?text=` ali produziria um link quebrado.
    // Ver o ponto em aberto 3 da spec 009.
    globalThis.open?.(contato, '_blank', 'noopener');
  }

  /** O mesmo canal de contato que a landing usa. Um lugar só para o link mudar. */
  protected readonly contactHref = computed(() => {
    const links = this.profileService.profile().identity.links;
    return links.find((link) => link.icon === 'linkedin')?.url ?? links[0]?.url ?? '';
  });
}
