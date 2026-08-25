import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NotificationDialog } from './notification-dialog';
import { AppNotification } from '../../models/notification.model';

function notification(over: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 'video__git-github__abc',
    kind: 'video',
    title: 'Rebase sem medo',
    badgeId: 'git-github',
    createdAt: '2026-08-25T18:03:11.204Z',
    ...over
  };
}

describe('NotificationDialog', () => {
  let fixture: ComponentFixture<NotificationDialog>;

  function render(item: AppNotification | null): HTMLElement {
    fixture.componentRef.setInput('notification', item);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationDialog],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationDialog);
  });

  afterEach(() => fixture.destroy());

  it('fechado não mostra conteúdo', () => {
    const el = render(null);

    expect(el.querySelector('.modal__title')).toBeNull();
  });

  it('vídeo: uma frase com a insígnia, e o botão da trilha', () => {
    const el = render(notification({ kind: 'video' }));

    expect(el.querySelector('.modal__title')?.textContent?.trim()).toBe(
      'Rebase sem medo'
    );
    expect(el.querySelector('.modal__text')?.textContent?.trim()).toBe(
      'Vídeo novo na Insígnia do Git e GitHub.'
    );
    expect(el.querySelector('.modal__go')?.textContent?.trim()).toBe(
      'Ver na trilha'
    );
  });

  it('pergunta: a outra frase, e o botão do Mural', () => {
    const el = render(
      notification({ kind: 'pergunta', badgeId: 'logica', title: 'O que é um laço?' })
    );

    expect(el.querySelector('.modal__text')?.textContent?.trim()).toBe(
      'Pergunta nova no Mural, na Insígnia da Lógica.'
    );
    expect(el.querySelector('.modal__go')?.textContent?.trim()).toBe(
      'Ver no Mural'
    );
  });

  /**
   * Uma frase, um botão, nenhuma escolha. Um segundo botão transformaria o
   * aviso numa tela, e ninguém abre uma tela para ver um aviso.
   */
  it('tem um botão só', () => {
    const el = render(notification());

    expect(el.querySelectorAll('button').length).toBe(1);
  });

  it('o botão pede a navegação, com a notificação junto', () => {
    let asked: AppNotification | undefined;
    fixture.componentInstance.go.subscribe((item) => (asked = item));

    const el = render(notification({ id: 'a' }));
    el.querySelector<HTMLButtonElement>('.modal__go')?.click();

    expect(asked?.id).toBe('a');
  });

  it('abre e fecha seguindo o dado, sem método a lembrar de chamar', () => {
    const el = render(notification());
    const dialog = el.querySelector('dialog');
    expect(dialog?.open).toBe(true);

    render(null);
    expect(dialog?.open).toBe(false);
  });
});
