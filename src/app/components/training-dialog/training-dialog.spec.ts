import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TrainingDialog } from './training-dialog';
import {
  CompleteTrainingRequest,
  Training,
  TrainingComment,
} from '../../models/training.model';

function desafio(extra: Partial<Training> = {}): Training {
  return {
    id: 'trn-1',
    badgeId: 'logica',
    title: 'Refatore o laço em três funções',
    description: 'Um exercício de leitura antes de escrever.',
    objective: 'Um laço lido de cima a baixo sem rolar a tela.',
    hints: ['Repare no que o laço acumula', 'Uma delas dá nome a uma função', 'Extraia a menor'],
    videoUrl: null,
    xpAmount: 30,
    position: 0,
    completed: false,
    ...extra,
  };
}

function comentario(extra: Partial<TrainingComment> = {}): TrainingComment {
  return {
    id: 'cmt-1',
    trainingId: 'trn-1',
    authorName: 'Ana',
    content: 'Travei no passo 3.',
    adminReply: null,
    createdAt: '2026-09-01T12:00:00.000Z',
    ...extra,
  };
}

describe('TrainingDialog', () => {
  let fixture: ComponentFixture<TrainingDialog>;

  function render(
    inputs: {
      training?: Training;
      comments?: readonly TrainingComment[];
      canComment?: boolean;
      hasMore?: boolean;
      completing?: boolean;
      canSendPhoto?: boolean;
      uploadingPhoto?: boolean;
      resultImageUrl?: string | null;
      erroDaFoto?: string | null;
    } = {},
  ): HTMLElement {
    fixture.componentRef.setInput('training', inputs.training ?? desafio());
    fixture.componentRef.setInput('comments', inputs.comments ?? []);
    fixture.componentRef.setInput('canComment', inputs.canComment ?? false);
    fixture.componentRef.setInput('hasMore', inputs.hasMore ?? false);
    fixture.componentRef.setInput('completing', inputs.completing ?? false);
    fixture.componentRef.setInput('canSendPhoto', inputs.canSendPhoto ?? false);
    fixture.componentRef.setInput(
      'uploadingPhoto',
      inputs.uploadingPhoto ?? false,
    );
    fixture.componentRef.setInput(
      'resultImageUrl',
      inputs.resultImageUrl ?? null,
    );
    fixture.componentRef.setInput('erroDaFoto', inputs.erroDaFoto ?? null);
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingDialog],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainingDialog);
  });

  function revelar(host: HTMLElement): void {
    host.querySelector<HTMLButtonElement>('.td__revelar')!.click();
    fixture.detectChanges();
  }

  describe('o objetivo', () => {
    it('aparece com rótulo próprio, separado da descrição', () => {
      const objetivo = render().querySelector('.td__objetivo')!;

      expect(objetivo.textContent).toContain('Objetivo');
      expect(objetivo.textContent).toContain('Um laço lido de cima a baixo');
    });

    /**
     * **Treinamento anterior à spec 025 não tem objetivo**, e o converter do
     * backend o devolve como texto vazio. Sem a guarda, a caixa em destaque
     * aparece com o rótulo e nada embaixo — foi o que apareceu ao abrir um
     * desafio legado no preview.
     */
    it('some inteiro quando o desafio é anterior à spec e não tem objetivo', () => {
      const host = render({ training: desafio({ objective: '' }) });

      expect(host.querySelector('.td__objetivo')).toBeNull();
    });
  });

  describe('as dicas', () => {
    /**
     * `<ol>` de verdade, e não `<ul>` com contador no CSS.
     *
     * A numeração é informação — "volte à dica 3" só faz sentido se as dicas
     * forem numeradas —, e quem ouve a tela precisa ouvir "lista numerada".
     */
    it('desenha um item por dica, numa lista ordenada', () => {
      expect(render().querySelectorAll('ol.td__lista li').length).toBe(3);
    });

    /**
     * **O teste que protege a mecânica inteira** (spec 025).
     *
     * A dica fechada **não entra no DOM**. Não é `filter: blur()` e não é
     * `aria-hidden`: os dois deixam o texto no HTML, onde o leitor de tela lê e
     * o inspecionar elemento mostra, e a cobrança de 1 XP vira uma censura que
     * qualquer um contorna — sem erro, sem log, e sem ninguém perceber.
     */
    it('o texto da dica fechada não está no DOM', () => {
      const host = render();

      expect(host.textContent).not.toContain('Repare no que o laço acumula');
      expect(host.innerHTML).not.toContain('Repare no que o laço acumula');
    });

    it('revelar abre uma dica por vez, na ordem', () => {
      const host = render();

      revelar(host);

      expect(host.textContent).toContain('Repare no que o laço acumula');
      expect(host.textContent).not.toContain('Uma delas dá nome a uma função');
    });

    it('o botão some quando a última dica abre', () => {
      const host = render();

      revelar(host);
      revelar(host);
      expect(host.querySelector('.td__revelar')).not.toBeNull();

      revelar(host);
      expect(host.querySelector('.td__revelar')).toBeNull();
    });

    /**
     * **Desafio concluído não mostra preço nenhum.** Sem XP a perder, cobrar
     * por uma dica seria cobrar por nada.
     */
    it('concluído mostra todas as dicas abertas e nenhum botão de revelar', () => {
      const host = render({ training: desafio({ completed: true }) });

      expect(host.textContent).toContain('Repare no que o laço acumula');
      expect(host.textContent).toContain('Extraia a menor');
      expect(host.querySelector('.td__revelar')).toBeNull();
      expect(host.querySelector('.td__premio')).toBeNull();
    });
  });

  /**
   * **Com a dica fechada fora do DOM, não há `aria-hidden` a colocar.**
   *
   * O que falta é o contrário: quem não vê a tela precisa saber o que o botão
   * vai custar antes de apertar, e precisa saber que algo apareceu depois.
   */
  describe('a leitura de tela', () => {
    it('o botão de revelar anuncia qual dica e o custo', () => {
      const rotulo = render()
        .querySelector('.td__revelar')!
        .getAttribute('aria-label')!;

      expect(rotulo).toContain('dica 1 de 3');
      expect(rotulo).toContain('1 XP');
    });

    it('a dica revelada entra numa região viva', () => {
      const host = render();

      revelar(host);

      const regiao = host.querySelector('ol.td__lista[aria-live="polite"]')!;

      expect(regiao.textContent).toContain('Repare no que o laço acumula');
    });
  });

  describe('o prêmio', () => {
    it('começa no valor cheio do desafio', () => {
      expect(render().querySelector('.td__premio')!.textContent).toContain('30 XP');
    });

    it('cai 1 XP por dica revelada', () => {
      const host = render();

      revelar(host);
      revelar(host);

      expect(host.querySelector('.td__premio')!.textContent).toContain('28 XP');
    });

    /** A tela nunca promete um valor negativo, como o servidor nunca o paga. */
    it('não passa de zero por baixo', () => {
      const host = render({
        training: desafio({ xpAmount: 2, hints: ['Uma', 'Duas', 'Três'] }),
      });

      revelar(host);
      revelar(host);
      revelar(host);

      expect(host.querySelector('.td__premio')!.textContent).toContain('0 XP');
    });
  });

  describe('o vídeo de apoio', () => {
    it('não desenha moldura quando não há vídeo', () => {
      expect(render().querySelector('iframe')).toBeNull();
    });

    it('desenha o player quando a URL é do YouTube', () => {
      const host = render({
        training: desafio({
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        }),
      });

      expect(host.querySelector('iframe')).not.toBeNull();
    });

    /**
     * **URL que não é do YouTube não vira `src` de iframe.**
     *
     * O campo é texto livre digitado pelo admin — ao contrário do `youtubeId`
     * da spec 017, que a API extraiu e validou. Vira link, e o membro decide
     * abrir.
     */
    it('vira link, e não moldura, quando a URL não é do YouTube', () => {
      const host = render({
        training: desafio({ videoUrl: 'https://exemplo.com/aula.mp4' }),
      });

      expect(host.querySelector('iframe')).toBeNull();
      expect(host.querySelector('.td__link-externo a')).not.toBeNull();
    });
  });

  describe('os comentários', () => {
    it('diz que ninguém comentou, em vez de mostrar nada', () => {
      expect(render().textContent).toContain('Ninguém comentou ainda');
    });

    it('lista os comentários recebidos', () => {
      const host = render({ comments: [comentario()] });

      expect(host.textContent).toContain('Ana');
      expect(host.textContent).toContain('Travei no passo 3.');
    });

    /**
     * **A resposta do admin aparece embaixo do comentário.**
     *
     * É o que fecha o ciclo: sem esta área o admin responde no painel e o
     * membro nunca vê.
     */
    it('mostra a resposta do admin dentro do comentário respondido', () => {
      const host = render({
        comments: [
          comentario({
            adminReply: {
              content: 'Rode npm ci antes.',
              authorName: 'Leno',
              repliedAt: '2026-09-02T09:00:00.000Z',
            },
          }),
        ],
      });

      expect(host.querySelector('.td__resposta')).not.toBeNull();
      expect(host.textContent).toContain('Rode npm ci antes.');
      expect(host.textContent).toContain('Leno');
    });

    it('não desenha área de resposta no comentário sem resposta', () => {
      const host = render({ comments: [comentario()] });

      expect(host.querySelector('.td__resposta')).toBeNull();
    });

    it('o Mostrar mais só existe quando há mais páginas', () => {
      expect(render({ comments: [comentario()] }).querySelector('.td__mais')).toBeNull();
    });

    it('pede a próxima página ao clicar em Mostrar mais', () => {
      const host = render({ comments: [comentario()], hasMore: true });
      let pediu = false;

      fixture.componentInstance.carregarMais.subscribe(() => (pediu = true));
      host.querySelector<HTMLButtonElement>('.td__mais')!.click();

      expect(pediu).toBeTrue();
    });
  });

  describe('o portão do tier', () => {
    /**
     * **A restrição é de escrita, e não de leitura.**
     *
     * Quem não pode comentar continua vendo a conversa: o campo some, a lista
     * fica. Esconder a seção inteira tiraria conteúdo de quem tem direito a ele.
     */
    it('sem permissão, mostra a mensagem e esconde o campo, mas não a lista', () => {
      const host = render({ canComment: false, comments: [comentario()] });

      expect(host.textContent).toContain('exclusiva para membros do Great Tier');
      // `.td__campo` e nao `textarea`: desde a spec 027 existe um segundo textarea
      // no modal, o do codigo da submissao, e ele nao tem nada a ver com o portao
      // dos comentarios. Um seletor generico aqui faz este teste falhar por causa
      // de uma mudanca em outra secao.
      expect(host.querySelector('.td__campo')).toBeNull();
      expect(host.textContent).toContain('Travei no passo 3.');
    });

    it('com permissão, mostra o campo e não mostra a mensagem', () => {
      const host = render({ canComment: true });

      expect(host.querySelector('.td__campo')).not.toBeNull();
      // A frase inteira do portao dos comentarios, e nao um prefixo: a spec 027
      // trouxe um segundo aviso de tier -- o da foto de resultado -- que comeca com
      // as mesmas palavras.
      expect(host.textContent).not.toContain('exclusiva para membros do Great Tier');
    });

    it('emite o texto digitado e limpa o campo', () => {
      const host = render({ canComment: true });
      const campo = host.querySelector<HTMLTextAreaElement>('textarea')!;
      let enviado: string | undefined;

      fixture.componentInstance.comentar.subscribe((texto) => (enviado = texto));
      campo.value = '  Travei no passo 3  ';
      host.querySelector<HTMLFormElement>('form.td__form')!.dispatchEvent(new Event('submit'));

      expect(enviado).toBe('Travei no passo 3');
      expect(campo.value).toBe('');
    });

    it('não emite comentário vazio', () => {
      const host = render({ canComment: true });
      const campo = host.querySelector<HTMLTextAreaElement>('textarea')!;
      let emitiu = false;

      fixture.componentInstance.comentar.subscribe(() => (emitiu = true));
      campo.value = '   ';
      host.querySelector<HTMLFormElement>('form.td__form')!.dispatchEvent(new Event('submit'));

      expect(emitiu).toBeFalse();
    });
  });

  describe('concluir', () => {
    it('mostra o botão enquanto o desafio não foi concluído', () => {
      const host = render();

      expect(host.querySelector('.td__concluir')?.textContent).toContain('Concluir Desafio');
      expect(host.querySelector('.td__selo')).toBeNull();
    });

    /**
     * Depois de concluído o botão **some e vira selo**.
     *
     * Um botão desabilitado convida ao clique e não explica nada; o selo diz que
     * está feito.
     */
    it('depois de concluído, troca o botão pelo selo', () => {
      const host = render({ training: desafio({ completed: true }) });

      expect(host.querySelector('.td__concluir')).toBeNull();
      expect(host.textContent).toContain('Desafio concluído');
    });

    it('trava o botão enquanto a conclusão está em voo', () => {
      const host = render({ completing: true });

      expect(host.querySelector<HTMLButtonElement>('.td__concluir')!.disabled).toBeTrue();
    });

    it('emite a intenção de concluir, com as dicas reveladas', () => {
      const host = render();
      let pedido: CompleteTrainingRequest | undefined;

      fixture.componentInstance.concluir.subscribe((p) => (pedido = p));
      revelar(host);
      revelar(host);
      host.querySelector<HTMLButtonElement>('.td__concluir')!.click();

      expect(pedido?.hintsUsed).toBe(2);
    });

    it('emite zero quando nenhuma dica foi aberta', () => {
      const host = render();
      let pedido: CompleteTrainingRequest | undefined;

      fixture.componentInstance.concluir.subscribe((p) => (pedido = p));
      host.querySelector<HTMLButtonElement>('.td__concluir')!.click();

      expect(pedido?.hintsUsed).toBe(0);
    });

    it('o botão mostra o prêmio atual', () => {
      const host = render();

      revelar(host);

      expect(host.querySelector('.td__concluir')!.textContent).toContain('29 XP');
    });
  });

  it('emite o fechamento pelo botão de fechar', () => {
    const host = render();
    let fechou = false;

    fixture.componentInstance.fechar.subscribe(() => (fechou = true));
    host.querySelector<HTMLButtonElement>('.td__fechar')!.click();

    expect(fechou).toBeTrue();
  });

  /**
   * O ganho de XP é anunciado em `aria-live`.
   *
   * Quem não vê a animação precisa ouvir que ela aconteceu — senão o feedback
   * de sucesso existe só para quem enxerga a tela.
   */
  it('anuncia o XP ganho numa região viva', () => {
    fixture.componentRef.setInput('training', desafio());
    fixture.componentRef.setInput('xpGanho', 30);
    fixture.detectChanges();

    const regiao = (fixture.nativeElement as HTMLElement).querySelector(
      '.td__xp[aria-live="polite"]',
    );

    expect(regiao?.textContent).toContain('+30 XP');
  });

  describe('a submissao da resposta (spec 027)', () => {
    function codigo(host: HTMLElement): HTMLTextAreaElement {
      return host.querySelector<HTMLTextAreaElement>('.td__codigo')!;
    }

    function digitar(host: HTMLElement, texto: string): void {
      const campo = codigo(host);
      campo.value = texto;
      campo.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    it('o campo de codigo aparece para qualquer tier', () => {
      const host = render({ canSendPhoto: false });

      expect(codigo(host)).not.toBeNull();
      expect(host.textContent).toContain('Ctrl+A, Ctrl+C e Ctrl+V');
    });

    it('emite o codigo junto das dicas', () => {
      const host = render();
      let pedido: CompleteTrainingRequest | undefined;
      fixture.componentInstance.concluir.subscribe((p) => (pedido = p));

      revelar(host);
      digitar(host, 'public static void main(String[] a) {}');
      host.querySelector<HTMLButtonElement>('.td__concluir')!.click();

      expect(pedido).toEqual({
        hintsUsed: 1,
        mainCode: 'public static void main(String[] a) {}',
      });
    });

    /**
     * **Campo vazio não entra no corpo.** Mandar `mainCode: ''` faria o servidor
     * gravar string vazia onde `null` é a verdade, e a diferença aparece no dia em
     * que alguém for conferir quem entregou código.
     */
    it('teste-trava: codigo vazio nao vai no corpo', () => {
      const host = render();
      let pedido: CompleteTrainingRequest | undefined;
      fixture.componentInstance.concluir.subscribe((p) => (pedido = p));

      digitar(host, '   ');
      host.querySelector<HTMLButtonElement>('.td__concluir')!.click();

      expect(pedido).toEqual({ hintsUsed: 0 });
      expect('mainCode' in (pedido ?? {})).toBeFalse();
    });

    describe('o portao da foto', () => {
      it('Dev Tier ve o aviso e nao ve o botao de anexar', () => {
        const host = render({ canSendPhoto: false });

        expect(host.textContent).toContain(
          'exclusiva para membros Great Dev e superiores',
        );
        expect(host.querySelector('.td__foto-input')).toBeNull();
      });

      it('Great Dev ve o botao e nao ve o aviso', () => {
        const host = render({ canSendPhoto: true });

        expect(host.querySelector('.td__foto-input')).not.toBeNull();
        expect(host.textContent).not.toContain(
          'exclusiva para membros Great Dev',
        );
      });

      it('escolher o arquivo emite uma vez, para a pagina subir', () => {
        const host = render({ canSendPhoto: true });
        const enviados: File[] = [];
        fixture.componentInstance.fotoEscolhida.subscribe((f) =>
          enviados.push(f),
        );

        const input = host.querySelector<HTMLInputElement>('.td__foto-input')!;
        const file = new File([new Uint8Array([1])], 'r.png', {
          type: 'image/png',
        });
        Object.defineProperty(input, 'files', { value: [file] });
        input.dispatchEvent(new Event('change'));
        fixture.detectChanges();

        expect(enviados).toEqual([file]);
      });

      it('mostra a miniatura do que subiu, e oferece trocar', () => {
        const host = render({
          canSendPhoto: true,
          resultImageUrl: 'https://s/b/trainings/u/t?v=1',
        });

        expect(
          host
            .querySelector<HTMLImageElement>('.td__foto')!
            .getAttribute('src'),
        ).toBe('https://s/b/trainings/u/t?v=1');
        expect(host.textContent).toContain('Trocar a foto');
      });

      it('mostra o erro do upload sem apagar o resto da tela', () => {
        const host = render({
          canSendPhoto: true,
          erroDaFoto: 'Nao consegui enviar a foto agora. Tente de novo.',
        });

        expect(host.querySelector('[role="alert"]')?.textContent).toContain(
          'Nao consegui enviar a foto',
        );
        expect(codigo(host)).not.toBeNull();
      });

      it('a URL da foto entra no corpo da conclusao', () => {
        const host = render({
          canSendPhoto: true,
          resultImageUrl: 'https://s/b/trainings/u/t?v=1',
        });
        let pedido: CompleteTrainingRequest | undefined;
        fixture.componentInstance.concluir.subscribe((p) => (pedido = p));

        host.querySelector<HTMLButtonElement>('.td__concluir')!.click();

        expect(pedido?.resultImageUrl).toBe('https://s/b/trainings/u/t?v=1');
      });
    });

    /**
     * **A trava desta fase.** O upload acontece na seleção, e concluir antes de a
     * URL chegar mandaria a conclusão sem a foto que a pessoa acabou de escolher —
     * e a segunda conclusão não reescreve a submissão, então ela perderia a foto
     * para sempre.
     */
    it('teste-trava: concluir fica travado enquanto a foto sobe', () => {
      const host = render({ canSendPhoto: true, uploadingPhoto: true });

      const botao = host.querySelector<HTMLButtonElement>('.td__concluir')!;
      expect(botao.disabled).toBeTrue();
      expect(botao.textContent).toContain('Aguarde a foto');
    });

    describe('o desafio ja concluido', () => {
      it('mostra o codigo enviado em leitura, e nao um formulario', () => {
        const host = render({
          training: desafio({
            completed: true,
            submission: {
              mainCode: 'o que eu entreguei',
              resultImageUrl: null,
            },
          }),
        });

        expect(codigo(host)).toBeNull();
        expect(host.querySelector('.td__codigo-lido')?.textContent).toContain(
          'o que eu entreguei',
        );
      });

      it('mostra a foto enviada', () => {
        const host = render({
          training: desafio({
            completed: true,
            submission: {
              mainCode: null,
              resultImageUrl: 'https://s/b/trainings/u/t?v=1',
            },
          }),
        });

        expect(
          host
            .querySelector<HTMLImageElement>('.td__foto')!
            .getAttribute('src'),
        ).toBe('https://s/b/trainings/u/t?v=1');
      });

      it('diz que nao houve anexo quando a conclusao e anterior a spec', () => {
        // Conclusao anterior a 027 chega com os dois campos nulos, e a secao vazia
        // pareceria defeito.
        const host = render({
          training: desafio({ completed: true, submission: null }),
        });

        expect(host.textContent).toContain('sem anexar uma resposta');
      });
    });
  });
});
