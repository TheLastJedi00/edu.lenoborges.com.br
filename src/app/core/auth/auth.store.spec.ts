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
  avatarUrl: null,
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

  it('setAvatarUrl escreve a foto e nao mexe em mais nada', () => {
    store.setProfile(PERFIL);

    store.setAvatarUrl('https://s/b/avatars/uid-1?v=1');

    expect(store.profile()?.avatarUrl).toBe('https://s/b/avatars/uid-1?v=1');
    // O resto do perfil fica intacto: e um campo so que muda, e o XP do fixture
    // continua onde estava.
    expect(store.profile()?.name).toBe('Membro');
    expect(store.xp()).toBe(340);
  });

  it('setAvatarUrl aceita null, que e a remocao da foto', () => {
    store.setProfile({ ...PERFIL, avatarUrl: 'https://s/b/avatars/uid-1?v=1' });

    store.setAvatarUrl(null);

    expect(store.profile()?.avatarUrl).toBeNull();
  });

  it('teste-trava: setAvatarUrl sem perfil carregado NAO cria um perfil pela metade', () => {
    // Mesma razao do setXp abaixo: um perfil pela metade deixa
    // `profileCompleted` falso, e o guard de onboarding sequestra quem so trocou
    // a foto.
    store.setAvatarUrl('https://s/b/avatars/uid-1?v=1');

    expect(store.profile()).toBeNull();
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
