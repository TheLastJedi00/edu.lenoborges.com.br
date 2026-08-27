/**
 * Conteúdo da trilha (spec 009).
 *
 * O vídeo é hospedado no YouTube, mas o **título é nosso**: o de lá é escrito
 * para o algoritmo, e este diz onde a pessoa está na trilha.
 */
export type BadgeVideoKind = 'aula' | 'resposta';

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
   * A aba da insígnia (spec 010).
   *
   * Aula se assiste em ordem; resposta se consulta por assunto. Misturadas, a
   * trilha fica com respostas avulsas no meio da sequência — e a sequência
   * deixa de ser sequência.
   */
  readonly kind: BadgeVideoKind;
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
   * **Não se deriva de `kind` aqui.** Seria uma linha, e é por ser uma linha
   * que ela viraria três — template, folha de estilo e teste —, cada uma
   * envelhecendo por conta própria. O servidor afirma, a tela obedece, e o dia
   * em que existir uma resposta longa em paisagem nenhum arquivo daqui muda.
   */
  readonly orientation: VideoOrientation;
  /** Livre para todos, mesmo numa insígnia adiantada. */
  readonly devTierFree: boolean;
  readonly order: number;
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
