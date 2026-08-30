import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RankingPage } from '../models/games.model';

/** O tamanho de página que a tela pede. O teto do servidor é 50. */
export const RANKING_PAGE_SIZE = 20;

/**
 * O Ranking da Liga (spec 022).
 *
 * **A paginação é por cursor, e o cursor é opaco.** A tela devolve o
 * `nextCursor` que recebeu e não monta um: a forma dele é do servidor, e o dia
 * em que o desempate da ordenação mudar não pode quebrar o "Carregar mais" de
 * toda aba aberta.
 *
 * Não é paginação por número de página de propósito: com XP mudando a toda hora,
 * a página 3 de agora não é a página 3 de daqui a um minuto, e um deslocamento
 * numérico faria a rolagem repetir e pular gente.
 */
@Injectable({ providedIn: 'root' })
export class RankingService {
  private readonly http = inject(HttpClient);

  /**
   * Uma página do placar, com a posição do membro logado.
   *
   * `myPosition` vem sempre, mesmo que ele não esteja nesta página — é a linha
   * fixa do topo da tela. Vem `null` para quem ainda não escolheu gamertag: quem
   * não tem nome no placar não tem posição nele.
   */
  page(after?: string | null): Observable<RankingPage> {
    let params = new HttpParams().set('limit', RANKING_PAGE_SIZE);

    if (after) {
      params = params.set('after', after);
    }

    return this.http.get<RankingPage>(`${environment.apiUrl}/ranking`, {
      params
    });
  }
}
