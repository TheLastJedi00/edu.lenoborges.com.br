import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { WaitlistEntry } from '../models/waitlist.model';
import { WaitlistService } from './waitlist.service';

const VALID: WaitlistEntry = {
  name: 'Maria Souza',
  phone: '(47) 99999-1234',
  email: 'Maria@Exemplo.com ',
  consent: true
};

describe('WaitlistService', () => {
  let service: WaitlistService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    service = TestBed.inject(WaitlistService);
  });

  it('confirma a inscrição com um recibo identificado e datado', async () => {
    const receipt = await firstValueFrom(service.submit(VALID));

    expect(receipt.id.length).toBeGreaterThan(0);
    expect(receipt.receivedAt instanceof Date).toBeTrue();
  });

  it('normaliza o telefone para apenas dígitos e o e-mail em minúsculas', async () => {
    await firstValueFrom(service.submit(VALID));

    const [sent] = service.sent();
    expect(sent.phone).toBe('47999991234');
    expect(sent.email).toBe('maria@exemplo.com');
    expect(sent.name).toBe('Maria Souza');
  });

  it('recusa a inscrição sem consentimento, sem registrar o envio', async () => {
    await expectAsync(
      firstValueFrom(service.submit({ ...VALID, consent: false }))
    ).toBeRejectedWithError(/consentimento/i);

    expect(service.sent().length).toBe(0);
  });

  it('recusa telefone que não tenha 10 ou 11 dígitos', async () => {
    await expectAsync(
      firstValueFrom(service.submit({ ...VALID, phone: '99999' }))
    ).toBeRejectedWithError(/telefone/i);
  });

  it('recusa e-mail sem formato válido', async () => {
    await expectAsync(
      firstValueFrom(service.submit({ ...VALID, email: 'maria@' }))
    ).toBeRejectedWithError(/e-mail/i);
  });

  it('guarda cada inscrição confirmada na ordem em que foi enviada', async () => {
    await firstValueFrom(service.submit(VALID));
    await firstValueFrom(service.submit({ ...VALID, name: 'João Lima', email: 'joao@exemplo.com' }));

    expect(service.sent().map((entry) => entry.name)).toEqual(['Maria Souza', 'João Lima']);
  });
});
