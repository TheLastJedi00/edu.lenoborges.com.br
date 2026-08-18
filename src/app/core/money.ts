/**
 * Formatação de dinheiro, num lugar só.
 *
 * A API manda `price` em centavos e um `priceLabel` já formatado. O rótulo é
 * **fallback**, nunca fonte: dois formatadores discordando é a forma mais boba
 * de a tela mostrar `R$ 260` num lugar e `R$ 260,00` no outro. Ver a decisão 4
 * da spec 009.
 */
const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

export function formatBRL(cents: number): string {
  return BRL.format(cents / 100);
}
