import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AUDIENCE_DEBOUNCE_MS, AdminEmailsPage } from './emails.page';

const ENVIAR = `${environment.apiUrl}/admin/emails`;
const HISTORICO = ENVIAR;
const AUDIENCIA = `${ENVIAR}/audiencia`;
const TESTE = `${ENVIAR}/teste`;
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

    // O histórico sai no `ngOnInit`, antes do catálogo.
    http.expectOne({ url: HISTORICO, method: 'GET' }).flush([]);

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

    http.expectOne({ url: HISTORICO, method: 'GET' }).flush([]);
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

  describe('conferir e enviar', () => {
    const conteudo = {
      subject: 'Um aviso',
      body: 'Corpo com mais de dez caracteres.',
      ctaLabel: '',
      ctaUrl: ''
    };

    function escrever(): void {
      component['form'].setValue(conteudo);
      fixture.detectChanges();
    }

    async function mandarTeste(): Promise<void> {
      escrever();
      const pendente = component.enviarTeste();
      http.expectOne(TESTE).flush(null, { status: 204, statusText: 'No Content' });
      await pendente;
      fixture.detectChanges();
    }

    it('o teste chama a rota de teste com o conteudo atual', async () => {
      montar();
      escrever();

      const pendente = component.enviarTeste();
      const req = http.expectOne(TESTE);
      expect(req.request.body).toEqual(
        jasmine.objectContaining({ subject: 'Um aviso' })
      );
      req.flush(null, { status: 204, statusText: 'No Content' });
      await pendente;
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Teste enviado');
    });

    /**
     * Testar uma versão e enviar outra é o mesmo que não ter testado. Guardar a
     * assinatura do conteúdo, e não um booleano, é o que faz a invalidação
     * acontecer sozinha.
     */
    it('teste-trava: editar depois de testar trava o envio de novo', async () => {
      montar();
      await mandarTeste();

      expect(component['precisaTestar']()).toBeFalse();

      component['form'].controls.body.setValue('Outro corpo, bem diferente.');
      fixture.detectChanges();

      expect(component['precisaTestar']()).toBeTrue();
      expect(component['podeEnviar']()).toBeFalse();
    });

    it('teste-trava: trocar de tier NAO trava o envio -- o conteudo e o mesmo', async () => {
      montar();
      await mandarTeste();

      component['alternarTier']('dev-tier');
      await esperarDebounce();
      http.expectOne(AUDIENCIA).flush({ count: 12 });
      fixture.detectChanges();

      expect(component['precisaTestar']()).toBeFalse();
      expect(component['podeEnviar']()).toBeTrue();
    });

    it('o botao diz o numero, e vem da mesma fonte da contagem', async () => {
      montar(42);
      await mandarTeste();

      expect(component['rotuloDoEnvio']()).toBe('Enviar para 42 pessoas');

      component['alternarTier']('dev-tier');
      await esperarDebounce();
      http.expectOne(AUDIENCIA).flush({ count: 1 });
      fixture.detectChanges();

      // Singular, porque "1 pessoas" é o detalhe que denuncia um número montado
      // à mão em vez de derivado.
      expect(component['rotuloDoEnvio']()).toBe('Enviar para 1 pessoa');
    });

    it('audiencia zero nao deixa enviar', async () => {
      montar(0);
      await mandarTeste();

      expect(component['podeEnviar']()).toBeFalse();
    });

    it('o disparo chama a rota, recarrega o historico e limpa o formulario', async () => {
      montar();
      await mandarTeste();

      const pendente = component.enviar();
      http.expectOne({ url: ENVIAR, method: 'POST' }).flush({
        id: 'camp-1',
        status: 'concluida',
        audienceCount: 42,
        sentCount: 42,
        failedCount: 0
      });
      await pendente;
      http.expectOne({ url: HISTORICO, method: 'GET' }).flush([]);
      fixture.detectChanges();

      expect(component['form'].controls.subject.value).toBe('');
      expect(component['precisaTestar']()).toBeTrue();
    });

    /**
     * "Tente de novo" aqui faz o admin reenviar para quem já recebeu, e essa é a
     * pior consequência possível desta tela.
     */
    it('teste-trava: falha de rede NAO diz "nao foi enviado"', async () => {
      montar();
      await mandarTeste();

      const pendente = component.enviar();
      http.expectOne({ url: ENVIAR, method: 'POST' }).error(new ProgressEvent('offline'));
      await pendente;
      http.expectOne({ url: HISTORICO, method: 'GET' }).flush([]);
      fixture.detectChanges();

      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('O envio começou e pode ter sido interrompido');
      expect(texto).toContain('Não mande de novo');
      expect(texto).not.toContain('Tente de novo');
    });

    it('409 diz que ja existe um disparo em andamento, e nao vira o aviso de interrompido', async () => {
      montar();
      await mandarTeste();

      const pendente = component.enviar();
      http
        .expectOne({ url: ENVIAR, method: 'POST' })
        .flush({ message: 'x' }, { status: 409, statusText: 'Conflict' });
      await pendente;
      http.expectOne({ url: HISTORICO, method: 'GET' }).flush([]);
      fixture.detectChanges();

      expect(component['talvezInterrompido']()).toBeFalse();
      expect(fixture.nativeElement.textContent).toContain('disparo em andamento');
    });
  });

  describe('enviados', () => {
    function comHistorico(campanhas: unknown[]): void {
      fixture = TestBed.createComponent(AdminEmailsPage);
      component = fixture.componentInstance;
      fixture.detectChanges();

      http.expectOne({ url: HISTORICO, method: 'GET' }).flush(campanhas);
      http.expectOne(CATALOGO).flush({ tiers: [] });
      http.expectOne(AUDIENCIA).flush({ count: 42 });
      fixture.detectChanges();
    }

    const interrompida = {
      id: 'camp-1',
      kind: 'manual',
      subject: 'Um aviso',
      status: 'interrompida',
      audienceCount: 250,
      sentCount: 200,
      failedCount: 50,
      createdAt: new Date().toISOString(),
      finishedAt: null,
      error: 'rate limit'
    };

    it('sem campanha nenhuma, o estado vazio aparece', () => {
      comHistorico([]);

      expect(fixture.nativeElement.textContent).toContain(
        'Nenhum e-mail enviado ainda'
      );
    });

    it('a linha mostra assunto, quantos receberam e o estado', () => {
      comHistorico([{ ...interrompida, status: 'concluida', sentCount: 250 }]);

      const linha = fixture.nativeElement.querySelector('.enviado') as HTMLElement;
      expect(linha.textContent).toContain('Um aviso');
      expect(linha.textContent).toContain('250 de 250 pessoas');
      expect(linha.textContent).toContain('Concluído');
    });

    it('nenhuma linha do historico e clicavel', () => {
      // Não existe tela de detalhe: quem quer ver o que foi enviado tem a
      // própria caixa de entrada.
      comHistorico([{ ...interrompida, status: 'concluida' }]);

      const linha = fixture.nativeElement.querySelector('.enviado') as HTMLElement;
      expect(linha.querySelector('a')).toBeNull();
      expect(linha.tagName).toBe('LI');
    });

    it('campanha interrompida ganha Retomar, e retomar recarrega a lista', async () => {
      comHistorico([interrompida]);

      expect(fixture.nativeElement.textContent).toContain('Interrompido');

      const pendente = component.retomar('camp-1');
      http.expectOne(`${ENVIAR}/camp-1/retomar`).flush({
        id: 'camp-1',
        status: 'concluida',
        audienceCount: 250,
        sentCount: 250,
        failedCount: 0
      });
      await pendente;
      http.expectOne({ url: HISTORICO, method: 'GET' }).flush([
        { ...interrompida, status: 'concluida', sentCount: 250 }
      ]);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Concluído');
    });

    it('campanha concluida nao ganha Retomar', () => {
      comHistorico([{ ...interrompida, status: 'concluida' }]);

      expect(fixture.nativeElement.textContent).not.toContain('Retomar');
    });
  });
});
