import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { FinanceiroPage } from './financeiro.page';
import { TierCatalog } from '../../models/billing.model';

const CATALOG: TierCatalog = {
  tiers: [
    {
      id: 'dev-tier',
      name: 'Dev Tier',
      price: 0,
      priceLabel: 'Gratuito',
      period: 'gratuito',
      summary: 'Livre para qualquer pessoa.',
      perks: ['Comunidade no WhatsApp']
    },
    {
      id: 'great-dev-tier',
      name: 'Great Dev Tier',
      price: 1999,
      priceLabel: 'R$ 19,99',
      period: 'mensal',
      summary: 'A plataforma inteira.',
      perks: ['Tudo do Dev Tier', 'Trilha completa']
    },
    {
      id: 'ultra-dev-tier',
      name: 'Ultra Dev Tier',
      price: 19999,
      priceLabel: 'R$ 199,99',
      period: 'mensal',
      summary: 'Com a Grinding Arena.',
      perks: ['Tudo do Great Dev Tier', 'Um Grinding por semana']
    },
    {
      id: 'master-dev-tier',
      name: 'Master Dev Tier',
      price: 26000,
      priceLabel: 'R$ 260,00',
      period: 'mensal',
      summary: 'Com inglês para entrevista.',
      perks: ['Tudo do Ultra Dev Tier', 'Duas aulas de inglês por mês']
    }
  ],
  currentTierId: 'dev-tier'
};

describe('FinanceiroPage', () => {
  let http: HttpTestingController;

  function setup() {
    TestBed.configureTestingModule({
      imports: [FinanceiroPage],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(FinanceiroPage);
    fixture.detectChanges();

    http.expectOne((req) => req.url.endsWith('/billing/tiers')).flush(CATALOG);
    fixture.detectChanges();

    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('renderiza os quatro tiers', () => {
    const { el } = setup();

    expect(el.querySelectorAll('app-tier-card').length).toBe(4);
  });

  /**
   * A API manda centavos; quem formata é `core/money.ts`. Este teste é o que
   * denuncia alguém passar a usar o `priceLabel` da API como fonte — os dois
   * divergiriam no dia em que um deles mudasse.
   */
  it('formata o preço em pt-BR a partir dos centavos', () => {
    const { el } = setup();

    // O Intl separa o símbolo com NBSP (U+00A0). Normalizar aqui deixa a
    // asserção legível em vez de esconder um caractere invisível na string.
    const texto = (el.textContent ?? '').replace(/ /g, ' ');

    expect(texto).toContain('R$ 260,00');
    expect(texto).toContain('R$ 19,99');
  });

  it('destaca o plano atual e não oferece upgrade para ele', () => {
    const { el } = setup();
    const atual = el.querySelector('.card--current');

    expect(atual).not.toBeNull();
    expect(atual?.textContent).toContain('Dev Tier');
    expect(atual?.querySelector('.card__cta')).toBeNull();
  });

  /**
   * Só o degrau seguinte. Mostrar o que todos os tiers acrescentam devolveria o
   * problema da landing: quatro colunas para comparar de uma vez.
   */
  it('mostra o que o próximo degrau abre, sem repetir o "Tudo do anterior"', () => {
    const { el } = setup();
    const proximo = el.querySelector('.next');

    expect(proximo?.textContent).toContain('Great Dev Tier');
    expect(proximo?.querySelector('.next__gains')?.textContent).toContain(
      'Trilha completa'
    );
    expect(proximo?.querySelector('.next__gains')?.textContent).not.toContain(
      'Tudo do Dev Tier'
    );
  });

  it('não oferece botão de assinar', () => {
    // Não existe cobrança: um botão "Assinar" prometeria um fluxo inexistente, e
    // a pessoa descobriria no clique.
    const { el } = setup();

    expect(el.textContent).not.toContain('Assinar');
    expect(el.textContent).toContain('Quero o Great Dev Tier');
  });

  it('mostra esqueleto enquanto carrega, e não spinner', () => {
    TestBed.configureTestingModule({
      imports: [FinanceiroPage],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    const fixture = TestBed.createComponent(FinanceiroPage);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.skeleton').length).toBe(4);

    TestBed.inject(HttpTestingController)
      .expectOne((req) => req.url.endsWith('/billing/tiers'))
      .flush(CATALOG);
  });
});
