import { normalizeEmail, normalizeName, normalizePhone } from './normalize';

describe('Normalize utilities', () => {
  describe('normalizeName', () => {
    it('remove espaços nas pontas e colapsa múltiplos espaços internos', () => {
      expect(normalizeName('  Maria   Souza   da   Silva  ')).toBe('Maria Souza da Silva');
    });

    it('mantém nome sem espaços extras intacto', () => {
      expect(normalizeName('João Silva')).toBe('João Silva');
    });
  });

  describe('normalizePhone', () => {
    it('remove formatação, pontuação e letras deixando apenas dígitos', () => {
      expect(normalizePhone('(47) 99999-1234')).toBe('47999991234');
      expect(normalizePhone('+55 (11) 98888-0000')).toBe('5511988880000');
    });

    it('preserva string já exclusivamente numérica', () => {
      expect(normalizePhone('11999998888')).toBe('11999998888');
    });
  });

  describe('normalizeEmail', () => {
    it('remove espaços nas pontas e converte para minúsculas', () => {
      expect(normalizeEmail('  Maria@Exemplo.COM  ')).toBe('maria@exemplo.com');
    });

    it('mantém e-mail já em minúsculas e sem espaços', () => {
      expect(normalizeEmail('contato@lenoborges.com.br')).toBe('contato@lenoborges.com.br');
    });
  });
});
