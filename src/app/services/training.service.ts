import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Training,
  TrainingComment,
  TrainingCommentList,
  TrainingCompletionResult,
  TrainingList,
} from '../models/training.model';

export interface ListCommentsOptions {
  readonly limit?: number;
  /** O `nextCursor` da página anterior. Opaco: é um id, não uma data. */
  readonly after?: string;
}

@Injectable({ providedIn: 'root' })
export class TrainingService {
  private readonly http = inject(HttpClient);

  /**
   * Os desafios de uma insígnia, já na ordem que o servidor mandou.
   *
   * **Lista vazia é uma resposta bem-sucedida**, não um erro: a API responde
   * 200 com `trainings: []` quando a insígnia ainda não tem desafio, e isso é o
   * estado normal do produto. Tratar vazio como falha é o bug mais provável
   * desta camada — é a mesma armadilha que a spec 009 já documentou nos vídeos.
   *
   * 404 aqui significa outra coisa: a insígnia não existe na trilha, o que é
   * bug ou URL adulterada.
   */
  listByBadge(badgeId: string): Observable<TrainingList> {
    return this.http.get<TrainingList>(`${environment.apiUrl}/badges/${badgeId}/trainings`);
  }

  getTraining(trainingId: string): Observable<Training> {
    return this.http.get<Training>(`${environment.apiUrl}/trainings/${trainingId}`);
  }

  /**
   * Conclui o desafio e recebe o XP **calculado pelo servidor**.
   *
   * **A rota é idempotente**: concluir de novo responde 200 com `xpAwarded: 0`
   * e o `xp` intacto. É por isso que a tela pinta o `xp` da resposta em vez de
   * somar o `xpAmount` localmente — a soma acertaria no primeiro clique de cada
   * desafio e erraria em todos os seguintes, e o erro só apareceria quando
   * alguém recarregasse a página e visse o número cair.
   */
  complete(trainingId: string): Observable<TrainingCompletionResult> {
    return this.http.post<TrainingCompletionResult>(
      `${environment.apiUrl}/trainings/${trainingId}/complete`,
      {},
    );
  }

  /**
   * Os comentários do desafio, mais recentes primeiro.
   *
   * **Parâmetro vazio não vai na URL.** Um `after=` vazio acaba virando cursor
   * por string vazia no dia em que a validação do backend mudar, e o sintoma
   * seria uma página que repete a primeira sem nada na tela explicando por quê.
   */
  listComments(
    trainingId: string,
    options: ListCommentsOptions = {},
  ): Observable<TrainingCommentList> {
    let params = new HttpParams();

    if (options.limit !== undefined) {
      params = params.set('limit', options.limit);
    }
    if (options.after) {
      params = params.set('after', options.after);
    }

    return this.http.get<TrainingCommentList>(
      `${environment.apiUrl}/trainings/${trainingId}/comments`,
      params.keys().length ? { params } : undefined,
    );
  }

  /**
   * Comenta no desafio.
   *
   * **Responde 403 para quem é Dev Tier**, e a tela não deve chegar aqui: o
   * campo de texto só existe quando o tier permite. A checagem do servidor é a
   * que vale, e a da tela existe para não oferecer o que vai ser recusado.
   */
  addComment(trainingId: string, content: string): Observable<TrainingComment> {
    return this.http.post<TrainingComment>(
      `${environment.apiUrl}/trainings/${trainingId}/comments`,
      {
        content,
      },
    );
  }
}
