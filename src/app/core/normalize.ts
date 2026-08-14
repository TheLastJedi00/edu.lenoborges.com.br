export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Normaliza o nome removendo espaços sobressalentes nas pontas e colapsando múltiplos
 * espaços internos em um só.
 */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Remove todos os caracteres não numéricos do telefone, preservando apenas os dígitos.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Normaliza o e-mail removendo espaços nas pontas e convertendo para minúsculas.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
