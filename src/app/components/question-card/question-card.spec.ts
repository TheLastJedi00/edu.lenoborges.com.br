import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { QuestionCard } from './question-card';
import { MuralQuestion } from '../../models/mural.model';

const PERGUNTA: MuralQuestion = {
  id: '2026-08-16__uid-7',
  weekId: '2026-08-16',
  phase: 'votacao',
  badgeId: 'poo',
  authorName: 'Ana',
  authorUid: 'uid-7',
  title: 'Quando usar herança em vez de composição?',
  body: null,
  voteCount: 4,
  hasVoted: false,
  isMine: false,
  answerVideoId: null,
  promotedTo: null,
  createdAt: '2026-08-16T12:00:00.000Z',
};

describe('QuestionCard', () => {
  function montar(question: MuralQuestion) {
    TestBed.configureTestingModule({
      imports: [QuestionCard],
      providers: [provideZonelessChangeDetection()],
    });

    const fixture = TestBed.createComponent(QuestionCard);
    fixture.componentRef.setInput('question', question);
    fixture.detectChanges();

    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function botaoDoAutor(el: HTMLElement): HTMLButtonElement | null {
    return el.querySelector('.card__autor-botao');
  }

  it('o nome vira botão quando há autor para abrir', () => {
    const { fixture, el } = montar(PERGUNTA);

    let emitido: MuralQuestion | undefined;
    fixture.componentInstance.authorClick.subscribe((q) => (emitido = q));

    const botao = botaoDoAutor(el);
    expect(botao).not.toBeNull();
    expect(botao!.textContent?.trim()).toBe('Ana');

    botao!.click();
    expect(emitido?.authorUid).toBe('uid-7');
  });

  /**
   * **A garantia de que ninguém abre o cartão de quem pediu para ser
   * esquecido** (spec 019, decisão 8).
   *
   * Sem `authorUid`, o nome é texto e mais nada: sem botão, sem elemento
   * focável, sem emissão. Não existe um "clicou e deu erro" — o alvo não existe.
   */
  it('teste-trava: pergunta anônima não tem botão, e não emite nada', () => {
    const { fixture, el } = montar({
      ...PERGUNTA,
      authorUid: null,
      authorName: 'Membro removido',
    });

    let emitiu = false;
    fixture.componentInstance.authorClick.subscribe(() => (emitiu = true));

    expect(botaoDoAutor(el)).toBeNull();
    expect(el.querySelector('.card__author button')).toBeNull();
    expect(el.textContent).toContain('Membro removido');
    expect(emitiu).toBeFalse();
  });

  /**
   * **O cartão continua burro.** Ele emite; quem abre o modal é a página do
   * Mural. Um cartão que injetasse serviço para buscar membro faria o Mural
   * inteiro precisar de HTTP para ser testado — e este teste monta o componente
   * sem `provideHttpClient` nenhum, que é a prova.
   */
  it('teste-trava: não faz requisição — monta sem HttpClient', () => {
    const { el } = montar(PERGUNTA);

    expect(el.querySelector('.card')).not.toBeNull();
  });

  it('o rótulo acessível do botão diz de quem é o perfil', () => {
    const { el } = montar(PERGUNTA);

    expect(botaoDoAutor(el)!.getAttribute('aria-label')).toBe('Ver o perfil de Ana');
  });

  /**
   * O alvo esticado (spec 024, decisão 3): o título é o botão, e o ::after dele
   * cobre o cartão inteiro.
   */
  it('o título abre a pergunta', () => {
    const { fixture, el } = montar(PERGUNTA);

    let emitido: MuralQuestion | undefined;
    fixture.componentInstance.abrir.subscribe((q) => (emitido = q));

    const botao = el.querySelector<HTMLButtonElement>('.card__abrir');
    expect(botao!.getAttribute('aria-label')).toBe(
      'Abrir a pergunta: Quando usar herança em vez de composição?',
    );

    botao!.click();
    expect(emitido?.id).toBe(PERGUNTA.id);
  });

  /**
   * **Os dois testes que o alvo esticado convida a quebrar.**
   *
   * O ::after do título cobre o cartão inteiro, e sem o z-index do voto e do
   * autor ele engoliria os dois — o cartão passaria a ter um clique só, e o
   * toque mais repetido do app viraria "abrir a pergunta".
   */
  it('teste-trava: votar não abre a pergunta', () => {
    const { fixture, el } = montar(PERGUNTA);
    fixture.componentRef.setInput('votable', true);
    fixture.detectChanges();

    let abriu = false;
    let votou = false;
    fixture.componentInstance.abrir.subscribe(() => (abriu = true));
    fixture.componentInstance.toggle.subscribe(() => (votou = true));

    el.querySelector<HTMLButtonElement>('.vote')!.click();

    expect(votou).toBeTrue();
    expect(abriu).toBeFalse();
  });

  it('teste-trava: clicar no autor não abre a pergunta', () => {
    const { fixture, el } = montar(PERGUNTA);

    let abriu = false;
    let pediuOAutor = false;
    fixture.componentInstance.abrir.subscribe(() => (abriu = true));
    fixture.componentInstance.authorClick.subscribe(() => (pediuOAutor = true));

    botaoDoAutor(el)!.click();

    expect(pediuOAutor).toBeTrue();
    expect(abriu).toBeFalse();
  });
});
