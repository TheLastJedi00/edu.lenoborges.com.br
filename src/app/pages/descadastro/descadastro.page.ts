import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Logo } from '../../shared/logo/logo';
import { EmailService } from '../../services/email.service';

type Estado = 'processando' | 'pronto' | 'sem-token' | 'erro';

/**
 * A página pública de descadastro (spec 014, decisão 11).
 *
 * **Sem `authGuard`, fora do `dashboard-shell`, e sem menu.** Ela precisa
 * funcionar para quem não está logado, nunca esteve nesse navegador, e está
 * lendo o e-mail no celular do trabalho. Qualquer coisa que peça sessão aqui
 * empurra a pessoa para o botão de spam do cliente de e-mail — que é o único
 * caminho mais caro que o descadastro.
 *
 * **Não depende do `AuthStore` e não espera o refresh de sessão.** Esperar por
 * ele numa página pública é o defeito que só aparece para quem está deslogado —
 * ou seja, para todo mundo que a usa.
 *
 * **Não pede confirmação.** Quem clicou em "descadastrar" no rodapé de um e-mail
 * já confirmou; um segundo botão aqui é a interface duvidando de uma decisão que
 * não é dela. O caminho de volta existe e está escrito na própria tela.
 */
@Component({
  selector: 'app-descadastro-page',
  standalone: true,
  imports: [RouterLink, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './descadastro.page.html',
  styleUrl: './descadastro.page.scss'
})
export class DescadastroPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly emails = inject(EmailService);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly estado = signal<Estado>('processando');

  constructor() {
    // Fora dos buscadores. É uma URL com token na query: ela não tem por que
    // existir num índice de busca, e um rastreador que a visitasse
    // descadastraria a pessoa dona daquele token.
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });

    // A marca sai junto com a página: sem isto ela sobreviveria à navegação e
    // tiraria a landing inteira do índice.
    this.destroyRef.onDestroy(() =>
      this.meta.removeTag('name="robots"'),
    );
  }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.estado.set('sem-token');
      return;
    }

    this.emails
      .descadastrar(token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // **Token inválido mostra a mesma tela de sucesso**, porque é o que a
        // API responde: 204 sempre. Distinguir seria um oráculo de `uid`, e é
        // deliberado dos dois lados.
        next: () => this.estado.set('pronto'),
        // Só falha de rede chega aqui, e aí a pessoa precisa saber que a ação
        // não aconteceu — senão ela fecha a aba achando que saiu da lista.
        error: () => this.estado.set('erro')
      });
  }
}
