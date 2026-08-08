import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ContactLinks } from '../../components/contact-links/contact-links';
import { CtaSplit } from '../../components/cta-split/cta-split';
import { DialogBox } from '../../components/dialog-box/dialog-box';
import { LessonTrack } from '../../components/lesson-track/lesson-track';
import { MenuBar } from '../../components/menu-bar/menu-bar';
import { PixelButton } from '../../components/pixel-button/pixel-button';
import { PixelPanel } from '../../components/pixel-panel/pixel-panel';
import { StatTile } from '../../components/stat-tile/stat-tile';
import { TeachingStackGrid } from '../../components/teaching-stack-grid/teaching-stack-grid';
import { TimelineEntry } from '../../components/timeline-entry/timeline-entry';
import { TrainerCard } from '../../components/trainer-card/trainer-card';
import { Reveal } from '../../directives/reveal';
import { ProfileService } from '../../services/profile.service';

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
    Reveal
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss'
})
export class LandingPage {
  private readonly profileService = inject(ProfileService);

  protected readonly identity = computed(() => this.profileService.profile().identity);
  protected readonly teachingStack = this.profileService.teachingStack;
  protected readonly lessonSteps = this.profileService.lessonSteps;
  protected readonly stats = computed(() => this.profileService.profile().stats);
  protected readonly education = computed(() => this.profileService.profile().education);
  protected readonly educatorExperiences = this.profileService.educatorExperiences;

  /** Único canal de contato real hoje (LinkedIn); agendamento por calendário fica fora de escopo nesta fase. */
  protected readonly contactHref = computed(
    () => this.identity().links.find((link) => link.icon === 'linkedin')?.url ?? this.identity().links[0].url
  );
}
