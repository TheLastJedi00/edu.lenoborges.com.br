import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { MemberCardDialog } from './member-card-dialog';
import { PublicMember } from '../../models/auth.model';

const ANA: PublicMember = {
  id: 'uid-2',
  name: 'Ana Prado',
  bio: 'Migrando de suporte para desenvolvimento.',
  grade: 3,
  xp: 340,
  linkedin: null,
  instagram: null
};

describe('MemberCardDialog', () => {
  let http: HttpTestingController;

  function montar() {
    TestBed.configureTestingModule({
      imports: [MemberCardDialog],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(MemberCardDialog);
    fixture.detectChanges();

    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function responder(body: PublicMember) {
    http.expectOne((req) => req.url.endsWith('/members/uid-2')).flush(body);
  }

  it('busca o cartão ao abrir e desenha nome, etapa e bio', () => {
    const { fixture, el } = montar();

    fixture.componentInstance.open('uid-2');
    responder(ANA);
    fixture.detectChanges();

    expect(el.textContent).toContain('Ana Prado');
    expect(el.textContent).toContain('3 de 8 insígnias');
    expect(el.textContent).toContain('Migrando de suporte');
    expect(el.textContent).toContain('340');
  });

  /**
   * Ausentes **não reservam espaço e não viram "não informado"**: quem escolheu
   * não mostrar não precisa que a tela anuncie a escolha, e quem não preencheu
   * também não.
   */
  it('membro sem redes não desenha os links', () => {
    const { fixture, el } = montar();

    fixture.componentInstance.open('uid-2');
    responder(ANA);
    fixture.detectChanges();

    expect(el.querySelector('.redes')).toBeNull();
    expect(el.textContent).not.toContain('não informado');
  });

  it('com redes, desenha os dois links para fora', () => {
    const { fixture, el } = montar();

    fixture.componentInstance.open('uid-2');
    responder({
      ...ANA,
      linkedin: 'https://www.linkedin.com/in/ana-prado',
      instagram: 'https://www.instagram.com/anaprado'
    });
    fixture.detectChanges();

    const links = Array.from(
      el.querySelectorAll<HTMLAnchorElement>('.redes__link')
    );
    expect(links.map((a) => a.href)).toEqual([
      'https://www.linkedin.com/in/ana-prado',
      'https://www.instagram.com/anaprado'
    ]);
    expect(links.every((a) => a.rel.includes('noopener'))).toBeTrue();
  });

  /**
   * 404 é uma saída **normal** do produto: acontece quando alguém exclui a conta
   * com o Mural aberto na outra aba. Um erro genérico faria isso parecer bug
   * nosso.
   */
  it('teste-trava: 404 tem frase própria, e não a de erro', () => {
    const { fixture, el } = montar();

    fixture.componentInstance.open('uid-2');
    http
      .expectOne((req) => req.url.endsWith('/members/uid-2'))
      .flush(null, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(el.textContent).toContain(
      'Esse membro não faz mais parte da comunidade.'
    );
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });

  it('outro erro qualquer continua sendo erro', () => {
    const { fixture, el } = montar();

    fixture.componentInstance.open('uid-2');
    http
      .expectOne((req) => req.url.endsWith('/members/uid-2'))
      .flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el.querySelector('[role="alert"]')).not.toBeNull();
    expect(el.textContent).toContain('Não consegui carregar esse perfil agora.');
  });

  /**
   * **Sem cache** (decisão 9): o XP sobe, a bio muda, o interruptor é ligado — e
   * um cache mostraria o estado de dez minutos atrás sem nada que denunciasse.
   */
  it('teste-trava: abrir duas vezes faz duas requisições', () => {
    const { fixture } = montar();

    fixture.componentInstance.open('uid-2');
    responder(ANA);
    fixture.detectChanges();

    fixture.componentInstance.open('uid-2');
    responder({ ...ANA, xp: 350 });
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).textContent
    ).toContain('350');
  });

  /**
   * O modal desenha **só** os campos do `PublicMember`. Se um dia o backend
   * mandar telefone, esta tela não o mostra por acidente.
   */
  it('teste-trava: campo extra vindo da API não é desenhado', () => {
    const { fixture, el } = montar();

    fixture.componentInstance.open('uid-2');
    http.expectOne((req) => req.url.endsWith('/members/uid-2')).flush({
      ...ANA,
      phone: '47999990000',
      email: 'ana@exemplo.com'
    });
    fixture.detectChanges();

    expect(el.textContent).not.toContain('47999990000');
    expect(el.textContent).not.toContain('ana@exemplo.com');
  });

  afterEach(() => http.verify());
});
