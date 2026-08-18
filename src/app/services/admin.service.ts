import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AdminUserPage,
  CreateVideoRequest,
  UpdateVideoRequest
} from '../models/admin.model';
import { BadgeVideo, BadgeVideoList } from '../models/track.model';

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
  reorderVideos(badgeId: string, videoIds: readonly string[]): Observable<void> {
    return this.http.patch<void>(`${this.base}/badges/${badgeId}/videos/order`, {
      videoIds
    });
  }
}
