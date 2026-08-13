import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { WaitlistEntry, WaitlistReceipt } from '../models/waitlist.model';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** O backend serializa em JSON, então receivedAt chega como string ISO. */
interface WaitlistReceiptResponse {
  readonly id: string;
  readonly receivedAt: string;
}

@Injectable({ providedIn: 'root' })
export class WaitlistService {
  private readonly http = inject(HttpClient);

  /**
   * Registra o interesse em entrar na Seita Dev.
   *
   * E-mail repetido não é erro: o backend é idempotente e devolve o recibo original,
   * então quem clica duas vezes vê sucesso.
   */
  submit(entry: WaitlistEntry): Observable<WaitlistReceipt> {
    const normalized = this.normalize(entry);
    const failure = this.validate(normalized);

    if (failure) {
      return throwError(() => new Error(failure));
    }

    return this.http
      .post<WaitlistReceiptResponse>(`${environment.apiUrl}/waitlist`, normalized)
      .pipe(
        map((response) => ({
          id: response.id,
          receivedAt: new Date(response.receivedAt)
        }))
      );
  }

  private normalize(entry: WaitlistEntry): WaitlistEntry {
    return {
      name: entry.name.trim().replace(/\s+/g, ' '),
      phone: entry.phone.replace(/\D/g, ''),
      email: entry.email.trim().toLowerCase(),
      consent: entry.consent
    };
  }

  /**
   * O formulário já bloqueia entrada inválida; o service não confia no chamador.
   * Barrar aqui também evita gastar uma das 5 requisições por minuto que o backend permite.
   */
  private validate(entry: WaitlistEntry): string | null {
    if (!entry.consent) {
      return 'É preciso dar consentimento para o uso dos dados.';
    }

    if (entry.name.length < 2) {
      return 'Informe o seu nome.';
    }

    if (entry.phone.length < 10 || entry.phone.length > 11) {
      return 'Informe um telefone com DDD.';
    }

    if (!EMAIL_PATTERN.test(entry.email)) {
      return 'Informe um e-mail válido.';
    }

    return null;
  }
}
