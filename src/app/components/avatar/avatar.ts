import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg';

/**
 * A foto de um membro, com as iniciais no lugar dela quando não há foto (spec 027).
 *
 * **Este componente é o único lugar que decide o que aparece sem foto, e ele nasce
 * junto com a necessidade.** Antes da spec 027 não existia avatar em tela nenhuma e
 * nenhuma tela desenhava iniciais — o Ranking mostrava só o `nickname`. Três telas
 * passam a mostrar a foto de uma vez (Ranking, cartão de membro e o aside do
 * painel), e a regra do fallback escrita três vezes divergiria na primeira mudança.
 *
 * Dumb component: recebe `avatarUrl` e `name`, e não pergunta nada a ninguém.
 *
 * **`NgOptimizedImage` não serve aqui.** Ele é para imagem estática com dimensão
 * conhecida em build; esta URL chega em runtime, de um bucket, e muda a cada troca
 * de foto.
 */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="avatar" [class]="'avatar--' + size()" aria-hidden="true">
      @if (mostrarFoto()) {
        <img
          class="avatar__img"
          [src]="avatarUrl()"
          [alt]="alt()"
          loading="lazy"
          decoding="async"
          (error)="aoFalhar()"
        />
      } @else {
        <span class="avatar__initials u-mono">{{ iniciais() }}</span>
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }

    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex: none;
      aspect-ratio: 1;
      border-radius: 999px;
      border: var(--border-w) solid var(--screen-deep);
      background: var(--gradient-accent);
      color: var(--paper);
      font-weight: 600;
      line-height: 1;
      user-select: none;
    }

    /* Cobrir e não conter: a foto é recortada em 200x200 no modal, e um retrato
       antigo que escape disso fica melhor cortado do que deformado. */
    .avatar__img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .avatar--sm {
      width: 2rem;
      font-size: var(--step--1);
    }

    .avatar--md {
      width: 3rem;
      font-size: var(--step-0);
    }

    .avatar--lg {
      width: 5rem;
      font-size: var(--step-2);
    }
  `,
})
export class Avatar {
  readonly avatarUrl = input<string | null>(null);
  readonly name = input<string | null>(null);
  readonly size = input<AvatarSize>('md');

  /**
   * Se a URL atual já falhou ao carregar.
   *
   * **Ele é zerado quando a URL muda**, e não é detalhe: sem o `effect`, trocar a
   * foto na mesma tela onde uma falhou mostraria as iniciais para sempre. O
   * sinalizador é da URL, não do componente.
   */
  private readonly falhou = signal(false);

  constructor() {
    effect(() => {
      this.avatarUrl();
      this.falhou.set(false);
    });
  }

  readonly mostrarFoto = computed(() => !!this.avatarUrl() && !this.falhou());

  readonly alt = computed(() => `Foto de ${this.name()?.trim() || 'membro'}`);

  /**
   * Primeira e última palavra do nome.
   *
   * **A última, e não a segunda**: "Ana Carolina Prado" é AP, que é como a pessoa
   * assina. Duas primeiras daria AC, que não é o nome de ninguém.
   */
  readonly iniciais = computed(() => {
    const partes = (this.name() ?? '')
      .trim()
      .split(/\s+/)
      .filter((p) => p.length > 0);

    if (partes.length === 0) {
      // Um espaço em branco dentro de um círculo colorido parece defeito.
      return '?';
    }

    const primeira = partes[0][0];
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';

    return (primeira + ultima).toUpperCase();
  });

  aoFalhar(): void {
    this.falhou.set(true);
  }
}
