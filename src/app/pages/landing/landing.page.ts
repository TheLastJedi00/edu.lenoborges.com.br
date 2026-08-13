import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { ContactLinks } from '../../components/contact-links/contact-links';
import { CtaSplit } from '../../components/cta-split/cta-split';
import { DialogBox } from '../../components/dialog-box/dialog-box';
import { LessonTrack } from '../../components/lesson-track/lesson-track';
import { MenuBar, MenuItem } from '../../components/menu-bar/menu-bar';
import { PixelButton } from '../../components/pixel-button/pixel-button';
import { PixelPanel } from '../../components/pixel-panel/pixel-panel';
import { StatTile } from '../../components/stat-tile/stat-tile';
import { TeachingStackGrid } from '../../components/teaching-stack-grid/teaching-stack-grid';
import { TimelineEntry } from '../../components/timeline-entry/timeline-entry';
import { TrainerCard } from '../../components/trainer-card/trainer-card';
import { WaitlistDialog, WaitlistState } from '../../components/waitlist-dialog/waitlist-dialog';
import { Reveal } from '../../directives/reveal';
import { WaitlistEntry } from '../../models/waitlist.model';
import { ProfileService } from '../../services/profile.service';
import { WaitlistService } from '../../services/waitlist.service';
import { WAITLIST_ERROR_DEFAULT, waitlistErrorMessage } from '../../services/waitlist-error';

@Component({
  selector: 'app-landing-page',
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
export class LandingPage {
  private readonly profileService = inject(ProfileService);
  private readonly waitlistService = inject(WaitlistService);

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

  protected readonly waitlistState = signal<WaitlistState>('idle');
  protected readonly waitlistError = signal(WAITLIST_ERROR_DEFAULT);

  protected readonly identity = computed(() => this.profileService.profile().identity);
  protected readonly teachingStack = this.profileService.teachingStack;
  protected readonly lessonSteps = this.profileService.lessonSteps;
  protected readonly stats = computed(() => this.profileService.profile().stats);
  protected readonly education = computed(() => this.profileService.profile().education);
  protected readonly educatorExperiences = this.profileService.educatorExperiences;

  protected openWaitlist(): void {
    this.waitlistState.set('idle');
    this.waitlistError.set(WAITLIST_ERROR_DEFAULT);
    this.dialog().open();
  }

  protected register(entry: WaitlistEntry): void {
    this.waitlistState.set('sending');

    this.waitlistService.submit(entry).subscribe({
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
