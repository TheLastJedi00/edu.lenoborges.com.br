import { TestBed } from '@angular/core/testing';
import { ComponentRef, provideZonelessChangeDetection } from '@angular/core';
import { VideoForm } from './video-form';
import { CreateVideoRequest } from '../../models/admin.model';
import { AnsweredQuestion } from '../../models/track.model';

/** A pergunta que põe o formulário em modo resposta (spec 017). */
const PERGUNTA: AnsweredQuestion = {
  id: '2026-08-09__uid-1',
  title: 'Como saber quando usar herança em vez de composição?',
  authorName: 'Ana Prado',
  askedAt: '2026-08-09T18:00:00.000Z'
};

describe('VideoForm', () => {
  function setup(question: AnsweredQuestion | null) {
    TestBed.configureTestingModule({
      imports: [VideoForm],
      providers: [provideZonelessChangeDetection()]
    });

    const fixture = TestBed.createComponent(VideoForm);
    const ref = fixture.componentRef as ComponentRef<VideoForm>;
    ref.setInput('question', question);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;

    /** Preenche o mínimo válido e publica, devolvendo o corpo emitido. */
    function publicar(): CreateVideoRequest | undefined {
      let corpo: CreateVideoRequest | undefined;
      fixture.componentInstance.submitted.subscribe(
        (body: CreateVideoRequest) => (corpo = body)
      );

      preencher('#video-title', 'Herança e composição, na prática');
      preencher('#video-url', 'https://www.youtube.com/shorts/rrrrrrrrrrr');

      (el.querySelector('form') as HTMLFormElement).dispatchEvent(
        new Event('submit')
      );
      fixture.detectChanges();

      return corpo;
    }

    function preencher(seletor: string, valor: string): void {
      const campo = el.querySelector(seletor) as HTMLInputElement;
      campo.value = valor;
      campo.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    function toggle(): HTMLInputElement | null {
      return el.querySelector('.trilha__input');
    }

    return { fixture, el, publicar, toggle };
  }

  /**
   * O toggle da spec 021 só existe em **modo resposta**: em modo aula ele não
   * teria significado, porque aula vive na trilha e ponto.
   */
  it('sem pergunta, o toggle não é renderizado e `tab` nunca sai no corpo', () => {
    const { publicar, toggle } = setup(null);

    expect(toggle()).toBeNull();

    const corpo = publicar();

    expect(corpo?.tab).toBeUndefined();
    expect(corpo?.kind).toBeUndefined();
    expect(corpo?.questionId).toBeUndefined();
  });

  /**
   * **O padrão é o comportamento de hoje**, e ele é o que acontece quando
   * ninguém decide nada: a resposta vai para a aba de Perguntas Frequentes.
   *
   * E `tab` **não vai** no corpo — o servidor deriva `tab = kind`, e mandar
   * `tab: 'resposta'` explicitamente seria só ruído.
   */
  it('com pergunta e toggle desligado, manda kind e questionId e não manda tab', () => {
    const { publicar, toggle } = setup(PERGUNTA);

    expect(toggle()).not.toBeNull();
    expect(toggle()!.checked).toBeFalse();

    const corpo = publicar();

    expect(corpo?.kind).toBe('resposta');
    expect(corpo?.questionId).toBe(PERGUNTA.id);
    expect(corpo?.tab).toBeUndefined();
  });

  /** O caso que a spec inteira existe para permitir. */
  it('com pergunta e toggle ligado, manda tab aula junto do kind resposta', () => {
    const { fixture, publicar, toggle } = setup(PERGUNTA);

    const caixa = toggle()!;
    caixa.checked = true;
    caixa.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const corpo = publicar();

    expect(corpo?.kind).toBe('resposta');
    expect(corpo?.questionId).toBe(PERGUNTA.id);
    expect(corpo?.tab).toBe('aula');
  });

  /**
   * A etiqueta diz que é uma **troca de lugar**, e não uma adição: "posicionar
   * na trilha" sozinho não conta que a resposta sai da aba de Perguntas
   * Frequentes, e essa é a metade que surpreende depois.
   */
  it('a etiqueta do toggle diz que a resposta sai da aba', () => {
    const { el } = setup(PERGUNTA);

    expect(el.querySelector('.trilha')?.textContent).toContain(
      'sai da aba de Perguntas Frequentes'
    );
  });

  /**
   * O reset volta o toggle a desligado. Uma escolha que sobrevivesse à
   * publicação anterior mandaria a próxima resposta para a trilha sem ninguém
   * ter decidido isso de novo — e o admin publica várias em sequência.
   */
  it('o reset desliga o toggle de novo', () => {
    const { fixture, toggle } = setup(PERGUNTA);

    const caixa = toggle()!;
    caixa.checked = true;
    caixa.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    fixture.componentInstance.reset();
    fixture.detectChanges();

    expect(toggle()!.checked).toBeFalse();
  });
});
