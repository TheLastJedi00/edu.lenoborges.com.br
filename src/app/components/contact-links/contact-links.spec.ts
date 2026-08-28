import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ContactLinks } from './contact-links';
import { ProfileService } from '../../services/profile.service';
import { SocialLink } from '../../models/profile.model';

/**
 * Os contatos reais da spec 020.
 *
 * Os testes daqui olham para os `href` de verdade, e não para uma lista de
 * mentira: o que a spec 020 mudou foi o conteúdo, e uma fixture própria passaria
 * verde com o link errado publicado.
 */
describe('ContactLinks · os quatro canais', () => {
  let links: readonly SocialLink[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ContactLinks],
      providers: [provideZonelessChangeDetection()]
    });

    links = TestBed.inject(ProfileService).profile().identity.links;
  });

  function hrefs(): string[] {
    const fixture = TestBed.createComponent(ContactLinks);
    fixture.componentRef.setInput('links', links);
    fixture.detectChanges();

    return Array.from(
      fixture.nativeElement.querySelectorAll('a.link') as NodeListOf<HTMLAnchorElement>
    ).map((anchor) => anchor.getAttribute('href') ?? '');
  }

  it('o WhatsApp aponta para o número no formato que o wa.me aceita', () => {
    const whatsapp = links.find((link) => link.icon === 'whatsapp');

    expect(whatsapp).toBeDefined();
    expect(whatsapp?.url).toBe('https://wa.me/5547992478232');
    // O formatado é para uma pessoa ler; o do href é para o WhatsApp
    // interpretar. Os dois existem, e nenhum deriva do outro.
    expect(whatsapp?.handle).toBe('+55 47 99247-8232');
  });

  it('teste-trava: nenhum href de contato carrega o igsi do Instagram', () => {
    // Fica vermelho no dia em que alguém colar de novo o link que o app do
    // Instagram copia. O `?igsi=` é o identificador de sessão de quem copiou, e
    // mandá-lo com todo visitante é o rastreio que a cláusula 8 da Política de
    // Privacidade (spec 018) diz que este produto não faz.
    for (const href of hrefs()) {
      expect(href).not.toContain('igsi');
    }
  });

  it('todo contato abre em aba nova, sem entregar a janela de origem', () => {
    const fixture = TestBed.createComponent(ContactLinks);
    fixture.componentRef.setInput('links', links);
    fixture.detectChanges();

    const anchors = fixture.nativeElement.querySelectorAll(
      'a.link'
    ) as NodeListOf<HTMLAnchorElement>;

    expect(anchors.length).toBe(4);
    anchors.forEach((anchor) => {
      expect(anchor.getAttribute('target')).toBe('_blank');
      expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });
});
