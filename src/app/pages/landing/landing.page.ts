import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactLinks } from '../../components/contact-links/contact-links';
import { CtaSplit } from '../../components/cta-split/cta-split';
import { DialogBox } from '../../components/dialog-box/dialog-box';
import { LessonTrack } from '../../components/lesson-track/lesson-track';
import { MenuAction, MenuBar, MenuItem } from '../../components/menu-bar/menu-bar';
import { PixelButton } from '../../components/pixel-button/pixel-button';
import { PixelPanel } from '../../components/pixel-panel/pixel-panel';
import { StatTile } from '../../components/stat-tile/stat-tile';
import { TeachingStackGrid } from '../../components/teaching-stack-grid/teaching-stack-grid';
import { TimelineEntry } from '../../components/timeline-entry/timeline-entry';
import { TrainerCard } from '../../components/trainer-card/trainer-card';
import { WaitlistDialog, WaitlistState } from '../../components/waitlist-dialog/waitlist-dialog';
import { AuthStore } from '../../core/auth/auth.store';
import { Reveal } from '../../directives/reveal';
import { WaitlistEntry } from '../../models/waitlist.model';
import { ProfileService } from '../../services/profile.service';
import { WaitlistService } from '../../services/waitlist.service';
import { WAITLIST_ERROR_DEFAULT, waitlistErrorMessage } from '../../services/waitlist-error';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    MenuBar,
    TrainerCard,
    DialogBox,
    CtaSplit,
    PixelButton,
    PixelPanel,
    StatTile,
    TeachingStackGrid,
    LessonTrack,
    TimelineEntry,
    ContactLinks,
    WaitlistDialog,
    Reveal
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss'
})
export class LandingPage implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly waitlistService = inject(WaitlistService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly authStore = inject(AuthStore);

  private readonly dialog = viewChild.required(WaitlistDialog);

  protected readonly menuItems: readonly MenuItem[] = [
    { href: '#stack', label: 'Stack' },
    { href: '#aulas', label: 'Aulas' },
    { href: '#ensino', label: 'Professor' },
    { href: '#dev', label: 'Dev' },
    { route: '/comunidade', label: 'Comunidade' },
    { href: '#formacao', label: 'Formação' },
    { href: '#contato', label: 'Contato' }
  ];

  protected readonly menuAction = computed<MenuAction>(() =>
    this.authStore.isLoggedIn()
      ? { label: 'Ir para o painel', route: '/dashboard' }
      : { label: 'Entrar na Seita Dev' }
  );

  protected readonly waitlistState = signal<WaitlistState>('idle');
  protected readonly waitlistError = signal(WAITLIST_ERROR_DEFAULT);

  protected readonly identity = computed(() => this.profileService.profile().identity);
  protected readonly teachingStack = this.profileService.teachingStack;
  protected readonly lessonSteps = this.profileService.lessonSteps;
  protected readonly stats = computed(() => this.profileService.profile().stats);
  protected readonly education = computed(() => this.profileService.profile().education);
  protected readonly educatorExperiences = this.profileService.educatorExperiences;

  /**
   * Abre o diálogo de login quando a landing recebe `?entrar=1`.
   *
   * É a volta de quem acabou de definir a senha: o link do e-mail leva para a
   * tela hospedada pelo Firebase, e o botão de retorno de lá traz o usuário para
   * cá com esse parâmetro. Sem isto ele cairia na home sem nenhum sinal de que
   * já pode entrar, e o cadastro terminaria em anticlímax.
   *
   * O parâmetro é limpo da URL logo em seguida, com `replaceUrl` para não
   * empilhar entrada no histórico: um F5 depois não deve reabrir o diálogo.
   */
  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('entrar') !== '1') {
      return;
    }

    this.authStore.openAuthDialog('login');

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

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

  /** Único canal de contato real hoje (LinkedIn); agendamento por calendário fica fora de escopo. */
  protected readonly contactHref = computed(
    () => this.identity().links.find((link) => link.icon === 'linkedin')?.url ?? this.identity().links[0].url
  );
}
