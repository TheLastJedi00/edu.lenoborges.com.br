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
  name: 'Leno Borges',
  phone: '47999991234',
  bio: 'Desenvolvedor e mentor de programação.',
  grade: 1,
  profileCompleted: true
};

const MOCK_SESSION: Session = {
  accessToken: 'jwt-access-token-123',
  user: {
    id: 'user-123',
    email: 'leno@exemplo.com'
  },
  profile: MOCK_PROFILE
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

  it('5. setPassword posta tokenHash e senha; senhas divergentes falham sem rede', async () => {
    // Caso com senhas divergentes -> falha sem rede
    await expectAsync(
      firstValueFrom(
        service.setPassword({
          tokenHash: 'token-abc',
          password: 'novasenha123',
          passwordConfirmation: 'outrasenha123'
        })
      )
    ).toBeRejectedWithError(/iguais|confirmação/i);

    httpMock.expectNone(`${environment.apiUrl}/auth/password`);

    // Caso válido -> dispara POST
    const pendingValid = firstValueFrom(
      service.setPassword({
        tokenHash: 'token-abc',
        password: 'novasenha123',
        passwordConfirmation: 'novasenha123'
      })
    );

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      tokenHash: 'token-abc',
      password: 'novasenha123',
      passwordConfirmation: 'novasenha123'
    });
    req.flush(null, { status: 204, statusText: 'No Content' });

    await pendingValid;
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
});
