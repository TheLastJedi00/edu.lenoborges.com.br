import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';

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

  constructor() {
    afterNextRender(() => {
      const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion || !('IntersectionObserver' in globalThis)) {
        return;
      }

      this.element.classList.add('reveal-idle');

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
