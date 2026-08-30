import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AuthStore } from './auth.store';
import { MemberProfile } from '../../models/auth.model';

const PERFIL: MemberProfile = {
  id: 'uid-1',
  email: 'membro@exemplo.com',
  name: 'Membro',
  phone: '47999990000',
  bio: 'Uma bio qualquer.',
  grade: 3,
  linkedin: null,
  instagram: null,
  emailOptOut: false,
  profileCompleted: true,
  role: null,
  tier: 'dev-tier',
  pendingLegal: [],
  legalAcceptances: {},
  xp: 340,
  socialLinksPublic: false,
  nickname: null
};

describe('AuthStore · XP (spec 019)', () => {
  let store: AuthStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), AuthStore]
    });

    store = TestBed.inject(AuthStore);
  });

  it('o xp vem do perfil carregado', () => {
    store.setProfile(PERFIL);

    expect(store.xp()).toBe(340);
  });

  /**
   * **Diferente de `grade` e `role`, não há fallback de sessão** (decisão 3): o
   * campo chega no `GET /me`, e uma segunda fonte para o mesmo valor divergiria
   * no primeiro check dado antes do refresh. Até o perfil chegar, é zero.
   */
  it('sem perfil carregado, o xp é zero', () => {
    expect(store.xp()).toBe(0);
  });

  it('setXp escreve o número novo e não mexe em mais nada', () => {
    store.setProfile(PERFIL);

    store.setXp(350);

    expect(store.xp()).toBe(350);
    expect(store.profile()?.name).toBe('Membro');
    expect(store.profileCompleted()).toBeTrue();
  });

  /**
   * **A trava desta task.** Criar um perfil pela metade aqui deixaria
   * `profileCompleted` falso, e o guard de onboarding sequestraria quem só
   * marcou um vídeo. O número certo chega no `GET /me` seguinte de qualquer
   * forma.
   */
  it('teste-trava: setXp sem perfil carregado NÃO cria um perfil pela metade', () => {
    store.setXp(10);

    expect(store.profile()).toBeNull();
    expect(store.xp()).toBe(0);
  });
});
