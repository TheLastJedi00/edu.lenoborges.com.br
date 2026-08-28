import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconName } from '../../models/profile.model';
import { IconInstagram } from './icon-instagram';
import { IconLinkedin } from './icon-linkedin';
import { IconPortfolio } from './icon-portfolio';
import { IconWhatsapp } from './icon-whatsapp';

/** Resolve o ícone de contato pelo nome, mantendo os templates de página simples. */
@Component({
  selector: 'app-icon-social',
  imports: [IconLinkedin, IconInstagram, IconWhatsapp, IconPortfolio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (name()) {
      @case ('linkedin') {
        <app-icon-linkedin />
      }
      @case ('instagram') {
        <app-icon-instagram />
      }
      @case ('whatsapp') {
        <app-icon-whatsapp />
      }
      @case ('portfolio') {
        <app-icon-portfolio />
      }
    }
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconSocial {
  readonly name = input.required<IconName>();
}
