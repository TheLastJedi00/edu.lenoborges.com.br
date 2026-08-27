import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { dataDeVersao } from '../../core/datas';
import { LegalDocument } from '../../models/legal.model';

/**
 * Desenha um documento legal (spec 018, decisão 3).
 *
 * Não tem check, não tem botão, não sabe o que é aceite e não faz requisição.
 * Três telas o usam — a página pública, o modal de aceite e a consulta em Meu
 * Perfil —, e é uma cópia só de propósito: duas diagramações do mesmo texto
 * divergem, e a que fica errada é sempre a que ninguém abre.
 *
 * **Zero `innerHTML`, zero `DomSanitizer`, e não é excesso de zelo.** É a única
 * forma de garantir que este caminho continue seguro depois que alguém resolver
 * que o texto legal ficaria melhor em markdown: o dia em que houver um
 * `bypassSecurityTrustHtml` aqui, ele fica — e a fonte do texto pode deixar de
 * ser uma constante do backend sem que ninguém reveja aquela linha.
 */
@Component({
  selector: 'app-legal-document-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="doc">
      <header class="doc__head">
        <h2 class="doc__title">{{ document().title }}</h2>
        <p class="doc__version u-mono">Versão de {{ versionLabel() }}</p>
      </header>

      @for (section of document().sections; track section.heading) {
        <section class="doc__section">
          <h3 class="doc__heading">{{ section.heading }}</h3>
          @for (paragraph of section.paragraphs; track $index) {
            <p class="doc__paragraph">{{ paragraph }}</p>
          }
        </section>
      }
    </article>
  `,
  styles: `
    :host {
      display: block;
    }

    .doc__head {
      padding-bottom: 0.75rem;
      border-bottom: var(--border-w) solid var(--border-soft);
    }

    .doc__title {
      font-family: var(--font-display);
      font-size: var(--step-1);
      font-weight: 700;
      line-height: 1.25;
      color: var(--ink);
    }

    .doc__version {
      margin-top: 0.25rem;
      font-size: var(--step--2);
      color: var(--ink-soft);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .doc__section {
      margin-top: 1.5rem;
    }

    .doc__heading {
      font-family: var(--font-display);
      font-size: var(--step-0);
      font-weight: 700;
      color: var(--ink);
    }

    .doc__paragraph {
      margin-top: 0.6rem;
      max-width: 68ch;
      font-size: var(--step--1);
      line-height: 1.65;
      color: var(--ink-soft);
      text-wrap: pretty;
    }
  `
})
export class LegalDocumentView {
  readonly document = input.required<LegalDocument>();

  /** `2026-08-27` vira `27/08/2026`. Ver `dataDeVersao` — não usa `Date`. */
  protected readonly versionLabel = computed(() => dataDeVersao(this.document().version));
}
