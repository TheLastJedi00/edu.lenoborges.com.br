import { Injectable, computed, signal } from '@angular/core';
import { Experience, Profile } from '../models/profile.model';

const PROFILE: Profile = {
  identity: {
    name: 'Leno Borges',
    role: 'Professor de Programação Particular',
    tagline: 'Aulas particulares de programação, do primeiro código à vaga no mercado.',
    summary:
      'Dou aulas particulares de HTML & CSS, Java, TypeScript & JavaScript, SQL, Angular, Spring, ' +
      'NestJS e Git & GitHub, no ritmo de cada aluno. Também sou desenvolvedor fullstack em ' +
      'produção: o que ensino é o que uso todos os dias para construir plataformas SaaS reais — ' +
      'por isso a aula nunca fica só na teoria.',
    languages: ['Português nativo', 'Inglês B1'],
    links: [
      {
        icon: 'linkedin',
        label: 'LinkedIn',
        handle: '/in/jediaelborges00',
        url: 'https://linkedin.com/in/jediaelborges00'
      },
      {
        icon: 'portfolio',
        label: 'Portfólio',
        handle: 'lenoborges.com.br',
        url: 'https://lenoborges.com.br'
      },
      {
        icon: 'instagram',
        label: 'Instagram',
        handle: '@lenoborges.dev',
        url: 'https://instagram.com/lenoborges.dev'
      }
    ]
  },
  teachingStack: [
    { id: 'html-css', label: 'HTML & CSS' },
    { id: 'java', label: 'Java' },
    { id: 'ts-js', label: 'TypeScript & JavaScript' },
    { id: 'sql', label: 'SQL' },
    { id: 'angular', label: 'Angular' },
    { id: 'spring', label: 'Spring' },
    { id: 'nestjs', label: 'NestJS' },
    { id: 'git-github', label: 'Git & GitHub' }
  ],
  experiences: [
    {
      id: 'tichr',
      role: 'Desenvolvedor Fullstack',
      org: 'Tichr',
      mode: 'Remoto',
      period: 'Abr 2026 — presente',
      current: true,
      track: 'dev',
      highlights: [
        'Plataforma SaaS educacional multiplano ponta a ponta, com Angular 20 no front e NestJS 11 + Firebase no back.',
        'Motor de agendamento orientado a regras que projeta e recalcula grades escolares, eliminando o reposicionamento manual de datas.',
        'Arquitetura CQRS com separação estrita entre componentes smart e dumb, unindo comandos REST e leitura em tempo real no Firestore para jogos educativos multiplayer.',
        'IA generativa (Gemini) para conteúdo didático e autenticação por PIN via JWT isolando o portal do aluno.'
      ],
      stack: ['Angular 20', 'NestJS 11', 'Firebase', 'CQRS', 'Gemini']
    },
    {
      id: 'proway',
      role: 'Instrutor Técnico',
      org: 'ProWay',
      mode: 'Part-time',
      period: 'Jan 2026 — presente',
      current: true,
      track: 'educator',
      highlights: [
        'Introdução à programação e pensamento computacional para adolescentes.',
        'Treinamento técnico intensivo para jovens e adultos em transição de carreira ou especialização.',
        'Consultoria e capacitação sob medida para empresas, empresários e executivos.'
      ],
      stack: ['Java', 'POO', 'Node.js', 'SQL', 'Angular', 'JavaScript', 'TypeScript', 'Git']
    },
    {
      id: 'freelancer',
      role: 'Desenvolvedor',
      org: 'Freelancer',
      mode: 'Remoto',
      period: 'Jan 2026 — Mar 2026',
      current: false,
      track: 'dev',
      highlights: [
        'Plataforma de consultoria construída com Angular e NestJS.',
        'Módulo de IA generativa que reduziu a produção de material personalizado de 3 horas para 1 minuto.',
        'Arquitetura modular serverless, com alta disponibilidade e custo zero de ociosidade.',
        'Esteiras de CI/CD para deploy automatizado e controle de qualidade de código.'
      ],
      stack: ['Angular', 'NestJS', 'Serverless', 'CI/CD']
    },
    {
      id: 'bf-academy',
      role: 'Cofundador — Desenvolvedor Fullstack',
      org: 'BF Academy',
      mode: 'Remoto',
      period: 'Out 2025 — presente',
      current: true,
      track: 'dev',
      highlights: [
        'Liderança técnica e desenvolvimento end-to-end de um LMS com Angular e NestJS.',
        'Módulo de IA generativa que reduziu a produção de material didático de 5 dias para 2 minutos.',
        'FinOps com arquitetura modular serverless, mantendo o custo de infraestrutura perto de 0%.',
        'Esteiras de CI/CD para deploy automatizado e gestão de qualidade de código.'
      ],
      stack: ['Angular', 'NestJS', 'Serverless', 'FinOps', 'LMS']
    },
    {
      id: 'bootcamp-mentor',
      role: 'Referência Técnica da turma',
      org: 'Bootcamp AMS — T-Systems / ProWay',
      mode: 'Presencial',
      period: 'Dez 2025',
      current: false,
      track: 'educator',
      highlights: [
        'Referência técnica e mentor dos colegas nos projetos práticos de Java, APIs e banco de dados.',
        'O destaque técnico e didático resultou em um convite direto para o quadro de instrutores da ProWay.'
      ],
      stack: ['Java', 'APIs', 'Bancos de dados']
    },
    {
      id: 'autonomo',
      role: 'Desenvolvedor',
      org: 'Autônomo',
      mode: 'Blumenau, SC',
      period: 'Out 2025 — Nov 2025',
      current: false,
      track: 'dev',
      highlights: [
        'Sistema de agendamento online desenvolvido com Angular.',
        'Migração de monolito para serverless, eliminando custo de servidor ocioso e ampliando a disponibilidade.'
      ],
      stack: ['Angular', 'Serverless']
    }
  ],
  stats: [
    { value: '5 dias → 2 min', label: 'Produção de material didático no LMS da BF Academy' },
    { value: '3 h → 1 min', label: 'Criação de material personalizado na plataforma de consultoria' },
    { value: '≈ 0%', label: 'Custo de infraestrutura ociosa depois da migração serverless' }
  ],
  education: [
    {
      id: 'ads',
      title: 'Análise e Desenvolvimento de Sistemas',
      org: 'Uniasselvi',
      period: 'Conclusão em 06/2027',
      detail: 'Graduação em andamento, com foco em engenharia de software e bancos de dados.'
    },
    {
      id: 'bootcamp-ams',
      title: 'Bootcamp de Suporte AMS',
      org: 'T-Systems / ProWay',
      period: 'Dez 2025',
      detail:
        'Java, APIs e bancos de dados (100h+), arquitetura em cloud, DevOps e redes (36h), ITIL e ITSM (44h) e liderança de times diversos (24h).'
    }
  ]
};

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly source = signal<Profile>(PROFILE);

  readonly profile = this.source.asReadonly();

  readonly teachingStack = computed(() => this.source().teachingStack);

  readonly devExperiences = computed<readonly Experience[]>(() =>
    this.source().experiences.filter((item) => item.track === 'dev')
  );

  readonly educatorExperiences = computed<readonly Experience[]>(() =>
    this.source().experiences.filter((item) => item.track === 'educator')
  );
}
