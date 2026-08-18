import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateQuestionRequest,
  MuralQuestion,
  MuralState,
  MuralWinner
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

  listQuestions(fase: 'coleta' | 'votacao'): Observable<MuralQuestion[]> {
    return this.http.get<MuralQuestion[]>(`${this.base}/perguntas`, {
      params: new HttpParams().set('fase', fase)
    });
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

  /** Moderação: remove pergunta ofensiva, duplicada ou fora de tema. */
  removeQuestion(id: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/admin/mural/perguntas/${id}`
    );
  }
}
