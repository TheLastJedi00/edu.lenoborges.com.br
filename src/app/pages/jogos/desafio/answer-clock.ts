/**
 * O cronômetro que mede quanto tempo o membro levou para responder
 * (spec 022, decisão 5).
 *
 * **É o outro relógio, e ele não é o timer visual.** São dois papéis e duas
 * implementações, de propósito:
 *
 * - O **timer visual** é um `setInterval` que pinta uma barra. Pode atrasar,
 *   pode ser estrangulado pelo navegador numa aba de fundo, e nada disso importa
 *   — ele só cria urgência.
 * - **Este** é uma subtração de dois `performance.now()`. Ele é o número que
 *   vira XP.
 *
 * **Derivar a medição do contador visual é o erro que este arquivo existe para
 * impedir.** Um `setInterval` de 100ms acumula erro, e o navegador o estrangula
 * para uma vez por segundo em aba de fundo: o membro que troca de aba para ler a
 * documentação e volta veria o contador dizer que passaram 4 segundos onde
 * passaram 40 — ou o contrário. O tempo roubado sairia do XP dele, e ninguém
 * conseguiria reproduzir a queixa.
 *
 * `performance.now()` e não `Date.now()`: ele é monotônico, então um ajuste de
 * relógio do sistema no meio da rodada não produz um tempo negativo.
 */
export class AnswerClock {
  private startedAt: number | null = null;

  /** Começa a contar. Chamado quando a questão é pintada, não quando ela chega. */
  start(now: number = performance.now()): void {
    this.startedAt = now;
  }

  /**
   * Para e devolve o tempo em milissegundos inteiros.
   *
   * **Zero quando não foi iniciado**, e não um erro: o servidor confere o valor
   * contra o próprio relógio e usa o dele quando o do cliente está fora da
   * janela. Um zero aqui é aceito, e essa é uma escolha registrada da spec — o
   * dano de ignorar o tempo do cliente cairia sobre quem joga em rede lenta.
   */
  stop(now: number = performance.now()): number {
    if (this.startedAt === null) {
      return 0;
    }

    const elapsed = Math.max(0, Math.round(now - this.startedAt));
    this.startedAt = null;

    return elapsed;
  }

  /** Se há uma medição em curso. */
  get running(): boolean {
    return this.startedAt !== null;
  }
}
