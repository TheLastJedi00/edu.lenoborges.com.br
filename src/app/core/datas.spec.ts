import { dataCurta, dataPorExtenso } from './datas';

describe('datas', () => {
  describe('dataPorExtenso', () => {
    it('escreve dia e mes quando a data e do ano corrente', () => {
      const esteAno = new Date().getFullYear();

      expect(dataPorExtenso(`${esteAno}-08-09T18:00:00.000Z`)).toBe(
        '9 de agosto'
      );
    });

    /**
     * O ano aparece **só** quando ele importa. Repetir "de 2026" em toda linha
     * de uma lista deste ano esconde justamente a linha em que o ano muda.
     */
    it('acrescenta o ano quando a data e de outro ano', () => {
      const anoPassado = new Date().getFullYear() - 1;

      expect(dataPorExtenso(`${anoPassado}-08-09T18:00:00.000Z`)).toBe(
        `9 de agosto de ${anoPassado}`
      );
    });

    it('devolve string vazia para nulo e para data ilegivel', () => {
      expect(dataPorExtenso(null)).toBe('');
      expect(dataPorExtenso('')).toBe('');
      expect(dataPorExtenso('nao é uma data')).toBe('');
    });
  });

  describe('dataCurta', () => {
    it('escreve no formato de tabela', () => {
      expect(dataCurta('2026-08-09T18:00:00.000Z')).toBe('09/08/2026');
    });

    it('devolve string vazia para nulo', () => {
      expect(dataCurta(null)).toBe('');
    });
  });
});
