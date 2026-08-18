/**
 * O financeiro da Liga Dev (spec 009).
 *
 * Este arquivo é o único do front que conhece preço, e ele nunca é preenchido
 * com um literal: os valores chegam de `GET /billing/tiers`, que exige sessão.
 * O conteúdo público (`community.model.ts`) não tem campo de preço de propósito.
 */

export type TierId =
  | 'dev-tier'
  | 'great-dev-tier'
  | 'ultra-dev-tier'
  | 'master-dev-tier';

export interface BillingTier {
  readonly id: TierId;
  readonly name: string;
  /**
   * Em **centavos**. Valor monetário em decimal é a armadilha clássica —
   * `199.99` não existe exatamente em ponto flutuante, e a primeira soma revela
   * isso num lugar inconveniente. Quem formata é `core/money.ts`.
   */
  readonly price: number;
  /** Rótulo pronto vindo da API. Serve de fallback, nunca de fonte. */
  readonly priceLabel: string;
  readonly period: 'mensal' | 'gratuito';
  readonly summary: string;
  readonly perks: readonly string[];
}

export interface TierCatalog {
  readonly tiers: readonly BillingTier[];
  /** O tier do usuário. Hoje sempre `dev-tier`: não existe cobrança. */
  readonly currentTierId: TierId;
}
