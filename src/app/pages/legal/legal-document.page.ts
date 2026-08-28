import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LegalDocumentView } from '../../components/legal-document-view/legal-document-view';
import { LegalService } from '../../core/legal/legal.service';
import { Logo } from '../../shared/logo/logo';
import { LegalDocument } from '../../models/legal.model';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * A página pública de um documento legal (spec 018, decisão 10).
 *
 * **Sem guard nenhum, e fora do `DashboardShell`.** Quem lê pelo rodapé da
 * landing não tem conta, e é justamente a pessoa que mais precisa ler antes:
 * uma página de contrato atrás de login é um contrato que só se lê depois de
 * assinar. É a mesma razão do `/descadastro` (spec 014, decisão 11).
 *
 * Uma page só para os dois documentos — o id vem dos `data` da rota. Duas pages
 * idênticas divergiriam no primeiro ajuste de layout.
 */
@Component({
  selector: 'app-legal-document-page',
  imports: [LegalDocumentView, Logo, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page__header">
        <a routerLink="/" aria-label="Voltar para a página inicial">
          <app-logo />
        </a>
      </header>

      <main class="page__main">
        @switch (state()) {
          @case ('loading') {
            <p class="page__status u-mono">Carregando o documento...</p>
          }
          @case ('error') {
            <p class="page__status u-mono" role="alert">
              Não foi possível carregar este documento. Tente de novo em alguns instantes.
            </p>
          }
          @default {
            <app-legal-document-view [document]="document()!" />
          }
        }
      </main>

      <footer class="page__footer u-mono">
        <a routerLink="/termos-de-uso">Termos de Uso</a>
        <span aria-hidden="true">·</span>
        <a routerLink="/politica-de-privacidade">Política de Privacidade</a>
      </footer>
    </div>
  `,
  styles: `
    .page {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem 1rem 3rem;
      background: var(--paper);
      color: var(--ink);
    }

    .page__main {
      width: min(48rem, 100%);
      margin-inline: auto;
      flex: 1;
    }

    .page__header,
    .page__footer {
      width: min(48rem, 100%);
      margin-inline: auto;
    }

    .page__status {
      font-size: var(--step--1);
      color: var(--ink-soft);
    }

    .page__footer {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding-top: 1.5rem;
      border-top: var(--border-w) solid var(--border-soft);
      font-size: var(--step--2);
      color: var(--ink-soft);
    }

    .page__footer a {
      color: inherit;
    }
  `
})
export class LegalDocumentPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly legalService = inject(LegalService);

  protected readonly state = signal<LoadState>('loading');
  protected readonly document = signal<LegalDocument | null>(null);

  ngOnInit(): void {
    // `data`, e não `paramMap`: o id não é digitável na URL — são duas rotas
    // fixas, e um `:id` aberto convidaria a tratar documento inexistente como
    // caso de tela em vez de rota que não existe.
    this.route.data.subscribe((data) => {
      const documentId = data['documentId'] as string;
      this.state.set('loading');

      this.legalService.getById(documentId).subscribe({
        next: (document) => {
          this.document.set(document);
          this.state.set('ready');
        },
        error: () => this.state.set('error')
      });
    });
  }
}
