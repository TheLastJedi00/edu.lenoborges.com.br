/**
 * Ambiente de preview (branch `dev` na Vercel).
 *
 * O bundle é gerado com as mesmas otimizações do build de produção — o preview
 * só vale como ensaio se for o mesmo artefato — mas fala com a API de preview,
 * nunca com o banco real.
 */
export const environment = {
  /**
   * `false` de propósito, mesmo o bundle sendo otimizado: o flag responde
   * "este é o ambiente real?", e a resposta aqui é não.
   */
  production: false,
  /**
   * API de preview em **subdomínio do mesmo domínio registrável do front**,
   * pelo mesmo motivo detalhado em `environment.production.ts`: o refresh token
   * vive num cookie `HttpOnly; SameSite=Lax`, e `Lax` não acompanha requisição
   * cross-site nenhuma.
   *
   * Apontar para a URL `*.vercel.app` do deployment de preview do backend
   * reproduziria exatamente o bug da spec 011 — login funciona, F5 desloga —
   * porque `vercel.app` está na Public Suffix List. O front de preview precisa,
   * portanto, ser servido sob um domínio de `lenoborges.com.br` também.
   */
  apiUrl: 'https://apipreview.lenoborges.com.br',
  /**
   * Link de convite do grupo oficial da Liga Dev no WhatsApp.
   * Fixo no código por enquanto, e igual ao dos demais ambientes.
   */
  whatsappGroupUrl: 'https://chat.whatsapp.com/FIyeOUoIuCmKghcHpd0vbR',
};
