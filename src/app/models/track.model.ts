/**
 * Conteúdo da trilha (spec 009).
 *
 * O vídeo é hospedado no YouTube, mas o **título é nosso**: o de lá é escrito
 * para o algoritmo, e este diz onde a pessoa está na trilha.
 */
export type BadgeVideoKind = 'aula' | 'resposta';

/**
 * A lista em que o vídeo aparece (spec 021).
 *
 * **`kind` é a natureza do vídeo e `tab` é a lista em que ele aparece.** Os
 * dois divergem em exatamente um caso, e é o desta spec: a resposta que o admin
 * posicionou na trilha tem `kind: 'resposta'` e `tab: 'aula'`.
 *
 * Toda listagem e toda reordenação são por este campo. Ler `kind` para decidir
 * em que aba um vídeo aparece é o erro que esta spec inteira existe para
 * separar.
 */
export type BadgeVideoTab = 'aula' | 'resposta';

/**
 * A proporção do player (spec 017).
 *
 * `retrato` é 9:16 — o Short em que os vídeos de resposta são gravados —, e
 * `paisagem` é 16:9.
 */
export type VideoOrientation = 'paisagem' | 'retrato';

/**
 * A pergunta que um vídeo de resposta responde, **como ela estava quando o
 * vídeo foi publicado**.
 *
 * É uma foto, e não uma leitura do Mural: ela chega dentro do vídeo, e é o que
 * a tela usa para desenhar o balão sem uma segunda requisição. Duas
 * consequências que quem consome precisa saber:
 *
 * - **o texto pode divergir do texto atual da pergunta no Mural**, se o autor a
 *   editou depois — e isso é o comportamento certo, porque o vídeo respondeu o
 *   que foi perguntado;
 * - **`askedAt` é a data da pergunta, nunca a da publicação do vídeo.**
 */
export interface AnsweredQuestion {
  readonly id: string;
  readonly title: string;
  readonly authorName: string;
  /** ISO 8601. Quando a pergunta foi feita. */
  readonly askedAt: string;
}

export interface BadgeVideo {
  readonly id: string;
  readonly badgeId: string;
  /** O título da plataforma. Nunca o do YouTube. */
  readonly title: string;
  readonly description: string | null;
  /** Só o ID do vídeo. A URL de embed é derivada, não guardada. */
  readonly youtubeId: string;
  /**
   * A **natureza** do vídeo (spec 010), e não a lista em que ele aparece —
   * essa é `tab`.
   *
   * Aula se assiste em ordem; resposta tem pergunta, tem balão e é Short. É de
   * `kind` que `orientation` sai, e continua saindo depois da spec 021.
   */
  readonly kind: BadgeVideoKind;
  /**
   * A **lista** em que o vídeo aparece (spec 021).
   *
   * `kind` é a natureza, `tab` é a lista, e os dois divergem em exatamente um
   * caso: a resposta posicionada na trilha, com `kind: 'resposta'` e
   * `tab: 'aula'`. Ela continua com balão, continua em `retrato` e continua
   * carregando a pergunta — o que mudou foi o endereço.
   *
   * Vídeo publicado antes da spec 021 chega com `tab` igual ao `kind` dele,
   * que é onde ele já estava: o servidor deriva no converter, e nenhum
   * documento foi migrado.
   */
  readonly tab: BadgeVideoTab;
  /** A pergunta do Mural que originou a resposta. Nulo em toda aula. */
  readonly questionId: string | null;
  /**
   * A foto da pergunta, para o balão acima do player (spec 017).
   *
   * `null` em toda aula **e em todo vídeo publicado antes da spec 017** —
   * inclusive nos marcados como resposta. A tela desenha o balão quando ele
   * existe e não reserva espaço quando não existe.
   */
  readonly question: AnsweredQuestion | null;
  /**
   * A proporção do player, **derivada no servidor** (spec 017).
   *
   * **Não se deriva de `kind` aqui, e nem de `tab`.** Seria uma linha, e é por
   * ser uma linha que ela viraria três — template, folha de estilo e teste —,
   * cada uma envelhecendo por conta própria. O servidor afirma, a tela obedece,
   * e o dia em que existir uma resposta longa em paisagem nenhum arquivo daqui
   * muda. **A decisão 4 da spec 017 não é revogada pela 021:** a resposta
   * posicionada na trilha continua chegando `retrato`, e o que a tela decide é
   * apenas **onde** pintar esse retrato — dentro de um modal, e não na coluna
   * da trilha.
   */
  readonly orientation: VideoOrientation;
  /** Livre para todos, mesmo numa insígnia adiantada. */
  readonly devTierFree: boolean;
  readonly order: number;
  /**
   * Se **quem pediu esta lista** já marcou o vídeo como assistido (spec 019).
   *
   * É o único campo desta lista que muda de membro para membro: a resposta
   * deixou de ser igual para todo mundo. Vídeo sem registro chega `false` — não
   * existe "não sei" aqui, e a tela não precisa de um terceiro estado.
   */
  readonly watched: boolean;
}

/**
 * A resposta de `PUT /me/watched-videos/:videoId` (spec 019).
 *
 * **O `xp` vem daqui, calculado.** É a razão de a rota devolver corpo em vez de
 * 204: quem marca está na tela da insígnia e o número mora no painel, e sem ele
 * a tela teria de escolher entre um `GET /me` por clique ou somar 10 sozinha —
 * que erra em todo vídeo remarcado, porque remarcar não paga XP.
 */
export interface WatchedVideoResult {
  readonly videoId: string;
  readonly watched: boolean;
  readonly xp: number;
}

export interface BadgeVideoList {
  readonly badgeId: string;
  /** Já na ordem que o servidor mandou. O front não reordena. */
  readonly videos: readonly BadgeVideo[];
}

/**
 * Monta a URL de embed a partir do ID.
 *
 * Derivada e não guardada: se a URL viesse do banco, trocar de parâmetro (um
 * `rel=0`, um `modestbranding`) exigiria reescrever todos os documentos.
 */
export function youtubeEmbedUrl(youtubeId: string): string {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`;
}
