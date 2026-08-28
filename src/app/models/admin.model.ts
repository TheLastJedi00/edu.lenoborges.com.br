import type { TierId } from './auth.model';
import type { BadgeVideoKind, BadgeVideoTab } from './track.model';
/** Administração da Liga Dev (spec 009). */

export interface AdminUser {
  readonly id: string;
  readonly email: string | null;
  readonly emailVerified: boolean;
  readonly disabled: boolean;
  readonly role: 'admin' | null;
  readonly createdAt: string;
  readonly lastSignInAt: string | null;
  /**
   * Nulos aqui são informação, não ausência de dado: é o retrato de quem criou
   * conta e parou antes do onboarding — a pessoa que o admin mais precisa ver.
   */
  readonly name: string | null;
  /**
   * **`phone` não está aqui, e a ausência é decisão** (spec 015, decisão 9).
   *
   * Ele vive só em `GET /admin/users/:id`, e a regra é da API, e não do CSS:
   * uma listagem que carrega o telefone e a bio de 200 pessoas trafega dado
   * pessoal que ninguém pediu, guarda-o no estado do navegador e o entrega ao
   * primeiro `console.log` de depuração. A tela **não contorna isso** guardando
   * o que já teria.
   */
  readonly grade: number | null;
  readonly profileCompleted: boolean;
  /**
   * Tier de acesso (spec 010).
   *
   * **Acesso, nao conquista.** Fica visivelmente separado do `grade` na tela:
   * encostados sem explicacao, os dois viram a mesma coisa na cabeca de quem
   * clica -- e a spec 008 inteira depende de nao virarem.
   */
  readonly tier: TierId | null;
  /**
   * Se este membro saiu da lista de e-mails (spec 014).
   *
   * Sem ele, "não chegou o e-mail para o fulano" é investigação sem pista.
   */
  readonly emailOptOut: boolean;
}

export interface AdminUserPage {
  readonly users: readonly AdminUser[];
  /**
   * **O tamanho do RECORTE, e não da base** (spec 015, decisão 6).
   *
   * É a frase que impede a tela de escrever "213 membros" com um filtro ligado:
   * com filtro, os dois números são diferentes, e um número grande sozinho na
   * tela é lido como o tamanho da comunidade. Por isso a contagem com recorte é
   * **"12 de 213 membros"**, e nunca só um número.
   */
  readonly total: number;
  /** Deslocamento desta página dentro do recorte. */
  readonly offset: number;
  readonly limit: number;
}

/**
 * O recorte da lista (spec 015, decisões 2 a 5).
 *
 * **Ausência significa todos**, nos quatro campos — a mesma inversão que a spec
 * 014 protegeu do outro lado. Lá, um estado vazio lido como "ninguém" não
 * dispararia nada; aqui, ele mostraria uma lista vazia e faria o admin achar que
 * a base sumiu.
 */
export interface AdminUserFilters {
  readonly q?: string;
  readonly onboarding?: OnboardingFilter;
  readonly tiers?: readonly TierId[];
  readonly gradeMin?: number | null;
  readonly gradeMax?: number | null;
}

export type OnboardingFilter = 'pendente' | 'concluido';

/**
 * Por que este membro não pode receber e-mail (spec 015, decisão 15).
 *
 * **União literal, e nunca `string`.** A tela escolhe o texto pelo código, e um
 * `string` deixaria o `switch` sem exaustividade — e a alternativa que alguém
 * tentaria, ler a mensagem do backend, quebra na primeira revisão de copy de lá.
 * Texto de erro não é contrato.
 */
export type CannotReceiveEmailReason =
  | 'desativado'
  | 'email-nao-verificado'
  | 'descadastrado';

/** Por que o endereço saiu da lista (spec 014). */
export type EmailOptOutReason = 'membro' | 'bounce' | 'reclamacao';

/**
 * Um membro inteiro, como só o detalhe conhece (spec 015, decisão 9).
 *
 * Tudo da linha, mais o que **não trafega na listagem**: telefone, bio, redes,
 * o motivo do descadastro e as datas do perfil.
 */
export interface AdminUserDetail extends AdminUser {
  readonly phone: string | null;
  readonly bio: string | null;
  readonly linkedin: string | null;
  readonly instagram: string | null;
  readonly emailOptOutReason: EmailOptOutReason | null;
  readonly emailOptOutAt: string | null;
  readonly waitlistEntryId: string | null;
  readonly profileCreatedAt: string | null;
  readonly profileUpdatedAt: string | null;
  /**
   * Se dá para escrever para ele.
   *
   * Vem derivado dos mesmos três cortes que a API usa para recusar o envio: é o
   * que permite a tela desabilitar o botão **antes** de o admin escrever o
   * recado inteiro.
   */
  readonly canReceiveEmail: boolean;
  readonly cannotReceiveReason: CannotReceiveEmailReason | null;
}

/** O recado para uma pessoa (spec 015, decisão 12). */
export interface SendDirectEmailRequest {
  readonly subject: string;
  readonly body: string;
}

export interface CreateVideoRequest {
  readonly title: string;
  readonly description?: string;
  /**
   * A URL como o admin colou. A API extrai o ID.
   *
   * Seis formas servem, **link de Shorts incluído** desde a spec 017 — que é a
   * forma em que todo vídeo de resposta nasce.
   */
  readonly youtubeUrl: string;
  /**
   * A aba da insígnia. Sem valor, a API grava como aula.
   *
   * **`kind` e `questionId` andam juntos, nos dois sentidos:** resposta sem
   * pergunta e aula com pergunta são os dois 400 do backend. Quem garante isso
   * é o modo do formulário — ou ele está em modo resposta e manda os dois, ou
   * não manda nenhum —, e não uma validação espalhada por quem chama.
   */
  readonly kind?: BadgeVideoKind;
  /**
   * A **lista** em que o vídeo vai viver (spec 021). Sem valor, a API deriva
   * `tab = kind`.
   *
   * Só é enviado em **modo resposta**: em modo aula ele não teria significado,
   * porque aula vive na trilha e ponto. E `kind: 'aula'` com `tab: 'resposta'`
   * é **400** no backend — o terceiro estado incoerente da família que a spec
   * 017 abriu, junto de resposta sem pergunta e aula com pergunta.
   *
   * Em modo resposta com o toggle desligado ele também não vai: mandar
   * `tab: 'resposta'` explicitamente seria só ruído, já que o servidor deriva
   * exatamente isso.
   */
  readonly tab?: BadgeVideoTab;
  /** A pergunta do Mural que este vídeo responde. Só com `kind: 'resposta'`. */
  readonly questionId?: string;
}

export interface UpdateVideoRequest {
  readonly title?: string;
  readonly description?: string;
}
