import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MemberProfile, Session } from '../../models/auth.model';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';

const MOCK_PROFILE: MemberProfile = {
  id: 'prof-123',
  email: 'leno@exemplo.com',
  name: 'Leno Borges',
  phone: '47999991234',
  bio: 'Desenvolvedor e mentor de programação.',
  grade: 1,
  profileCompleted: true,
  role: null
};

const MOCK_SESSION: Session = {
  accessToken: 'jwt-access-token-123',
  expiresIn: 3600,
  user: {
    id: 'user-123',
    email: 'leno@exemplo.com'
  },
  profileCompleted: true,
  grade: 1,
  role: null
};

describe('AuthService (TDD)', () => {
  let service: AuthService;
  let store: AuthStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthStore,
        AuthService
      ]
    });

    service = TestBed.inject(AuthService);
    store = TestBed.inject(AuthStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('1. signup posta email e emailConfirmation normalizados em minúsculas e sem espaços', async () => {
    const pending = firstValueFrom(
      service.signup({
        email: '  Maria@Exemplo.COM  ',
        emailConfirmation: 'maria@exemplo.com '
      })
    );

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/signup`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'maria@exemplo.com',
      emailConfirmation: 'maria@exemplo.com'
    });
    req.flush(null, { status: 202, statusText: 'Accepted' });

    await pending;
  });

  it('2. signup com confirmação divergente falha sem chamar a rede', async () => {
    await expectAsync(
      firstValueFrom(
        service.signup({
          email: 'maria@exemplo.com',
          emailConfirmation: 'joao@exemplo.com'
        })
      )
    ).toBeRejectedWithError(/iguais|confirmação/i);

    httpMock.expectNone(`${environment.apiUrl}/auth/signup`);
  });

  it('3. login posta credenciais, guarda o token no store e devolve a sessão', async () => {
    const pending = firstValueFrom(
      service.login({
        email: '  Leno@Exemplo.COM ',
        password: 'password123'
      })
    );

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'leno@exemplo.com',
      password: 'password123'
    });
    req.flush(MOCK_SESSION);

    const session = await pending;
    expect(session.accessToken).toBe('jwt-access-token-123');
    expect(store.accessToken()).toBe('jwt-access-token-123');
    expect(store.isLoggedIn()).toBeTrue();
    expect(store.user()?.email).toBe('leno@exemplo.com');
  });

  it('4. login 401 propaga o erro e não guarda token no store', async () => {
    const pending = firstValueFrom(
      service.login({
        email: 'leno@exemplo.com',
        password: 'wrong-password'
      })
    );

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ message: 'E-mail ou senha inválidos.' }, { status: 401, statusText: 'Unauthorized' });

    await expectAsync(pending).toBeRejected();
    expect(store.accessToken()).toBeNull();
    expect(store.isLoggedIn()).toBeFalse();
  });

  it('5. nao expoe setPassword: a senha e definida fora da aplicacao', () => {
    // A ausência é o comportamento, então ela é testada. Desde a spec 007 o link
    // do e-mail abre a tela hospedada pelo Firebase, e o `oobCode` não chega no
    // front nem na API. Se alguém reintroduzir isto sem reabrir a decisão 3
    // daquela spec, este teste avisa.
    expect((service as unknown as Record<string, unknown>)['setPassword']).toBeUndefined();
  });

  it('6. refresh atualiza o token e a sessão no store', async () => {
    const pending = firstValueFrom(service.refresh());

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(req.request.method).toBe('POST');
    req.flush(MOCK_SESSION);

    const session = await pending;
    expect(session.accessToken).toBe(MOCK_SESSION.accessToken);
    expect(store.accessToken()).toBe(MOCK_SESSION.accessToken);
    expect(store.status()).toBe('authenticated');
  });

  it('7. logout limpa o store mesmo quando a requisição falha', async () => {
    store.setSession(MOCK_SESSION);
    expect(store.isLoggedIn()).toBeTrue();

    const pending = firstValueFrom(service.logout());

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Erro de rede ou servidor' }, { status: 500, statusText: 'Server Error' });

    await pending; // Mesmo com erro do backend, o logout do front resolve ou encerra com store limpo
    expect(store.accessToken()).toBeNull();
    expect(store.isLoggedIn()).toBeFalse();
    expect(store.status()).toBe('anonymous');
  });

  it('8. updateProfile posta os campos normalizados e atualiza profile no store', async () => {
    store.setSession(MOCK_SESSION);

    const updatedProfile: MemberProfile = {
      ...MOCK_PROFILE,
      name: 'Maria Silva',
      phone: '11988887777',
      bio: 'Desenvolvedora Full-Stack apaixonada por código limpo.'
    };

    const pending = firstValueFrom(
      service.updateProfile({
        name: '  Maria   Silva  ',
        phone: '(11) 98888-7777',
        bio: '  Desenvolvedora Full-Stack apaixonada por código limpo.  '
      })
    );

    const req = httpMock.expectOne(`${environment.apiUrl}/me/profile`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      name: 'Maria Silva',
      phone: '11988887777',
      bio: 'Desenvolvedora Full-Stack apaixonada por código limpo.'
    });
    req.flush(updatedProfile);

    const result = await pending;
    expect(result.name).toBe('Maria Silva');
    expect(store.profile()?.name).toBe('Maria Silva');
  });

  describe('contrato da API', () => {
    // Estes testes usam o corpo literal que o backend responde, copiado do
    // context.md da spec 005. Os outros usam constantes do próprio front, e foi
    // por isso que a divergência de formato passou por 118 testes verdes e só
    // apareceu no teste manual: o front tipava um `profile` aninhado que a API
    // nunca mandou, e o F5 dentro do painel devolvia o usuário ao onboarding.

    it('9. refresh sozinho já responde profileCompleted, sem depender de GET /me', async () => {
      const pending = firstValueFrom(service.refresh());

      httpMock.expectOne(`${environment.apiUrl}/auth/refresh`).flush({
        accessToken: 'token-novo',
        expiresIn: 3600,
        user: { id: 'user-123', email: 'leno@exemplo.com' },
        profileCompleted: true,
        grade: 7,
        role: null
      });

      await pending;

      expect(store.profileCompleted()).toBeTrue();
      expect(store.grade()).toBe(7);
      expect(store.accessToken()).toBe('token-novo');
      // O perfil completo não vem na sessão, e não pode ser inventado.
      expect(store.profile()).toBeNull();
    });

    it('10. login com perfil incompleto responde profileCompleted falso', async () => {
      const pending = firstValueFrom(
        service.login({ email: 'novo@exemplo.com', password: 'senha-12345' })
      );

      httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({
        accessToken: 'token-abc',
        expiresIn: 3600,
        user: { id: 'user-novo', email: 'novo@exemplo.com' },
        profileCompleted: false,
        grade: 1,
        role: null
      });

      await pending;

      expect(store.profileCompleted()).toBeFalse();
    });

    it('11. GET /me devolve o perfil achatado e alimenta o store', async () => {
      const pending = firstValueFrom(service.getMe());

      httpMock.expectOne(`${environment.apiUrl}/me`).flush({
        id: 'user-123',
        email: 'leno@exemplo.com',
        name: 'Leno Borges',
        phone: '47999991234',
        bio: 'Bio de teste com mais de dez caracteres.',
        grade: 7,
        profileCompleted: true,
        role: null
      });

      const profile = await pending;

      expect(profile.name).toBe('Leno Borges');
      expect(store.profile()?.name).toBe('Leno Borges');
    });

    it('12. perfil ainda vazio chega com name, phone e bio nulos', async () => {
      const pending = firstValueFrom(service.getMe());

      httpMock.expectOne(`${environment.apiUrl}/me`).flush({
        id: 'user-123',
        email: 'novo@exemplo.com',
        name: null,
        phone: null,
        bio: null,
        grade: 1,
        profileCompleted: false
      });

      const profile = await pending;

      expect(profile.name).toBeNull();
      expect(store.profileCompleted()).toBeFalse();
    });
  });
});
