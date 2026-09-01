import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminTreinamentosComentariosPage } from './treinamentos-comentarios.page';

function comentario(extra: Record<string, unknown> = {}) {
  return {
    id: 'cmt-1',
    trainingId: 'trn-1',
    authorName: 'Ana',
    content: 'Travei no passo 3.',
    adminReply: null,
    createdAt: '2026-09-01T12:00:00.000Z',
    trainingTitle: 'Refatore o laço',
    badgeId: 'logica',
    ...extra,
  };
}

describe('AdminTreinamentosComentariosPage', () => {
  let http: HttpTestingController;

  function setup() {
    TestBed.configureTestingModule({
      imports: [AdminTreinamentosComentariosPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminTreinamentosComentariosPage);
    fixture.detectChanges();

    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function flush(comentarios: unknown[]) {
    http
      .expectOne((req) => req.url.endsWith('/admin/trainings/comments/recent'))
      .flush({ comments: comentarios });
  }

  it('mostra o estado de carregamento antes da resposta', () => {
    const { el } = setup();

    expect(el.textContent).toContain('Carregando os comentários');
    http
      .expectOne((req) => req.url.includes('/comments/recent'))
      .flush({
        comments: [],
      });
  });

  it('diz que ninguém comentou, em vez de mostrar uma lista vazia', () => {
    const { fixture, el } = setup();
    flush([]);
    fixture.detectChanges();

    expect(el.textContent).toContain('Ninguém comentou em nenhum desafio ainda');
  });

  /**
   * Cada linha diz **de onde veio**.
   *
   * Sem o título do desafio, o admin lê "travei no passo 3" sem saber de qual
   * exercício, e precisa abrir a trilha para descobrir.
   */
  it('mostra o comentário com o desafio de origem', () => {
    const { fixture, el } = setup();
    flush([comentario()]);
    fixture.detectChanges();

    expect(el.textContent).toContain('Refatore o laço');
    expect(el.textContent).toContain('Ana');
    expect(el.textContent).toContain('Travei no passo 3.');
  });

  it('diz "Desafio removido" quando o treinamento já não existe', () => {
    const { fixture, el } = setup();
    flush([comentario({ trainingTitle: null, badgeId: null })]);
    fixture.detectChanges();

    expect(el.textContent).toContain('Desafio removido');
  });

  it('mostra o erro e oferece nova tentativa quando a lista falha', () => {
    const { fixture, el } = setup();
    http
      .expectOne((req) => req.url.includes('/comments/recent'))
      .flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el.querySelector('[role="alert"]')).not.toBeNull();
    expect(el.textContent).toContain('Tentar de novo');
  });

  describe('a resposta inline', () => {
    it('grava a resposta e a mostra na própria linha', () => {
      const { fixture, el } = setup();
      flush([comentario()]);
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('.linha__responder')!.click();
      fixture.detectChanges();

      const campo = el.querySelector<HTMLTextAreaElement>('.linha__campo')!;
      campo.value = 'Rode npm ci antes.';
      el.querySelector<HTMLFormElement>('.linha__form')!.dispatchEvent(new Event('submit'));

      const req = http.expectOne((r) => r.url.endsWith('/admin/trainings/comments/cmt-1/reply'));
      expect(req.request.body).toEqual({ content: 'Rode npm ci antes.' });
      req.flush({
        ...comentario(),
        adminReply: {
          content: 'Rode npm ci antes.',
          authorName: 'Leno',
          repliedAt: '2026-09-02T09:00:00.000Z',
        },
      });
      fixture.detectChanges();

      expect(el.querySelector('.linha__resposta')).not.toBeNull();
      expect(el.textContent).toContain('Rode npm ci antes.');
    });

    it('não envia resposta vazia', () => {
      const { fixture, el } = setup();
      flush([comentario()]);
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('.linha__responder')!.click();
      fixture.detectChanges();
      el.querySelector<HTMLFormElement>('.linha__form')!.dispatchEvent(new Event('submit'));

      http.expectNone((r) => r.url.includes('/reply'));
    });

    /**
     * **Comentário já respondido mostra a resposta, e o botão muda de texto.**
     *
     * A tela lista tudo, e não só o que falta responder. Sem esta marca o admin
     * responde duas vezes a mesma pessoa sem perceber, e a segunda resposta
     * sobrescreve a primeira.
     */
    it('quem já foi respondido mostra a resposta e oferece editar', () => {
      const { fixture, el } = setup();
      flush([
        comentario({
          adminReply: {
            content: 'Já respondi isso.',
            authorName: 'Leno',
            repliedAt: '2026-09-02T09:00:00.000Z',
          },
        }),
      ]);
      fixture.detectChanges();

      expect(el.querySelector('.linha__resposta')).not.toBeNull();
      expect(el.querySelector('.linha__responder')?.textContent).toContain('Editar resposta');
    });

    it('a caixa de edição vem preenchida com a resposta atual', () => {
      const { fixture, el } = setup();
      flush([
        comentario({
          adminReply: {
            content: 'Já respondi isso.',
            authorName: 'Leno',
            repliedAt: '2026-09-02T09:00:00.000Z',
          },
        }),
      ]);
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('.linha__responder')!.click();
      fixture.detectChanges();

      expect(el.querySelector<HTMLTextAreaElement>('.linha__campo')!.value).toBe(
        'Já respondi isso.',
      );
    });
  });
});
