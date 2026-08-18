import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { TierCatalog } from '../models/billing.model';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);

  /**
   * Cache de sessão.
   *
   * A tabela de preços não muda enquanto a pessoa navega — ela muda num deploy —,
   * então refazer a chamada a cada visita à aba do Financeiro é gasto sem
   * retorno, e ainda faz a tela piscar o esqueleto de novo. `shareReplay(1)`
   * mantém a resposta viva pelo tempo de vida do service, que é o da aba.
   *
   * `refCount` fica **falso** de propósito: com ele, a assinatura sendo
   * descartada ao sair da tela apagaria o cache, e voltar à aba refaria a
   * requisição — que é exatamente o caso que este cache existe para evitar.
   */
  private catalog$?: Observable<TierCatalog>;

  getCatalog(): Observable<TierCatalog> {
    this.catalog$ ??= this.http
      .get<TierCatalog>(`${environment.apiUrl}/billing/tiers`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));

    return this.catalog$;
  }
}
