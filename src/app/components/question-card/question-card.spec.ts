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
    // Cada montagem começa do zero: sem isso os cartões das montagens
    // anteriores continuam no documento, empilhados, e a seção que mede
    // geometria acaba medindo o cartão do teste passado.
    TestBed.resetTestingModule();
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
   * O alvo esticado (spec 024, decisão 3): um botão sobreposto do tamanho do
   * cartão, com o título acessível no rótulo.
   */
  it('o alvo do cartão abre a pergunta', () => {
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
   * O botão sobreposto cobre o cartão inteiro, e sem o z-index do voto e do
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

  /**
   * **A prova de que o alvo esticado é do tamanho do cartão** (spec 024,
   * fase 05).
   *
   * Os testes acima clicam nos elementos por seletor, e por isso passariam
   * mesmo se o botão não cobrisse nada: seria um cartão em que só o texto do
   * título abre a pergunta, que é quase o defeito de antes. Aqui a medida é
   * geométrica, com o cartão numa largura de celular, e feita num navegador de
   * verdade — o layout é o do Chrome, não o de um DOM simulado.
   *
   * **Não é `elementFromPoint`**: a página do Karma desenha as próprias caixas
   * por cima do fixture, e a pergunta "quem está debaixo deste ponto" acaba
   * respondendo sobre elas. O que se mede aqui é o retângulo do alvo contra o
   * do cartão, mais a pilha declarada dos dois botões que precisam ficar por
   * cima — que é exatamente o que decide o comportamento na tela.
   */
  describe('o alvo esticado, medido no Chrome em 360px', () => {
    function montarEstreito(question: MuralQuestion) {
      const montado = montar(question);
      const host = montado.el;
      host.style.display = 'block';
      host.style.width = '360px';
      montado.fixture.componentRef.setInput('votable', true);
      montado.fixture.detectChanges();

      return montado;
    }

    it('o alvo cobre o cartão inteiro, e não só o título', () => {
      const { el } = montarEstreito(PERGUNTA);
      const card = el.querySelector('.card')!.getBoundingClientRect();
      const alvo = el.querySelector('.card__abrir')!.getBoundingClientRect();
      const titulo = el.querySelector('.card__title')!.getBoundingClientRect();

      // Cobre o cartão dentro da borda, nos quatro lados.
      expect(alvo.left - card.left).toBeLessThanOrEqual(2);
      expect(card.right - alvo.right).toBeLessThanOrEqual(2);
      expect(alvo.top - card.top).toBeLessThanOrEqual(2);
      expect(card.bottom - alvo.bottom).toBeLessThanOrEqual(2);

      // E é bem maior que o título: é essa diferença que faz "clicar no cartão"
      // ser diferente de "clicar no texto".
      expect(alvo.height).toBeGreaterThan(titulo.height * 2);
    });

    /**
     * **Os dois que precisam ficar por cima do alvo.**
     *
     * Sem esta pilha o botão sobreposto engole os dois, e o cartão passa a ter
     * um clique só: o de abrir. O toque mais repetido do app inteiro, que é o
     * voto, deixaria de existir sem nada quebrar.
     */
    it('teste-trava: voto e autor ficam acima do alvo na pilha', () => {
      const { el } = montarEstreito(PERGUNTA);

      for (const seletor of ['.vote', '.card__autor-botao']) {
        const estilo = getComputedStyle(el.querySelector(seletor) as HTMLElement);

        expect(estilo.position).toBe('relative');
        expect(estilo.zIndex).toBe('1');
      }

      const alvo = getComputedStyle(el.querySelector('.card__abrir') as HTMLElement);
      expect(alvo.position).toBe('absolute');
      expect(alvo.zIndex).toBe('auto');
    });

    /**
     * A prévia de três linhas (decisão 4). Em 360px, um corpo de 1000
     * caracteres passaria de vinte linhas e empurraria as outras perguntas para
     * fora da tela: a lista deixaria de ser lista.
     */
    it('o corpo longo é cortado em três linhas', () => {
      const { el } = montarEstreito({
        ...PERGUNTA,
        body: 'palavra '.repeat(140).trim(),
      });

      const texto = el.querySelector('.card__text') as HTMLElement;
      const linha = parseFloat(getComputedStyle(texto).lineHeight);

      expect(texto.scrollHeight).toBeGreaterThan(texto.clientHeight);
      expect(texto.clientHeight).toBeLessThanOrEqual(Math.ceil(linha * 3) + 2);
    });
  });
});
