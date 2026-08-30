import { AnswerClock } from './answer-clock';

describe('AnswerClock', () => {
  it('mede a diferença entre o início e a parada', () => {
    const clock = new AnswerClock();

    clock.start(1000);

    expect(clock.stop(5200)).toBe(4200);
  });

  it('arredonda para milissegundo inteiro', () => {
    // `performance.now()` devolve fração, e o servidor valida `@IsInt()`: um
    // 3200.7 no corpo seria recusado com 400, e o membro perderia a resposta.
    const clock = new AnswerClock();

    clock.start(1000);

    expect(clock.stop(4200.7)).toBe(3201);
    expect(Number.isInteger(clock.stop(0))).toBeTrue();
  });

  it('teste-trava: nunca devolve tempo negativo', () => {
    // `performance.now()` é monotônico, então isto não deveria acontecer — mas
    // um número negativo enviado ao servidor cairia fora da janela e faria o
    // membro perder o benefício do próprio relógio sem motivo.
    const clock = new AnswerClock();

    clock.start(5000);

    expect(clock.stop(1000)).toBe(0);
  });

  it('devolve zero quando nunca foi iniciado', () => {
    const clock = new AnswerClock();

    expect(clock.stop(1000)).toBe(0);
  });

  it('parar duas vezes não devolve a mesma medição de novo', () => {
    // A segunda chamada é um erro de fluxo — duas respostas para a mesma
    // questão —, e o servidor já responde 409 nesse caso. Devolver zero aqui
    // deixa claro que não há medição em curso.
    const clock = new AnswerClock();
    clock.start(1000);

    expect(clock.stop(3000)).toBe(2000);
    expect(clock.stop(9000)).toBe(0);
  });

  it('sabe se está contando', () => {
    const clock = new AnswerClock();

    expect(clock.running).toBeFalse();

    clock.start(0);
    expect(clock.running).toBeTrue();

    clock.stop(100);
    expect(clock.running).toBeFalse();
  });

  it('reiniciar substitui a medição anterior', () => {
    // Cada questão começa uma medição nova. Se `start` acumulasse, a segunda
    // questão herdaria o tempo da primeira e pagaria menos XP.
    const clock = new AnswerClock();

    clock.start(0);
    clock.start(1000);

    expect(clock.stop(1500)).toBe(500);
  });
});
