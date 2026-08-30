import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NicknameDialog } from './nickname-dialog';

describe('NicknameDialog', () => {
  let fixture: ComponentFixture<NicknameDialog>;

  function root(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function digitar(valor: string): void {
    const input = root().querySelector<HTMLInputElement>('.gamertag__input')!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submit(): HTMLButtonElement {
    return root().querySelector<HTMLButtonElement>('.gamertag__submit')!;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NicknameDialog],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(NicknameDialog);
    fixture.detectChanges();
  });

  it('avisa que a escolha é definitiva antes de confirmar', () => {
    // A pessoa precisa saber disso ANTES, e não descobrir no 409 seguinte.
    expect(root().textContent).toContain('não poderá ser alterado depois');
  });

  it('o botão nasce travado, e destrava com um nome válido', () => {
    expect(submit().disabled).toBeTrue();

    digitar('leno_dev');

    expect(submit().disabled).toBeFalse();
  });

  it('teste-trava: recusa espaço, acento e nome curto demais', () => {
    // O placar mostra gamertags lado a lado, e um nome com espaços duplos ou
    // caracteres que se leem igual é a forma mais simples de se passar por
    // outro membro.
    for (const invalido of ['ab', 'leno dev', 'lenó', 'a'.repeat(21)]) {
      digitar(invalido);
      expect(submit().disabled)
        .withContext(`"${invalido}" deveria ser recusado`)
        .toBeTrue();
    }
  });

  it('emite o nome aparado no submit', () => {
    const emitidos: string[] = [];
    fixture.componentInstance.submitted.subscribe((v) => emitidos.push(v));

    digitar('  leno_dev  ');
    submit().click();

    expect(emitidos).toEqual(['leno_dev']);
  });

  it('mostra o erro que o servidor mandou', () => {
    fixture.componentRef.setInput('error', 'Esse gamertag já está em uso.');
    fixture.detectChanges();

    expect(root().querySelector('[role="alert"]')!.textContent).toContain(
      'já está em uso'
    );
  });

  it('pendente trava os dois botões e muda o texto', () => {
    digitar('leno_dev');
    fixture.componentRef.setInput('pending', true);
    fixture.detectChanges();

    expect(submit().disabled).toBeTrue();
    expect(submit().textContent).toContain('Salvando');
    expect(
      root().querySelector<HTMLButtonElement>('.gamertag__ghost')!.disabled
    ).toBeTrue();
  });

  it('teste-trava: o Esc não fecha o modal', () => {
    // Ele é bloqueante, e fechar por acidente deixaria a pessoa numa rota de
    // Jogos sem gamertag — o estado que o guard existe para impedir.
    const dialog = root().querySelector('dialog')!;
    const evento = new Event('cancel', { cancelable: true });

    dialog.dispatchEvent(evento);

    expect(evento.defaultPrevented).toBeTrue();
  });

  it('"Agora não" emite a desistência', () => {
    let desistiu = false;
    fixture.componentInstance.dismissed.subscribe(() => (desistiu = true));

    root().querySelector<HTMLButtonElement>('.gamertag__ghost')!.click();

    expect(desistiu).toBeTrue();
  });

  it('entra com a animação da casa', () => {
    expect(root().querySelector('dialog')!.classList).toContain(
      'animate-enter'
    );
  });
});
