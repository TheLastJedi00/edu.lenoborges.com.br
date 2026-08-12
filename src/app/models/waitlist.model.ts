/** Interesse em entrar na Seita Dev antes da abertura, com acesso antecipado gratuito. */
export interface WaitlistEntry {
  readonly name: string;
  readonly phone: string;
  readonly email: string;
  /** Consentimento explícito do titular para o uso dos dados (LGPD, art. 7º, I). */
  readonly consent: boolean;
}

/** Confirmação devolvida depois do envio. */
export interface WaitlistReceipt {
  readonly id: string;
  readonly receivedAt: Date;
}
