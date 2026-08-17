import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BadgeLadder } from './badge-ladder';
import { CommunityTier } from '../../models/community.model';

const TIERS: readonly CommunityTier[] = [
  {
    id: 'dev-tier',
    name: 'Dev Tier',
    range: 'Insígnia 1 e 2',
    price: 'Gratuito',
    summary: 'Livre para qualquer pessoa.',
    perks: ['Grupo aberto no WhatsApp']
  },
  {
    id: 'great-dev-tier',
    name: 'Great Dev Tier',
    range: 'Insígnia 3 em diante',
    price: 'R$ 19,99 por mês',
    summary: 'A plataforma inteira.',
    perks: ['Tudo do Dev Tier']
  },
  {
    id: 'ultra-dev-tier',
    name: 'Ultra Dev Tier',
    range: 'Plataforma e Grinding Arena',
    price: 'R$ 199,99 por mês',
    summary: 'Quatro cadeiras, e elas acabam.',
    perks: ['Tudo do Great Dev Tier']
  }
];

describe('BadgeLadder', () => {
  let fixture: ComponentFixture<BadgeLadder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeLadder],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeLadder);
    fixture.componentRef.setInput('progress', { totalBadges: 8, freeBadges: 2 });
    fixture.componentRef.setInput('tiers', TIERS);
    fixture.detectChanges();
  });

  it('desenha oito passos de insígnia e quatro Elite Battles', () => {
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('.ladder__step').length).toBe(12);
    expect(el.querySelectorAll('.ladder__step--elite').length).toBe(4);
  });

  it('separa as duas naturezas com um vão', () => {
    // Sem o vão, as quatro Elite Battles leem como "mais quatro degraus" em vez
    // de prêmio por ter conquistado as oito.
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.ladder__gap')).not.toBeNull();
  });

  it('acende só as insígnias gratuitas', () => {
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('.ladder__step--free').length).toBe(2);
  });

  it('exibe os três tiers com nome e preço', () => {
    const el = fixture.nativeElement as HTMLElement;
    const tiers = el.querySelectorAll('.tier');

    expect(tiers.length).toBe(3);
    expect(el.textContent).toContain('Dev Tier');
    expect(el.textContent).toContain('R$ 19,99');
    expect(el.textContent).toContain('R$ 199,99');
  });

  it('marca como pago tudo que não é gratuito', () => {
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('.tier--paid').length).toBe(2);
  });

  it('anuncia a régua como decorativa', () => {
    // A informação está no texto das faixas; a régua repetiria em forma o que já
    // foi dito em palavra, e um leitor de tela leria doze itens sem conteúdo.
    const el = fixture.nativeElement as HTMLElement;
    const rail = el.querySelector('.ladder__rail');

    expect(rail?.getAttribute('aria-hidden')).toBe('true');
  });
});
