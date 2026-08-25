import { Injectable, computed, signal } from '@angular/core';
import { Community } from '../models/community.model';

const COMMUNITY: Community = {
  identity: {
    name: 'Liga Dev',
    tagline: 'A comunidade de quem quer entender programação, não decorar sintaxe.',
    summary:
      'A Liga Dev é um grupo aberto no WhatsApp para compartilhar conhecimento sobre ' +
      'programação. A trilha vai da primeira variável ao deploy em produção, dividida em oito ' +
      'insígnias, sempre explicando como o mercado usa cada ferramenta. Quem conquista as oito ' +
      'disputa a Elite Four, e quem vence a Final ainda encontra a Battle Frontier do outro lado.',
    status: 'Em construção, e aberta: qualquer pessoa cria conta e começa pela Insígnia da Lógica'
  },
  badges: {
    totalBadges: 8,
    freeBadges: 2
  },
  tiers: [
    {
      id: 'dev-tier',
      name: 'Dev Tier',
      range: 'Insígnia 1 e 2',
      // "Gratuito" fica, e não é exceção à regra da spec 009: é a ausência de
      // preço, e é o CTA da página. Esconder o "grátis" seria esconder a única
      // coisa que a landing precisa dizer sobre dinheiro.
      priceHint: 'Gratuito',
      paid: false,
      summary:
        'Qualquer pessoa entra, conquista a Insígnia da Lógica e a da POO, joga e disputa o ' +
        'ranking daquele trecho, sem pagar nada e sem prazo.',
      perks: [
        'Grupo aberto no WhatsApp para tirar dúvida e compartilhar conhecimento',
        'Trilha e jogos das duas primeiras insígnias',
        'Parte do conteúdo publicado de graça no canal do Leno Borges no YouTube'
      ]
    },
    {
      id: 'great-dev-tier',
      name: 'Great Dev Tier',
      range: 'Insígnia 3 em diante',
      priceHint: 'Preço na plataforma',
      paid: true,
      summary:
        'Tudo do Dev Tier, mais a plataforma inteira: a trilha continua da terceira insígnia até ' +
        'a oitava, e segue na Elite Four.',
      perks: [
        'Tudo do Dev Tier',
        'Trilha completa: da Insígnia 3 até a 8, e as quatro Elite Battles',
        'Vídeos e jogos de todas as etapas',
        'Ranking completo, com as oito insígnias e a Elite Four em disputa'
      ]
    },
    {
      id: 'ultra-dev-tier',
      name: 'Ultra Dev Tier',
      range: 'Plataforma e Grinding Arena',
      priceHint: 'Preço na plataforma',
      paid: true,
      summary:
        'Tudo do Great Dev Tier, mais a Grinding Arena: quatro Grindings por mês, ao vivo, em uma ' +
        'turma de no máximo quatro pessoas. São quatro cadeiras, e elas acabam.',
      perks: [
        'Tudo do Great Dev Tier',
        'Um Grinding por semana com o Leno Borges, ao vivo',
        'Turma de no máximo 4 alunos, sem plateia',
        'Correção e feedback pessoal em cada exercício entregue'
      ]
    },
    {
      id: 'master-dev-tier',
      name: 'Master Dev Tier',
      range: 'Plataforma, Grinding Arena e inglês',
      priceHint: 'Preço na plataforma',
      paid: true,
      // A cópia tem uma armadilha para evitar: duas aulas por mês NÃO ensinam
      // inglês, e a página não pode sugerir que ensinam. O que elas treinam é a
      // entrevista técnica em inglês, para quem já programa e trava na conversa.
      summary:
        'Tudo do Ultra Dev Tier, mais duas aulas de inglês por mês voltadas para entrevista ' +
        'técnica — para a vaga que trava no idioma, e não no código.',
      perks: [
        'Tudo do Ultra Dev Tier',
        'Duas aulas de inglês por mês, focadas em entrevista técnica',
        'Treino de apresentação, explicação de arquitetura e follow-up em inglês',
        'Preparação para vagas que exigem inglês no processo seletivo'
      ]
    }
  ],
  highlights: [
    {
      id: 'whatsapp',
      icon: 'whatsapp',
      title: 'Grupo aberto no WhatsApp',
      detail:
        'Ninguém aprende sozinho olhando documentação. Aqui a dúvida de um vira explicação para ' +
        'todos, e quem explica aprende duas vezes.'
    },
    {
      id: 'ranking',
      icon: 'ranking',
      title: 'Jogos de conhecimento e ranking',
      detail:
        'Os membros disputam jogos de conhecimento na plataforma e sobem no ranking das oito ' +
        'insígnias. A pontuação mede o que você entendeu, não o que você decorou.'
    },
    {
      id: 'youtube',
      icon: 'youtube',
      title: 'Conteúdo gratuito no YouTube',
      detail:
        'Parte da trilha fica pública no canal do Leno Borges no YouTube. Você assiste antes de ' +
        'decidir se quer entrar mais fundo.'
    }
  ],
  trackStages: [
    {
      id: 'logica',
      order: 1,
      phase: 'gym',
      area: 'Back-End',
      title: 'Insígnia da Lógica',
      icon: 'java',
      topics: [
        'Variáveis',
        'Operadores Aritméticos e Relacionais',
        'Operadores Lógicos',
        'Estruturas condicionais',
        'Loops',
        'Listas'
      ]
    },
    {
      id: 'poo',
      order: 2,
      phase: 'gym',
      area: 'Back-End',
      title: 'Insígnia da POO',
      icon: 'java',
      topics: ['Abstração', 'Encapsulamento', 'Herança', 'Polimorfismo', 'SOLID']
    },
    {
      id: 'git-github',
      order: 3,
      phase: 'gym',
      area: 'Fundamentos',
      title: 'Insígnia do Git e GitHub',
      icon: 'git-github',
      topics: ['Versionamento local', 'Git Flow, GitHub Flow e Trunk-Based']
    },
    {
      id: 'spring-boot',
      order: 4,
      phase: 'gym',
      area: 'Back-End',
      title: 'Insígnia do Spring Boot',
      icon: 'spring',
      // Banco de dados deixou de ser etapa própria e vive aqui, em SQL puro e em
      // JPA. Os dois níveis aparecem de propósito: só `@Entity` esconde o que
      // acontece embaixo, e só SQL não prepara para o Spring. Ver spec 008.
      topics: [
        'Introdução ao Spring Boot: conceito de MVC',
        'SQL vs NoSQL no mercado',
        'CRUD com SQL puro',
        'Functions, Procedures e Triggers',
        'Persistência com JPA',
        'Variáveis de Ambiente',
        'Do endpoint ao CRUD no banco',
        'Overview de arquiteturas em uma API'
      ]
    },
    {
      id: 'html-css',
      order: 5,
      phase: 'gym',
      area: 'Front-End',
      title: 'Insígnia do HTML e CSS',
      icon: 'html-css',
      topics: [
        'Textos, imagens e seletores',
        'Div, FlexBox e Grids',
        'Forms e pseudoclasses',
        'HTML semântico',
        'Responsividade'
      ]
    },
    {
      id: 'js-ts',
      order: 6,
      phase: 'gym',
      area: 'Front-End',
      title: 'Insígnia do JavaScript e TypeScript',
      icon: 'ts-js',
      topics: [
        'JavaScript na web',
        'Manipulação do DOM',
        'Assincronismo: callback, Promise e async/await',
        'Tipos, interfaces e generics no TypeScript',
        'Por que tipar quando o navegador não exige'
      ]
    },
    {
      id: 'angular',
      order: 7,
      phase: 'gym',
      area: 'Front-End',
      title: 'Insígnia do Angular',
      icon: 'angular',
      topics: [
        'Diretivas vs Control Flow Syntax',
        'RxJS vs Signals no HTML',
        'Rota, componentização e workspaces',
        'Recomendação pessoal: Dumb Components e Smart Pages',
        'Protocolo HTTP',
        'Login e Guards'
      ]
    },
    {
      id: 'nestjs',
      order: 8,
      phase: 'gym',
      area: 'Back-End',
      title: 'Insígnia do NestJS',
      icon: 'nestjs',
      topics: [
        'Por que não em Java?',
        'Diferenças de sintaxe no backend',
        'Olá Guards (de novo)',
        'Introdução ao TypeORM',
        'Decorators personalizados'
      ]
    },
    {
      id: 'oitavas-vercel',
      order: 9,
      phase: 'elite',
      round: 'oitavas',
      area: 'Cloud Computing',
      title: 'Vercel',
      icon: 'vercel',
      topics: ['Ambientes e Deploy', 'Preview por branch', 'Variáveis por ambiente']
    },
    {
      id: 'quartas-baas',
      order: 10,
      phase: 'elite',
      round: 'quartas',
      area: 'Cloud Computing',
      title: 'Firebase e Supabase',
      icon: 'firebase',
      topics: [
        'Backend gerenciado: o que você ganha e o que você entrega',
        'Autenticação sem escrever autenticação',
        'Firestore e Postgres gerenciado',
        'Supabase e Firestore para TTM e ROI'
      ]
    },
    {
      id: 'semifinais-docker',
      order: 11,
      phase: 'elite',
      round: 'semifinais',
      area: 'DevOps',
      title: 'Docker',
      icon: 'docker',
      topics: [
        'Imagem, container e volume',
        'Dockerfile na prática',
        'GitHub Actions e CI/CD',
        'Segregação de ambientes'
      ]
    },
    {
      id: 'final-gcp',
      order: 12,
      phase: 'elite',
      round: 'final',
      area: 'Cloud Computing',
      title: 'Google Cloud Platform',
      icon: 'gcp',
      topics: [
        'Cloud Run',
        'Problemas com container: custo vs lucro',
        'Serverless e alternativas para ROI'
      ]
    },
    {
      id: 'frontier-ia',
      order: 13,
      phase: 'frontier',
      area: 'Pós-game',
      title: 'IA Aplicada ao Desenvolvimento',
      icon: 'ia',
      topics: [
        'Integrações com IA na sua API',
        'Agentes e ferramentas no fluxo de trabalho',
        'O que delegar e o que nunca delegar'
      ]
    }
  ],
  grindingArena: {
    title: 'A Grinding Arena',
    summary:
      'A mentoria da Liga Dev: um Grinding por semana, de 2 horas, para no máximo 4 alunos. ' +
      'Turma pequena o bastante para todo mundo falar e ser corrigido.',
    priceHint: 'No Ultra Dev Tier e no Master Dev Tier',
    duration: '2 horas por Grinding',
    cadence: 'Um Grinding por semana',
    seats: 4,
    perks: [
      'Grinding ao vivo com o Leno Borges, com espaço para discutir e discordar',
      'Correção e feedback pessoal em cada exercício entregue na plataforma',
      'Turma de no máximo 4 alunos, sem plateia'
    ]
  }
};

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private readonly source = signal<Community>(COMMUNITY);

  readonly community = this.source.asReadonly();

  readonly identity = computed(() => this.source().identity);

  readonly badges = computed(() => this.source().badges);

  readonly tiers = computed(() => this.source().tiers);

  readonly highlights = computed(() => this.source().highlights);

  readonly trackStages = computed(() =>
    [...this.source().trackStages].sort((a, b) => a.order - b.order)
  );

  readonly grindingArena = computed(() => this.source().grindingArena);

  /**
   * O nome da insígnia a partir do `badgeId`.
   *
   * Existe aqui porque o catálogo já mora aqui, e porque a spec 012 precisa do
   * nome em dois lugares novos — a linha do painel de notificações e o modal
   * dela. **Uma segunda tabela de insígnias em qualquer outro arquivo é a que
   * vai divergir**: os treze ids já estão duplicados entre front e backend de
   * propósito, e uma terceira cópia não tem justificativa.
   *
   * `badgeId` desconhecido devolve o próprio id em vez de vazio: um id feio na
   * tela é um defeito visível, e o vazio esconderia o mesmo defeito.
   */
  badgeTitle(badgeId: string): string {
    return (
      this.trackStages().find((stage) => stage.id === badgeId)?.title ?? badgeId
    );
  }

  /** O ícone da insígnia, para reusar o mesmo desenho da trilha e do Mural. */
  badgeIcon(badgeId: string): string | null {
    return this.trackStages().find((stage) => stage.id === badgeId)?.icon ?? null;
  }
}
