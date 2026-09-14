import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AiGenerateTrainingsDialog } from './ai-generate-trainings-dialog';
import { AdminService } from '../../services/admin.service';
import { GeneratedTrainings, TrainingInput } from '../../models/training.model';

function rascunho(extra: Partial<TrainingInput> = {}): TrainingInput {
  return {
    title: 'A idade que o sistema não aceita',
    description: 'Um cadastro aceita qualquer número no campo idade.',
    objective: 'O cadastro recusa idade fora da faixa e avisa o usuário.',
    hints: ['Precisamos de uma variável inteira para guardar a idade.', 'Compare com a faixa.'],
    ...extra,
  };
}

describe('AiGenerateTrainingsDialog', () => {
  let fixture: ComponentFixture<AiGenerateTrainingsDialog>;
  let host: HTMLElement;
  let admin: { generateTrainings: jasmine.Spy };

  function montar(): void {
    fixture = TestBed.createComponent(AiGenerateTrainingsDialog);
    fixture.componentRef.setInput('badgeId', 'logica');
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  function preencherTema(texto = 'Desafios sobre laços de repetição em um caso real.'): void {
    const area = host.querySelector<HTMLTextAreaElement>('#prompt-treinos')!;
    area.value = texto;
    area.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function gerar(): void {
    host.querySelector<HTMLFormElement>('form.ait__form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function responder(result: Partial<GeneratedTrainings> = {}): void {
    admin.generateTrainings.and.returnValue(
      of({ trainings: [rascunho()], discarded: 0, ...result } as GeneratedTrainings),
    );
  }

  beforeEach(async () => {
    admin = { generateTrainings: jasmine.createSpy('generateTrainings') };

    await TestBed.configureTestingModule({
      imports: [AiGenerateTrainingsDialog],
      providers: [
        provideZonelessChangeDetection(),
        { provide: AdminService, useValue: admin },
      ],
    }).compileComponents();
  });

  describe('o passo 1', () => {
    it('abre pedindo tema, dificuldade e quantidade', () => {
      montar();

      expect(host.querySelector('#prompt-treinos')).toBeTruthy();
      expect(host.querySelector('#difficulty-treinos')).toBeTruthy();
      expect(host.querySelector('#count-treinos')).toBeTruthy();
      expect(host.querySelector('.ait__list')).toBeNull();
    });

    it('não gera com o tema vazio', () => {
      montar();
      gerar();

      expect(admin.generateTrainings).not.toHaveBeenCalled();
    });

    /**
     * O `select` devolve texto mesmo com `[value]` numérico, e um `"3"` no
     * corpo é 400 no `@IsInt` do backend — um erro que aparece só depois da
     * espera da geração.
     */
    it('manda a quantidade como número', () => {
      responder();
      montar();
      preencherTema();
      gerar();

      const body = admin.generateTrainings.calls.mostRecent().args[1] as { count: unknown };

      expect(typeof body.count).toBe('number');
    });
  });

  describe('o passo 2', () => {
    beforeEach(() => {
      responder({ trainings: [rascunho({ title: 'Um' }), rascunho({ title: 'Dois' })] });
      montar();
      preencherTema();
      gerar();
    });

    /**
     * **Os rascunhos nascem marcados.** O admin revisa e **desmarca** o que não
     * presta, que é o caminho mais curto quando a maioria está boa.
     */
    it('mostra os rascunhos já marcados', () => {
      const marcados = host.querySelectorAll<HTMLInputElement>('.ait__pick input:checked');

      expect(host.querySelectorAll('.ait__item').length).toBe(2);
      expect(marcados.length).toBe(2);
    });

    it('desmarcar tira o item da contagem, sem excluí-lo', () => {
      host.querySelector<HTMLInputElement>('.ait__pick input')!.click();
      fixture.detectChanges();

      expect(host.querySelectorAll('.ait__item').length).toBe(2);
      expect(host.querySelector('.ait__count')!.textContent).toContain('1/2');
    });

    it('excluir tira o item da lista', () => {
      host.querySelector<HTMLButtonElement>('.ait__item .ait__drop')!.click();
      fixture.detectChanges();

      expect(host.querySelectorAll('.ait__item').length).toBe(1);
    });

    it('emite só os aprovados, e não grava nada', (done) => {
      fixture.componentInstance.saved.subscribe((aprovados) => {
        expect(aprovados.length).toBe(1);
        expect(aprovados[0].title).toBe('Dois');
        done();
      });

      host.querySelector<HTMLInputElement>('.ait__pick input')!.click();
      fixture.detectChanges();
      host.querySelector<HTMLButtonElement>('.ait__foot .ait__submit')!.click();
    });

    /**
     * O backend exige pelo menos uma dica (spec 025, decisão 1). Deixar o
     * rascunho chegar a zero seria oferecer um botão de salvar que devolve 400
     * no fim da revisão.
     */
    it('não deixa remover a última dica de um rascunho', () => {
      const remover = () => {
        const botoes = host.querySelectorAll<HTMLButtonElement>('.ait__dica .ait__drop');
        botoes[0].click();
        fixture.detectChanges();
      };

      remover();
      remover();

      expect(host.querySelectorAll('.ait__item')[0].querySelectorAll('.ait__dica').length).toBe(1);
    });
  });

  /**
   * **O `discarded` precisa aparecer.** Sem ele, um rascunho de 1 quando se
   * pediu 5 parece limite do produto em vez de um modelo que errou o formato.
   */
  it('mostra quantos foram descartados', () => {
    responder({ discarded: 4 });
    montar();
    preencherTema();
    gerar();

    expect(host.querySelector('.ait__discarded')!.textContent).toContain('4');
  });

  /**
   * O `503` é o único erro desta rota que não é culpa do prompt, e a mensagem
   * precisa oferecer a saída — senão o admin fica repetindo um pedido que não
   * tem como dar certo.
   */
  it('no 503, explica e oferece o cadastro à mão', () => {
    admin.generateTrainings.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 503 })),
    );
    montar();
    preencherTema();
    gerar();

    const erro = host.querySelector('.ait__error')!.textContent ?? '';

    expect(erro).toContain('à mão');
    expect(host.querySelector('.ait__list')).toBeNull();
  });
});
