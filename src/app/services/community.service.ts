import { Injectable, computed, signal } from '@angular/core';
import { Community } from '../models/community.model';

const COMMUNITY: Community = {
  identity: {
    name: 'Seita Dev',
    tagline: 'A comunidade de quem quer entender programação, não decorar sintaxe.',
    summary:
      'A Seita Dev é um grupo aberto no WhatsApp para compartilhar conhecimento sobre ' +
      'programação. A trilha vai da primeira variável ao deploy em produção, sempre explicando ' +
      'como o mercado usa cada ferramenta. Quem participa disputa jogos de conhecimento, sobe no ' +
      'ranking e aprende a discutir tecnologia de igual para igual com quem já trabalha na área.',
    status: 'Em construção, com acesso antecipado gratuito para quem entrar na lista'
  },
  grades: {
    totalGrades: 33,
    freeGrades: 5
  },
  tiers: [
    {
      id: 'iniciado',
      range: 'Grau 1 ao 5',
      price: 'Gratuito',
      summary:
        'Qualquer pessoa entra, joga e disputa o ranking até o Grau 5, sem pagar nada e sem prazo.',
      perks: [
        'Grupo aberto no WhatsApp para tirar dúvida e compartilhar conhecimento',
        'Jogos de conhecimento com ranking entre os membros',
        'Parte do conteúdo publicado de graça no canal do Leno Borges no YouTube'
      ]
    },
    {
      id: 'iniciado-maior',
      range: 'Grau 5 ao 33',
      price: 'R$ 14,99 por mês',
      summary:
        'Do Grau 5 em diante a Seita pede uma assinatura simbólica e passa a entregar material ' +
        'de estudo próprio.',
      perks: [
        'Vídeos e materiais de estudo de toda a trilha',
        'Exercícios da plataforma liberados até o Grau 33',
        'Ranking completo, com os 33 Graus em disputa'
      ]
    }
  ],
  highlights: [
    {
      id: 'grupo',
      icon: 'whatsapp',
      title: 'Grupo aberto no WhatsApp',
      detail:
        'A Seita começa onde a conversa acontece: um grupo aberto, sem burocracia de entrada, ' +
        'para perguntar, responder e trocar o que cada um está aprendendo.'
    },
    {
      id: 'conhecimento',
      icon: 'share',
      title: 'Conhecimento compartilhado',
      detail:
        'Ninguém aprende sozinho olhando documentação. Aqui a dúvida de um vira explicação para ' +
        'todos, e quem explica aprende duas vezes.'
    },
    {
      id: 'ranking',
      icon: 'ranking',
      title: 'Jogos de conhecimento e ranking',
      detail:
        'Os membros disputam jogos de conhecimento na plataforma e sobem no ranking dos 33 ' +
        'Graus. A pontuação mede o que você entendeu, não o que você decorou.'
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
      id: 'stacks',
      order: 1,
      area: 'Fundamentos',
      title: 'Stacks',
      icon: 'stacks',
      topics: ['O que são?', 'Como se relacionam?']
    },
    {
      id: 'logica-java',
      order: 2,
      area: 'Back-End',
      title: 'Lógica de Programação com Java',
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
      id: 'poo-java',
      order: 3,
      area: 'Back-End',
      title: 'Orientação a Objetos com Java',
      icon: 'java',
      topics: ['Abstração', 'Encapsulamento', 'Herança', 'Polimorfismo', 'SOLID']
    },
    {
      id: 'banco-de-dados',
      order: 4,
      area: 'Back-End',
      title: 'Banco de Dados',
      icon: 'sql',
      topics: ['SQL vs NoSQL no mercado', 'CRUD com SQL', 'Functions, Procedures e Triggers']
    },
    {
      id: 'git-github',
      order: 5,
      area: 'Fundamentos',
      title: 'Git e GitHub',
      icon: 'git-github',
      topics: ['Versionamento local', 'Git Flow, GitHub Flow e Trunk-Based']
    },
    {
      id: 'api',
      order: 6,
      area: 'Back-End',
      title: 'API',
      icon: 'spring',
      topics: [
        'Introdução ao SpringBoot: conceito de MVC',
        'Variáveis de Ambiente',
        'Do endpoint ao CRUD no banco',
        'Overview de arquiteturas em uma API',
        'Integrações com IA',
        'Básico do Docker'
      ]
    },
    {
      id: 'gcp',
      order: 7,
      area: 'Cloud Computing',
      title: 'GCP',
      icon: 'gcp',
      topics: [
        'Cloud Run',
        'Problemas com container: custo vs lucro',
        'Serverless e alternativas para ROI'
      ]
    },
    {
      id: 'html-css',
      order: 8,
      area: 'Front-End',
      title: 'HTML e CSS',
      icon: 'html-css',
      topics: [
        'Textos, imagens e seletores',
        'Div, FlexBox e Grids',
        'Forms e pseudoclasses',
        'HTML semântico',
        'Responsividade',
        'JavaScript na web'
      ]
    },
    {
      id: 'vercel',
      order: 9,
      area: 'Cloud Computing',
      title: 'Vercel',
      icon: 'vercel',
      topics: ['Ambientes e Deploy']
    },
    {
      id: 'angular',
      order: 10,
      area: 'Front-End',
      title: 'Angular 17+',
      icon: 'angular',
      topics: [
        'Reaprendendo lógica com TypeScript',
        'Diretivas vs Control Flow Syntax',
        'RxJS vs Signals no HTML',
        'Rota, componentização e workspaces',
        'Recomendação pessoal: Dumb Components e Smart Pages',
        'Protocolo HTTP',
        'Login e Guards'
      ]
    },
    {
      id: 'devops',
      order: 11,
      area: 'DevOps',
      title: 'DevOps',
      icon: 'devops',
      topics: [
        'GitHub Actions',
        'CI/CD',
        'Vercel Environments',
        'Segregação de ambientes'
      ]
    },
    {
      id: 'nestjs',
      order: 12,
      area: 'Back-End',
      title: 'NestJS',
      icon: 'nestjs',
      topics: [
        'Por que não em Java?',
        'Diferenças de sintaxe no backend',
        'Olá Guards (de novo)',
        'Introdução ao TypeORM',
        'Decorators personalizados',
        'Supabase e Firestore para TTM e ROI'
      ]
    }
  ],
  conclave: {
    title: 'O Conclave',
    summary:
      'A mentoria da Seita: um encontro por semana, de 2 horas, para no máximo 4 alunos. Turma ' +
      'pequena o bastante para todo mundo falar e ser corrigido.',
    price: 'R$ 150,00',
    duration: '2 horas por encontro',
    cadence: 'Um encontro por semana',
    seats: 4,
    perks: [
      'Aula ao vivo com o Leno Borges, com espaço para discutir e discordar',
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

  readonly grades = computed(() => this.source().grades);

  readonly tiers = computed(() => this.source().tiers);

  readonly highlights = computed(() => this.source().highlights);

  readonly trackStages = computed(() => this.source().trackStages);

  readonly conclave = computed(() => this.source().conclave);
}
