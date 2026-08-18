import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject
} from '@angular/core';
import { BadgeLadder } from '../../components/badge-ladder/badge-ladder';
import { IconRanking } from '../../components/icons/icon-ranking';
import { IconShare } from '../../components/icons/icon-share';
import { IconWhatsapp } from '../../components/icons/icon-whatsapp';
import { IconYoutube } from '../../components/icons/icon-youtube';
import { MenuAction, MenuBar, MenuItem } from '../../components/menu-bar/menu-bar';
import { PixelButton } from '../../components/pixel-button/pixel-button';
import { PixelPanel } from '../../components/pixel-panel/pixel-panel';
import { TrackTimeline } from '../../components/track-timeline/track-timeline';
import { AuthStore } from '../../core/auth/auth.store';
import { Reveal } from '../../directives/reveal';
import { CommunityService } from '../../services/community.service';

@Component({
  selector: 'app-comunidade-page',
  standalone: true,
  imports: [
    MenuBar,
    PixelButton,
    PixelPanel,
    BadgeLadder,
    TrackTimeline,
    IconWhatsapp,
    IconYoutube,
    IconRanking,
    IconShare,
    Reveal
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comunidade.page.html',
  styleUrl: './comunidade.page.scss'
})
export class ComunidadePage {
  private readonly communityService = inject(CommunityService);
  readonly authStore = inject(AuthStore);

  protected readonly menuItems: readonly MenuItem[] = [
    { href: '#liga', label: 'A Liga' },
    { href: '#insignias', label: 'Insígnias' },
    { href: '#trilha', label: 'Trilha' },
    { href: '#grinding-arena', label: 'Grinding Arena' },
    { route: '/', label: 'Aulas particulares' }
  ];

  protected readonly menuAction = computed<MenuAction>(() =>
    this.authStore.isLoggedIn()
      ? { label: 'Ir para o painel', route: '/dashboard' }
      : { label: 'Entrar na Liga Dev' }
  );

  protected readonly identity = this.communityService.identity;
  protected readonly badges = this.communityService.badges;
  protected readonly tiers = this.communityService.tiers;
  protected readonly highlights = this.communityService.highlights;
  protected readonly trackStages = this.communityService.trackStages;
  protected readonly grindingArena = this.communityService.grindingArena;

  protected openLogin(): void {
    this.authStore.openAuthDialog('login');
  }

  /**
   * O CTA primário desta página (spec 009).
   *
   * Abre na aba de **cadastro**. `openAuthDialog()` tem `'login'` como padrão, e
   * chamá-lo sem argumento mandaria quem nunca teve conta para um formulário de
   * senha que ela não tem.
   */
  protected openSignup(): void {
    this.authStore.openAuthDialog('signup');
  }
}
