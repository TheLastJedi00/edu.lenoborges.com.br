import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IconClose } from '../icons/icon-close';
import { IconCheck } from '../icons/icon-check';
import { Training, TrainingComment } from '../../models/training.model';
import { dataPorExtenso } from '../../core/datas';

/**
 * O conteúdo do modal de um desafio (spec 023, decisão 2).
 *
 * **Componente burro.** Ele recebe tudo pronto — o desafio, os comentários, se
 * a pessoa pode comentar — e emite as quatro intenções: concluir, comentar,
 * carregar mais e fechar. Quem fala com a API é a página, pelo mesmo princípio
 * do `gym-challenge-card`.
 *
 * **O `<dialog>` fica na página, e não aqui.** Este componente é o miolo, e a
 * página o instancia dentro de um `@if` — um player de vídeo escondido continua
 * tocando, e destruir o elemento é o único jeito confiável de parar um player de
 * terceiros sem falar a API dele. É a mesma decisão da spec 021, e é ela que
 * decide onde este componente começa.
 */
@Component({
  selector: 'app-training-dialog',
  imports: [IconClose, IconCheck],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './training-dialog.html',
  styleUrl: './training-dialog.scss',
})
export class TrainingDialog {
  private readonly sanitizer = inject(DomSanitizer);

  readonly training = input.required<Training>();
  readonly comments = input<readonly TrainingComment[]>([]);
  /**
   * Se a pessoa pode escrever.
   *
   * **Chega pronto da página**, que lê o tier do `AuthStore`. A regra é uma só e
   * mora num lugar; recalculá-la aqui seria a segunda cópia, e a que envelhece
   * primeiro. E ela não esconde a conversa: quem não pode escrever continua
   * lendo, e é por isso que este input governa o formulário e não a seção.
   */
  readonly canComment = input(false);
  /** Um `POST` de conclusão em voo. Trava o botão para o clique não sair duas vezes. */
  readonly completing = input(false);
  /** Um `POST` de comentário em voo. */
  readonly sending = input(false);
  readonly loadingComments = input(false);
  /** Há mais páginas de comentário para carregar. */
  readonly hasMore = input(false);
  /** O XP que a última conclusão pagou, para a animação. Nulo fora dela. */
  readonly xpGanho = input<number | null>(null);
  readonly erro = input<string | null>(null);

  readonly concluir = output<void>();
  readonly comentar = output<string>();
  readonly carregarMais = output<void>();
  readonly fechar = output<void>();

  protected readonly concluido = computed(() => this.training().completed);

  /**
   * A URL do vídeo de apoio, marcada como confiável.
   *
   * **Só entra no iframe o que for `youtube.com` ou `youtu.be`.** A URL aqui é
   * crua e digitada pelo admin — ao contrário do `youtubeId` da spec 017, que a
   * API extraiu e validou —, e um `bypassSecurityTrustResourceUrl` sobre texto
   * livre é exatamente o buraco que esse método existe para não abrir. O que não
   * casa vira link, e não moldura.
   */
  protected readonly embedUrl = computed<SafeResourceUrl | null>(() => {
    const id = extrairYoutubeId(this.training().videoUrl);

    return id
      ? this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
        )
      : null;
  });

  /** O vídeo existe mas não é do YouTube: vira link, e o membro decide abrir. */
  protected readonly linkExterno = computed(() => {
    const { videoUrl } = this.training();

    return videoUrl && !extrairYoutubeId(videoUrl) ? videoUrl : null;
  });

  protected enviarComentario(campo: HTMLTextAreaElement): void {
    const texto = campo.value.trim();

    // Comentário vazio não vai: o backend responderia 400, e um erro na tela
    // por um clique num botão que não deveria ter sido oferecido é ruído.
    if (!texto || this.sending()) {
      return;
    }

    this.comentar.emit(texto);
    campo.value = '';
  }

  protected quando(iso: string): string {
    return dataPorExtenso(iso);
  }
}

/**
 * Extrai o ID de 11 caracteres das formas de URL do YouTube.
 *
 * **É uma segunda extração neste produto, e ela é deliberadamente mais
 * restrita** do que a `extractYoutubeId` do backend: aqui ela não normaliza
 * nada para gravar, ela decide se uma string digitada pode virar `src` de
 * iframe. O que não casa não vira moldura.
 */
function extrairYoutubeId(url: string | null): string | null {
  if (!url) {
    return null;
  }

  const padroes = [
    /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];

  for (const padrao of padroes) {
    const encontrado = padrao.exec(url);

    if (encontrado) {
      return encontrado[1];
    }
  }

  return null;
}
