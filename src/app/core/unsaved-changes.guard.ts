import { CanDeactivateFn } from '@angular/router';

/**
 * O que uma tela precisa expor para poder segurar a saída.
 *
 * A pergunta é da tela, não do roteador: só ela sabe se o que está na mão da
 * pessoa foi salvo.
 */
export interface CanDeactivateComponent {
  canDeactivate(): boolean | Promise<boolean>;
}

/**
 * Segura a navegação quando há alteração não salva (spec 013, decisão 2).
 *
 * **Um diálogo, e não um `beforeunload`.** Trocar de aba do painel é um clique,
 * e a bio é o campo mais longo que o produto tem — o `beforeunload` do navegador
 * nem chega a rodar numa navegação interna do Angular, e onde roda mostra um
 * texto que não é nosso.
 */
export const unsavedChangesGuard: CanDeactivateFn<CanDeactivateComponent> = (component) =>
  component.canDeactivate();
