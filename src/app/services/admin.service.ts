import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AdminUserPage,
  CreateVideoRequest,
  UpdateVideoRequest
} from '../models/admin.model';
import {
  BadgeVideo,
  BadgeVideoKind,
  BadgeVideoList
} from '../models/track.model';
import type { TierId } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  listUsers(pageToken?: string, limit = 50): Observable<AdminUserPage> {
    let params = new HttpParams().set('limit', limit);
    if (pageToken) {
      params = params.set('pageToken', pageToken);
    }

    return this.http.get<AdminUserPage>(`${this.base}/users`, { params });
  }

  updateUserGrade(userId: string, grade: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/users/${userId}`, { grade });
  }

  /**
   * Concede ou remove acesso à mão.
   *
   * Manda **só** `tier`, nunca junto de `grade`: são coisas independentes, e um
   * PATCH com os dois escreveria o progresso ao conceder acesso. `tier` é
   * acesso; `grade` é conquista.
   */
  updateUserTier(userId: string, tier: TierId): Observable<void> {
    return this.http.patch<void>(`${this.base}/users/${userId}`, { tier });
  }

  listVideos(badgeId: string): Observable<BadgeVideoList> {
    return this.http.get<BadgeVideoList>(
      `${this.base}/badges/${badgeId}/videos`
    );
  }

  createVideo(
    badgeId: string,
    body: CreateVideoRequest
  ): Observable<BadgeVideo> {
    return this.http.post<BadgeVideo>(
      `${this.base}/badges/${badgeId}/videos`,
      body
    );
  }

  updateVideo(
    badgeId: string,
    videoId: string,
    body: UpdateVideoRequest
  ): Observable<BadgeVideo> {
    return this.http.patch<BadgeVideo>(
      `${this.base}/badges/${badgeId}/videos/${videoId}`,
      body
    );
  }

  deleteVideo(badgeId: string, videoId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/badges/${badgeId}/videos/${videoId}`
    );
  }

  /**
   * Grava a ordem inteira de uma vez.
   *
   * O backend escreve num lote atômico: ou entram todas as posições ou nenhuma.
   * Por isso a tela pode ser otimista sem risco de estado pela metade — o
   * rollback é sempre para uma lista íntegra.
   */
  reorderVideos(
    badgeId: string,
    videoIds: readonly string[],
    kind: BadgeVideoKind = 'aula'
  ): Observable<void> {
    // A ordem é por aba (spec 010): reordenar Aulas não pode mexer nas
    // Perguntas Frequentes, e o `kind` é o que separa as duas sequências.
    return this.http.patch<void>(
      `${this.base}/badges/${badgeId}/videos/order`,
      { videoIds },
      { params: new HttpParams().set('kind', kind) }
    );
  }

  listVideosByKind(
    badgeId: string,
    kind: BadgeVideoKind
  ): Observable<BadgeVideoList> {
    return this.http.get<BadgeVideoList>(
      `${this.base}/badges/${badgeId}/videos`,
      { params: new HttpParams().set('kind', kind) }
    );
  }
}
