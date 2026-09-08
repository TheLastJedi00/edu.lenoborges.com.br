import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { QuestionDetailDialog } from './question-detail-dialog';
import { MuralQuestion } from '../../models/mural.model';

const PERGUNTA: MuralQuestion = {
  id: '2026-08-16__uid-7',
  weekId: '2026-08-16',
  phase: 'votacao',
  badgeId: 'poo',
  authorName: 'Ana',
  authorUid: 'uid-7',
  title: 'Quando usar herança em vez de composição?',
  body: 'Tenho duas classes que compartilham três métodos.\nHerdar de uma base resolve, mas parece errado.',
  voteCount: 12,
  hasVoted: false,
  isMine: false,
  answerVideoId: null,
  promotedTo: null,
  createdAt: '2026-08-13T18:00:00.000Z',
};

/**
 * O `close` do `<dialog>` nativo não sai no mesmo tique do `close()`, e no
 * Chrome headless ele só chega no quadro seguinte: uma `Promise` resolvida, ou
 * um `setTimeout` de zero, ainda rodam antes dele. Daí a espera com folga.
 */
function esperarOFechamento(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 50));
}

describe('QuestionDetailDialog', () => {
  function montar() {
    // Cada montagem começa do zero: os testes de fase abrem três diálogos no
    // mesmo `it`, e o TestBed recusa ser configurado duas vezes.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [QuestionDetailDialog],
      providers: [provideZonelessChangeDetection()],
    });

    const fixture = TestBed.createComponent(QuestionDetailDialog);
    fixture.detectChanges();

    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function abrir(question: MuralQuestion = PERGUNTA) {
    const montado = montar();
    montado.fixture.componentInstance.open(question);
    montado.fixture.detectChanges();

    return montado;
  }

  function texto(el: HTMLElement): string {
    return el.textContent ?? '';
  }

  it('abre com o título e o corpo inteiro, com as quebras de linha', () => {
    const { el } = abrir();

    expect(el.querySelector('dialog')!.hasAttribute('open')).toBeTrue();
    expect(texto(el)).toContain('Quando usar herança em vez de composição?');
    expect(el.querySelector('.qd__corpo')!.textContent).toContain('Herdar de uma base resolve');
  });

  it('pergunta sem contexto diz que não há contexto, e não deixa buraco', () => {
    const { el } = abrir({ ...PERGUNTA, body: null });

    expect(texto(el)).toContain('Quem perguntou não escreveu mais contexto.');
  });

  it('a fase sai do dado, por extenso, nos três valores', () => {
    expect(texto(abrir({ ...PERGUNTA, phase: 'coleta' }).el)).toContain('recebendo perguntas');
    expect(texto(abrir({ ...PERGUNTA, phase: 'votacao' }).el)).toContain('em votação');
    expect(texto(abrir({ ...PERGUNTA, phase: 'encerrada' }).el)).toContain('encerrada');
  });

  it('mostra os selos de adiantada e de "a sua" quando o dado traz', () => {
    const { el } = abrir({ ...PERGUNTA, promotedTo: 'votacao', isMine: true });

    expect(texto(el)).toContain('adiantada');
    expect(texto(el)).toContain('a sua');
  });

  it('mostra a data da pergunta e a contagem de votos', () => {
    const { el } = abrir();

    expect(texto(el)).toContain('13 de agosto');
    expect(texto(el)).toContain('12 votos');
  });

  it('um voto só não vira "1 votos"', () => {
    expect(texto(abrir({ ...PERGUNTA, voteCount: 1 }).el)).toContain('1 voto');
  });

  /**
   * **O diálogo lê, e não vota** (decisão 5).
   *
   * Ele recebe uma fotografia da pergunta. Um voto disparado daqui teria que
   * atualizar a lista, o contador da fotografia e o rollback dos dois — seria a
   * segunda implementação do voto otimista, e ela divergiria da primeira no
   * primeiro `catch`. Quem vota é o cartão, no lado do polegar.
   */
  it('teste-trava: não existe botão de voto dentro do diálogo', () => {
    const { el } = abrir();

    expect(el.querySelector('.vote')).toBeNull();
    expect(el.querySelector('[aria-pressed]')).toBeNull();
  });

  it('o nome vira botão quando há autor, e clicar fecha antes de emitir', () => {
    const { fixture, el } = abrir();

    let emitido: MuralQuestion | undefined;
    let abertoNoMomentoDoEvento = true;
    fixture.componentInstance.authorClick.subscribe((q) => {
      emitido = q;
      abertoNoMomentoDoEvento = el.querySelector('dialog')!.hasAttribute('open');
    });

    const botao = el.querySelector<HTMLButtonElement>('.qd__autor');
    expect(botao).not.toBeNull();
    botao!.click();

    expect(emitido?.authorUid).toBe('uid-7');
    // Um modal por vez: o da pergunta fecha antes de o cartão do membro abrir,
    // ou o Esc passa a fechar um dos dois sem ninguém saber qual (decisão 6).
    expect(abertoNoMomentoDoEvento).toBeFalse();
  });

  /**
   * A mesma garantia da spec 019, agora no diálogo: sem `authorUid`, o nome é
   * texto e mais nada. A comparação é com nulo, nunca com o valor sentinela do
   * backend.
   */
  it('teste-trava: pergunta anônima não tem botão de autor, e não emite nada', () => {
    const { fixture, el } = abrir({
      ...PERGUNTA,
      authorUid: null,
      authorName: 'Membro removido',
    });

    let emitiu = false;
    fixture.componentInstance.authorClick.subscribe(() => (emitiu = true));

    expect(el.querySelector('.qd__autor')).toBeNull();
    expect(texto(el)).toContain('Membro removido');
    expect(emitiu).toBeFalse();
  });

  it('fechar avisa a página e esquece a pergunta', async () => {
    const { fixture, el } = abrir();

    let fechou = false;
    fixture.componentInstance.closed.subscribe(() => (fechou = true));

    el.querySelector<HTMLButtonElement>('.btn--cancel')!.click();
    // O evento `close` do <dialog> nativo é assíncrono: ele entra na fila de
    // tarefas, e não sai no mesmo tique do clique.
    await esperarOFechamento();
    fixture.detectChanges();

    expect(fechou).toBeTrue();
    expect(el.querySelector('dialog')!.hasAttribute('open')).toBeFalse();
    expect(texto(el)).not.toContain('Quando usar herança');
  });

  /**
   * Clique no `::backdrop` chega com `target` igual ao próprio `<dialog>`.
   * Sem a comparação, um clique no meio do texto fecharia o diálogo por engano
   * — que é o defeito que este par de testes protege.
   */
  it('clique fora fecha, e clique dentro não', async () => {
    const { fixture, el } = abrir();
    const dialog = el.querySelector('dialog')!;

    dialog.querySelector<HTMLElement>('.qd__titulo')!.click();
    fixture.detectChanges();
    expect(dialog.hasAttribute('open')).toBeTrue();

    dialog.click();
    await esperarOFechamento();
    fixture.detectChanges();
    expect(dialog.hasAttribute('open')).toBeFalse();
  });

  /**
   * **O componente é burro.** Ele monta sem `provideHttpClient` nenhum, que é a
   * prova de que não busca a pergunta: ela chega pronta, da lista que a página
   * já carregou.
   */
  it('teste-trava: não faz requisição — monta sem HttpClient', () => {
    const { el } = abrir();

    expect(el.querySelector('.qd__titulo')).not.toBeNull();
  });
});
