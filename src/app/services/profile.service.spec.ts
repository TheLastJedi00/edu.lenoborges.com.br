import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    service = TestBed.inject(ProfileService);
  });

  it('expõe a identidade com nome, papel e resumo preenchidos', () => {
    const { identity } = service.profile();

    expect(identity.name).toBe('Leno Borges');
    expect(identity.role.length).toBeGreaterThan(0);
    expect(identity.summary.length).toBeGreaterThan(80);
  });

  it('expõe três links de contato com URL absoluta', () => {
    const links = service.profile().identity.links;

    expect(links.length).toBe(3);
    links.forEach((link) => expect(link.url).toMatch(/^https:\/\//));
  });

  it('lista as 8 stacks ensinadas para estudantes, sem repetição', () => {
    const teachingStack = service.teachingStack();

    expect(teachingStack.length).toBe(8);
    const ids = teachingStack.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    teachingStack.forEach((item) => expect(item.label.length).toBeGreaterThan(0));
  });

  it('lista experiências de desenvolvedor da mais recente para a mais antiga', () => {
    const dev = service.devExperiences();

    expect(dev.length).toBeGreaterThan(0);
    dev.forEach((item) => expect(item.track).toBe('dev'));
    expect(dev[0].current).toBeTrue();
  });

  it('separa a trilha de educador das experiências de desenvolvedor', () => {
    const educator = service.educatorExperiences();

    expect(educator.length).toBeGreaterThan(0);
    educator.forEach((item) => expect(item.track).toBe('educator'));
    expect(service.devExperiences().some((item) => item.track === 'educator')).toBeFalse();
  });

  it('garante identificadores únicos entre todas as experiências', () => {
    const ids = service.profile().experiences.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('descreve cada experiência com ao menos um destaque', () => {
    service
      .profile()
      .experiences.forEach((item) => expect(item.highlights.length).toBeGreaterThan(0));
  });

  it('expõe formação acadêmica e números de impacto', () => {
    expect(service.profile().education.length).toBeGreaterThan(0);
    expect(service.profile().stats.length).toBe(3);
  });
});
