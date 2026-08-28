/**
 * Documentos legais (spec 018).
 *
 * **O front não guarda o texto e não tem opinião sobre qual versão é a
 * vigente.** Tudo aqui vem de `GET /legal/documents/:id`, e quem diz o que falta
 * aceitar é o backend, por dois canais: `pendingLegal` no `GET /me` e o corpo do
 * `428`.
 *
 * A tentação é óbvia — guardar as versões numa constante daqui e comparar. Ela
 * cria o estado que a decisão 1 da spec descreve: texto novo, número velho,
 * ninguém chamado a aceitar de novo, nenhum erro em lugar nenhum. **Se o front
 * souber comparar versões, ele vai comparar errado um dia**, e o sintoma é o
 * produto funcionando perfeitamente sob um contrato que não é mais o contrato.
 */

export interface LegalSection {
  readonly heading: string;
  /**
   * Parágrafos em **texto puro**, sempre.
   *
   * Renderizados com `@for` e interpolação. Nunca `innerHTML`: o dia em que este
   * campo virar markup é o dia em que a tela precisa de um
   * `bypassSecurityTrustHtml` — e aquele `bypass` fica no código para sempre,
   * inclusive quando a fonte do texto deixar de ser uma constante do backend.
   */
  readonly paragraphs: readonly string[];
}

export interface LegalDocument {
  readonly id: string;
  readonly title: string;
  /** Data da versão, `YYYY-MM-DD`. É o valor que o aceite devolve ao backend. */
  readonly version: string;
  readonly updatedAt: string;
  readonly sections: readonly LegalSection[];
}

/** Identidade sem o texto: é o que a listagem e o `pendingLegal` carregam. */
export interface LegalDocumentSummary {
  readonly id: string;
  readonly title: string;
  readonly version: string;
}

/** O aceite vigente de um documento, como a seção Contratos o mostra. */
export interface LegalAcceptance {
  readonly version: string;
  /** ISO 8601, vindo do backend. */
  readonly acceptedAt: string;
}

/** Corpo de `POST /me/legal-acceptances`. Um documento por chamada. */
export interface AcceptLegalRequest {
  readonly documentId: string;
  readonly version: string;
}
