import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TrainingDialog } from './training-dialog';
import { Training, TrainingComment } from '../../models/training.model';

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
    } = {},
  ): HTMLElement {
    fixture.componentRef.setInput('training', inputs.training ?? desafio());
    fixture.componentRef.setInput('comments', inputs.comments ?? []);
    fixture.componentRef.setInput('canComment', inputs.canComment ?? false);
    fixture.componentRef.setInput('hasMore', inputs.hasMore ?? false);
    fixture.componentRef.setInput('completing', inputs.completing ?? false);
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
      expect(host.querySelector('textarea')).toBeNull();
      expect(host.textContent).toContain('Travei no passo 3.');
    });

    it('com permissão, mostra o campo e não mostra a mensagem', () => {
      const host = render({ canComment: true });

      expect(host.querySelector('textarea')).not.toBeNull();
      expect(host.textContent).not.toContain('exclusiva para membros');
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
      let dicas: number | undefined;

      fixture.componentInstance.concluir.subscribe((quantas) => (dicas = quantas));
      revelar(host);
      revelar(host);
      host.querySelector<HTMLButtonElement>('.td__concluir')!.click();

      expect(dicas).toBe(2);
    });

    it('emite zero quando nenhuma dica foi aberta', () => {
      const host = render();
      let dicas: number | undefined;

      fixture.componentInstance.concluir.subscribe((quantas) => (dicas = quantas));
      host.querySelector<HTMLButtonElement>('.td__concluir')!.click();

      expect(dicas).toBe(0);
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
});
