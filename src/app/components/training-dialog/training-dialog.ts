import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IconClose } from '../icons/icon-close';
import { IconCheck } from '../icons/icon-check';
import {
  CompleteTrainingRequest,
  Training,
  TrainingComment,
} from '../../models/training.model';
import { dataPorExtenso } from '../../core/datas';
import { FOTO_RESULTADO_RECUSADA } from '../../models/training.constants';

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

  /**
   * Se este membro pode mandar a foto do resultado (spec 027).
   *
   * **Chega pronto da pagina**, que le o `isPaid` do `AuthStore` -- pela
   * mesma razao escrita no `canComment` acima: a regra mora num lugar so, e
   * recalcula-la aqui seria a segunda copia. E ela **nao esconde a area**: quem nao
   * pode ve o aviso, porque um recurso que nao aparece nao vende upgrade.
   */
  readonly canSendPhoto = input(false);
  /** Um upload de foto em voo. Trava o concluir ate a URL chegar. */
  readonly uploadingPhoto = input(false);
  /** A URL que a rota de upload devolveu, ou nulo. Vem da pagina. */
  readonly resultImageUrl = input<string | null>(null);
  /** O erro do upload, separado do erro da conclusao. */
  readonly erroDaFoto = input<string | null>(null);

  /**
   * Emite a submissao inteira (spec 027).
   *
   * Era `output<number>` com as dicas reveladas. Virou objeto porque agora sao
   * tres coisas, e um segundo `output` para o codigo faria a pagina costurar dois
   * eventos que descrevem um unico clique.
   */
  readonly concluir = output<CompleteTrainingRequest>();
  /** O arquivo que a pessoa acabou de escolher, para a pagina subir. */
  readonly fotoEscolhida = output<File>();
  readonly comentar = output<string>();
  readonly carregarMais = output<void>();
  readonly fechar = output<void>();

  /**
   * Quantas dicas o membro já abriu, **e o estado morre com o modal**.
   *
   * A página instancia este componente dentro de um `@if` (spec 023), então
   * fechar e reabrir já nasce zerado -- **não existe `effect` de reset**, que
   * seria uma segunda fonte de verdade para a mesma coisa.
   *
   * **Fechar e voltar entrega as dicas de graça, e isso é aceito de propósito**
   * (spec 025). Persistir exigiria uma escrita por dica revelada, três vezes
   * mais cara para cobrar 1 XP, e o servidor já não tem como conferir esse
   * número de qualquer forma. É um vazamento conhecido e barato, e fechá-lo
   * custaria mais do que ele vale.
   */
  /** A frase da recusa, importada para nao existir uma segunda redacao dela. */
  protected readonly fotoRecusada = FOTO_RESULTADO_RECUSADA;

  protected readonly dicasReveladas = signal(0);

  /**
   * O codigo colado pelo membro (spec 027).
   *
   * Mora num signal, e nao num `FormControl`: nao ha validacao a fazer aqui --
   * o teto de 20000 e do servidor, e um campo vazio e uma conclusao sem codigo,
   * que e permitida. Morre com o modal, como as dicas.
   */
  protected readonly mainCode = signal('');

  /**
   * O que a tela manda ao concluir.
   *
   * **Campo vazio nao entra no corpo.** Mandar `mainCode: ''` faria o servidor
   * gravar string vazia onde `null` e a verdade -- e a diferenca aparece no dia
   * em que alguem for conferir quem entregou codigo.
   */
  protected submissao(): CompleteTrainingRequest {
    const codigo = this.mainCode().trim();
    const foto = this.resultImageUrl();

    return {
      hintsUsed: this.dicasReveladas(),
      ...(codigo ? { mainCode: codigo } : {}),
      ...(foto ? { resultImageUrl: foto } : {}),
    };
  }

  /**
   * Se o botao de concluir pode ser clicado.
   *
   * **Trava enquanto a foto sobe** (spec 027, decisao 2): o upload acontece na
   * selecao, e concluir antes de a URL chegar mandaria a conclusao sem a foto que a
   * pessoa acabou de escolher -- e a segunda conclusao nao reescreve a submissao,
   * entao ela perderia a foto para sempre.
   */
  protected readonly podeConcluir = computed(
    () => !this.completing() && !this.uploadingPhoto(),
  );

  /**
   * A foto escolhida sobe **na hora**, e nao no submit.
   *
   * Um upload disparado junto do "Concluir Desafio" faria a conclusao -- que paga XP
   * -- depender de um envio que pode falhar no meio, com o XP ja em jogo.
   */
  protected aoEscolherFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.fotoEscolhida.emit(file);
    // O input e limpo para escolher o mesmo arquivo de novo disparar o change.
    input.value = '';
  }

  protected readonly concluido = computed(() => this.training().completed);

  /**
   * O prêmio que este desafio ainda paga: 1 XP a menos por dica aberta.
   *
   * **É o número que a tela pinta, e não o que ela paga** — quem paga é o
   * servidor, e o `xp` do perfil continua vindo da resposta. O `max` repete
   * aqui a regra de lá para a tela nunca prometer um valor negativo.
   */
  protected readonly premioAtual = computed(() =>
    Math.max(0, this.training().xpAmount - this.dicasReveladas()),
  );

  /**
   * **Desafio concluído não tem dica a pagar.** Sem XP a perder, cobrar por uma
   * dica seria cobrar por nada: elas aparecem todas abertas e o botão some.
   */
  protected readonly podeRevelar = computed(
    () => !this.concluido() && this.dicasReveladas() < this.training().hints.length,
  );

  protected revelarProxima(): void {
    if (!this.podeRevelar()) {
      return;
    }

    this.dicasReveladas.update((quantas) => quantas + 1);
  }

  /**
   * Se a dica de índice `i` deve ser **renderizada**.
   *
   * É renderização, e não visibilidade: a dica fechada não entra no DOM.
   */
  protected dicaAberta(indice: number): boolean {
    return this.concluido() || indice < this.dicasReveladas();
  }

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
