import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Logo } from '../../shared/logo/logo';

/**
 * A tela de acesso (spec 020). **Esqueleto** — a Fase 04 a preenche.
 *
 * Existe já nesta fase porque a rota precisa de um componente para apontar, e
 * uma rota que não compila não é uma rota.
 */
@Component({
  selector: 'app-acesso-page',
  standalone: true,
  imports: [Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './acesso.page.html',
  styleUrl: './acesso.page.scss'
})
export class AcessoPage {}
