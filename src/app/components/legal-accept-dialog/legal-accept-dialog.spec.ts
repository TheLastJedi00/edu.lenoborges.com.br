import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { LegalAcceptDialog } from './legal-accept-dialog';

const DOCUMENTO = {
  id: 'termos-de-uso',
  title: 'Termos de Uso',
  version: '2026-08-27',
  updatedAt: '2026-08-27',
  sections: [{ heading: '1. Aceitação', paragraphs: ['Ao criar uma conta...'] }]
};

@Component({
  imports: [LegalAcceptDialog],
  template: `
    <app-legal-accept-dialog
      #dialog
      documentId="termos-de-uso"
      [readonly]="readonly()"
      (accepted)="aceitos.push($event)"
    />
  `
})
class Host {
  readonly dialog = viewChild.required(LegalAcceptDialog);
  readonly aceitos: string[] = [];
  readonly = signal(false);
}

describe('LegalAcceptDialog', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
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

    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  async function abrir(): Promise<void> {
    host.dialog().open();
    httpMock
      .expectOne(`${environment.apiUrl}/legal/documents/termos-de-uso`)
      .flush(DOCUMENTO);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function botaoAceitar(): HTMLButtonElement | null {
    const botoes = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button')
    );
    return (botoes.find((b) => b.textContent?.includes('Aceitar')) ??
      null) as HTMLButtonElement | null;
  }

  function check(): HTMLInputElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('input[type="checkbox"]');
  }

  it('abre com o texto do documento', async () => {
    await abrir();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ao criar uma conta');
  });

  /**
   * O check está habilitado desde o primeiro instante — não depende de rolagem
   * (decisão 4). O que depende dele é o botão.
   */
  it('teste-trava: o botão de aceitar não habilita com o check desmarcado', async () => {
    await abrir();

    expect(check()?.disabled).toBeFalse();
    expect(botaoAceitar()?.disabled).toBeTrue();
  });

  /**
   * **A versão vai do documento que a pessoa acabou de ler**, e nunca de uma
   * constante do front — é o que faz o 409 de aba velha existir.
   */
  it('teste-trava: aceitar manda a versão que veio no documento', async () => {
    await abrir();

    check()!.click();
    fixture.detectChanges();
    botaoAceitar()!.click();

    const req = httpMock.expectOne(`${environment.apiUrl}/me/legal-acceptances`);
    expect(req.request.body).toEqual({
      documentId: 'termos-de-uso',
      version: '2026-08-27'
    });
    req.flush(null, { status: 204, statusText: 'No Content' });

    await fixture.whenStable();
    expect(host.aceitos).toEqual(['termos-de-uso']);
  });

  /**
   * Abrir sem `readonly` numa tela de consulta daria um check de aceite onde a
   * pessoa só queria reler o contrato.
   */
  it('teste-trava: em readonly não existe caminho para aceitar', async () => {
    host.readonly.set(true);
    fixture.detectChanges();

    await abrir();

    expect(check()).toBeNull();
    expect(botaoAceitar()).toBeNull();
  });

  it('409 recarrega o documento e desmarca o check', async () => {
    await abrir();

    check()!.click();
    fixture.detectChanges();
    botaoAceitar()!.click();

    httpMock.expectOne(`${environment.apiUrl}/me/legal-acceptances`).flush(
      { error: 'stale_version', current: '2026-12-01' },
      { status: 409, statusText: 'Conflict' }
    );
    await fixture.whenStable();
    fixture.detectChanges();

    // O texto na tela não é mais o vigente: ele é recarregado, e a pessoa não
    // continua com um "concordo" marcado sobre o documento antigo.
    httpMock
      .expectOne(`${environment.apiUrl}/legal/documents/termos-de-uso`)
      .flush({ ...DOCUMENTO, version: '2026-12-01' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(check()?.checked).toBeFalse();
    expect(host.aceitos).toEqual([]);
  });
});
