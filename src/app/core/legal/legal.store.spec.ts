import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LegalStore } from './legal.store';

const TERMOS = { id: 'termos-de-uso', title: 'Termos de Uso', version: '2026-08-27' };
const PRIVACIDADE = {
  id: 'politica-de-privacidade',
  title: 'Política de Privacidade',
  version: '2026-08-27'
};

describe('LegalStore', () => {
  let store: LegalStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    store = TestBed.inject(LegalStore);
  });

  it('nasce sem pendência', () => {
    expect(store.hasPending()).toBeFalse();
    expect(store.pending()).toEqual([]);
  });

  it('setPending liga o bloqueio', () => {
    store.setPending([TERMOS, PRIVACIDADE]);

    expect(store.hasPending()).toBeTrue();
    expect(store.pending().length).toBe(2);
  });

  it('clearOne tira só o documento aceito, e o bloqueio continua', () => {
    store.setPending([TERMOS, PRIVACIDADE]);

    store.clearOne('termos-de-uso');

    expect(store.hasPending()).toBeTrue();
    expect(store.pending().map((d) => d.id)).toEqual(['politica-de-privacidade']);
  });

  it('o bloqueio some quando o último pendente sai', () => {
    store.setPending([TERMOS]);

    store.clearOne('termos-de-uso');

    expect(store.hasPending()).toBeFalse();
  });

  /**
   * O aceite é do servidor, e só. Um flag local mentiria nas duas direções:
   * navegador limpo faria quem já aceitou aceitar de novo, e um flag "aceito"
   * gravado por engano esconderia um pendente real para sempre.
   */
  it('teste-trava: nada é escrito no armazenamento do navegador', () => {
    const setItem = spyOn(Storage.prototype, 'setItem');

    store.setPending([TERMOS]);
    store.clearOne('termos-de-uso');

    expect(setItem).not.toHaveBeenCalled();
  });
});
