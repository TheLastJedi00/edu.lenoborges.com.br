import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AudienceCount,
  CampaignResult,
  EmailCampaign,
  EmailFilters,
  SendEmailRequest
} from '../models/email.model';

@Injectable({ providedIn: 'root' })
export class EmailService {
  private readonly http = inject(HttpClient);
  private readonly admin = `${environment.apiUrl}/admin/emails`;

  /**
   * Quantas pessoas um conjunto de filtros pega.
   *
   * A resposta é **só o número**: a rota não devolve a lista de e-mails, e a tela
   * não precisa dela. Filtro ausente significa todos os membros.
   */
  audiencia(filters: EmailFilters): Observable<AudienceCount> {
    return this.http.post<AudienceCount>(`${this.admin}/audiencia`, filters);
  }

  /** Manda o e-mail montado para o próprio admin. **Não cria campanha.** */
  enviarTeste(payload: SendEmailRequest): Observable<void> {
    return this.http.post<void>(`${this.admin}/teste`, payload);
  }

  /**
   * Cria a campanha e dispara.
   *
   * **O envio acontece dentro desta requisição**, e a resposta é o resultado, não
   * um aceite. Uma falha aqui não significa "não enviou": o backend gravou a
   * campanha antes do primeiro lote e guarda onde parou.
   */
  enviar(payload: SendEmailRequest): Observable<CampaignResult> {
    return this.http.post<CampaignResult>(this.admin, payload);
  }

  /** Continua uma campanha interrompida a partir do cursor, e nunca do começo. */
  retomar(id: string): Observable<CampaignResult> {
    return this.http.post<CampaignResult>(`${this.admin}/${id}/retomar`, {});
  }

  listar(): Observable<EmailCampaign[]> {
    return this.http.get<EmailCampaign[]>(this.admin);
  }

  /**
   * Sai da lista de e-mails, pelo token do rodapé.
   *
   * **É chamada pública, feita por quem pode não ter sessão nenhuma** — a pessoa
   * está lendo o e-mail no celular do trabalho, num navegador onde nunca entrou.
   * O endpoint não exige `Authorization`, e o interceptor anexar um token quando
   * ele existe não muda nada: a rota não olha o header.
   *
   * Responde `204` sempre, inclusive com token inválido, e a tela mostra o mesmo
   * sucesso nos dois casos — distinguir seria um oráculo de `uid`.
   */
  descadastrar(token: string): Observable<void> {
    const url = `${environment.apiUrl}/emails/descadastro?token=${encodeURIComponent(token)}`;
    return this.http.post<void>(url, {});
  }
}
