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

    expect(name).toBe('Seita Dev');
    expect(tagline.length).toBeGreaterThan(0);
    expect(summary.length).toBeGreaterThan(80);
  });

  it('descreve a trilha como uma sequência de 12 etapas sem lacunas', () => {
    const stages = service.trackStages();

    expect(stages.length).toBe(12);
    stages.forEach((stage, index) => {
      expect(stage.order).toBe(index + 1);
      expect(stage.title.length).toBeGreaterThan(0);
      expect(stage.area.length).toBeGreaterThan(0);
    });
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

  it('começa a trilha por stacks e termina em NestJS', () => {
    const stages = service.trackStages();

    expect(stages[0].icon).toBe('stacks');
    expect(stages[stages.length - 1].icon).toBe('nestjs');
  });

  it('divide os 33 graus em uma faixa gratuita e uma faixa por assinatura', () => {
    const tiers = service.tiers();

    expect(tiers.length).toBe(2);
    expect(tiers[0].price).toBe('Gratuito');
    expect(tiers[1].price).toContain('14,99');
    tiers.forEach((tier) => {
      expect(tier.perks.length).toBeGreaterThan(0);
      expect(tier.summary.length).toBeGreaterThan(0);
    });
  });

  it('expõe a progressão dos graus como número, com o limite gratuito dentro do total', () => {
    const { totalGrades, freeGrades } = service.grades();

    expect(totalGrades).toBe(33);
    expect(freeGrades).toBe(5);
    expect(freeGrades).toBeLessThan(totalGrades);
  });

  it('lista os destaques do que a comunidade é, sem repetir identificadores', () => {
    const highlights = service.highlights();

    expect(highlights.length).toBeGreaterThanOrEqual(3);
    const ids = highlights.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    highlights.forEach((item) => expect(item.detail.length).toBeGreaterThan(0));
  });

  it('descreve o Conclave com formato, preço e vagas por encontro', () => {
    const conclave = service.conclave();

    expect(conclave.price).toContain('150');
    expect(conclave.seats).toBe(4);
    expect(conclave.duration).toContain('2');
    expect(conclave.perks.length).toBeGreaterThan(0);
  });
});
