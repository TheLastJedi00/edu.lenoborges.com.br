/**
 * Ambiente de produção.
 *
 * O front é servido em `edu.lenoborges.com.br` e a API em `api.lenoborges.com.br`.
 */
export const environment = {
  production: true,
  /**
   * Backend em **subdomínio do mesmo domínio do front**, e isso não é cosmético:
   * é o que faz o F5 dentro do painel não deslogar (spec 011).
   *
   * O refresh token vive num cookie HttpOnly com `SameSite=Lax`, e `Lax` não
   * acompanha requisição cross-site nenhuma feita por XHR. Enquanto a API
   * respondeu em `api-lenoborges.vercel.app`, o `POST /auth/refresh` da abertura
   * chegava **sem o cookie** — `vercel.app` está na Public Suffix List, então
   * aquele host e este front eram sites diferentes para o navegador. Login
   * funcionava, F5 deslogava.
   *
   * Sob `api.lenoborges.com.br` os dois compartilham o domínio registrável
   * `lenoborges.com.br`, são same-site, e o cookie é first-party.
   *
   * **Não trocar por um `*.vercel.app`, nem "resolver" com `SameSite=None`.**
   * `None` assume o cookie como de terceiro, e o Safari bloqueia cookie de
   * terceiro por padrão: consertaria o F5 no Chrome de quem testa e o manteria
   * quebrado no iPhone, que é onde está a maior parte dos membros.
   *
   * Continua sendo cross-**origin**, então a origem deste front precisa seguir
   * na `FRONTEND_URL` do backend para o CORS liberar.
   */
  apiUrl: 'https://api.lenoborges.com.br',
  /**
   * Link de convite do grupo oficial da Liga Dev no WhatsApp.
   * Fixo no código por enquanto, e igual ao de desenvolvimento.
   */
  whatsappGroupUrl: 'https://chat.whatsapp.com/FIyeOUoIuCmKghcHpd0vbR',
};
