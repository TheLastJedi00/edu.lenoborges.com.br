import { ChangeDetectionStrategy, Component, VERSION, computed, inject } from '@angular/core';
import { ContactLinks } from '../../components/contact-links/contact-links';
import { DialogBox } from '../../components/dialog-box/dialog-box';
import { MenuBar } from '../../components/menu-bar/menu-bar';
import { PixelButton } from '../../components/pixel-button/pixel-button';
import { PixelPanel } from '../../components/pixel-panel/pixel-panel';
import { StatTile } from '../../components/stat-tile/stat-tile';
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
    PixelButton,
    PixelPanel,
    StatTile,
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

  protected readonly angularVersion = VERSION.major;

  protected readonly identity = computed(() => this.profileService.profile().identity);
  protected readonly teachingStack = this.profileService.teachingStack;
  protected readonly stats = computed(() => this.profileService.profile().stats);
  protected readonly education = computed(() => this.profileService.profile().education);
  protected readonly devExperiences = this.profileService.devExperiences;
  protected readonly educatorExperiences = this.profileService.educatorExperiences;

  protected readonly primaryLink = computed(
    () => this.identity().links.find((link) => link.icon === 'linkedin') ?? this.identity().links[0]
  );

  protected readonly portfolioLink = computed(
    () => this.identity().links.find((link) => link.icon === 'portfolio') ?? this.identity().links[0]
  );
}
