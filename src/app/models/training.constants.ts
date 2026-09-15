/**
 * O XP padrão de um desafio novo (spec 023).
 *
 * **É o valor inicial do campo do formulário, e nada além disso.** O XP que
 * vale é sempre o `xpAmount` que o servidor devolve no desafio — o admin pode
 * ter escrito outro. Esta constante existe só para o formulário nascer
 * preenchido com o caso comum, e nenhuma tela a usa para exibir XP.
 */
export const DEFAULT_TRAINING_XP = 30;

/**
 * A recusa da foto de resultado, numa frase só (spec 027).
 *
 * **Dois lugares dizem a mesma coisa** — o aviso que o modal desenha para o Dev
 * Tier, e a tradução do `403` que a página faz quando alguém contorna a tela — e
 * duas redações da mesma recusa divergem na primeira vez que alguém melhora uma.
 * Foi o que aconteceu ao escrever esta spec: uma dizia "exclusiva" e a outra
 * "exclusivo", e o teste do `403` ficou vermelho por causa de uma letra.
 */
export const FOTO_RESULTADO_RECUSADA =
  'O envio de fotos com o resultado é uma feature exclusiva para membros Great Dev e superiores.';
