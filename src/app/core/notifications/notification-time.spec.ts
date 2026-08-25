import { describeNotificationTime } from './notification-time';

/**
 * Relógio fixo em todos os casos. Um teste de data que depende da hora de
 * execução reprova sozinho de madrugada, e o defeito parece estar em outro
 * lugar.
 */
const AGORA = new Date(2026, 7, 25, 14, 0, 0); // 25/08/2026, 14:00 local

describe('describeNotificationTime', () => {
  it('mostra só a hora quando é de hoje', () => {
    const hoje = new Date(2026, 7, 25, 9, 5, 0);

    expect(describeNotificationTime(hoje.toISOString(), AGORA)).toBe('09:05');
  });

  it('diz "ontem" com a hora', () => {
    const ontem = new Date(2026, 7, 24, 22, 30, 0);

    expect(describeNotificationTime(ontem.toISOString(), AGORA)).toBe(
      'ontem 22:30'
    );
  });

  it('mostra a data a partir de anteontem', () => {
    const antes = new Date(2026, 7, 12, 8, 0, 0);

    expect(describeNotificationTime(antes.toISOString(), AGORA)).toBe('12/08');
  });

  /**
   * Às 00:30 uma notificação das 23:00 tem 90 minutos e mesmo assim é de ontem.
   * É o que a pessoa entende olhando, e é onde a conta por milissegundos erra.
   */
  it('usa dia de calendário, e não bloco de 24 horas', () => {
    const madrugada = new Date(2026, 7, 25, 0, 30, 0);
    const ontemANoite = new Date(2026, 7, 24, 23, 0, 0);

    expect(
      describeNotificationTime(ontemANoite.toISOString(), madrugada)
    ).toBe('ontem 23:00');
  });

  it('data malformada não derruba a linha', () => {
    expect(describeNotificationTime('nao-e-data', AGORA)).toBe('');
  });
});
