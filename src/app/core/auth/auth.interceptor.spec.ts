import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MemberProfile, Session } from '../../models/auth.model';
import { authInterceptor, resetRefreshInProgress } from './auth.interceptor';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';

const MOCK_PROFILE: MemberProfile = {
  id: 'prof-1',
  email: 'leno@exemplo.com',
  name: 'Leno',
  phone: '47999991234',
  bio: 'Bio teste',
  grade: 1,
  linkedin: null,
  instagram: null,
  profileCompleted: true,
  role: null,
  tier: 'dev-tier'
};

const MOCK_SESSION: Session = {
  accessToken: 'new-token-abc',
  expiresIn: 3600,
  user: { id: 'u1', email: 'leno@exemplo.com' },
  profileCompleted: true,
  grade: 1,
  role: null,
  tier: 'dev-tier'
};

describe('authInterceptor (TDD)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let store: AuthStore;

  beforeEach(() => {
    resetRefreshInProgress();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'comunidade', children: [] }]),
        AuthStore,
        AuthService
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(AuthStore);
  });

  afterEach(() => {
    httpMock.verify();
    resetRefreshInProgress();
  });

  it('1. injeta Authorization quando há token no store para chamadas em apiUrl', async () => {
    store.accessToken.set('initial-token-123');

    const pending = firstValueFrom(http.get(`${environment.apiUrl}/me`));

    const req = httpMock.expectOne(`${environment.apiUrl}/me`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer initial-token-123');
    req.flush({ ok: true });

    await pending;
  });

  it('2. não injeta Authorization em requisição para fora de apiUrl', async () => {
    store.accessToken.set('initial-token-123');

    const pending = firstValueFrom(http.get('https://api.github.com/users/leno'));

    const req = httpMock.expectOne('https://api.github.com/users/leno');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ ok: true });

    await pending;
  });

  it('3. 401 numa rota protegida dispara refresh e refaz a requisição original com novo token', async () => {
    store.accessToken.set('expired-token');

    const pending = firstValueFrom(http.get<{ data: string }>(`${environment.apiUrl}/dashboard/data`));

    // Primeira tentativa recebe 401
    const req1 = httpMock.expectOne(`${environment.apiUrl}/dashboard/data`);
    expect(req1.request.headers.get('Authorization')).toBe('Bearer expired-token');
    req1.flush({ message: 'Token expirado' }, { status: 401, statusText: 'Unauthorized' });

    // Deve disparar POST /auth/refresh com withCredentials
    const refreshReq = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(refreshReq.request.method).toBe('POST');
    expect(refreshReq.request.withCredentials).toBeTrue();
    refreshReq.flush(MOCK_SESSION);

    // Deve refazer a requisição original com o novo token
    const retriedReq = httpMock.expectOne(`${environment.apiUrl}/dashboard/data`);
    expect(retriedReq.request.headers.get('Authorization')).toBe('Bearer new-token-abc');
    retriedReq.flush({ data: 'conteúdo protegido' });

    const response = await pending;
    expect(response.data).toBe('conteúdo protegido');
    expect(store.accessToken()).toBe('new-token-abc');
  });

  it('4. duas requisições em 401 simultâneo disparam um único refresh', async () => {
    store.accessToken.set('expired-token');

    const pending1 = firstValueFrom(http.get(`${environment.apiUrl}/resource-1`));
    const pending2 = firstValueFrom(http.get(`${environment.apiUrl}/resource-2`));

    const req1 = httpMock.expectOne(`${environment.apiUrl}/resource-1`);
    const req2 = httpMock.expectOne(`${environment.apiUrl}/resource-2`);

    // Ambos tomam 401
    req1.flush({ message: 'Token expirado' }, { status: 401, statusText: 'Unauthorized' });
    req2.flush({ message: 'Token expirado' }, { status: 401, statusText: 'Unauthorized' });

    // Apenas UM refresh deve ser chamado
    const refreshReq = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    refreshReq.flush(MOCK_SESSION);

    // Ambas as requisições originais são refeitas
    const retry1 = httpMock.expectOne(`${environment.apiUrl}/resource-1`);
    const retry2 = httpMock.expectOne(`${environment.apiUrl}/resource-2`);

    expect(retry1.request.headers.get('Authorization')).toBe('Bearer new-token-abc');
    expect(retry2.request.headers.get('Authorization')).toBe('Bearer new-token-abc');

    retry1.flush({ res: 1 });
    retry2.flush({ res: 2 });

    const [res1, res2] = await Promise.all([pending1, pending2]);
    expect(res1).toEqual({ res: 1 });
    expect(res2).toEqual({ res: 2 });
  });

  it('5. refresh falhando limpa o store e não repete a tentativa', async () => {
    store.accessToken.set('expired-token');

    const pending = firstValueFrom(http.get(`${environment.apiUrl}/me`));

    const req = httpMock.expectOne(`${environment.apiUrl}/me`);
    req.flush({ message: 'Token inválido' }, { status: 401, statusText: 'Unauthorized' });

    const refreshReq = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    refreshReq.flush({ message: 'Refresh inválido' }, { status: 401, statusText: 'Unauthorized' });

    await expectAsync(pending).toBeRejected();
    expect(store.accessToken()).toBeNull();
    expect(store.isLoggedIn()).toBeFalse();
  });

  it('6. 401 em /auth/login não dispara refresh', async () => {
    const pending = firstValueFrom(
      http.post(`${environment.apiUrl}/auth/login`, { email: 'a@b.com', password: '123' })
    );

    const loginReq = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    loginReq.flush({ message: 'Credenciais inválidas' }, { status: 401, statusText: 'Unauthorized' });

    await expectAsync(pending).toBeRejected();
    httpMock.expectNone(`${environment.apiUrl}/auth/refresh`);
  });

  it('7. login envia withCredentials, senão o navegador descarta o cookie de refresh', async () => {
    // Front e API são origens distintas. Sem credenciais na requisição, o
    // Set-Cookie HttpOnly da resposta é descartado e o primeiro F5 desloga.
    const pending = firstValueFrom(
      http.post(`${environment.apiUrl}/auth/login`, { email: 'a@b.com', password: '12345678' })
    );

    const loginReq = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(loginReq.request.withCredentials).toBeTrue();
    loginReq.flush(MOCK_SESSION);

    await pending;
  });

  it('8. logout também envia withCredentials', async () => {
    const pending = firstValueFrom(http.post(`${environment.apiUrl}/auth/logout`, {}));

    const logoutReq = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(logoutReq.request.withCredentials).toBeTrue();
    logoutReq.flush(null);

    await pending;
  });

  it('9. erro na requisição refeita não derruba a sessão', async () => {
    // O refresh funcionou: a sessão é válida. Se o retry falha por 500, o problema
    // é do servidor, e expulsar o usuário do painel por isso seria trocar um erro
    // de requisição por um logout.
    store.accessToken.set('expired-token');

    const pending = firstValueFrom(http.get(`${environment.apiUrl}/me`));

    httpMock
      .expectOne(`${environment.apiUrl}/me`)
      .flush({ message: 'Token expirado' }, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectOne(`${environment.apiUrl}/auth/refresh`).flush(MOCK_SESSION);

    httpMock
      .expectOne(`${environment.apiUrl}/me`)
      .flush({ message: 'Erro interno' }, { status: 500, statusText: 'Server Error' });

    await expectAsync(pending).toBeRejected();
    expect(store.accessToken()).toBe('new-token-abc');
    expect(store.isLoggedIn()).toBeTrue();
  });

  it('10. cancelar uma requisição não libera o refresh em andamento', async () => {
    // O refresh é compartilhado. Se o cancelamento de um assinante zera o
    // controle, um 401 seguinte dispara um segundo refresh com o token já
    // rotacionado pelo primeiro, e o backend responde 401.
    store.accessToken.set('expired-token');

    const cancelada = http.get(`${environment.apiUrl}/resource-1`).subscribe({
      error: () => undefined
    });
    const pending2 = firstValueFrom(http.get(`${environment.apiUrl}/resource-2`));

    httpMock
      .expectOne(`${environment.apiUrl}/resource-1`)
      .flush({ message: 'expirado' }, { status: 401, statusText: 'Unauthorized' });
    httpMock
      .expectOne(`${environment.apiUrl}/resource-2`)
      .flush({ message: 'expirado' }, { status: 401, statusText: 'Unauthorized' });

    // A primeira desiste enquanto o refresh ainda está em voo.
    cancelada.unsubscribe();

    const refreshReqs = httpMock.match(`${environment.apiUrl}/auth/refresh`);
    expect(refreshReqs.length).toBe(1);
    refreshReqs[0].flush(MOCK_SESSION);

    httpMock.expectOne(`${environment.apiUrl}/resource-2`).flush({ res: 2 });
    await pending2;

    httpMock.expectNone(`${environment.apiUrl}/auth/refresh`);
  });

  it('11. refresh falhando manda o usuário para /comunidade', async () => {
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    store.accessToken.set('expired-token');

    const pending = firstValueFrom(http.get(`${environment.apiUrl}/me`));

    httpMock
      .expectOne(`${environment.apiUrl}/me`)
      .flush({ message: 'expirado' }, { status: 401, statusText: 'Unauthorized' });
    httpMock
      .expectOne(`${environment.apiUrl}/auth/refresh`)
      .flush({ message: 'inválido' }, { status: 401, statusText: 'Unauthorized' });

    await expectAsync(pending).toBeRejected();
    expect(navigate).toHaveBeenCalledWith('/comunidade');
  });
});
