import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CommunityService } from './community.service';

describe('CommunityService', () => {
  let service: CommunityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    service = TestBed.inject(CommunityService);
  });

  it('identifica a comunidade pelo nome e por uma tese curta', () => {
    const { name, tagline, summary } = service.identity();

    expect(name).toBe('Liga Dev');
    expect(tagline.length).toBeGreaterThan(0);
    expect(summary.length).toBeGreaterThan(80);
  });

  it('descreve a trilha como uma sequência de 13 etapas sem lacunas', () => {
    // 8 GYM Battles + 4 Elite Battles + a Battle Frontier.
    const stages = service.trackStages();

    expect(stages.length).toBe(13);
    stages.forEach((stage, index) => {
      expect(stage.order).toBe(index + 1);
      expect(stage.title.length).toBeGreaterThan(0);
      expect(stage.area.length).toBeGreaterThan(0);
    });
  });

  it('tem exatamente 8 insígnias, 4 Elite Battles e 1 Battle Frontier', () => {
    // A metáfora inteira depende desses números: "conquiste as oito" e "Elite
    // Four" deixam de fazer sentido se a contagem escorregar.
    const stages = service.trackStages();
    const count = (phase: string) =>
      stages.filter((stage) => stage.phase === phase).length;

    expect(count('gym')).toBe(8);
    expect(count('elite')).toBe(4);
    expect(count('frontier')).toBe(1);
  });

  it('nomeia as quatro rodadas da Elite Four, sem repetir', () => {
    const rounds = service
      .trackStages()
      .filter((stage) => stage.phase === 'elite')
      .map((stage) => stage.round);

    expect(rounds).toEqual(['oitavas', 'quartas', 'semifinais', 'final']);
  });

  it('mantém identificadores únicos entre as etapas da trilha', () => {
    const ids = service.trackStages().map((stage) => stage.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('detalha cada etapa com ao menos um tópico de estudo', () => {
    service.trackStages().forEach((stage) => {
      expect(stage.topics.length).toBeGreaterThan(0);
      stage.topics.forEach((topic) => expect(topic.length).toBeGreaterThan(0));
    });
  });

  it('começa pela Lógica e termina a disputa no GCP', () => {
    const stages = service.trackStages();

    expect(stages[0].title).toContain('Lógica');
    expect(stages[11].round).toBe('final');
    expect(stages[11].icon).toBe('gcp');
  });

  it('promete SQL puro e JPA na Insígnia do Spring Boot', () => {
    // A etapa de banco de dados foi absorvida aqui. Uma insígnia que promete
    // banco e entrega só `@Entity` esconde o que acontece embaixo.
    const spring = service
      .trackStages()
      .find((stage) => stage.title.includes('Spring Boot'));
    const topics = spring!.topics.join(' ');

    expect(topics).toContain('SQL');
    expect(topics).toContain('JPA');
  });

  it('divide o acesso em três tiers, do gratuito ao Ultra', () => {
    const tiers = service.tiers();

    expect(tiers.length).toBe(3);
    expect(tiers.map((tier) => tier.name)).toEqual([
      'Dev Tier',
      'Great Dev Tier',
      'Ultra Dev Tier'
    ]);
    expect(tiers[0].price).toBe('Gratuito');
    expect(tiers[1].price).toContain('19,99');
    expect(tiers[2].price).toContain('199,99');
  });

  it('escreve os tiers como degraus cumulativos, não como alternativas', () => {
    // Sem o "tudo do anterior", a tabela convida a comparar o que não é
    // comparável, e o Great parece competir com o Ultra em vez de levar a ele.
    const [, great, ultra] = service.tiers();

    expect(great.perks[0]).toContain('Tudo do Dev Tier');
    expect(ultra.perks[0]).toContain('Tudo do Great Dev Tier');
  });

  it('expõe a progressão como número, com o limite gratuito dentro do total', () => {
    const { totalBadges, freeBadges } = service.badges();

    expect(totalBadges).toBe(8);
    expect(freeBadges).toBe(2);
    expect(freeBadges).toBeLessThan(totalBadges);
  });

  it('lista os destaques do que a comunidade é, sem repetir identificadores', () => {
    const highlights = service.highlights();

    expect(highlights.length).toBeGreaterThanOrEqual(3);
    const ids = highlights.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    highlights.forEach((item) => expect(item.detail.length).toBeGreaterThan(0));
  });

  it('descreve a Grinding Arena com formato, preço e vagas', () => {
    const arena = service.grindingArena();

    expect(arena.price).toContain('199,99');
    expect(arena.seats).toBe(4);
    expect(arena.cadence).toContain('Grinding');
    expect(arena.perks.length).toBeGreaterThan(0);
  });

  it('não usa Elite no texto da Grinding Arena', () => {
    // A palavra pertence ao endgame. A Arena é paralela à trilha, e misturar as
    // duas desfaz a separação que o vocabulário construiu. Ver spec 008.
    const arena = service.grindingArena();
    const texto = [arena.title, arena.summary, ...arena.perks].join(' ');

    expect(texto).not.toContain('Elite');
  });

  it('não carrega vocabulário da Seita em lugar nenhum', () => {
    const tudo = JSON.stringify(service.community());

    expect(tudo).not.toContain('Seita');
    expect(tudo).not.toContain('Conclave');
    expect(tudo).not.toContain('Grau');
  });
});
