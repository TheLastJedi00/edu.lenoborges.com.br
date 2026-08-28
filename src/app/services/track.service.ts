import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  BadgeVideoKind,
  BadgeVideoList,
  WatchedVideoResult
} from '../models/track.model';

@Injectable({ providedIn: 'root' })
export class TrackService {
  private readonly http = inject(HttpClient);

  /**
   * Vídeos de uma insígnia, já na ordem que o servidor mandou.
   *
   * **Lista vazia é uma resposta bem-sucedida**, não um erro: a API responde 200
   * com `videos: []` quando a insígnia ainda não tem conteúdo, e isso é o estado
   * normal do produto — no lançamento, onze das treze estarão assim. Quem
   * consome precisa distinguir "vazio" de "falhou", e tratar os dois como erro é
   * o bug mais provável desta spec.
   *
   * 404 aqui significa outra coisa: a insígnia não existe na trilha, o que é bug
   * ou URL adulterada.
   */
  getVideos(
    badgeId: string,
    kind?: BadgeVideoKind
  ): Observable<BadgeVideoList> {
    // Sem `kind`, as duas abas juntas. Com ele, só a pedida — que é como a
    // trilha do aluno separa Aulas de Perguntas Frequentes (spec 010).
    const params = kind ? new HttpParams().set('kind', kind) : undefined;

    return this.http.get<BadgeVideoList>(
      `${environment.apiUrl}/badges/${badgeId}/videos`,
      { params }
    );
  }

  /**
   * Marca ou desmarca um vídeo como assistido (spec 019).
   *
   * **O `xp` da resposta é o número novo, e este método não o calcula.** O 10
   * não existe neste repositório, e a tentação de somá-lo localmente para a tela
   * responder mais rápido está errada por um motivo específico: **remarcar um
   * vídeo não paga XP nenhum**. A soma local acertaria no primeiro clique de
   * cada vídeo e erraria em todos os seguintes, e o erro é invisível até alguém
   * recarregar a página e ver o número cair.
   *
   * A rota é idempotente: marcar o que já está marcado responde 200 sem pagar de
   * novo, e desmarcar não devolve o XP já pago.
   */
  setWatched(
    videoId: string,
    watched: boolean
  ): Observable<WatchedVideoResult> {
    return this.http.put<WatchedVideoResult>(
      `${environment.apiUrl}/me/watched-videos/${videoId}`,
      { watched }
    );
  }
}
