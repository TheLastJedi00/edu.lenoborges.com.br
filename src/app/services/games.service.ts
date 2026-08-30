import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AnswerRequest,
  AnswerResult,
  ChallengeList,
  ChallengeState,
  StartedRound
} from '../models/games.model';

/**
 * O GYM Challenge do lado de quem joga (spec 022).
 *
 * **Este serviço não calcula XP, não conhece a fórmula e não sabe o número 50.**
 * Ele mede tempo — no relógio da página, não aqui — e envia; o servidor decide.
 * É a mesma regra do `TrackService.setWatched` da spec 019, com um motivo a
 * mais: num questionário, a conta na tela é meio caminho para o placar na tela.
 */
@Injectable({ providedIn: 'root' })
export class GamesService {
  private readonly http = inject(HttpClient);

  /**
   * As oito insígnias com o estado do desafio de cada uma.
   *
   * Desembrulha o `challenges` do corpo: a API responde um objeto para poder
   * crescer, e quem consome quer a lista. O desembrulho mora aqui, e não em cada
   * página que a usa.
   *
   * **`hasActiveRound` vem sempre `false` nesta rota**, por decisão do servidor:
   * descobri-lo custaria oito consultas de subcoleção para pintar oito cards.
   * Quem precisa dele é a tela do desafio.
   */
  listChallenges(): Observable<readonly ChallengeState[]> {
    return this.http
      .get<ChallengeList>(`${environment.apiUrl}/games/challenges`)
      .pipe(map((body) => body.challenges));
  }

  getChallenge(badgeId: string): Observable<ChallengeState> {
    return this.http.get<ChallengeState>(
      `${environment.apiUrl}/games/challenges/${badgeId}`
    );
  }

  /**
   * Abre a rodada corrente e recebe as dez questões de uma vez.
   *
   * **As dez juntas, e as respostas uma a uma.** Servir todas deixa o membro
   * inspecionar as perguntas seguintes — e isso é aceito: ele vê as perguntas,
   * não as respostas, e olhar a próxima não dá vantagem quando a pressão é de
   * tempo. A alternativa custaria dez idas ao servidor por rodada, cada pergunta
   * esperando a latência da anterior.
   *
   * Erros que a tela precisa distinguir: `403` (desafio indisponível ou XP
   * insuficiente — **o corpo diz qual**), `409` (já há rodada em andamento).
   */
  startRound(badgeId: string): Observable<StartedRound> {
    return this.http.post<StartedRound>(
      `${environment.apiUrl}/games/challenges/${badgeId}/start`,
      {}
    );
  }

  /**
   * Responde uma questão e recebe o resultado imediato.
   *
   * O `clientElapsedMs` do corpo é medido pelo `answer-clock` da página, com
   * `performance.now()`. **Ele é conferido, não confiado**: o servidor o aceita
   * apenas dentro de uma janela em torno do próprio relógio, e usa o menor dos
   * dois — a latência de rede não é tempo de pensar, e não pode custar XP.
   *
   * **O `totalXp` da resposta é o número que vai para o `AuthStore`.** Somar
   * `xp + xpAwarded` localmente erra no replay (que paga zero) e em toda
   * resposta errada.
   */
  answer(badgeId: string, body: AnswerRequest): Observable<AnswerResult> {
    return this.http.post<AnswerResult>(
      `${environment.apiUrl}/games/challenges/${badgeId}/answer`,
      body
    );
  }
}
