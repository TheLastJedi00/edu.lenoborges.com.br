import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { WaitlistEntry } from '../models/waitlist.model';
import { WaitlistService } from './waitlist.service';

const VALID: WaitlistEntry = {
  name: 'Maria Souza',
  phone: '(47) 99999-1234',
  email: 'Maria@Exemplo.com ',
  consent: true
};

const URL = `${environment.apiUrl}/waitlist`;

/** Resposta do backend: receivedAt trafega como string ISO, nunca como Date. */
const RECEIPT_RESPONSE = {
  id: '9f1c0a3e-6d2b-4a55-9c1e-77b0c2a41f31',
  receivedAt: '2026-08-13T18:20:31.412Z'
};

describe('WaitlistService', () => {
  let service: WaitlistService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(WaitlistService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('confirma a inscrição com um recibo identificado e datado', async () => {
    const pending = firstValueFrom(service.submit(VALID));

    const request = httpMock.expectOne(URL);
    expect(request.request.method).toBe('POST');
    request.flush(RECEIPT_RESPONSE);

    const receipt = await pending;
    expect(receipt.id).toBe(RECEIPT_RESPONSE.id);
    expect(receipt.receivedAt instanceof Date).toBeTrue();
  });

  it('envia o corpo já normalizado, com telefone só de dígitos e e-mail em minúsculas', async () => {
    const pending = firstValueFrom(service.submit(VALID));

    const request = httpMock.expectOne(URL);
    expect(request.request.body).toEqual({
      name: 'Maria Souza',
      phone: '47999991234',
      email: 'maria@exemplo.com',
      consent: true
    });

    request.flush(RECEIPT_RESPONSE);
    await pending;
  });

  it('converte o receivedAt da resposta em Date com o mesmo instante', async () => {
    const pending = firstValueFrom(service.submit(VALID));

    httpMock.expectOne(URL).flush(RECEIPT_RESPONSE);

    const receipt = await pending;
    expect(receipt.receivedAt.toISOString()).toBe(RECEIPT_RESPONSE.receivedAt);
  });

  it('recusa a inscrição sem consentimento, sem gastar requisição', async () => {
    await expectAsync(
      firstValueFrom(service.submit({ ...VALID, consent: false }))
    ).toBeRejectedWithError(/consentimento/i);

    httpMock.expectNone(URL);
  });

  it('recusa telefone que não tenha 10 ou 11 dígitos, sem gastar requisição', async () => {
    await expectAsync(
      firstValueFrom(service.submit({ ...VALID, phone: '99999' }))
    ).toBeRejectedWithError(/telefone/i);

    httpMock.expectNone(URL);
  });

  it('recusa e-mail sem formato válido, sem gastar requisição', async () => {
    await expectAsync(
      firstValueFrom(service.submit({ ...VALID, email: 'maria@' }))
    ).toBeRejectedWithError(/e-mail/i);

    httpMock.expectNone(URL);
  });

  it('propaga o 429 com o status preservado para a página escolher a mensagem', async () => {
    const pending = firstValueFrom(service.submit(VALID));

    httpMock
      .expectOne(URL)
      .flush({ message: 'Too Many Requests' }, { status: 429, statusText: 'Too Many Requests' });

    await expectAsync(pending).toBeRejected();
    await pending.catch((error: unknown) => {
      expect(error instanceof HttpErrorResponse).toBeTrue();
      expect((error as HttpErrorResponse).status).toBe(429);
    });
  });

  it('propaga o 500 com o status preservado', async () => {
    const pending = firstValueFrom(service.submit(VALID));

    httpMock
      .expectOne(URL)
      .flush({ message: 'Erro interno' }, { status: 500, statusText: 'Internal Server Error' });

    await expectAsync(pending).toBeRejected();
    await pending.catch((error: unknown) => {
      expect((error as HttpErrorResponse).status).toBe(500);
    });
  });
});
