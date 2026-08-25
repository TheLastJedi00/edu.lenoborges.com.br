import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NotificationBell } from './notification-bell';

describe('NotificationBell', () => {
  let fixture: ComponentFixture<NotificationBell>;

  function render(count: number, open = false): HTMLElement {
    fixture.componentRef.setInput('count', count);
    fixture.componentRef.setInput('open', open);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationBell],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBell);
  });

  it('sem não lidas fica parado, sem contador', () => {
    const el = render(0);

    expect(el.querySelector('.bell__count')).toBeNull();
    expect(el.querySelector('.bell--calling')).toBeNull();
  });

  it('com não lidas mostra o número e chama', () => {
    const el = render(3);

    expect(el.querySelector('.bell__count')?.textContent?.trim()).toBe('3');
    expect(el.querySelector('.bell--calling')).not.toBeNull();
  });

  /**
   * Sem número, "tem alguma coisa" e "tem oito coisas" seriam o mesmo ponto, e
   * a pessoa abriria o painel só para descobrir o tamanho do trabalho.
   */
  it('corta a contagem em 9+', () => {
    const el = render(23);

    expect(el.querySelector('.bell__count')?.textContent?.trim()).toBe('9+');
  });

  /** Chamado atendido não continua chamando. */
  it('para de chamar com o painel aberto', () => {
    const el = render(3, true);

    expect(el.querySelector('.bell--calling')).toBeNull();
    expect(el.querySelector('.bell__count')).not.toBeNull();
  });

  it('anuncia a contagem por extenso para o leitor de tela', () => {
    const el = render(1);
    const button = el.querySelector('button');

    expect(button?.getAttribute('aria-label')).toBe(
      'Notificações, 1 não lida'
    );

    const many = render(4);
    expect(many.querySelector('button')?.getAttribute('aria-label')).toBe(
      'Notificações, 4 não lidas'
    );
  });

  it('declara o painel que abre, para o teclado saber onde foi parar', () => {
    const el = render(2, true);
    const button = el.querySelector('button');

    expect(button?.getAttribute('aria-expanded')).toBe('true');
    expect(button?.getAttribute('aria-controls')).toBe('painel-notificacoes');
  });

  it('emite o toque', () => {
    let toques = 0;
    fixture.componentInstance.toggle.subscribe(() => (toques += 1));

    const el = render(1);
    el.querySelector('button')?.click();

    expect(toques).toBe(1);
  });
});
