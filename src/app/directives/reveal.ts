import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  inject,
  input
} from '@angular/core';

/**
 * Revela o elemento quando ele entra na viewport, reaproveitando a animação `animate-enter`.
 * O conteúdo permanece no DOM: sem observer ou com movimento reduzido, nada é escondido.
 */
@Directive({
  selector: '[appReveal]'
})
export class Reveal {
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Posição do elemento numa entrada em cascata.
   *
   * O atraso é de 60ms por passo, **com teto de 6** (spec 009): a sétima
   * insígnia não pode esperar 700ms para existir. Depois do teto, todos entram
   * juntos — a cascata serve para dar ritmo à leitura, não para fazer a página
   * ser preenchida devagar.
   */
  readonly appReveal = input<number | ''>('');

  constructor() {
    afterNextRender(() => {
      const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion || !('IntersectionObserver' in globalThis)) {
        return;
      }

      this.element.classList.add('reveal-idle');

      const index = Number(this.appReveal());
      if (Number.isFinite(index) && index > 0) {
        const STEP_MS = 60;
        const MAX_STEPS = 6;
        this.element.style.setProperty(
          '--reveal-delay',
          `${Math.min(index, MAX_STEPS) * STEP_MS}ms`
        );
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) {
              continue;
            }
            this.element.classList.remove('reveal-idle');
            this.element.classList.add('animate-enter');
            observer.unobserve(entry.target);
          }
        },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.1 }
      );

      observer.observe(this.element);

      // Rede de segurança: nenhum conteúdo pode ficar invisível se o observer não disparar.
      const failsafe = setTimeout(() => this.element.classList.remove('reveal-idle'), 4000);

      this.destroyRef.onDestroy(() => {
        observer.disconnect();
        clearTimeout(failsafe);
      });
    });
  }
}
