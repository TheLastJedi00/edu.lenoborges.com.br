import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PublicMember } from '../models/auth.model';

/**
 * O cartão de outro membro (spec 019).
 *
 * Serviço próprio, e não um método no `AuthService`: aquele é o dono das
 * escritas em `/me` — o que a pessoa faz consigo mesma. Isto é leitura de
 * `/members/:uid`, que é outra pessoa e outro recurso.
 */
@Injectable({ providedIn: 'root' })
export class MemberService {
  private readonly http = inject(HttpClient);

  /**
   * Busca o cartão, **sem cache** (decisão 9).
   *
   * Abrir o cartão da mesma pessoa duas vezes faz duas requisições, de
   * propósito: o que está lá dentro muda — o XP sobe, a bio é editada, o
   * interruptor das redes é ligado — e um cache mostraria o estado de dez
   * minutos atrás sem nada que denunciasse. O ganho seria uma requisição num
   * gesto que acontece talvez três vezes por sessão.
   *
   * **404 é uma saída normal do produto**, e não uma falha: acontece quando
   * alguém exclui a conta com o Mural aberto em outra aba. Quem chama traduz
   * isso numa frase própria.
   */
  getMember(uid: string): Observable<PublicMember> {
    return this.http.get<PublicMember>(
      `${environment.apiUrl}/members/${uid}`
    );
  }
}
