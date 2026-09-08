import { TrackStage } from '../../models/community.model';
import { tituloDaInsignia } from './badge-title';

const ETAPAS: readonly TrackStage[] = [
  {
    id: 'poo',
    order: 2,
    phase: 'gym',
    area: 'Back-End',
    title: 'Insígnia da POO',
    icon: 'java',
    topics: []
  },
  {
    id: 'logica',
    order: 1,
    phase: 'gym',
    area: 'Fundamentos',
    title: 'Insígnia da Lógica',
    icon: 'ts-js',
    topics: []
  }
];

describe('tituloDaInsignia', () => {
  it('troca o id pelo título da etapa', () => {
    expect(tituloDaInsignia(ETAPAS, 'poo')).toBe('Insígnia da POO');
  });

  /**
   * **O fallback é o próprio id, e é decisão** (spec 010, e agora a decisão 9
   * da spec 024).
   *
   * Acontece com dado antigo e com etapa renomeada. Um rótulo feio ainda diz
   * sobre o que a pergunta é; string vazia deixa o cartão sem assunto, e é para
   * lá que a próxima "simplificação" vai querer levar esta função.
   */
  it('teste-trava: id fora da trilha volta como ele mesmo, e não vazio', () => {
    expect(tituloDaInsignia(ETAPAS, 'etapa-que-sumiu')).toBe('etapa-que-sumiu');
  });

  it('trilha ainda não carregada devolve o id', () => {
    expect(tituloDaInsignia([], 'poo')).toBe('poo');
  });
});
