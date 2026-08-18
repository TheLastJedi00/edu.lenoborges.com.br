/**
 * Conteúdo da trilha (spec 009).
 *
 * O vídeo é hospedado no YouTube, mas o **título é nosso**: o de lá é escrito
 * para o algoritmo, e este diz onde a pessoa está na trilha.
 */
export interface BadgeVideo {
  readonly id: string;
  readonly badgeId: string;
  /** O título da plataforma. Nunca o do YouTube. */
  readonly title: string;
  readonly description: string | null;
  /** Só o ID do vídeo. A URL de embed é derivada, não guardada. */
  readonly youtubeId: string;
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
