import { TrackStage } from '../../models/community.model';

/**
 * O título da insígnia a partir do `badgeId` da pergunta.
 *
 * `poo` não diz nada para quem está lendo o Mural; "Insígnia da POO" diz. A
 * conversão nasceu dentro do `QuestionCard` e saiu de lá na spec 024, quando o
 * diálogo da pergunta passou a precisar do mesmo rótulo: duas cópias do mesmo
 * `find` divergem na primeira vez que o fallback mudar de ideia num dos lados.
 *
 * **É função pura, e não um método de serviço.** Quem tem o `CommunityService`
 * é quem chama; assim o Mural inteiro continua montável em teste sem
 * `provideHttpClient` nenhum, que é o que o teste-trava do `QuestionCard`
 * garante.
 *
 * Id que não está na trilha volta como ele mesmo — dado antigo, etapa
 * renomeada. Melhor um rótulo feio que um cartão sem assunto.
 */
export function tituloDaInsignia(
  stages: readonly TrackStage[],
  badgeId: string
): string {
  return stages.find((stage) => stage.id === badgeId)?.title ?? badgeId;
}
