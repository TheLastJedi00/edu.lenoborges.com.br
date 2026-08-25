import { toInstagramUrl, toLinkedinUrl } from './social-url';

describe('social-url', () => {
  describe('toLinkedinUrl', () => {
    it('aceita handle com e sem arroba', () => {
      expect(toLinkedinUrl('@fulano')).toBe('https://www.linkedin.com/in/fulano');
      expect(toLinkedinUrl('fulano')).toBe('https://www.linkedin.com/in/fulano');
    });

    it('aceita a URL inteira, com e sem esquema', () => {
      expect(toLinkedinUrl('https://www.linkedin.com/in/fulano')).toBe(
        'https://www.linkedin.com/in/fulano'
      );
      expect(toLinkedinUrl('linkedin.com/in/fulano')).toBe(
        'https://www.linkedin.com/in/fulano'
      );
    });

    it('aceita subdomínio de país e devolve a forma canônica', () => {
      expect(toLinkedinUrl('https://br.linkedin.com/in/fulano')).toBe(
        'https://www.linkedin.com/in/fulano'
      );
    });

    it('promove http para https', () => {
      expect(toLinkedinUrl('http://linkedin.com/in/fulano')).toBe(
        'https://www.linkedin.com/in/fulano'
      );
    });

    it('teste-trava: URL de outro domínio é recusada, não "consertada"', () => {
      // Virar `linkedin.com/in/evil.com/fulano` seria pior que recusar: geraria
      // um link plausível para um perfil que não existe.
      expect(toLinkedinUrl('evil.com/fulano')).toBeNull();
      expect(toLinkedinUrl('https://evil.com/in/fulano')).toBeNull();
      expect(toLinkedinUrl('https://evillinkedin.com/in/fulano')).toBeNull();
    });

    it('recusa esquema que não é http nem https', () => {
      expect(toLinkedinUrl('javascript://linkedin.com/in/x')).toBeNull();
    });

    it('recusa o domínio sem caminho nenhum', () => {
      expect(toLinkedinUrl('https://www.linkedin.com/')).toBeNull();
    });

    it('vazio devolve string vazia, que é a remoção do campo', () => {
      expect(toLinkedinUrl('')).toBe('');
      expect(toLinkedinUrl('   ')).toBe('');
    });
  });

  describe('toInstagramUrl', () => {
    it('handle vira URL sem o /in/ do LinkedIn', () => {
      expect(toInstagramUrl('@fulano')).toBe('https://www.instagram.com/fulano');
    });

    it('aceita a URL inteira', () => {
      expect(toInstagramUrl('https://instagram.com/fulano')).toBe(
        'https://www.instagram.com/fulano'
      );
    });

    it('recusa a URL da outra rede', () => {
      expect(toInstagramUrl('https://www.linkedin.com/in/fulano')).toBeNull();
    });
  });
});
