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
   * Vazio por padrão até o link definitivo ser configurado.
   */
  whatsappGroupUrl: '',
};
