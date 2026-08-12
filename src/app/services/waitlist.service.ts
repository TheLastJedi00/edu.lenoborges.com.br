import { Injectable, signal } from '@angular/core';
import { Observable, defer, delay, of, throwError } from 'rxjs';
import { WaitlistEntry, WaitlistReceipt } from '../models/waitlist.model';

/** Atraso simulado para o estado de envio ser visível na interface. */
const NETWORK_DELAY_MS = 600;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

@Injectable({ providedIn: 'root' })
export class WaitlistService {
  private readonly entries = signal<readonly WaitlistEntry[]>([]);

  /** Inscrições confirmadas nesta sessão. Enquanto não há API, é o único registro que existe. */
  readonly sent = this.entries.asReadonly();

  /**
   * Registra o interesse em entrar na Seita Dev.
   * O envio é mockado: não há API por trás ainda, só o contrato que a API futura deve cumprir.
   */
  submit(entry: WaitlistEntry): Observable<WaitlistReceipt> {
    return defer(() => {
      const normalized = this.normalize(entry);
      const failure = this.validate(normalized);

      if (failure) {
        return throwError(() => new Error(failure));
      }

      const receipt: WaitlistReceipt = {
        id: this.newId(),
        receivedAt: new Date()
      };

      this.entries.update((current) => [...current, normalized]);

      return of(receipt).pipe(delay(NETWORK_DELAY_MS));
    });
  }

  private normalize(entry: WaitlistEntry): WaitlistEntry {
    return {
      name: entry.name.trim().replace(/\s+/g, ' '),
      phone: entry.phone.replace(/\D/g, ''),
      email: entry.email.trim().toLowerCase(),
      consent: entry.consent
    };
  }

  /** O formulário já bloqueia entrada inválida; o service não confia no chamador. */
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

  private newId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `waitlist-${Date.now()}`;
  }
}
