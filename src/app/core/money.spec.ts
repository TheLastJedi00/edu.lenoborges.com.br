import { formatBRL } from './money';

describe('formatBRL', () => {
  it('formata centavos em real brasileiro', () => {
    // ATENÇÃO: o separador que o Intl põe depois do "R$" é um NBSP (U+00A0), e
    // não o espaço comum. As strings esperadas abaixo carregam o NBSP de
    // verdade — trocá-lo por um espaço digitado quebra o teste por um caractere
    // invisível, e a investigação disso custa meia hora por nada.
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
