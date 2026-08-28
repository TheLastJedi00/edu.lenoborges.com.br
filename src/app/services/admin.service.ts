import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AdminUserDetail,
  AdminUserFilters,
  AdminUserPage,
  CreateVideoRequest,
  SendDirectEmailRequest,
  UpdateVideoRequest
} from '../models/admin.model';
import type { CampaignResult } from '../models/email.model';
import {
  BadgeVideo,
  BadgeVideoList,
  BadgeVideoTab
} from '../models/track.model';
import type { TierId } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  /**
   * O recorte da base, paginado por `offset` (spec 015).
   *
   * **Parâmetro vazio não vai na URL.** `q=` e `tiers=` vazios são ruído que
   * acaba virando filtro por string vazia no dia em que alguém trocar a
   * validação do backend — e o sintoma seria uma lista vazia sem nada na tela
   * explicando por quê.
   */
  listUsers(
    filters: AdminUserFilters = {},
    offset = 0,
    limit = 50
  ): Observable<AdminUserPage> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);

    if (filters.q) {
      params = params.set('q', filters.q);
    }
    if (filters.onboarding) {
      params = params.set('onboarding', filters.onboarding);
    }
    // Dois tiers viram dois valores do MESMO parametro (`tiers=a&tiers=b`), que
    // e o que o backend le como lista. Uma string com virgulas chegaria la como
    // um tier chamado "a,b", e o recorte voltaria vazio.
    for (const tier of filters.tiers ?? []) {
      params = params.append('tiers', tier);
    }
    if (filters.gradeMin != null) {
      params = params.set('gradeMin', filters.gradeMin);
    }
    if (filters.gradeMax != null) {
      params = params.set('gradeMax', filters.gradeMax);
    }

    return this.http.get<AdminUserPage>(`${this.base}/users`, { params });
  }

  /**
   * Um membro inteiro (spec 015, decisão 9).
   *
   * É uma requisição por clique, e não há cache de nenhum lado. É barato hoje, e
   * a solução preguiçosa — devolver tudo na listagem — é exatamente a decisão 9
   * desfeita: telefone e bio de 200 pessoas trafegando para desenhar 200 linhas.
   */
  getUser(userId: string): Observable<AdminUserDetail> {
    return this.http.get<AdminUserDetail>(`${this.base}/users/${userId}`);
  }

  /**
   * Escreve um e-mail para aquele membro (spec 015, decisão 12).
   *
   * **Sem `ctaLabel` e sem `ctaUrl`, e a ausência é decisão.** É o primeiro
   * campo que alguém vai querer "só adicionar", por simetria com a tela de
   * campanha: um recado para uma pessoa não tem para onde apontar, e o único
   * botão que existiria seria "clique aqui". Quando houver um destino de verdade
   * a apontar, o e-mail que o leva é uma campanha — e a tela de campanha é
   * outra.
   *
   * O que é compartilhado está no backend, e é o que importa: o mesmo caminho de
   * envio, o mesmo template e o **mesmo rodapé de descadastro**.
   */
  enviarEmailDireto(
    userId: string,
    body: SendDirectEmailRequest
  ): Observable<CampaignResult> {
    return this.http.post<CampaignResult>(
      `${this.base}/users/${userId}/email`,
      body
    );
  }

  updateUserGrade(userId: string, grade: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/users/${userId}`, { grade });
  }

  /**
   * Concede ou remove acesso à mão.
   *
   * Manda **só** `tier`, nunca junto de `grade`: são coisas independentes, e um
   * PATCH com os dois escreveria o progresso ao conceder acesso. `tier` é
   * acesso; `grade` é conquista.
   */
  updateUserTier(userId: string, tier: TierId): Observable<void> {
    return this.http.patch<void>(`${this.base}/users/${userId}`, { tier });
  }

  /**
   * Os vídeos de **uma aba** da insígnia (spec 017).
   *
   * O parâmetro entrou junto com a primeira resposta publicável, e não por
   * simetria: **a reordenação valida a lista contra os vídeos daquela aba**, e
   * até aqui a tela listava as duas juntas e mandava essa lista misturada. Não
   * quebrava porque não existia resposta nenhuma; a partir da primeira, seria
   * 400 em toda seta clicada.
   */
  listVideos(
    badgeId: string,
    tab?: BadgeVideoTab
  ): Observable<BadgeVideoList> {
    // A aba é `tab` desde a spec 021, e o nome do argumento importa tanto
    // quanto o do parâmetro: é ele que faz a próxima pessoa mandar a lista, e
    // não a natureza do vídeo. A aba Aulas inclui as respostas posicionadas na
    // trilha, e elas têm `kind: 'resposta'`.
    const params = tab ? new HttpParams().set('tab', tab) : undefined;

    return this.http.get<BadgeVideoList>(
      `${this.base}/badges/${badgeId}/videos`,
      { params }
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
  reorderVideos(
    badgeId: string,
    videoIds: readonly string[],
    tab: BadgeVideoTab = 'aula'
  ): Observable<void> {
    // A ordem é por aba (spec 010): reordenar Aulas não pode mexer nas
    // Perguntas Frequentes, e o `tab` é o que separa as duas sequências.
    //
    // **É `tab`, e não `kind` (spec 021).** A lista da trilha pode conter uma
    // resposta posicionada nela, e é uma lista válida; mandada como `kind`, o
    // backend a validaria contra a outra sequência e responderia 400 em toda
    // seta clicada.
    return this.http.patch<void>(
      `${this.base}/badges/${badgeId}/videos/order`,
      { videoIds },
      { params: new HttpParams().set('tab', tab) }
    );
  }

  listVideosByTab(
    badgeId: string,
    tab: BadgeVideoTab
  ): Observable<BadgeVideoList> {
    return this.http.get<BadgeVideoList>(
      `${this.base}/badges/${badgeId}/videos`,
      { params: new HttpParams().set('tab', tab) }
    );
  }
}
