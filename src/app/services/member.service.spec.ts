import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { MemberService } from './member.service';
import { PublicMember } from '../models/auth.model';

const ANA: PublicMember = {
  id: 'uid-2',
  name: 'Ana Prado',
  bio: 'Migrando de suporte para desenvolvimento.',
  grade: 3,
  xp: 340,
  linkedin: null,
  instagram: null
};

describe('MemberService', () => {
  let service: MemberService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(MemberService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('busca o cartão pelo uid', () => {
    let recebido: PublicMember | undefined;
    service.getMember('uid-2').subscribe((member) => (recebido = member));

    const req = http.expectOne((r) => r.url.endsWith('/members/uid-2'));
    expect(req.request.method).toBe('GET');
    req.flush(ANA);

    expect(recebido?.name).toBe('Ana Prado');
  });

  /**
   * **Sem cache** (spec 019, decisão 9). O XP sobe, a bio é editada, o
   * interruptor das redes é ligado — e um cache mostraria o estado de dez
   * minutos atrás sem nada que denunciasse. O ganho seria uma requisição num
   * gesto que acontece talvez três vezes por sessão.
   */
  it('teste-trava: duas chamadas seguidas fazem duas requisições', () => {
    service.getMember('uid-2').subscribe();
    http.expectOne((r) => r.url.endsWith('/members/uid-2')).flush(ANA);

    service.getMember('uid-2').subscribe();
    http.expectOne((r) => r.url.endsWith('/members/uid-2')).flush(ANA);
  });
});
