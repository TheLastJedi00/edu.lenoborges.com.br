import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { AvatarDialog } from './avatar-dialog';

/** Um Blob qualquer, no lugar do recorte que a biblioteca produziria. */
const RECORTE = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/webp' });

function arquivoFalso(name = 'foto.png', type = 'image/png'): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

describe('AvatarDialog (spec 027)', () => {
  let fixture: ComponentFixture<AvatarDialog>;

  function montar(temFoto = false) {
    fixture = TestBed.createComponent(AvatarDialog);
    fixture.componentRef.setInput('temFoto', temFoto);
    fixture.componentRef.setInput('enviando', false);
    fixture.componentRef.setInput('erro', null);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  /** Simula a escolha de um arquivo no input escondido. */
  function escolher(file = arquivoFalso()) {
    fixture.componentInstance.aoEscolher({
      target: { files: [file] },
    } as unknown as Event);
    fixture.detectChanges();
  }

  /** Simula o recorte que a biblioteca emite a cada arrasto. */
  function recortar(blob: Blob | null = RECORTE) {
    fixture.componentInstance.aoRecortar({ blob } as never);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarDialog],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('comeca pedindo o arquivo, sem recorte na tela', () => {
    const root = montar();

    expect(root.querySelector('image-cropper')).toBeNull();
    expect(root.querySelector('[data-test="escolher"]')).toBeTruthy();
  });

  it('mostra o recorte depois de escolher o arquivo', () => {
    const root = montar();

    escolher();

    expect(root.querySelector('image-cropper')).toBeTruthy();
  });

  /**
   * **A trava desta task.** O `imageCropped` da biblioteca dispara a cada arrasto
   * e a cada zoom. Enviar nele faria um upload por pixel movido — o modal só emite
   * quando a pessoa confirma.
   */
  it('teste-trava: recortar nao emite nada, so confirmar emite', () => {
    montar();
    const enviados: Blob[] = [];
    fixture.componentInstance.saved.subscribe((b) => enviados.push(b));

    escolher();
    recortar();
    recortar();
    recortar();

    expect(enviados.length).toBe(0);

    fixture.componentInstance.confirmar();

    expect(enviados.length).toBe(1);
    expect(enviados[0]).toBe(RECORTE);
  });

  it('confirmar sem recorte pronto nao emite', () => {
    montar();
    const enviados: Blob[] = [];
    fixture.componentInstance.saved.subscribe((b) => enviados.push(b));

    escolher();
    fixture.componentInstance.confirmar();

    expect(enviados.length).toBe(0);
  });

  it('recorte nulo da biblioteca nao habilita o confirmar', () => {
    const root = montar();
    escolher();

    recortar(null);

    const botao = root.querySelector(
      '[data-test="confirmar"]'
    ) as HTMLButtonElement;
    expect(botao.disabled).toBeTrue();
  });

  it('o confirmar fica desabilitado enquanto envia', () => {
    const root = montar();
    escolher();
    recortar();

    fixture.componentRef.setInput('enviando', true);
    fixture.detectChanges();

    expect(
      (root.querySelector('[data-test="confirmar"]') as HTMLButtonElement)
        .disabled
    ).toBeTrue();
  });

  it('mostra o erro recebido e mantem o recorte na tela para tentar de novo', () => {
    const root = montar();
    escolher();
    recortar();

    fixture.componentRef.setInput('erro', 'A imagem precisa ter no máximo 5 MB.');
    fixture.detectChanges();

    expect(root.querySelector('[role="alert"]')?.textContent).toContain('5 MB');
    // O modal não fecha sozinho no erro, e o recorte continua ali.
    expect(root.querySelector('image-cropper')).toBeTruthy();
  });

  it('o botao de remover so aparece para quem ja tem foto', () => {
    let root = montar(false);
    expect(root.querySelector('[data-test="remover"]')).toBeNull();

    root = montar(true);
    expect(root.querySelector('[data-test="remover"]')).toBeTruthy();
  });

  it('remover emite removed', () => {
    montar(true);
    let pedidos = 0;
    fixture.componentInstance.removed.subscribe(() => pedidos++);

    fixture.componentInstance.remover();

    expect(pedidos).toBe(1);
  });

  it('fechar emite closed', () => {
    montar();
    let fechou = 0;
    fixture.componentInstance.closed.subscribe(() => fechou++);

    fixture.componentInstance.fechar();

    expect(fechou).toBe(1);
  });

  /**
   * O HEIC do iPhone passa pelo `accept` do input em alguns navegadores e a
   * biblioteca não consegue decodificá-lo. Sem esta mensagem, a tela fica num
   * recorte vazio e a pessoa não sabe que o formato é o problema.
   */
  it('arquivo que a biblioteca nao consegue abrir vira mensagem de formato', () => {
    const root = montar();
    escolher(arquivoFalso('foto.heic', 'image/heic'));

    fixture.componentInstance.aoFalharAImagem();
    fixture.detectChanges();

    expect(root.querySelector('[role="alert"]')?.textContent).toContain(
      'formato'
    );
    // E volta a oferecer a escolha, em vez de deixar um recorte quebrado.
    expect(root.querySelector('image-cropper')).toBeNull();
  });

  /**
   * **O modal e removido pelo `@if` do host, e nao fechado.** Um `<dialog>`
   * arrancado do DOM nao devolve o foco para o botao que o abriu -- ele cai no
   * `<body>`, e quem navega por teclado volta ao inicio da pagina. O `close()`
   * no `onDestroy` e o que conserta isso, e este teste e o que prova que ele
   * acontece.
   */
  it('fecha o dialog nativo ao ser destruido, para o foco voltar', () => {
    montar();
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.open).toBeTrue();

    fixture.destroy();

    expect(dialog.open).toBeFalse();
  });

  it('escolher outro arquivo limpa o erro anterior', () => {
    const root = montar();
    escolher(arquivoFalso('foto.heic', 'image/heic'));
    fixture.componentInstance.aoFalharAImagem();
    fixture.detectChanges();

    escolher();

    expect(root.querySelector('[role="alert"]')).toBeNull();
  });
});
