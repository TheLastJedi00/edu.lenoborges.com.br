/**
 * Normalização das URLs de rede social do perfil (spec 013, decisão 4).
 *
 * Os três formatos entram — `@fulano`, `fulano` e a URL inteira — e o que sai é
 * sempre a URL completa, que é o que a API guarda. Exigir a URL completa seria
 * exigir que a pessoa fosse até o navegador, abrisse o próprio perfil e copiasse
 * a barra de endereço para salvar um dado opcional: é a fricção que faz um campo
 * opcional ficar vazio para sempre.
 *
 * **Entrada que já é URL de outro domínio não é aceita nem "consertada".** Ela é
 * inválida, e transformar `evil.com/fulano` em `linkedin.com/in/evil.com/fulano`
 * seria pior do que recusar: geraria um link plausível para um perfil que não
 * existe, e ninguém descobriria até clicar.
 */

/** Recusado, e não corrigido. */
export const SOCIAL_URL_INVALID = null;

interface Rede {
  /** Domínio canônico, sem `www`. */
  readonly host: string;
  /** O que vem entre o domínio e o handle. Vazio no Instagram. */
  readonly prefixo: string;
}

const LINKEDIN: Rede = { host: 'linkedin.com', prefixo: 'in/' };
const INSTAGRAM: Rede = { host: 'instagram.com', prefixo: '' };

/**
 * Caracteres que um handle pode ter. Deliberadamente estreito: ponto e barra
 * ficam de fora porque `evil.com/fulano` precisa cair como inválido, e não virar
 * caminho dentro da URL da rede.
 */
const HANDLE = /^[A-Za-z0-9._-]+$/;

function normalizar(raw: string, rede: Rede): string | null {
  const texto = raw.trim();

  if (!texto) {
    return '';
  }

  // 1. Já é uma URL? Então ela precisa ser do domínio certo — sem "consertar".
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(texto) || texto.includes('/')) {
    const comEsquema = /^[a-z][a-z0-9+.-]*:\/\//i.test(texto)
      ? texto
      : `https://${texto}`;

    let url: URL;
    try {
      url = new URL(comEsquema);
    } catch {
      return SOCIAL_URL_INVALID;
    }

    // Só `https`. Um `http://` colado de um lugar antigo vira `https` aqui, e
    // qualquer outro esquema — `javascript:`, `data:` — é recusado.
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return SOCIAL_URL_INVALID;
    }

    const host = url.hostname.toLowerCase();
    // Comparação por rótulo, nunca por `includes`: `evillinkedin.com` termina
    // com o texto do domínio e não é o domínio.
    if (host !== rede.host && !host.endsWith(`.${rede.host}`)) {
      return SOCIAL_URL_INVALID;
    }

    const caminho = url.pathname.replace(/^\/+|\/+$/g, '');
    if (!caminho) {
      return SOCIAL_URL_INVALID;
    }

    return `https://www.${rede.host}/${caminho}`;
  }

  // 2. É handle: `@fulano` ou `fulano`.
  const handle = texto.replace(/^@/, '');
  if (!HANDLE.test(handle)) {
    return SOCIAL_URL_INVALID;
  }

  return `https://www.${rede.host}/${rede.prefixo}${handle}`;
}

/** Vazio devolve `''`, que a tela trata como remoção. Inválido devolve `null`. */
export function toLinkedinUrl(raw: string): string | null {
  return normalizar(raw, LINKEDIN);
}

export function toInstagramUrl(raw: string): string | null {
  return normalizar(raw, INSTAGRAM);
}
