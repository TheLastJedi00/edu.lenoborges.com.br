import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AUDIENCE_DEBOUNCE_MS, AdminEmailsPage } from './emails.page';

const AUDIENCIA = `${environment.apiUrl}/admin/emails/audiencia`;
const CATALOGO = `${environment.apiUrl}/billing/tiers`;

describe('AdminEmailsPage', () => {
  let fixture: ComponentFixture<AdminEmailsPage>;
  let component: AdminEmailsPage;
  let http: HttpTestingController;

  /** Monta a tela e resolve a primeira contagem, que sai na abertura. */
  function montar(count = 42): void {
    fixture = TestBed.createComponent(AdminEmailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    http.expectOne(CATALOGO).flush({
      tiers: [
        { id: 'dev-tier', name: 'Dev Tier', price: 0, priceLabel: 'Grátis', period: 'gratuito', summary: '', perks: [] },
        { id: 'ultra-dev-tier', name: 'Ultra Dev Tier', price: 19900, priceLabel: 'R$ 199', period: 'mensal', summary: '', perks: [] }
      ]
    });

    http.expectOne(AUDIENCIA).flush({ count });
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminEmailsPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        // A espera de verdade é 400ms; aqui ela é 1ms para o teste do switchMap
        // poder existir sem `fakeAsync`, que a app zoneless não tem.
        { provide: AUDIENCE_DEBOUNCE_MS, useValue: 1 }
      ]
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Deixa o debounce disparar de verdade. */
  const esperarDebounce = () => new Promise((resolve) => setTimeout(resolve, 10));

  it('calcula a audiencia na abertura, sem filtro nenhum', () => {
    fixture = TestBed.createComponent(AdminEmailsPage);
    fixture.detectChanges();

    http.expectOne(CATALOGO).flush({ tiers: [] });

    const req = http.expectOne(AUDIENCIA);
    // Corpo vazio: a API lê ausência como TODOS os membros.
    expect(req.request.body).toEqual({});
    req.flush({ count: 118 });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Todos os membros');
    expect(fixture.nativeElement.textContent).toContain('118 membros vão receber');
  });

  it('com filtro marcado, a contagem para de dizer "Todos os membros"', async () => {
    montar();

    component['alternarTier']('ultra-dev-tier');
    await esperarDebounce();
    http.expectOne(AUDIENCIA).flush({ count: 7 });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Todos os membros');
    expect(fixture.nativeElement.textContent).toContain('7 membros vão receber');
  });

  /**
   * Resposta antiga vencendo a nova aqui significa disparar com um número errado
   * na tela — e o botão de envio repete esse número.
   */
  it('teste-trava: duas mudancas rapidas fazem UMA requisicao, e vale a ultima', async () => {
    montar();

    component['alternarTier']('dev-tier');
    // sem esperar: as duas mudanças acontecem dentro da mesma janela
    component['alternarTier']('ultra-dev-tier');
    await esperarDebounce();

    // Uma só: o debounce engoliu a primeira.
    const req = http.expectOne(AUDIENCIA);
    expect(req.request.body).toEqual({
      tiers: ['dev-tier', 'ultra-dev-tier']
    });
    req.flush({ count: 9 });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('9 membros vão receber');
  });

  it('a faixa de insignia entra nos filtros, e "sem piso" nao vira zero', async () => {
    montar();

    component['definirGrade']('max', '8');
    await esperarDebounce();

    const req = http.expectOne(AUDIENCIA);
    expect(req.request.body).toEqual({ gradeMax: 8 });
    req.flush({ count: 30 });

    component['definirGrade']('max', '');
    await esperarDebounce();

    const limpo = http.expectOne(AUDIENCIA);
    expect(limpo.request.body).toEqual({});
    limpo.flush({ count: 42 });
  });

  /**
   * É diferente da spec 012, onde a falha do acessório não podia bloquear nada:
   * lá o pior caso era não ver um aviso; aqui é disparar às cegas para uma
   * audiência que ninguém confirmou.
   */
  it('teste-trava: falha na audiencia poe um traco e marca o bloqueio', async () => {
    montar();

    component['alternarTier']('dev-tier');
    await esperarDebounce();
    http.expectOne(AUDIENCIA).error(new ProgressEvent('erro'));
    fixture.detectChanges();

    expect(component['audienceFalhou']()).toBeTrue();
    expect(component['audienceCount']()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('envio fica bloqueado');
  });

  it('a contagem volta quando uma resposta valida chega depois da falha', async () => {
    montar();

    component['alternarTier']('dev-tier');
    await esperarDebounce();
    http.expectOne(AUDIENCIA).error(new ProgressEvent('erro'));

    component['alternarTier']('dev-tier');
    await esperarDebounce();
    http.expectOne(AUDIENCIA).flush({ count: 42 });
    fixture.detectChanges();

    expect(component['audienceFalhou']()).toBeFalse();
    expect(component['audienceCount']()).toBe(42);
  });

  describe('o bloco Escrever', () => {
    it('o corpo e um textarea, e nao existe campo de HTML', () => {
      montar();

      expect(
        fixture.nativeElement.querySelector('textarea[formControlName="body"]')
      ).not.toBeNull();
      expect(fixture.nativeElement.querySelector('[contenteditable]')).toBeNull();
    });

    it('o botao opcional exige os dois campos juntos', () => {
      montar();

      component['form'].controls.ctaLabel.setValue('Ver na trilha');
      fixture.detectChanges();
      expect(component['ctaIncompleto']()).toBeTrue();

      component['form'].controls.ctaUrl.setValue('https://exemplo.com/x');
      fixture.detectChanges();
      expect(component['ctaIncompleto']()).toBeFalse();
    });

    it('nao existe campo de status de pagamento na tela', () => {
      // Não há pagamento no produto: inventar o filtro criaria um segundo dono
      // da verdade de acesso ao lado do tier.
      montar();

      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto.toLowerCase()).not.toContain('pagamento');
      expect(texto.toLowerCase()).not.toContain('inadimplente');
    });
  });

  describe('a prévia', () => {
    it('cada linha em branco vira um paragrafo', () => {
      montar();

      component['form'].controls.body.setValue('Primeiro.\n\nSegundo.\n\nTerceiro.');
      fixture.detectChanges();

      expect(component['paragrafos']()).toEqual(['Primeiro.', 'Segundo.', 'Terceiro.']);
    });

    it('a tela diz que a previa e aproximacao', () => {
      montar();

      expect(fixture.nativeElement.textContent).toContain('aproximação');
    });
  });
});
