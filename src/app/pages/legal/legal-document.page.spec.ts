import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LegalDocumentPage } from './legal-document.page';

const DOCUMENTO = {
  id: 'termos-de-uso',
  title: 'Termos de Uso',
  version: '2026-08-27',
  updatedAt: '2026-08-27',
  sections: [
    {
      heading: '4. Assinatura, pagamento e ausência de reembolso',
      paragraphs: ['Não há reembolso. Nem parcial, nem proporcional.']
    }
  ]
};

describe('LegalDocumentPage', () => {
  let fixture: ComponentFixture<LegalDocumentPage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalDocumentPage],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { data: of({ documentId: 'termos-de-uso' }) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LegalDocumentPage);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  /**
   * **É toda a razão de a página existir**, e é o que um `authGuard` colado por
   * hábito quebraria sem que mais nada falhasse: a tela carregaria em
   * desenvolvimento, onde sempre há sessão, e só o visitante da landing veria o
   * redirecionamento.
   */
  it('teste-trava: carrega o documento sem sessão nenhuma', async () => {
    fixture.detectChanges();

    const req = httpMock.expectOne(`${environment.apiUrl}/legal/documents/termos-de-uso`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush(DOCUMENTO);

    await fixture.whenStable();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Não há reembolso');
    expect(texto).toContain('27/08/2026');
  });

  it('falha de rede mostra recado, e não tela em branco', async () => {
    fixture.detectChanges();

    httpMock
      .expectOne(`${environment.apiUrl}/legal/documents/termos-de-uso`)
      .flush('erro', { status: 500, statusText: 'Server Error' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Não foi possível carregar'
    );
  });
});
