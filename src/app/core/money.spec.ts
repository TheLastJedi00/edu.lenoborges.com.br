import { formatBRL } from './money';

describe('formatBRL', () => {
  it('formata centavos em real brasileiro', () => {
    // Comparação por igualdade estrita de propósito: vírgula decimal e o espaço
    // depois do símbolo são exatamente o que a tela mostra, e um toContain
    // deixaria passar "R$260" ou "R$ 260.00".
    expect(formatBRL(26000)).toBe('R$ 260,00');
    expect(formatBRL(1999)).toBe('R$ 19,99');
    expect(formatBRL(19999)).toBe('R$ 199,99');
  });

  it('formata o gratuito como zero, sem inventar palavra', () => {
    // Quem decide dizer "Gratuito" é a tela, olhando o period. O formatador não
    // pode ter uma opinião sobre isso, ou passa a existir uma segunda regra
    // sobre o que é grátis.
    expect(formatBRL(0)).toBe('R$ 0,00');
  });
});
