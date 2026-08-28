import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LegalService } from './legal.service';

describe('LegalService', () => {
  let service: LegalService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(LegalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list() busca a listagem pública', async () => {
    const promise = firstValueFrom(service.list());

    const req = httpMock.expectOne(`${environment.apiUrl}/legal/documents`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'termos-de-uso', title: 'Termos de Uso', version: '2026-08-27' }]);

    expect((await promise).length).toBe(1);
  });

  it('getById() busca o documento pelo id', async () => {
    const promise = firstValueFrom(service.getById('termos-de-uso'));

    const req = httpMock.expectOne(`${environment.apiUrl}/legal/documents/termos-de-uso`);
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 'termos-de-uso',
      title: 'Termos de Uso',
      version: '2026-08-27',
      updatedAt: '2026-08-27',
      sections: []
    });

    expect((await promise).title).toBe('Termos de Uso');
  });

  /**
   * **Teste-trava: a versão vai no corpo.**
   *
   * Sem ela o backend adivinharia a versão vigente e o `409` de aba velha nunca
   * aconteceria — quem está com a aba aberta desde antes do deploy registraria
   * concordância com um texto que ninguém mais vê.
   */
  it('teste-trava: accept() manda documentId E version', async () => {
    const promise = firstValueFrom(service.accept('termos-de-uso', '2026-08-27'));

    const req = httpMock.expectOne(`${environment.apiUrl}/me/legal-acceptances`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      documentId: 'termos-de-uso',
      version: '2026-08-27'
    });
    req.flush(null, { status: 204, statusText: 'No Content' });

    await promise;
  });
});
