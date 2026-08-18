import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { BillingService } from './billing.service';
import { TierCatalog } from '../models/billing.model';

const CATALOG: TierCatalog = {
  tiers: [
    {
      id: 'dev-tier',
      name: 'Dev Tier',
      price: 0,
      priceLabel: 'Gratuito',
      period: 'gratuito',
      summary: 'Livre.',
      perks: []
    },
    {
      id: 'master-dev-tier',
      name: 'Master Dev Tier',
      price: 26000,
      priceLabel: 'R$ 260,00',
      period: 'mensal',
      summary: 'Com inglês.',
      perks: ['Tudo do Ultra Dev Tier']
    }
  ],
  currentTierId: 'dev-tier'
};

describe('BillingService', () => {
  let service: BillingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(BillingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('busca o catálogo na rota autenticada', () => {
    let received: TierCatalog | undefined;
    service.getCatalog().subscribe((catalog) => (received = catalog));

    const request = http.expectOne((req) => req.url.endsWith('/billing/tiers'));
    expect(request.request.method).toBe('GET');
    request.flush(CATALOG);

    expect(received?.tiers.length).toBe(2);
    expect(received?.currentTierId).toBe('dev-tier');
  });

  it('serve o preço em centavos, sem converter', () => {
    // A conversão é da tela, por core/money.ts. Se o service dividisse por 100
    // aqui, existiriam dois lugares sabendo a unidade — e eles divergiriam.
    let received: TierCatalog | undefined;
    service.getCatalog().subscribe((catalog) => (received = catalog));
    http.expectOne((req) => req.url.endsWith('/billing/tiers')).flush(CATALOG);

    expect(received?.tiers[1].price).toBe(26000);
  });

  /**
   * A tabela não muda dentro de uma sessão, e o Financeiro é uma aba que a
   * pessoa entra e sai. Sem o cache, cada entrada refaz a requisição e a tela
   * pisca o esqueleto de novo por um dado que já estava em memória.
   */
  it('não repete a requisição entre visitas à aba', () => {
    service.getCatalog().subscribe();
    http.expectOne((req) => req.url.endsWith('/billing/tiers')).flush(CATALOG);

    let segunda: TierCatalog | undefined;
    service.getCatalog().subscribe((catalog) => (segunda = catalog));

    // Nenhuma requisição nova: o http.verify() do afterEach reprova se houver.
    expect(segunda?.currentTierId).toBe('dev-tier');
  });
});
