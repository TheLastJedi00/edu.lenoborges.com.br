import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MemberProfile, Session } from '../../models/auth.model';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';
import { restoreSession } from './session-init';

const MOCK_PROFILE: MemberProfile = {
  id: 'p-1',
  email: 'leno@exemplo.com',
  name: 'Leno',
  phone: '47999991234',
  bio: 'Bio teste',
  grade: 1,
  linkedin: null,
  instagram: null,
  emailOptOut: false,
  profileCompleted: true,
  role: null,
  tier: 'dev-tier',
  pendingLegal: [],
  legalAcceptances: {}
};

const MOCK_SESSION: Session = {
  accessToken: 'token-restaurado',
  expiresIn: 3600,
  user: { id: 'u1', email: 'leno@exemplo.com' },
  profileCompleted: true,
  grade: 1,
  role: null,
  tier: 'dev-tier'
};

describe('restoreSession', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let store: AuthStore;

  beforeEach(() => {
    localStorage.removeItem('eduleno.session');

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthStore,
        { provide: AuthService, useValue: jasmine.createSpyObj('AuthService', ['refresh']) }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    store = TestBed.inject(AuthStore);
  });

  afterEach(() => {
    localStorage.removeItem('eduleno.session');
  });

  it('não gasta requisição no visitante anônimo, que é quem abre a landing', async () => {
    // O bootstrap esperava o /auth/refresh de todo visitante, inclusive quem só
    // abriu a página pública. Com a API fora do ar, a landing só renderizava
    // depois de a conexão falhar.
    await restoreSession(authService, store);

    expect(authService.refresh).not.toHaveBeenCalled();
    expect(store.status()).toBe('anonymous');
  });

  it('tenta o refresh quando este navegador já teve uma sessão', async () => {
    // Quem grava a sessão no store é o AuthService, coberto na spec dele. Aqui o
    // que importa é a decisão de chamar, e o estado não voltar para anônimo.
    store.setSession(MOCK_SESSION);
    store.status.set('unknown');
    authService.refresh.and.returnValue(of(MOCK_SESSION));

    await restoreSession(authService, store);

    expect(authService.refresh).toHaveBeenCalled();
    expect(store.status()).not.toBe('anonymous');
  });

  it('vira anônimo quando o refresh falha, sem estourar erro na tela', async () => {
    store.setSession(MOCK_SESSION);
    store.status.set('unknown');
    authService.refresh.and.returnValue(throwError(() => new Error('401')));

    await expectAsync(restoreSession(authService, store)).toBeResolved();

    expect(store.status()).toBe('anonymous');
  });

  it('esquece a marca depois de a sessão acabar, para não tentar de novo à toa', async () => {
    store.setSession(MOCK_SESSION);
    expect(store.hasSessionHint()).toBeTrue();

    store.clearSession();

    expect(store.hasSessionHint()).toBeFalse();
  });

  it('não guarda nada além do booleano no armazenamento do navegador', () => {
    store.setSession(MOCK_SESSION);

    expect(localStorage.getItem('eduleno.session')).toBe('1');
    expect(JSON.stringify(localStorage)).not.toContain('token-restaurado');
  });
});
