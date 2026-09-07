import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TrainingForm } from './training-form';
import { Training } from '../../models/training.model';

function desafio(extra: Partial<Training> = {}): Training {
  return {
    id: 'trn-1',
    badgeId: 'logica',
    title: 'Refatore o laço',
    description: 'Descrição do desafio',
    steps: ['Um', 'Dois'],
    videoUrl: null,
    xpAmount: 30,
    position: 0,
    completed: false,
    ...extra,
  };
}

describe('TrainingForm', () => {
  let fixture: ComponentFixture<TrainingForm>;
  let host: HTMLElement;

  function preencher(campo: string, valor: string) {
    const input = host.querySelector<HTMLInputElement>(campo)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submeter() {
    host.querySelector<HTMLFormElement>('form.tf')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingForm],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainingForm);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  /**
   * O XP nasce em 30, que é o caso comum.
   *
   * O admin muda quando o exercício justifica — e o valor que vale depois é
   * sempre o do servidor, nunca esta constante.
   */
  it('o campo de XP nasce com o padrão de 30', () => {
    expect(host.querySelector<HTMLInputElement>('#tf-xp')!.value).toBe('30');
  });

  it('nasce com um passo, e não com zero', () => {
    expect(host.querySelectorAll('.tf__passo').length).toBe(1);
  });

  describe('os passos', () => {
    it('adiciona um campo por clique', () => {
      host.querySelector<HTMLButtonElement>('.tf__adicionar')!.click();
      fixture.detectChanges();

      expect(host.querySelectorAll('.tf__passo').length).toBe(2);
    });

    it('remove o passo clicado', () => {
      host.querySelector<HTMLButtonElement>('.tf__adicionar')!.click();
      fixture.detectChanges();
      host.querySelectorAll<HTMLButtonElement>('.tf__remover')[0].click();
      fixture.detectChanges();

      expect(host.querySelectorAll('.tf__passo').length).toBe(1);
    });

    /**
     * **Não dá para ficar sem nenhum passo.**
     *
     * Zero passos é um estado que o backend recusa, e o botão de salvar ficaria
     * travado sem dizer por quê. Com um passo na tela, a saída é apagar o texto
     * dele.
     */
    it('o botão de remover fica travado quando só resta um passo', () => {
      expect(host.querySelector<HTMLButtonElement>('.tf__remover')!.disabled).toBeTrue();
    });
  });

  describe('a validação', () => {
    it('não emite nada sem título', () => {
      let emitiu = false;
      fixture.componentInstance.submitted.subscribe(() => (emitiu = true));

      preencher('#tf-desc', 'Descrição');
      submeter();

      expect(emitiu).toBeFalse();
    });

    it('não emite nada com o passo vazio', () => {
      let emitiu = false;
      fixture.componentInstance.submitted.subscribe(() => (emitiu = true));

      preencher('#tf-title', 'Refatore o laço');
      preencher('#tf-desc', 'Descrição');
      submeter();

      expect(emitiu).toBeFalse();
    });

    it('emite o corpo quando tudo está preenchido', () => {
      let corpo: Record<string, unknown> | undefined;
      fixture.componentInstance.submitted.subscribe(
        (valor) => (corpo = valor as Record<string, unknown>),
      );

      preencher('#tf-title', '  Refatore o laço  ');
      preencher('#tf-desc', 'Descrição');
      preencher('.tf__passo-campo', 'Clone o repositório');
      submeter();

      expect(corpo).toEqual({
        title: 'Refatore o laço',
        description: 'Descrição',
        steps: ['Clone o repositório'],
        xpAmount: 30,
      });
    });

    /**
     * **Campo de vídeo vazio não vai no corpo.**
     *
     * O backend valida `videoUrl` como URL, e uma string vazia viraria 400 num
     * campo que é opcional.
     */
    it('não manda `videoUrl` quando o campo está vazio', () => {
      let corpo: Record<string, unknown> | undefined;
      fixture.componentInstance.submitted.subscribe(
        (valor) => (corpo = valor as Record<string, unknown>),
      );

      preencher('#tf-title', 'Refatore o laço');
      preencher('#tf-desc', 'Descrição');
      preencher('.tf__passo-campo', 'Clone o repositório');
      submeter();

      expect('videoUrl' in (corpo ?? {})).toBeFalse();
    });

    it('manda `videoUrl` quando o campo está preenchido', () => {
      let corpo: Record<string, unknown> | undefined;
      fixture.componentInstance.submitted.subscribe(
        (valor) => (corpo = valor as Record<string, unknown>),
      );

      preencher('#tf-title', 'Refatore o laço');
      preencher('#tf-desc', 'Descrição');
      preencher('.tf__passo-campo', 'Clone o repositório');
      preencher('#tf-video', 'https://youtu.be/dQw4w9WgXcQ');
      submeter();

      expect(corpo?.['videoUrl']).toBe('https://youtu.be/dQw4w9WgXcQ');
    });
  });

  describe('a edição', () => {
    it('preenche os campos com o desafio recebido', () => {
      fixture.componentRef.setInput('training', desafio({ xpAmount: 80 }));
      fixture.detectChanges();

      expect(host.querySelector<HTMLInputElement>('#tf-title')!.value).toBe('Refatore o laço');
      expect(host.querySelector<HTMLInputElement>('#tf-xp')!.value).toBe('80');
      expect(host.querySelectorAll('.tf__passo').length).toBe(2);
    });

    it('o botão diz que está salvando alterações, e não criando', () => {
      fixture.componentRef.setInput('training', desafio());
      fixture.detectChanges();

      expect(host.querySelector('.tf__salvar')?.textContent).toContain('Salvar alterações');
    });
  });
});
