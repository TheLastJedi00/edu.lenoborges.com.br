import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { IconCaret } from '../icons/icon-caret';

/** Caixa de diálogo do sistema: revela o texto caractere a caractere. */
@Component({
  selector: 'app-dialog-box',
  imports: [IconCaret],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(click)': 'reveal()',
    '(keydown.enter)': 'reveal()',
    '(keydown.space)': 'reveal()',
    '[attr.role]': '"button"',
    '[attr.tabindex]': 'done() ? -1 : 0',
    '[attr.aria-label]': 'done() ? null : "Mostrar o texto completo"'
  },
  template: `
    <p class="line" aria-hidden="true">{{ typed() }}<span class="cursor"></span></p>
    <p class="u-visually-hidden">{{ text() }}</p>
    <span class="marker" [class.marker--on]="done()">
      <app-icon-caret />
    </span>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      padding: 1.25rem 2.25rem 1.5rem 1.25rem;
      border: var(--border-w) solid var(--border-soft);
      border-radius: var(--radius-lg);
      background: var(--paper);
      box-shadow: var(--shadow-hard-sm);
      cursor: default;
    }

    .line {
      max-width: 58ch;
      min-height: 9.5rem;
      font-size: var(--step-0);
      line-height: 1.7;
    }

    .cursor {
      display: inline-block;
      width: 0.55em;
      height: 1em;
      margin-left: 2px;
      background: var(--ink);
      vertical-align: -0.12em;
      animation: anim-blink 700ms steps(1, end) infinite;
    }

    .marker {
      position: absolute;
      right: 0.9rem;
      bottom: 0.75rem;
      color: var(--accent-deep);
      opacity: 0;
    }

    .marker--on {
      opacity: 1;
      animation: anim-blink 900ms steps(1, end) infinite;
    }

    @media (min-width: 48rem) {
      .line {
        min-height: 7.5rem;
        font-size: var(--step-1);
      }
    }
  `
})
export class DialogBox {
  readonly text = input.required<string>();
  /** Milissegundos por caractere. */
  readonly speed = input(16);

  private readonly cursor = signal(0);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly typed = computed(() => this.text().slice(0, this.cursor()));
  protected readonly done = computed(() => this.cursor() >= this.text().length);

  constructor() {
    effect((onCleanup) => {
      const full = this.text();
      if (prefersReducedMotion()) {
        this.cursor.set(full.length);
        return;
      }

      this.cursor.set(0);
      const timer = setInterval(() => {
        this.cursor.update((value) => value + 1);
        if (this.cursor() >= full.length) {
          clearInterval(timer);
        }
      }, this.speed());

      onCleanup(() => clearInterval(timer));
    });

    this.destroyRef.onDestroy(() => this.cursor.set(0));
  }

  protected reveal(): void {
    this.cursor.set(this.text().length);
  }
}

function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
