import { describeCountdown } from './countdown';

const VIRADA = '2026-08-23T03:00:00.000Z';

describe('describeCountdown', () => {
  it('conta em dias quando falta mais de dois', () => {
    expect(describeCountdown(VIRADA, new Date('2026-08-18T12:00:00.000Z'))).toBe(
      'Fecha em 4 dias'
    );
  });

  // Entre 24 e 48 horas. Abaixo de 24 já vira contagem em horas.
  it('diz "amanhã" quando falta entre um e dois dias', () => {
    expect(describeCountdown(VIRADA, new Date('2026-08-22T02:00:00.000Z'))).toBe(
      'Fecha amanhã'
    );
  });

  it('passa a contar horas dentro das últimas 24', () => {
    expect(describeCountdown(VIRADA, new Date('2026-08-22T10:00:00.000Z'))).toBe(
      'Fecha em 17 horas'
    );
  });

  it('conta em horas na última volta', () => {
    expect(describeCountdown(VIRADA, new Date('2026-08-23T00:30:00.000Z'))).toBe(
      'Fecha em 2 horas'
    );
  });

  /**
   * Sem cronômetro de segundos: um número descendo em tempo real cria urgência
   * falsa para um prazo que não é urgente, e mantém uma animação viva sem razão.
   */
  it('não desce até os segundos', () => {
    expect(describeCountdown(VIRADA, new Date('2026-08-23T02:59:30.000Z'))).toBe(
      'Fecha em menos de uma hora'
    );
  });

  it('trata a virada já passada sem quebrar', () => {
    expect(describeCountdown(VIRADA, new Date('2026-08-23T04:00:00.000Z'))).toBe(
      'Virando agora'
    );
  });

  it('não quebra com data inválida', () => {
    // A tela nunca pode sumir por causa de um campo malformado da API — o mural
    // inteiro depende deste texto no cabeçalho.
    expect(describeCountdown('não é data', new Date())).toBe('Virando agora');
  });
});
