import { ChangeDetectionStrategy, Component } from '@angular/core';

let instanceCount = 0;

/**
 * Marca do site: o símbolo quadrado, sem wordmark.
 *
 * O SVG referencia gradientes, filtros e clipPath por `url(#id)`, e a marca
 * aparece mais de uma vez na mesma página (cabeçalho mobile, aside, topo das
 * páginas). Os ids levam um sufixo por instância porque ids repetidos fazem o
 * navegador resolver todas as referências para o primeiro `defs` encontrado.
 */
@Component({
  selector: 'app-logo',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  templateUrl: './logo.html',
  styleUrl: './logo.scss'
})
export class Logo {
  protected readonly uid = `logo${(instanceCount += 1)}`;
}
