import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OobCheck } from '../models/auth.model';

/**
 * As três chamadas da tela `/acesso` (spec 020).
 *
 * **O front não fala com o Firebase, e é este serviço que garante isso.** A
 * alternativa óbvia é instalar o SDK web do Firebase e chamar
 * `verifyPasswordResetCode` e `confirmPasswordReset` daqui — é menos código e é
 * o que a documentação do Firebase mostra. Também é a decisão 2 da spec 005
 * sendo desfeita pela porta dos fundos: um segundo caminho de login instalado
 * ao lado do primeiro, para sempre, por causa de uma tela. O `oobCode` vai para
 * a nossa API, e é ela que fala com o Identity Toolkit.
 *
 * **Sem `AuthStore`, sem `withCredentials`, sem token.** São três rotas
 * públicas, e a única credencial em jogo é o `oobCode` do corpo — quem está
 * nesta tela ainda não tem sessão, e é exatamente por isso que ela existe.
 *
 * **O `oobCode` não é guardado em lugar nenhum daqui.** Ele chega por
 * parâmetro, vai no corpo e some. Um código de uso único guardado fora da tela
 * que o usa é um código que sobrevive à tela (decisão 9).
 */
@Injectable({ providedIn: 'root' })
export class AccessService {
  private readonly http = inject(HttpClient);

  /**
   * Confere o código **sem consumi-lo** e diz de quem é o link.
   *
   * A tela chama isto antes de desenhar o formulário: sem a conferência, quem
   * clicou num link expirado escolhe uma senha, digita duas vezes, submete, e
   * só então descobre que o link morreu.
   */
  checkOobCode(oobCode: string): Observable<OobCheck> {
    return this.http.post<OobCheck>(`${environment.apiUrl}/auth/password/check`, {
      oobCode
    });
  }

  /**
   * Define a senha e encerra. **Não devolve sessão, e não deveria.**
   *
   * A resposta é `204` sem corpo: o front não recebe material de sessão de
   * nenhum caminho que não seja o login (spec 005, decisão 5). Quem acabou de
   * criar a senha entra com ela na hora, o que é, de quebra, a prova de que ela
   * é a senha que a pessoa achou que digitou.
   */
  confirmPassword(oobCode: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/password`, {
      oobCode,
      newPassword
    });
  }

  /**
   * Aplica a ação de e-mail que o código carrega, e devolve o e-mail final.
   *
   * Uma chamada para `verifyAndChangeEmail`, `verifyEmail` e `recoverEmail`:
   * **quem decide qual delas é o próprio `oobCode`**, no servidor. O `mode` da
   * URL escolhe a tela, e nunca a operação — mandá-lo no corpo "por garantia"
   * seria pedir à API que confiasse na query de um link.
   */
  applyEmailAction(oobCode: string): Observable<OobCheck> {
    return this.http.post<OobCheck>(`${environment.apiUrl}/auth/email-action`, {
      oobCode
    });
  }
}
