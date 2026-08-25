/**
 * A hora de um evento, como o painel a mostra (spec 012).
 *
 * **É relógio, não "há 5 minutos".** Tempo relativo obriga a recalcular na tela,
 * ou fica errado parado, e "há 3 horas" não ajuda a decidir nada. A hora
 * responde a pergunta que a pessoa realmente faz olhando a lista: isso é de
 * agora, ou é de antes de eu sair?
 *
 * Hoje vira `14:32`; ontem vira `ontem 14:32`; antes disso, `12/08`. O "hoje" é
 * o do fuso de quem está lendo, que é o único que importa para essa pergunta.
 */
export function describeNotificationTime(
  createdAtIso: string,
  now: Date = new Date()
): string {
  const createdAt = new Date(createdAtIso);

  // Data malformada não pode derrubar a linha: o painel inteiro renderiza esta
  // string, e um NaN aqui apagaria a notificação da tela.
  if (Number.isNaN(createdAt.getTime())) {
    return '';
  }

  const hora = `${pad(createdAt.getHours())}:${pad(createdAt.getMinutes())}`;
  const dias = diffInDays(createdAt, now);

  if (dias === 0) {
    return hora;
  }

  if (dias === 1) {
    return `ontem ${hora}`;
  }

  return `${pad(createdAt.getDate())}/${pad(createdAt.getMonth() + 1)}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Diferença em dias de calendário, e não em blocos de 24 horas.
 *
 * Às 00:30 uma notificação das 23:00 tem 90 minutos de idade e mesmo assim é de
 * **ontem** — é o que a pessoa entende olhando. Subtrair milissegundos diria
 * "hoje", e a lista contaria uma coisa que o calendário desmente.
 */
function diffInDays(createdAt: Date, now: Date): number {
  const meiaNoiteDe = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  return Math.round(
    (meiaNoiteDe(now) - meiaNoiteDe(createdAt)) / 86_400_000
  );
}
