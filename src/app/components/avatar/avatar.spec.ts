import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Avatar } from './avatar';

describe('Avatar (spec 027)', () => {
  let fixture: ComponentFixture<Avatar>;

  function montar(avatarUrl: string | null, name: string | null = 'Ana Prado') {
    fixture = TestBed.createComponent(Avatar);
    fixture.componentRef.setInput('avatarUrl', avatarUrl);
    fixture.componentRef.setInput('name', name);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Avatar],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('desenha a foto quando existe uma URL', () => {
    montar('https://s/b/avatars/uid-1?v=1');

    const img = fixture.debugElement.query(By.css('img'));
    expect(img).toBeTruthy();
    expect(img.nativeElement.getAttribute('src')).toBe(
      'https://s/b/avatars/uid-1?v=1'
    );
    expect(fixture.debugElement.query(By.css('.avatar__initials'))).toBeNull();
  });

  /**
   * **O fallback é novo, e não uma substituição.** Antes desta spec não existia
   * avatar em tela nenhuma e nenhuma tela desenhava iniciais — o ranking mostrava
   * só o nickname. É este componente que passa a ser o único lugar que decide o
   * que aparece quando não há foto.
   */
  it('desenha as iniciais quando nao ha foto', () => {
    montar(null);

    expect(fixture.debugElement.query(By.css('img'))).toBeNull();
    expect(
      fixture.debugElement.query(By.css('.avatar__initials')).nativeElement
        .textContent.trim()
    ).toBe('AP');
  });

  it('usa a primeira e a ultima palavra do nome, nao as duas primeiras', () => {
    montar(null, 'Ana Carolina Prado');

    expect(
      fixture.debugElement.query(By.css('.avatar__initials')).nativeElement
        .textContent.trim()
    ).toBe('AP');
  });

  it('cai em uma letra quando o nome tem uma palavra so', () => {
    montar(null, 'Ana');

    expect(
      fixture.debugElement.query(By.css('.avatar__initials')).nativeElement
        .textContent.trim()
    ).toBe('A');
  });

  it('nome nulo ou vazio nao vira string vazia na tela', () => {
    // Um espaço em branco dentro de um círculo colorido parece defeito. O traço
    // diz "não sei quem é" sem parecer que a tela quebrou.
    montar(null, null);

    expect(
      fixture.debugElement.query(By.css('.avatar__initials')).nativeElement
        .textContent.trim()
    ).toBe('?');
  });

  it('ignora espacos sobrando no nome', () => {
    montar(null, '  Ana   Prado  ');

    expect(
      fixture.debugElement.query(By.css('.avatar__initials')).nativeElement
        .textContent.trim()
    ).toBe('AP');
  });

  it('a foto tem alt descritivo, e as iniciais nao sao lidas duas vezes', () => {
    montar('https://s/b/avatars/uid-1?v=1');
    expect(
      fixture.debugElement.query(By.css('img')).nativeElement.getAttribute('alt')
    ).toBe('Foto de Ana Prado');

    montar(null);
    // As iniciais já são texto na árvore; um `aria-label` no círculo faria o
    // leitor de tela anunciar "AP" duas vezes.
    const circulo = fixture.debugElement.query(By.css('.avatar'));
    expect(circulo.nativeElement.getAttribute('aria-hidden')).toBe('true');
  });

  /**
   * **A imagem quebrada cai nas iniciais.** A URL pode responder 404 depois de a
   * foto ser removida em outra aba, ou de o objeto sair do bucket — e um ícone de
   * imagem quebrada no meio do placar é pior que as iniciais.
   */
  it('imagem que falha cai nas iniciais', () => {
    montar('https://s/b/avatars/uid-1?v=1');

    fixture.debugElement
      .query(By.css('img'))
      .triggerEventHandler('error', new Event('error'));
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('img'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.avatar__initials'))).toBeTruthy();
  });

  it('a foto nova depois de um erro volta a ser tentada', () => {
    // Sem isto, trocar a foto na mesma tela onde uma falhou mostraria as iniciais
    // para sempre: o sinalizador de erro é da URL, não do componente.
    montar('https://s/b/avatars/uid-1?v=1');
    fixture.debugElement
      .query(By.css('img'))
      .triggerEventHandler('error', new Event('error'));
    fixture.detectChanges();

    fixture.componentRef.setInput('avatarUrl', 'https://s/b/avatars/uid-1?v=2');
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('img'))).toBeTruthy();
  });

  it('carrega preguicoso e sem travar a pintura', () => {
    montar('https://s/b/avatars/uid-1?v=1');

    const img = fixture.debugElement.query(By.css('img')).nativeElement;
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('decoding')).toBe('async');
  });

  it('aplica a classe do tamanho pedido', () => {
    fixture = TestBed.createComponent(Avatar);
    fixture.componentRef.setInput('avatarUrl', null);
    fixture.componentRef.setInput('name', 'Ana Prado');
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();

    expect(
      fixture.debugElement
        .query(By.css('.avatar'))
        .nativeElement.classList.contains('avatar--lg')
    ).toBeTrue();
  });
});
