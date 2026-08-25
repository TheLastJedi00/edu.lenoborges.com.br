import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Logo } from '../../shared/logo/logo';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { MemberProfile } from '../../models/auth.model';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * Meu Perfil (spec 013).
 *
 * **Uma tela, quatro seções, nenhuma sub-rota.** Quatro rotas dariam quatro
 * telas em branco para editar três campos — e a seção de exclusão precisa estar
 * nesta mesma tela, no fim: escondê-la atrás de uma rota própria é o padrão que
 * faz a pessoa procurar no suporte como sair do produto, e ninguém deveria
 * precisar pedir ajuda para ir embora.
 *
 * É a tela do próprio membro, e não existe perfil de terceiros: sem `:id`, sem
 * lista de membros, sem visualização pública (decisão 13).
 */
@Component({
  selector: 'app-perfil-page',
  standalone: true,
  imports: [Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.scss'
})
export class PerfilPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly authStore = inject(AuthStore);

  protected readonly loadState = signal<LoadState>('loading');
  protected readonly profile = signal<MemberProfile | null>(null);

  /**
   * Carrega o perfil, com o que já está no store como partida.
   *
   * Mesmo padrão do `completar-perfil`, que é onde ele já está resolvido: o
   * `GET /me` acontece de qualquer jeito, porque o store pode estar velho, mas
   * os campos não ficam vazios esperando a resposta. Formulário que pisca com
   * valor errado é o que faz alguém salvar por cima do que ainda não chegou.
   */
  ngOnInit(): void {
    const carregado = this.authStore.profile();
    if (carregado) {
      this.aplicar(carregado);
    }

    this.authService
      .getMe()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => this.aplicar(profile),
        error: () => {
          if (!this.profile()) {
            this.loadState.set('error');
          }
        }
      });
  }

  protected recarregar(): void {
    this.loadState.set('loading');
    this.authService
      .getMe()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => this.aplicar(profile),
        error: () => this.loadState.set('error')
      });
  }

  private aplicar(profile: MemberProfile): void {
    this.profile.set(profile);
    this.loadState.set('ready');
  }
}
