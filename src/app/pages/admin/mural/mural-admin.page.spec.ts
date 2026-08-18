import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminMuralPage } from './mural-admin.page';
import { MuralQuestion, MuralWinner } from '../../../models/mural.model';

function question(overrides: Partial<MuralQuestion> = {}): MuralQuestion {
  return {
    id: '2026-08-09__uid-1',
    weekId: '2026-08-09',
    phase: 'votacao',
    badgeId: 'poo',
    authorName: 'Leno',
    title: 'Como saber quando usar herança?',
    body: null,
    voteCount: 7,
    hasVoted: false,
    isMine: false,
    answerVideoId: null,
    ...overrides
  };
}

describe('AdminMuralPage', () => {
  let http: HttpTestingController;

  function setup(
    votacao: MuralQuestion[],
    coleta: MuralQuestion[] = [],
    winners: MuralWinner[] = []
  ) {
    TestBed.configureTestingModule({
      imports: [AdminMuralPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminMuralPage);
    fixture.detectChanges();

    http.expectOne((req) => req.url.endsWith('/mural/perguntas')).flush(votacao);
    fixture.detectChanges();

    http.expectOne((req) => req.url.endsWith('/mural/perguntas')).flush(coleta);
    fixture.detectChanges();

    http
      .expectOne((req) => req.url.endsWith('/mural/vencedoras'))
      .flush(winners);
    fixture.detectChanges();

    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('lista as perguntas das duas semanas vivas', () => {
    const { el } = setup(
      [question({ id: 'a', title: 'Em votação agora' })],
      [question({ id: 'b', title: 'Escrita esta semana', phase: 'coleta' })]
    );

    expect(el.textContent).toContain('Em votação agora');
    expect(el.textContent).toContain('Escrita esta semana');
  });

  /**
   * A remoção é irreversível e leva os votos junto. Confirmar sem ver o que se
   * apaga é confirmar no escuro — e numa lista de trinta cartões, "tem certeza?"
   * sozinho não diz qual deles vai sumir.
   */
  it('mostra o texto da pergunta no diálogo de confirmação', () => {
    const { fixture, el } = setup([
      question({ title: 'Uma pergunta bem específica' })
    ]);

    (el.querySelector('.btn--danger') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.querySelector('.modal__message')?.textContent).toContain(
      'Uma pergunta bem específica'
    );
  });

  it('remove só depois de confirmar', () => {
    const { fixture, el } = setup([question()]);

    (el.querySelector('.btn--danger') as HTMLButtonElement).click();
    fixture.detectChanges();

    // Cancelar não pode disparar requisição nenhuma — o http.verify() do
    // afterEach não existe aqui, mas o expectOne abaixo reprovaria uma segunda.
    const cancelar = Array.from(el.querySelectorAll('.modal .btn')).find((node) =>
      node.textContent?.includes('Cancelar')
    ) as HTMLButtonElement;
    cancelar.click();
    fixture.detectChanges();

    (el.querySelector('.btn--danger') as HTMLButtonElement).click();
    fixture.detectChanges();

    const confirmar = Array.from(el.querySelectorAll('.modal .btn')).find(
      (node) => node.textContent?.includes('Remover')
    ) as HTMLButtonElement;
    confirmar.click();

    http
      .expectOne((req) => req.url.includes('/admin/mural/perguntas/'))
      .flush(null);
  });

  /**
   * O fluxo mais repetido do admin: toda semana tem uma vencedora para virar
   * vídeo. O atalho já chega no formulário com a insígnia certa.
   */
  it('oferece o atalho para cadastrar o vídeo da vencedora', () => {
    const { el } = setup(
      [],
      [],
      [
        {
          weekId: '2026-08-02',
          question: question({ badgeId: 'angular', title: 'A vencedora' })
        }
      ]
    );

    const atalho = Array.from(el.querySelectorAll('a')).find((node) =>
      node.textContent?.includes('Cadastrar o vídeo')
    );
    expect(atalho?.getAttribute('href')).toContain(
      '/dashboard/admin/trilha/angular'
    );
  });

  it('não oferece atalho quando a vencedora já tem vídeo', () => {
    const { el } = setup(
      [],
      [],
      [
        {
          weekId: '2026-08-02',
          question: question({ answerVideoId: 'angular__aaaaaaaaaaa' })
        }
      ]
    );

    expect(el.textContent).not.toContain('Cadastrar o vídeo');
  });
});
