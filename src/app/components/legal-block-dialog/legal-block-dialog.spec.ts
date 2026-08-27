import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { LegalStore } from '../../core/legal/legal.store';
import { LegalBlockDialog } from './legal-block-dialog';

const TERMOS = { id: 'termos-de-uso', title: 'Termos de Uso', version: '2026-08-27' };
const PRIVACIDADE = {
  id: 'politica-de-privacidade',
  title: 'Política de Privacidade',
  version: '2026-08-27'
};

const DOCUMENTO = {
  ...TERMOS,
  updatedAt: '2026-08-27',
  sections: [{ heading: '1. Aceitação', paragraphs: ['Ao criar uma conta...'] }]
};

/** Espelha o `@if (legalStore.hasPending())` do `DashboardShell`. */
@Component({
  imports: [LegalBlockDialog],
  template: `
    @if (legalStore.hasPending()) {
      <app-legal-block-dialog />
    }
  `
})
class Host {
  readonly legalStore = TestBed.inject(LegalStore);
}

describe('LegalBlockDialog', () => {
  let fixture: ComponentFixture<Host>;
  let store: LegalStore;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    store = TestBed.inject(LegalStore);
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Host);
  });

  afterEach(() => httpMock.verify());

  function dialogo(): HTMLDialogElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('dialog.block');
  }

  it('aparece com pendência, listando o que falta', () => {
    store.setPending([TERMOS, PRIVACIDADE]);
    fixture.detectChanges();

    expect(dialogo()?.open).toBeTrue();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Termos de Uso');
    expect(texto).toContain('Política de Privacidade');
  });

  it('não aparece sem pendência', () => {
    fixture.detectChanges();

    expect(dialogo()).toBeNull();
  });

  /**
   * **Esta trava e a próxima são o componente inteiro: um bloqueio que fecha no
   * Esc não é um bloqueio.** É também a "melhoria" mais provável de alguém
   * tentar — devolver ao usuário uma forma de sair.
   */
  it('teste-trava: Esc não fecha', () => {
    store.setPending([TERMOS]);
    fixture.detectChanges();

    const evento = new Event('cancel', { cancelable: true });
    dialogo()!.dispatchEvent(evento);
    fixture.detectChanges();

    expect(evento.defaultPrevented).toBeTrue();
    expect(dialogo()?.open).toBeTrue();
  });

  it('teste-trava: não existe botão que feche sem aceitar', () => {
    store.setPending([TERMOS, PRIVACIDADE]);
    fixture.detectChanges();

    const rotulos = Array.from(
      dialogo()!.querySelectorAll('button')
    ).map((b) => b.textContent?.trim());

    expect(rotulos).toEqual(['Ler e aceitar', 'Ler e aceitar']);
  });

  it('some sozinho quando o último pendente é aceito', async () => {
    store.setPending([TERMOS]);
    fixture.detectChanges();

    dialogo()!.querySelector('button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    httpMock
      .expectOne(`${environment.apiUrl}/legal/documents/termos-de-uso`)
      .flush(DOCUMENTO);
    await fixture.whenStable();
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLInputElement>('input[type="checkbox"]')!
      .click();
    fixture.detectChanges();

    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')
    )
      .find((b) => b.textContent?.trim() === 'Aceitar')!
      .click();

    httpMock
      .expectOne(`${environment.apiUrl}/me/legal-acceptances`)
      .flush(null, { status: 204, statusText: 'No Content' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(store.hasPending()).toBeFalse();
    expect(dialogo()).toBeNull();
  });
});
