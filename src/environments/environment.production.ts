/**
 * Ambiente de produção.
 *
 * O backend ainda não está publicado. Ajustar apiUrl no deploy, e lembrar que a origem do front
 * precisa entrar na FRONTEND_URL do backend para o CORS liberar.
 */
export const environment = {
  production: true,
  apiUrl: 'https://api-lenoborges.vercel.app',
  /**
   * Link de convite do grupo oficial da Seita Dev no WhatsApp.
   */
  whatsappGroupUrl: '',
};
