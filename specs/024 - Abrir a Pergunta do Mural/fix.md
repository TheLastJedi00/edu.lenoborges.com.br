# Spec 024, fix: o cartão do membro derrubava a detecção de mudanças ao fechar

## O sintoma
Na passada de navegador com a pilha local completa (API em `localhost:3000` contra o projeto de
preview, front em `localhost:4200`), o diálogo da pergunta passou a **abrir vazio**: o `<dialog>`
abria, o rodapé aparecia, e o corpo ficava em branco.

O sinal do componente estava certo. Lido pelo devtools do Angular, `question()` tinha a pergunta
inteira, com título e corpo — a view é que não redesenhava.

A sequência que reproduz é exatamente a que a spec 024 criou:

1. abrir uma pergunta pelo cartão;
2. clicar no nome do autor, que fecha a pergunta e abre o cartão do membro (decisão 6);
3. fechar o cartão do membro;
4. abrir qualquer pergunta de novo. **Vazia.**

## A causa
`MemberCardDialog.onNativeClose` (spec 019) fazia:

```ts
this.member.set(null);
this.closed.emit();
```

`state` continuava valendo `'ready'`, então o `@default` do `@switch` — que lê `member()!.name` —
era reavaliado com `member` nulo e lançava `TypeError: Cannot read properties of null (reading
'name')` **dentro da detecção de mudanças**.

Em zoneless, o erro derruba o ciclo. E o preço não é pago onde o erro acontece: o cartão do membro
já estava fechado, ninguém olhava para ele, e quem parava de redesenhar era a **próxima** tela que
mudasse um sinal. Daí o diálogo da pergunta vazio, com o dado certo por baixo.

O defeito é anterior a esta spec e vive desde a 019. O que a 024 fez foi tornar comum um caminho que
antes era raro: abrir o cartão do membro, fechar e continuar usando a tela.

## A correção
Os dois sinais são um estado só, e separá-los foi o erro:

```ts
this.state.set('loading');
this.member.set(null);
this.closed.emit();
```

`'loading'` é o estado de abertura, e é para ele que fechar volta.

## O teste
`member-card-dialog.spec.ts` ganhou o teste-trava do fechamento: abre, recebe o membro, fecha, espera
o `close` nativo (que só chega no quadro seguinte) e exige que o cartão tenha voltado ao estado
inicial. **Verificado que ele falha sem a correção** — com a linha removida, o cartão continua na
tela com o membro anterior, porque o ciclo caiu.

## O que isto ensina para a próxima
Um `TypeError` lançado dentro de um template em zoneless **não é um erro local**. Ele não quebra só o
componente que o lançou: derruba o ciclo, e o sintoma aparece em outra tela, depois, sem relação
visível com a causa. Duas consequências práticas:

- O par "sinal de dado" e "sinal de estado" de um mesmo componente muda junto, sempre. Anular um e
  deixar o outro é o que cria a janela em que o template lê `!` sobre nulo.
- Quando uma tela para de redesenhar sem motivo, **o console é o primeiro lugar a olhar** — e o erro
  que interessa pode ter o nome de outro componente.
