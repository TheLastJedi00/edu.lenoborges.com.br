/** Ambiente de desenvolvimento. Trocado por environment.production.ts no build de produção. */
export const environment = {
  production: false,
  /**
   * Backend da lista de espera. A porta 4200 do ng serve precisa estar na FRONTEND_URL
   * do backend, senão o CORS barra a requisição.
   */
  apiUrl: 'http://localhost:3000',
};
