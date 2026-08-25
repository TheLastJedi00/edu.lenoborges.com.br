import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let httpMock: HttpTestingController;

  const base = `${environment.apiUrl}/admin/emails`;

  const conteudo = {
    subject: 'Assunto',
    body: 'Corpo com mais de dez caracteres.'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(EmailService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('audiencia posta os filtros e devolve so a contagem', async () => {
    const pending = firstValueFrom(
      service.audiencia({ tiers: ['ultra-dev-tier'], gradeMin: 3 })
    );

    const req = httpMock.expectOne(`${base}/audiencia`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ tiers: ['ultra-dev-tier'], gradeMin: 3 });
    req.flush({ count: 42 });

    await expectAsync(pending).toBeResolvedTo({ count: 42 });
  });

  it('filtro vazio vai como corpo vazio, que a API le como todos os membros', async () => {
    const pending = firstValueFrom(service.audiencia({}));

    const req = httpMock.expectOne(`${base}/audiencia`);
    expect(req.request.body).toEqual({});
    req.flush({ count: 118 });

    await pending;
  });

  it('enviarTeste bate na rota de teste, e nao na de disparo', async () => {
    const pending = firstValueFrom(service.enviarTeste(conteudo));

    const req = httpMock.expectOne(`${base}/teste`);
    expect(req.request.method).toBe('POST');
    req.flush(null, { status: 204, statusText: 'No Content' });

    await pending;
  });

  it('enviar posta na raiz e devolve o resultado do disparo', async () => {
    const pending = firstValueFrom(service.enviar(conteudo));

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 'camp-1',
      status: 'concluida',
      audienceCount: 42,
      sentCount: 42,
      failedCount: 0
    });

    await expectAsync(pending).toBeResolvedTo(
      jasmine.objectContaining({ status: 'concluida', sentCount: 42 })
    );
  });

  it('retomar chama a rota da campanha, com corpo vazio', async () => {
    const pending = firstValueFrom(service.retomar('camp-1'));

    const req = httpMock.expectOne(`${base}/camp-1/retomar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({
      id: 'camp-1',
      status: 'concluida',
      audienceCount: 250,
      sentCount: 250,
      failedCount: 0
    });

    await pending;
  });

  it('listar busca o historico', async () => {
    const pending = firstValueFrom(service.listar());

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush([]);

    await expectAsync(pending).toBeResolvedTo([]);
  });

  describe('descadastro', () => {
    /**
     * É chamada pública, feita por quem pode não ter sessão nenhuma: a pessoa
     * está lendo o e-mail num navegador onde nunca entrou.
     */
    it('nao manda Authorization, e o token vai na query', async () => {
      const pending = firstValueFrom(service.descadastrar('abc.def'));

      const req = httpMock.expectOne(
        `${environment.apiUrl}/emails/descadastro?token=abc.def`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush(null, { status: 204, statusText: 'No Content' });

      await pending;
    });

    it('escapa o token na URL, para assinatura com caractere especial nao quebrar', async () => {
      const pending = firstValueFrom(service.descadastrar('a+b/c=d'));

      const req = httpMock.expectOne(
        `${environment.apiUrl}/emails/descadastro?token=a%2Bb%2Fc%3Dd`
      );
      expect(req.request.url).toContain('%2B');
      req.flush(null, { status: 204, statusText: 'No Content' });

      await pending;
    });
  });
});
