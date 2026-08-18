import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConfirmDialog } from '../../../components/confirm-dialog/confirm-dialog';
import { VideoForm } from '../../../components/video-form/video-form';
import { AdminService } from '../../../services/admin.service';
import { CommunityService } from '../../../services/community.service';
import { CreateVideoRequest } from '../../../models/admin.model';
import { BadgeVideo } from '../../../models/track.model';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-admin-insignia-page',
  standalone: true,
  imports: [RouterLink, VideoForm, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './insignia-admin.page.html',
  styleUrl: './insignia-admin.page.scss'
})
export class AdminInsigniaPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly admin = inject(AdminService);
  private readonly community = inject(CommunityService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly confirmDialog = viewChild.required(ConfirmDialog);
  private readonly form = viewChild(VideoForm);

  protected readonly state = signal<LoadState>('loading');
  protected readonly videos = signal<readonly BadgeVideo[]>([]);
  protected readonly badgeId = signal('');

  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  /** Aviso de reordenação que falhou e foi revertida. */
  protected readonly reorderError = signal<string | null>(null);

  private pendingRemoval: BadgeVideo | null = null;
  protected readonly removalTarget = signal<BadgeVideo | null>(null);

  protected readonly stage = computed(() =>
    this.community.trackStages().find((item) => item.id === this.badgeId())
  );

  protected readonly confirmMessage = computed(() => {
    const video = this.removalTarget();
    return video
      ? `"${video.title}" sai da trilha. Isso não pode ser desfeito.`
      : '';
  });

  ngOnInit(): void {
    this.badgeId.set(this.route.snapshot.paramMap.get('badgeId') ?? '');
    this.load();
  }

  protected load(): void {
    this.state.set('loading');

    this.admin
      .listVideos(this.badgeId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.videos.set(list.videos);
          this.state.set('ready');
        },
        error: () => this.state.set('error')
      });
  }

  protected openForm(): void {
    this.formError.set(null);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
  }

  protected create(body: CreateVideoRequest): void {
    this.saving.set(true);
    this.formError.set(null);

    this.admin
      .createVideo(this.badgeId(), body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (video) => {
          this.videos.update((current) => [...current, video]);
          this.saving.set(false);
          this.showForm.set(false);
          this.form()?.reset();
        },
        error: (error: { status?: number }) => {
          this.saving.set(false);
          this.formError.set(
            error.status === 409
              ? 'Esse vídeo já está nesta insígnia. Ele pode entrar em outra, mas não duas vezes na mesma.'
              : error.status === 400
                ? 'Não reconheci esse link do YouTube. Cole a URL do vídeo.'
                : 'Não consegui publicar agora. Tente de novo.'
          );
        }
      });
  }

  protected askRemove(video: BadgeVideo): void {
    this.pendingRemoval = video;
    this.removalTarget.set(video);
    this.confirmDialog().open();
  }

  protected cancelRemove(): void {
    this.pendingRemoval = null;
    this.removalTarget.set(null);
  }

  protected confirmRemove(): void {
    const video = this.pendingRemoval;
    this.pendingRemoval = null;
    this.removalTarget.set(null);

    if (!video) {
      return;
    }

    this.admin
      .deleteVideo(this.badgeId(), video.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // O backend renormaliza a ordem ao apagar, então reler é o que mantém a
        // lista igual ao banco em vez de igual ao palpite da tela.
        next: () => this.load(),
        error: () => this.reorderError.set('Não consegui remover agora.')
      });
  }

  protected moveUp(index: number): void {
    if (index > 0) {
      this.move(index, index - 1);
    }
  }

  protected moveDown(index: number): void {
    if (index < this.videos().length - 1) {
      this.move(index, index + 1);
    }
  }

  /**
   * Reordenação **otimista, com rollback**.
   *
   * A lista se move na hora e a requisição sai atrás. Esperar a rede a cada
   * clique de seta torna insuportável uma operação que é repetitiva por
   * natureza — e como o backend grava em lote atômico, o rollback é sempre para
   * um estado íntegro: não existe meio-reordenado.
   *
   * Uma requisição por gesto, **sem debounce**. Debounce só ganharia se a pessoa
   * clicasse muito rápido, e perderia a garantia de que o que está na tela é o
   * que está no banco.
   */
  private move(from: number, to: number): void {
    const anterior = this.videos();
    const reordenado = [...anterior];
    const [movido] = reordenado.splice(from, 1);
    reordenado.splice(to, 0, movido);

    this.videos.set(reordenado);
    this.reorderError.set(null);

    this.admin
      .reorderVideos(
        this.badgeId(),
        reordenado.map((video) => video.id)
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.videos.set(anterior);
          this.reorderError.set(
            'A nova ordem não foi salva, então voltei para a anterior.'
          );
        }
      });
  }
}
