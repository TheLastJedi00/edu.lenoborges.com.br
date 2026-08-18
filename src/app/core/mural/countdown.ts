/**
 * Quanto falta para a virada da semana.
 *
 * O instante vem da API (`currentWeekEndsAt`), e **não do relógio do navegador
 * sozinho**: quem está com o fuso errado no celular — ou viajando — veria uma
 * virada que não existe, votaria e receberia 409. O relógio local só entra como
 * "agora"; o alvo é sempre do servidor.
 *
 * **Não é cronômetro de segundos.** Granularidade de dias, e horas só no último
 * dia. Um número descendo em tempo real cria urgência falsa para um prazo que
 * não é urgente, e mantém uma animação viva na tela sem nenhuma razão.
 */
export function describeCountdown(
  endsAtIso: string,
  now: Date = new Date()
): string {
  const endsAt = new Date(endsAtIso).getTime();

  // Data malformada não pode derrubar a tela: o mural inteiro depende deste
  // texto, e um NaN aqui apagaria o cabeçalho.
  if (!Number.isFinite(endsAt)) {
    return 'Virando agora';
  }

  const restante = endsAt - now.getTime();
  if (restante <= 0) {
    return 'Virando agora';
  }

  const horas = Math.floor(restante / 3_600_000);

  if (horas >= 48) {
    return `Fecha em ${Math.floor(horas / 24)} dias`;
  }

  if (horas >= 24) {
    return 'Fecha amanhã';
  }

  if (horas >= 1) {
    return `Fecha em ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  }

  return 'Fecha em menos de uma hora';
}
