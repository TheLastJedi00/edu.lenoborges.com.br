/**
 * Notificações internas (spec 012).
 *
 * Dois eventos avisam a comunidade: vídeo novo numa insígnia e pergunta nova no
 * Mural. A lista curta é proposital — um sino que toca por sete motivos deixa de
 * significar alguma coisa antes de virar hábito.
 */

export type NotificationKind = 'video' | 'pergunta';

export interface AppNotification {
  readonly id: string;
  readonly kind: NotificationKind;
  /**
   * O título do vídeo ou da pergunta, **inteiro**.
   *
   * Abreviar é do CSS, não daqui: cortar em código dá reticências no lugar
   * errado em cada largura de tela, e a mesma linha some inteira num aparelho
   * estreito.
   */
  readonly title: string;
  /** A insígnia. O nome e o ícone são resolvidos aqui, pelo catálogo da trilha. */
  readonly badgeId: string;
  /** Instante do evento, em UTC. A tela formata com o fuso de quem lê. */
  readonly createdAt: string;
}

/**
 * **A lista já vem só com as não lidas.**
 *
 * Não existe campo `read` na resposta, e o front não filtra nada: a API é quem
 * descarta o evento do próprio autor, o que é anterior à entrada do membro e o
 * que já foi lido. Reimplementar essa peneira aqui seria duas implementações da
 * mesma regra, e a segunda divergiria na primeira exceção — é o mesmo princípio
 * do `canAsk` do Mural.
 */
export type UnreadNotifications = readonly AppNotification[];
