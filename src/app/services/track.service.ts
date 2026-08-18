import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BadgeVideoKind, BadgeVideoList } from '../models/track.model';

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
}
