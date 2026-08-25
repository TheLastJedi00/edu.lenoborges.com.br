# Fix: no desktop o painel de notificações abre para fora da tela

Aberto em 2026-08-25, depois da execução da spec 012.

## Sintoma

No celular o painel abre certo. **No desktop ele abre para a esquerda do sino e sai pela borda
esquerda da janela** — parte do cartão fica fora do `body`, e com o menu lateral recolhido some quase
inteiro. A pessoa toca o sino, alguma coisa pisca no canto, e não há painel para ler.

---

## Causa

São três regras corretas isoladamente que só se contradizem no desktop.

**1. O painel se ancora pela direita.** Em `notification-panel.ts`:

```
.panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: min(22rem, calc(100vw - 2rem));
}
```

`right: 0` alinha a **borda direita** do painel com a borda direita do sino, e o cartão cresce 22rem
**para a esquerda**.

**2. No celular isso é exatamente o certo.** O sino mora na `.mobile-header`, encostado na borda
direita da tela (decisão 1). Crescer para a esquerda é a única direção que existe.

**3. No desktop o sino trocou de lado, e a regra não foi junto.** Acima de `64rem` a `.mobile-header`
some e o sino passa a viver no `.aside__head` — dentro de uma coluna `position: fixed; left: 0`, de
`16rem` aberta e `4.75rem` recolhida (decisão 1). O sino, que estava na borda **direita** da janela,
foi para perto da borda **esquerda**. `right: 0` continuou valendo.

A conta, num desktop qualquer:

| Estado do menu | Borda direita do sino | Início do painel | Resultado |
|---|---|---|---|
| Expandido (`16rem`) | ≈ `13rem` | `13 − 22 = −9rem` | 9rem fora da tela |
| Recolhido (`4.75rem`) | ≈ `3.4rem` | `3.4 − 22 = −18.6rem` | quase tudo fora da tela |

É por isso que **o menu recolhido é o caso pior**, e é o estado em que o bug foi visto. A decisão 1 da
spec exigiu que o sino continuasse visível com o aside recolhido, e a Fase 02 tem teste-trava para
isso — mas o teste garante que o *sino* aparece, não que o *painel* caiba. As duas coisas nunca foram a
mesma, e é a fresta por onde isto passou.

Não há clipping envolvido: o `overflow-y: auto` do aside está no `.aside__nav`, e o sino mora no
`.aside__head`. O cartão não está cortado, está **fora da janela**.

---

## O conserto

O painel passa a saber de que lado abrir, e quem sabe o lado é quem o coloca na tela.

`NotificationCenter` e `NotificationPanel` ganham um input `align: 'start' | 'end'`, com **`'end'` como
padrão** — o comportamento de hoje, que é o certo para a barra do celular. O `dashboard-aside` passa
`'start'`, e `.panel--start` troca a âncora:

```
.panel--start {
  left: 0;
  right: auto;
}
```

Com `left: 0` o painel cresce **para a direita**, a partir da borda esquerda do sino: `2.4 → 24.4rem`
com o menu recolhido, `12 → 34rem` com ele aberto. Cabe nos dois estados em qualquer viewport de
desktop, que começa em `64rem`.

O padrão é `'end'` de propósito. Um input obrigatório faria a barra do celular — que está certa hoje —
precisar declarar o que já fazia, e um host novo que esquecesse de passar o valor quebraria em vez de
funcionar.

### A alternativa que foi recusada

`:host-context(.aside__bell) .panel { left: 0; right: auto; }` resolve com uma regra e nenhum input.

Foi recusada porque acopla o CSS do painel a um nome de classe que pertence ao **aside**. Renomear
`.aside__bell` — coisa que ninguém consideraria arriscada — quebraria o posicionamento do painel em
silêncio, sem erro de compilação e sem teste vermelho, e o próximo a investigar procuraria no arquivo
errado. O input custa duas linhas e deixa o acoplamento visível no template, onde ele pode ser testado.

### O que este fix não faz

**Não mexe na regra do celular.** Abaixo de `48rem` o painel é folha (`position: fixed`, `left` e
`right` em `0.75rem`, decisão 13) e nada disso muda. Entre `48rem` e `64rem` o sino ainda está na
`.mobile-header`, à direita, e `align` continua `'end'` — que é o correto.

**Não move o sino.** A decisão 1 continua valendo: um componente, dois lugares, visível também com o
aside recolhido. O que estava errado era a direção do painel, não a posição do sino.

**Não troca `position: absolute` por posicionamento calculado em TypeScript.** Medir o sino e escrever
`style.left` no painel resolveria os dois casos com um código só, e passaria a exigir recálculo em
`resize`, em rolagem e ao recolher o menu. Duas linhas de CSS por host resolvem sem nada disso.

---

## Verificação

- Conferir no desktop com o menu **expandido** e **recolhido** — o recolhido é o caso pior, e é o único
  em que um `left: 0` mal aplicado ainda pareceria funcionar por sorte.
- Conferir que o painel pinta **por cima do conteúdo principal**. O `.aside` é `position: fixed` com
  `z-index: 10` e cria contexto de empilhamento, então o `z-index: 61` do painel vale dentro dele: o
  cartão sobe acima do `main`, mas não acima de nada que venha a ficar acima de `10`.
- Conferir os três estados de largura: `< 48rem` (folha), `48–64rem` (barra do celular, âncora à
  direita) e `≥ 64rem` (aside, âncora à esquerda).
- Um teste garantindo que a instância do aside recebe `align="start"` e a da barra do celular não — é o
  que impede o bug de voltar no próximo host que alguém adicionar.
