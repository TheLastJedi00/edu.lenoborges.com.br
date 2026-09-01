import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TrainingCard } from './training-card';
import { Training } from '../../models/training.model';

function desafio(extra: Partial<Training> = {}): Training {
  return {
    id: 'trn-1',
    badgeId: 'logica',
    title: 'Refatore o laço em três funções',
    description: 'Um exercício de leitura antes de escrever.',
    steps: ['Clone o repositório', 'Rode os testes'],
    videoUrl: null,
    xpAmount: 30,
    position: 0,
    completed: false,
    ...extra,
  };
}

describe('TrainingCard', () => {
  let fixture: ComponentFixture<TrainingCard>;

  function render(training: Training): HTMLElement {
    fixture.componentRef.setInput('training', training);
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingCard],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainingCard);
  });

  it('mostra o título e a descrição', () => {
    const host = render(desafio());

    expect(host.textContent).toContain('Refatore o laço em três funções');
    expect(host.textContent).toContain('Um exercício de leitura antes de escrever.');
  });

  /**
   * **O XP vem do desafio, e não de uma constante do front.**
   *
   * O admin pode ter escrito 80 num exercício longo. Um 30 gravado no template
   * mentiria no card em silêncio, e só para quem lesse a tela.
   */
  it('mostra o XP que o desafio paga, e não o padrão', () => {
    expect(render(desafio({ xpAmount: 80 })).textContent).toContain('80 XP');
  });

  it('conta os passos, no singular e no plural', () => {
    expect(render(desafio({ steps: ['Um'] })).textContent).toContain('1 passo');

    fixture = TestBed.createComponent(TrainingCard);
    expect(render(desafio({ steps: ['Um', 'Dois'] })).textContent).toContain('2 passos');
  });

  describe('o selo de concluído', () => {
    it('não aparece quando o desafio não foi concluído', () => {
      expect(render(desafio()).textContent).not.toContain('Concluído');
    });

    /**
     * O selo é ícone **e** texto.
     *
     * Um check verde sozinho não diz nada para quem usa leitor de tela, e a cor
     * sozinha não diz nada para quem não a distingue.
     */
    it('aparece com texto, e não só com o ícone', () => {
      const host = render(desafio({ completed: true }));

      expect(host.textContent).toContain('Concluído');
      expect(host.querySelector('app-icon-check')).not.toBeNull();
    });
  });

  describe('o clique', () => {
    /**
     * O card é um `<button>` de verdade.
     *
     * Uma `<div>` com `(click)` não recebe foco, não responde ao Enter e não é
     * anunciada como acionável — e aqui o card é a única porta para o desafio.
     */
    it('é um botão, e não uma div clicável', () => {
      const host = render(desafio());

      expect(host.querySelector('button.treino')).not.toBeNull();
    });

    /**
     * Emite **o elemento** que originou o clique.
     *
     * É por ele que a página devolve o foco quando o modal fecha. Sem isso o
     * foco cai no `body` e quem navega por teclado recomeça a lista do topo.
     */
    it('emite o elemento clicado, para o foco poder voltar', () => {
      const host = render(desafio());
      let recebido: HTMLElement | undefined;

      fixture.componentInstance.abrir.subscribe((el) => (recebido = el));
      host.querySelector<HTMLButtonElement>('button.treino')!.click();

      expect(recebido).toBeInstanceOf(HTMLElement);
      expect(recebido?.classList.contains('treino')).toBeTrue();
    });
  });
});
