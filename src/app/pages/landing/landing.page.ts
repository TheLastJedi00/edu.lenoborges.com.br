import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { AuthStore } from '../../core/auth/auth.store';
import { Reveal } from '../../directives/reveal';
import { ProfileService } from '../../services/profile.service';

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
    Reveal,
    RouterLink
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss'
})
export class LandingPage implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly authStore = inject(AuthStore);

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
      : { label: 'Entrar na Liga Dev' }
  );

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
   *
   * O `?senha=trocada` vem junto quando a volta é da troca de senha (spec 013):
   * a sessão terminou de propósito, e sem essa linha cair numa tela de login é
   * indistinguível de ter sido deslogado por erro.
   */
  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('entrar') !== '1') {
      return;
    }

    if (this.route.snapshot.queryParamMap.get('senha') === 'trocada') {
      this.senhaTrocada.set(true);
    }

    this.authStore.openAuthDialog('login');

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  /** Mensagem de volta da troca de senha (spec 013, decisão 7). */
  protected readonly senhaTrocada = signal(false);

  protected openLogin(): void {
    this.authStore.openAuthDialog('login');
  }

  /**
   * O CTA primário da página (spec 009).
   *
   * Abre o diálogo na aba de **cadastro**, e não na de login: `openAuthDialog()`
   * tem `'login'` como padrão, e chamá-lo sem argumento aqui mandaria quem nunca
   * teve conta para um formulário de senha que ela não tem — que é exatamente o
   * erro fácil que o teste desta página cobre.
   */
  protected openSignup(): void {
    this.authStore.openAuthDialog('signup');
  }

  /** Único canal de contato real hoje (LinkedIn); agendamento por calendário fica fora de escopo. */
  protected readonly contactHref = computed(
    () => this.identity().links.find((link) => link.icon === 'linkedin')?.url ?? this.identity().links[0].url
  );
}
