import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppNotification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/notificacoes`;

  /**
   * As não lidas desta pessoa.
   *
   * **Lista vazia é sucesso**, e é o estado normal: na maioria dos dias não há
   * nada novo. Tratar vazio como erro faria o painel abrir com uma falha onde
   * deveria dizer que não há novidade.
   *
   * A resposta já vem peneirada pela API. O front não filtra.
   */
  list(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(this.base);
  }

  /**
   * Marca uma como lida.
   *
   * Tem **dois chamadores**: abrir o modal da notificação e o botão de check da
   * linha. A API é idempotente de propósito por causa disso — marcar duas vezes
   * é rotina, não erro.
   */
  markRead(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/lida`, {});
  }

  /** Esvazia a lista. É o que impede quem não usa o recurso de carregar um contador para sempre. */
  markAllRead(): Observable<void> {
    return this.http.post<void>(`${this.base}/lidas`, {});
  }
}
