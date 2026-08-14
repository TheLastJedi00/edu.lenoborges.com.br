import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GradeLadder } from '../../components/grade-ladder/grade-ladder';
import { IconRanking } from '../../components/icons/icon-ranking';
import { IconShare } from '../../components/icons/icon-share';
import { IconWhatsapp } from '../../components/icons/icon-whatsapp';
import { IconYoutube } from '../../components/icons/icon-youtube';
import { MenuAction, MenuBar, MenuItem } from '../../components/menu-bar/menu-bar';
import { PixelButton } from '../../components/pixel-button/pixel-button';
import { PixelPanel } from '../../components/pixel-panel/pixel-panel';
import { TrackTimeline } from '../../components/track-timeline/track-timeline';
import { WaitlistDialog, WaitlistState } from '../../components/waitlist-dialog/waitlist-dialog';
import { AuthStore } from '../../core/auth/auth.store';
import { Reveal } from '../../directives/reveal';
import { WaitlistEntry } from '../../models/waitlist.model';
import { CommunityService } from '../../services/community.service';
import { WaitlistService } from '../../services/waitlist.service';
import { WAITLIST_ERROR_DEFAULT, waitlistErrorMessage } from '../../services/waitlist-error';

@Component({
  selector: 'app-comunidade-page',
  standalone: true,
  imports: [
    MenuBar,
    PixelButton,
    PixelPanel,
    GradeLadder,
    TrackTimeline,
    WaitlistDialog,
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
  private readonly waitlistService = inject(WaitlistService);
  private readonly destroyRef = inject(DestroyRef);
  readonly authStore = inject(AuthStore);

  private readonly dialog = viewChild.required(WaitlistDialog);

  protected readonly menuItems: readonly MenuItem[] = [
    { href: '#seita', label: 'A Seita' },
    { href: '#graus', label: 'Graus' },
    { href: '#trilha', label: 'Trilha' },
    { href: '#conclave', label: 'Conclave' },
    { route: '/', label: 'Aulas particulares' }
  ];

  protected readonly menuAction = computed<MenuAction>(() =>
    this.authStore.isLoggedIn()
      ? { label: 'Ir para o painel', route: '/dashboard' }
      : { label: 'Entrar na Seita Dev' }
  );

  protected readonly identity = this.communityService.identity;
  protected readonly grades = this.communityService.grades;
  protected readonly tiers = this.communityService.tiers;
  protected readonly highlights = this.communityService.highlights;
  protected readonly trackStages = this.communityService.trackStages;
  protected readonly conclave = this.communityService.conclave;

  protected readonly waitlistState = signal<WaitlistState>('idle');
  protected readonly waitlistError = signal(WAITLIST_ERROR_DEFAULT);

  protected openLogin(): void {
    this.authStore.openAuthDialog('login');
  }

  protected openWaitlist(): void {
    this.waitlistState.set('idle');
    this.waitlistError.set(WAITLIST_ERROR_DEFAULT);
    this.dialog().open();
  }

  protected register(entry: WaitlistEntry): void {
    this.waitlistState.set('sending');

    // takeUntilDestroyed: se o visitante navegar com o envio em voo, o callback
    // nao pode escrever num signal de componente ja destruido.
    this.waitlistService
      .submit(entry)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.waitlistState.set('success'),
        error: (error: unknown) => {
          this.waitlistError.set(waitlistErrorMessage(error));
          this.waitlistState.set('error');
        }
      });
  }
}
