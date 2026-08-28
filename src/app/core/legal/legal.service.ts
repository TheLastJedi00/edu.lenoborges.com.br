import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LegalDocument,
  LegalDocumentSummary
} from '../../models/legal.model';

@Injectable({ providedIn: 'root' })
export class LegalService {
  private readonly http = inject(HttpClient);

  /** Público: funciona sem sessão, e é o que o rodapé da landing usa. */
  list(): Observable<LegalDocumentSummary[]> {
    return this.http.get<LegalDocumentSummary[]>(`${environment.apiUrl}/legal/documents`);
  }

  getById(id: string): Observable<LegalDocument> {
    return this.http.get<LegalDocument>(`${environment.apiUrl}/legal/documents/${id}`);
  }

  /**
   * Registra o aceite de **um** documento (spec 018, decisão 5).
   *
   * **É o único caminho de gravação de aceite do front**, e é chamado dos dois
   * lugares que precisam: os botões do onboarding e o modal de bloqueio do
   * painel. Um segundo caminho seria o que esquece um campo, ou grava o
   * documento errado, no dia em que o terceiro documento entrar.
   *
   * **A versão vai no corpo, e vem do documento que a pessoa acabou de ler** —
   * nunca de uma constante daqui. Sem ela o backend adivinharia a versão e o
   * `409` de aba velha nunca aconteceria: quem está com a aba aberta desde antes
   * do deploy registraria concordância com um texto que ninguém mais vê.
   */
  accept(documentId: string, version: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/me/legal-acceptances`, {
      documentId,
      version
    });
  }
}
