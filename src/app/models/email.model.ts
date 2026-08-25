import type { TierId } from './auth.model';

/** Disparo de e-mails (spec 014). */

/**
 * O recorte da audiência.
 *
 * > **Filtro ausente significa TODOS os membros, e nunca ninguém.** É a inversão
 * > que uma tela de disparo não pode errar: lida ao contrário, ela manda a
 * > campanha para zero pessoa e ninguém percebe — ou, pior, manda para a base
 * > inteira quando o admin achava que tinha filtrado. A tela escreve "Todos os
 * > membros" com essas palavras justamente para o estado vazio não ser
 * > silencioso.
 *
 * Não existe filtro de status de pagamento, e não é esquecimento: não há
 * pagamento no produto. Ver a decisão 12 da spec 014 do backend.
 */
export interface EmailFilters {
  readonly tiers?: readonly TierId[];
  /** Insígnia mínima, inclusiva. Ausente significa sem piso. */
  readonly gradeMin?: number;
  /** Insígnia máxima, inclusiva. Ausente significa sem teto. */
  readonly gradeMax?: number;
}

/** O que o admin escreve. `body` é **texto puro**, e nunca HTML. */
export interface SendEmailRequest extends EmailFilters {
  readonly subject: string;
  readonly body: string;
  readonly ctaLabel?: string;
  readonly ctaUrl?: string;
}

export type CampaignStatus = 'enviando' | 'concluida' | 'interrompida';
export type CampaignKind = 'video' | 'manual';

/** O resultado de um disparo, e a resposta de `POST /admin/emails`. */
export interface CampaignResult {
  readonly id: string;
  readonly status: CampaignStatus;
  readonly audienceCount: number;
  readonly sentCount: number;
  readonly failedCount: number;
}

/**
 * Uma linha do histórico.
 *
 * **Não traz o corpo do e-mail**, por decisão do backend: quem quer ver o que foi
 * enviado tem a própria caixa de entrada, porque o admin sempre recebe o teste.
 */
export interface EmailCampaign extends CampaignResult {
  readonly kind: CampaignKind;
  readonly subject: string;
  readonly createdAt: string;
  readonly finishedAt: string | null;
  readonly error: string | null;
}

/** A prévia de audiência. Só o número: a rota nunca devolve e-mail nenhum. */
export interface AudienceCount {
  readonly count: number;
}
