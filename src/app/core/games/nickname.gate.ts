import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  createComponent,
  inject,
  signal
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NicknameDialog } from '../../components/nickname-dialog/nickname-dialog';
import { AuthService } from '../auth/auth.service';

/**
 * Quem monta e desmonta o modal da gamertag (spec 022, decisão 16).
 *
 * **Existe porque um guard não tem template.** O `nicknameGuard` precisa mostrar
 * uma tela e esperar uma resposta, e a alternativa — redirecionar para uma rota
 * `/dashboard/gamertag` — trocaria um modal por uma navegação que tira a pessoa
 * de onde ela estava e a devolve num lugar diferente do que ela pediu.
 *
 * O componente é criado direto na `<body>` com `createComponent`, e não dentro
 * de um `<ng-container>` de alguma página: **nenhuma página deveria hospedar o
 * bloqueio de uma rota que ela não conhece**, e as quatro telas de Jogos teriam
 * que hospedá-lo todas.
 */
@Injectable({ providedIn: 'root' })
export class NicknameGate {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly auth = inject(AuthService);

  /** Um modal por vez. Dois navegações rápidas não abrem dois. */
  private ref: ComponentRef<NicknameDialog> | null = null;

  /**
   * Abre o modal e resolve com `true` quando a gamertag for gravada.
   *
   * Resolve com `false` quando a pessoa desistir — e desistir é uma saída
   * legítima: prender alguém numa tela sem saída seria pior do que a tela não
   * existir. Quem sai não entra em Jogos, e é só isso.
   */
  ask(): Promise<boolean> {
    // Já há um modal aberto: a navegação anterior ainda está pendente, e abrir
    // um segundo criaria dois donos para a mesma resposta.
    if (this.ref) {
      return Promise.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
      const pending = signal(false);
      const error = signal<string | null>(null);

      const ref = createComponent(NicknameDialog, {
        environmentInjector: this.injector
      });

      this.ref = ref;
      ref.setInput('pending', pending());
      ref.setInput('error', error());

      const sync = () => {
        ref.setInput('pending', pending());
        ref.setInput('error', error());
        ref.changeDetectorRef.detectChanges();
      };

      const close = (ok: boolean) => {
        ref.destroy();
        this.ref = null;
        resolve(ok);
      };

      ref.instance.dismissed.subscribe(() => close(false));

      ref.instance.submitted.subscribe((nickname: string) => {
        pending.set(true);
        error.set(null);
        sync();

        firstValueFrom(this.auth.setNickname(nickname))
          .then(() => close(true))
          .catch((failure: unknown) => {
            pending.set(false);
            error.set(this.mensagemDe(failure));
            sync();
          });
      });

      this.appRef.attachView(ref.hostView);
      document.body.appendChild(ref.location.nativeElement as HTMLElement);
      ref.changeDetectorRef.detectChanges();
    });
  }

  /**
   * A mensagem que a pessoa lê.
   *
   * **Vem do corpo, e nunca do status**: o `409` tem dois motivos — "você já tem
   * uma" e "esse nome é de outra pessoa" — e só o segundo é resolvível nesta
   * tela. O primeiro não deveria acontecer, porque o campo fica travado em Meu
   * Perfil, mas se acontecer a pessoa precisa entender por quê.
   */
  private mensagemDe(failure: unknown): string {
    if (failure instanceof HttpErrorResponse) {
      const body = failure.error as { message?: string | string[] } | null;
      const message = Array.isArray(body?.message)
        ? body?.message[0]
        : body?.message;

      if (typeof message === 'string' && message.length > 0) {
        return message;
      }

      if (failure.status === 409) {
        return 'Esse gamertag já está em uso. Escolha outro.';
      }
    }

    return 'Não foi possível salvar seu gamertag agora. Tente de novo.';
  }
}
