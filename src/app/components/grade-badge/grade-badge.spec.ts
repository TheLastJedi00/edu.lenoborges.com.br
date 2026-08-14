import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GradeBadge } from './grade-badge';

describe('GradeBadge', () => {
  let component: GradeBadge;
  let fixture: ComponentFixture<GradeBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradeBadge],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(GradeBadge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exibe o Grau 1 com a leitura 1 de 33 Graus por padrão', () => {
    const badge = fixture.nativeElement.querySelector('.grade-badge') as HTMLElement;
    expect(badge.getAttribute('aria-label')).toBe('Grau 1 de 33 Graus');
    expect(badge.textContent).toContain('Grau 1');
    expect(badge.textContent).toContain('33');
  });

  it('atualiza o Grau exibido quando recebe input diferente', () => {
    fixture.componentRef.setInput('grade', 7);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.grade-badge') as HTMLElement;
    expect(badge.getAttribute('aria-label')).toBe('Grau 7 de 33 Graus');
    expect(badge.textContent).toContain('Grau 7');
  });
});
