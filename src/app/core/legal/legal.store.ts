import { Injectable, computed, signal } from '@angular/core';
import { LegalDocumentSummary } from '../../models/legal.model';

/**
 * O que ainda falta esta pessoa aceitar (spec 018, decisão 8).
 *
 * Preenchido de dois lugares, e não é redundância:
 *
 * - **`GET /me`**, na carga do shell — o painel já nasce bloqueado, sem esperar
 *   uma requisição qualquer falhar por acaso e desenhar meia tela antes;
 * - **o `428`, no interceptor** — pega a versão publicada enquanto a pessoa
 *   estava com a aba aberta, que é o caso que nenhuma checagem de carregamento
 *   alcança.
 *
 * Só o primeiro, e quem ficou logado durante o deploy usa o produto a semana
 * inteira sob o texto antigo. Só o segundo, e o bloqueio aparece quando calhar.
 *
 * **Nada disto encosta no `localStorage`** (decisão 9). Um flag local mentiria
 * nas duas direções: navegador limpo faria quem já aceitou aceitar de novo, e —
 * pior — um flag "aceito" gravado por engano esconderia um pendente real e o
 * bloqueio nunca apareceria. O aceite é do servidor, e só.
 */
@Injectable({ providedIn: 'root' })
export class LegalStore {
  private readonly _pending = signal<readonly LegalDocumentSummary[]>([]);

  readonly pending = this._pending.asReadonly();
  readonly hasPending = computed(() => this._pending().length > 0);

  setPending(pending: readonly LegalDocumentSummary[]): void {
    this._pending.set([...pending]);
  }

  /**
   * Tira um documento da lista depois do aceite.
   *
   * O bloqueio some sozinho quando o último pendente sai — sem recarregar a
   * página e sem uma segunda ida ao servidor para confirmar o que a resposta
   * `204` já confirmou.
   */
  clearOne(documentId: string): void {
    this._pending.update((pending) => pending.filter((doc) => doc.id !== documentId));
  }

  clear(): void {
    this._pending.set([]);
  }
}
