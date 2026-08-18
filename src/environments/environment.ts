/** Ambiente de desenvolvimento. Trocado por environment.production.ts no build de produção. */
export const environment = {
  production: false,
  /**
   * Backend da lista de espera e autenticação. A porta 4200 do ng serve precisa estar na FRONTEND_URL
   * do backend, senão o CORS barra a requisição.
   */
  apiUrl: 'http://localhost:3000',
  /**
   * Link de convite do grupo oficial da Liga Dev no WhatsApp.
   *
   * Fixo no código por enquanto, e igual ao de produção: é um convite público,
   * não um segredo, e quebrá-lo em duas fontes só criaria a chance de o
   * ambiente de desenvolvimento apontar para um grupo que não existe.
   *
   * Quando o link precisar mudar sem novo deploy, ele vira campo de
   * configuração no backend — não variável de ambiente do front, que exige
   * build de qualquer jeito.
   */
  whatsappGroupUrl: 'https://chat.whatsapp.com/FIyeOUoIuCmKghcHpd0vbR',
};
