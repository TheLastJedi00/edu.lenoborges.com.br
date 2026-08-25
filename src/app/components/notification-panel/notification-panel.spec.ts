import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NotificationPanel } from './notification-panel';
import { AppNotification } from '../../models/notification.model';

function notification(over: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 'video__git-github__abc',
    kind: 'video',
    title: 'Rebase sem medo',
    badgeId: 'git-github',
    createdAt: new Date().toISOString(),
    ...over
  };
}

describe('NotificationPanel', () => {
  let fixture: ComponentFixture<NotificationPanel>;

  function render(
    open: boolean,
    notifications: readonly AppNotification[] = []
  ): HTMLElement {
    fixture.componentRef.setInput('open', open);
    fixture.componentRef.setInput('notifications', notifications);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationPanel],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationPanel);
  });

  it('fechado não renderiza nada', () => {
    const el = render(false, [notification()]);

    expect(el.querySelector('.panel')).toBeNull();
  });

  it('renderiza a lista na ordem que veio', () => {
    const el = render(true, [
      notification({ id: 'a', title: 'Primeira' }),
      notification({ id: 'b', title: 'Segunda' })
    ]);

    const titles = Array.from(el.querySelectorAll('.row__title')).map((node) =>
      node.textContent?.trim()
    );

    expect(titles).toEqual(['Primeira', 'Segunda']);
  });

  /**
   * O corte é do CSS. Cortar em código dá reticências no lugar errado em cada
   * largura de tela, e a mesma linha some inteira num aparelho estreito.
   */
  it('entrega o título inteiro ao DOM, sem cortar em código', () => {
    const longo =
      'Como configurar o Git no Windows sem quebrar as permissões do SSH e ainda manter o commit assinado';
    const el = render(true, [notification({ title: longo })]);

    expect(el.querySelector('.row__title')?.textContent?.trim()).toBe(longo);
  });

  it('resolve o nome da insígnia a partir do badgeId', () => {
    const el = render(true, [notification({ badgeId: 'git-github' })]);

    expect(el.querySelector('.row__badge')?.textContent?.trim()).toBe(
      'Insígnia do Git e GitHub'
    );
  });

  it('vazio explica em vez de abrir em branco', () => {
    const el = render(true, []);

    expect(el.querySelector('.panel')).not.toBeNull();
    expect(el.textContent).toContain('Nada novo por aqui');
    expect(el.querySelector('.panel__foot')).toBeNull();
  });

  it('tocar a linha pede para abrir aquela notificação', () => {
    let selected: AppNotification | undefined;
    fixture.componentInstance.select.subscribe((item) => (selected = item));

    const el = render(true, [notification({ id: 'a' })]);
    el.querySelector<HTMLButtonElement>('.row__open')?.click();

    expect(selected?.id).toBe('a');
  });

  /**
   * **O teste-trava do check.** Ele marca e só: quem já sabe o que é e não quer
   * ir não pode ser obrigado a abrir o modal para conseguir descartar.
   */
  it('tocar o check marca só aquela, sem abrir o modal', () => {
    let marked: string | undefined;
    let selected = false;
    fixture.componentInstance.markRead.subscribe((id) => (marked = id));
    fixture.componentInstance.select.subscribe(() => (selected = true));

    const el = render(true, [notification({ id: 'a' })]);
    el.querySelector<HTMLButtonElement>('.row__check')?.click();

    expect(marked).toBe('a');
    expect(selected).toBe(false);
  });

  /** Botão dentro de botão é HTML inválido, e o navegador resolve do jeito dele. */
  it('o check é irmão da linha, não filho dela', () => {
    const el = render(true, [notification()]);

    expect(el.querySelector('.row__open .row__check')).toBeNull();
    expect(el.querySelector('.row > .row__check')).not.toBeNull();
  });

  it('o check se anuncia com o que ele faz', () => {
    const el = render(true, [notification({ title: 'Rebase sem medo' })]);

    expect(
      el.querySelector('.row__check')?.getAttribute('aria-label')
    ).toBe('Marcar como lida: Rebase sem medo');
  });

  it('marcar todas aparece só quando há algo', () => {
    let all = 0;
    fixture.componentInstance.markAllRead.subscribe(() => (all += 1));

    const el = render(true, [notification()]);
    el.querySelector<HTMLButtonElement>('.panel__all')?.click();

    expect(all).toBe(1);
  });

  it('fecha ao tocar fora', () => {
    let closed = 0;
    fixture.componentInstance.close.subscribe(() => (closed += 1));

    const el = render(true, [notification()]);
    el.querySelector<HTMLElement>('.backdrop')?.click();

    expect(closed).toBe(1);
  });

  it('fecha no Esc', () => {
    let closed = 0;
    fixture.componentInstance.close.subscribe(() => (closed += 1));

    render(true, [notification()]);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(closed).toBe(1);
  });
});
