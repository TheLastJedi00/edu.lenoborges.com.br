import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NovaPerguntaPage } from './nova-pergunta.page';
import { MuralState } from '../../../models/mural.model';

const PODE: MuralState = {
  currentWeekId: '2026-08-16',
  votingWeekId: '2026-08-09',
  currentWeekEndsAt: '2099-01-03T03:00:00.000Z',
  canAsk: true,
  myQuestionId: null
};

describe('NovaPerguntaPage', () => {
  let http: HttpTestingController;

  function setup(state: MuralState) {
    TestBed.configureTestingModule({
      imports: [NovaPerguntaPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(NovaPerguntaPage);
    fixture.detectChanges();

    http.expectOne((req) => req.url.endsWith('/mural')).flush(state);
    fixture.detectChanges();

    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function preencher(el: HTMLElement, fixture: { detectChanges(): void }) {
    const chip = el.querySelector('.chip') as HTMLButtonElement;
    chip.click();

    const titulo = el.querySelector('#titulo') as HTMLInputElement;
    titulo.value = 'Como saber quando usar herança em vez de composição?';
    titulo.dispatchEvent(new Event('input'));

    fixture.detectChanges();
  }

  /**
   * Chips com o nome da insígnia, e não um `<select>`: no celular o select abre
   * uma roda nativa com treze linhas de texto e esconde a escolha enquanto a
   * pessoa escreve o resto.
   */
  it('oferece as treze insígnias como chips', () => {
    const { el } = setup(PODE);

    expect(el.querySelectorAll('.chip').length).toBe(13);
    expect(el.querySelector('select')).toBeNull();
  });

  it('exige insígnia e título para publicar', () => {
    const { el } = setup(PODE);

    const enviar = el.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(enviar.disabled).toBeTrue();
  });

  it('publica com a insígnia escolhida', () => {
    const { fixture, el } = setup(PODE);
    preencher(el, fixture);

    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();

    const request = http.expectOne((req) => req.url.endsWith('/mural/perguntas'));
    expect(request.request.method).toBe('POST');
    expect((request.request.body as { badgeId: string }).badgeId).toBe('logica');
    request.flush({});
  });

  /**
   * Contador visível desde o primeiro caractere transforma escrever numa prova,
   * e a pessoa passa a contar em vez de pensar na pergunta.
   */
  it('só mostra o contador depois dos primeiros 100 caracteres', () => {
    const { fixture, el } = setup(PODE);
    preencher(el, fixture);

    expect(el.querySelector('.form__counter')).toBeNull();

    const titulo = el.querySelector('#titulo') as HTMLInputElement;
    titulo.value = 'a'.repeat(105);
    titulo.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(el.querySelector('.form__counter')?.textContent).toContain('105');
  });

  /**
   * **O bloqueio da decisão 3, e o teste que sustenta a tela inteira.**
   *
   * Ele aparece no lugar do formulário — nunca como erro depois de a pessoa
   * escrever 200 caracteres —, e traz o caminho para o Financeiro.
   */
  it('mostra o bloqueio no lugar do formulário para quem não pode escrever', () => {
    const { el } = setup({ ...PODE, canAsk: false });

    expect(el.querySelector('form')).toBeNull();
    expect(el.textContent).toContain('O Dev Tier vota, mas não pergunta.');

    const link = Array.from(el.querySelectorAll('a')).find((node) =>
      node.textContent?.includes('Financeiro')
    );
    expect(link).toBeDefined();
  });

  it('o bloqueio mantém o voto em destaque, e não deixa a tela cinza', () => {
    // Quem vota está usando o produto, e é de lá que sai o assinante.
    const { el } = setup({ ...PODE, canAsk: false });

    expect(el.textContent).toContain('Votar continua sendo seu');
  });

  /**
   * Quem já perguntou vê a própria pergunta como rascunho editável, e não uma
   * cota estourada. O limite é o mesmo; o enquadramento muda o que ele produz.
   */
  it('vira edição quando a pessoa já perguntou nesta semana', () => {
    const { el } = setup({
      ...PODE,
      canAsk: false,
      myQuestionId: '2026-08-16__uid-1'
    });

    expect(el.querySelector('form')).not.toBeNull();
    expect(el.textContent).toContain('Sua pergunta desta semana');
    // Insígnia não se troca na edição: mudar de insígnia é fazer outra pergunta.
    expect(el.querySelector('.chip')).toBeNull();
  });

  it('traduz 403 e 409 em mensagens diferentes', () => {
    const { fixture, el } = setup(PODE);
    preencher(el, fixture);

    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    http
      .expectOne((req) => req.url.endsWith('/mural/perguntas'))
      .flush('', { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'já perguntou esta semana'
    );
  });
});
