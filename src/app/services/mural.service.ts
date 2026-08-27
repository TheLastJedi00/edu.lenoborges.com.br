import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateQuestionRequest,
  MuralQuestion,
  MuralState,
  MuralWinner,
  PromotionTarget
} from '../models/mural.model';

@Injectable({ providedIn: 'root' })
export class MuralService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/mural`;

  /**
   * Estado do ciclo.
   *
   * **Sem cache.** Ao contrário do catálogo de tiers, isto muda dentro de uma
   * sessão: a semana vira, a pessoa escreve a pergunta dela, `canAsk` deixa de
   * ser verdadeiro. Guardar o primeiro valor faria o botão continuar aberto
   * depois de a pergunta já existir.
   */
  getState(): Observable<MuralState> {
    return this.http.get<MuralState>(this.base);
  }

  /**
   * As perguntas de uma fase.
   *
   * `ordem: 'recentes'` inverte a coleta para a mais nova primeiro, e existe
   * para quem chegou por uma notificação de pergunta nova (spec 012): na ordem
   * padrão, a pergunta anunciada está no fim de tudo. **Sem o parâmetro nada
   * muda** — quem entra pelo menu continua lendo a semana do começo.
   */
  listQuestions(
    fase: 'coleta' | 'votacao',
    ordem?: 'recentes'
  ): Observable<MuralQuestion[]> {
    let params = new HttpParams().set('fase', fase);
    if (ordem) {
      params = params.set('ordem', ordem);
    }

    return this.http.get<MuralQuestion[]>(`${this.base}/perguntas`, { params });
  }

  listWinners(): Observable<MuralWinner[]> {
    return this.http.get<MuralWinner[]>(`${this.base}/vencedoras`);
  }

  createQuestion(body: CreateQuestionRequest): Observable<MuralQuestion> {
    return this.http.post<MuralQuestion>(`${this.base}/perguntas`, body);
  }

  updateQuestion(
    id: string,
    body: { title?: string; body?: string }
  ): Observable<MuralQuestion> {
    return this.http.put<MuralQuestion>(`${this.base}/perguntas/${id}`, body);
  }

  /**
   * Vota e desvota.
   *
   * A tela é otimista: pinta antes de a resposta chegar, e reverte se falhar. O
   * backend escreve num lote atômico, então o rollback é sempre para um estado
   * íntegro — não existe meio-votado.
   */
  vote(questionId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/perguntas/${questionId}/voto`, {});
  }

  unvote(questionId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/perguntas/${questionId}/voto`);
  }

  /**
   * Adianta uma pergunta (spec 016). Só admin.
   *
   * **A resposta é a pergunta nova, e é ela que a tela usa.** Recalcular a fase
   * no cliente depois de promover seria reimplementar a regra do lado errado —
   * a fase é o maior entre a conta do relógio e o piso da promoção, e essa
   * conta tem um dono só, no servidor.
   *
   * A promoção é de mão única: não existe desfazer, e por isso a tela confirma
   * antes. O caminho de arrependimento é o `removeQuestion` daqui de baixo.
   */
  promoteQuestion(
    id: string,
    fase: PromotionTarget
  ): Observable<MuralQuestion> {
    return this.http.patch<MuralQuestion>(
      `${environment.apiUrl}/admin/mural/perguntas/${id}/fase`,
      { fase }
    );
  }

  /** Moderação: remove pergunta ofensiva, duplicada ou fora de tema. */
  removeQuestion(id: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/admin/mural/perguntas/${id}`
    );
  }
}
