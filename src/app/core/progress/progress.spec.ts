import {
  TOTAL_BADGES,
  MAX_GRADE,
  describeProgress,
  badgesRemaining
} from './progress';

/**
 * As fronteiras são o teste inteiro.
 *
 * A tabela de `grade` (decisão 4 da spec 008) tem quatro trechos com significados
 * diferentes colados uns nos outros, e todo erro de faixa mora na emenda: `8` é a
 * última insígnia e não a primeira Elite Battle; `12` é campeão e não "chegou na
 * final".
 */
describe('describeProgress', () => {
  it('grade 0: entrou, nenhuma insígnia', () => {
    const p = describeProgress(0);

    expect(p.phase).toBe('gym');
    expect(p.badges).toBe(0);
    expect(p.label).toBe('Nenhuma insígnia');
  });

  it('grade 1 a 8: conta insígnias', () => {
    expect(describeProgress(1).label).toBe('Insígnia 1 / 8');
    expect(describeProgress(5).label).toBe('Insígnia 5 / 8');
    expect(describeProgress(8).label).toBe('Insígnia 8 / 8');
  });

  it('grade 8 ainda é GYM Battle, não Elite Four', () => {
    // A emenda mais fácil de errar: oito insígnias é o fim da trilha de
    // insígnias, não o começo do endgame.
    const p = describeProgress(8);

    expect(p.phase).toBe('gym');
    expect(p.badges).toBe(8);
    expect(p.round).toBeUndefined();
  });

  it('grade 9 a 12: Elite Four, uma rodada por grade', () => {
    expect(describeProgress(9).round).toBe('oitavas');
    expect(describeProgress(10).round).toBe('quartas');
    expect(describeProgress(11).round).toBe('semifinais');
    expect(describeProgress(12).round).toBe('final');
    expect(describeProgress(9).phase).toBe('elite');
  });

  it('grade 12 é campeão, não "chegou na final"', () => {
    // `grade` conta etapas CONCLUÍDAS. Quem tem 12 venceu a Final.
    const p = describeProgress(12);

    expect(p.label).toBe('Campeão');
    expect(p.round).toBe('final');
  });

  it('grade 13: Battle Frontier', () => {
    const p = describeProgress(13);

    expect(p.phase).toBe('frontier');
    expect(p.label).toBe('Battle Frontier');
  });

  it('trata valor fora da faixa como o extremo mais próximo', () => {
    // Um `grade` inválido vem do banco, não do usuário. Estourar aqui apagaria
    // o painel inteiro por causa de um número; grudar no extremo degrada só o selo.
    expect(describeProgress(-3).badges).toBe(0);
    expect(describeProgress(99).phase).toBe('frontier');
  });

  it('as constantes batem com a tabela da spec', () => {
    expect(TOTAL_BADGES).toBe(8);
    expect(MAX_GRADE).toBe(13);
  });
});

describe('badgesRemaining', () => {
  it('conta quantas insígnias faltam', () => {
    expect(badgesRemaining(0)).toBe(8);
    expect(badgesRemaining(6)).toBe(2);
  });

  it('não devolve negativo depois das oito', () => {
    // "faltam -4 insígnias" é o tipo de texto que só aparece em produção.
    expect(badgesRemaining(8)).toBe(0);
    expect(badgesRemaining(12)).toBe(0);
  });
});
