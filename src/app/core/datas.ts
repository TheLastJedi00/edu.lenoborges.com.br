/**
 * As datas do produto, num lugar só.
 *
 * Existe porque a spec 017 seria a **segunda** formatação de data escrita à mão
 * — a primeira era um método privado dentro da tela de usuários do admin — e
 * duas formatações de data é a coisa que o usuário nota e que ninguém procura:
 * "27/08/2026" numa tela e "27 de agosto" na outra não parece decisão, parece
 * descuido.
 *
 * As duas formas moram aqui e saem do mesmo `Intl`, com o mesmo locale.
 */

/** Devolve a data, ou `null` se a entrada não for uma data legível. */
function parse(iso: string | null | undefined): Date | null {
  if (!iso) {
    return null;
  }

  const data = new Date(iso);

  return Number.isNaN(data.getTime()) ? null : data;
}

/**
 * "9 de agosto", com o ano só quando **não** for o ano corrente.
 *
 * O ano omitido é a decisão: quase tudo que a tela mostra é deste ano, e
 * repetir "de 2026" em toda linha é ruído que esconde justamente a linha em que
 * o ano importa.
 *
 * **Nada de tempo relativo aqui.** "Há 3 meses" tem utilidade num feed que a
 * pessoa varre todo dia; a aba de respostas da trilha é consultada por assunto,
 * e "há 3 meses" envelhece dentro da própria frase — "9 de agosto" é a mesma
 * informação daqui a um ano.
 */
export function dataPorExtenso(iso: string | null | undefined): string {
  const data = parse(iso);
  if (!data) {
    return '';
  }

  const mesmoAno = data.getFullYear() === new Date().getFullYear();

  return data.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    ...(mesmoAno ? {} : { year: 'numeric' })
  });
}

/** "27/08/2026". A forma curta, para tabelas e listas densas. */
export function dataCurta(iso: string | null | undefined): string {
  const data = parse(iso);
  if (!data) {
    return '';
  }

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * "27/08/2026" a partir de uma data **sem hora**, como `2026-08-27`.
 *
 * Existe separada de `dataCurta` por um motivo que não é estilo: `new Date()`
 * sobre uma string só-data lê o valor como UTC e exibe no fuso local, o que
 * mostra **o dia anterior** a oeste de Greenwich. Em São Paulo, a versão de
 * 27/08 apareceria como 26/08 — e num documento legal a data *é* a identidade
 * da versão, então errar por um dia é mostrar outra versão.
 *
 * Por isso aqui não há `Date` nenhum: os três pedaços são reordenados como
 * texto. Ver a spec 018.
 */
export function dataDeVersao(version: string | null | undefined): string {
  const partes = (version ?? '').split('-');

  if (partes.length !== 3) {
    return '';
  }

  const [ano, mes, dia] = partes;

  return `${dia}/${mes}/${ano}`;
}
