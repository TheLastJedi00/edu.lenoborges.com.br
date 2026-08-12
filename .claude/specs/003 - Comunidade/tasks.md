# Fase 01: Domínio da Seita Dev []
- [] Task 01 (TDD): Spec de `CommunityService` antes da implementação (trilha com 12 etapas, `order` sem lacunas e ids únicos, tiers dos 33 Graus, highlights)
- [] Task 02: Criar `src/app/models/community.model.ts` com `TrackStage`, `TrackIconId`, `CommunityTier` e `CommunityHighlight`
- [] Task 03: Criar `CommunityService` (`providedIn: 'root'`) com os dados estáticos da Seita: 12 etapas da trilha com seus tópicos, faixas de Grau (1 a 5 gratuito, 5 a 33 por R$ 14,99), highlights e dados do Conclave

# Fase 02: Lista de espera (service mockado) []
- [] Task 01 (TDD): Spec de `WaitlistService` antes da lógica (sucesso com recibo, normalização de telefone e e-mail, recusa sem consentimento, propagação de erro)
- [] Task 02: Implementar `WaitlistEntry`/`WaitlistReceipt` e `WaitlistService` com envio mockado e atraso simulado

# Fase 03: Ícones SVG []
- [] Task 01: Criar `IconStacks`, `IconGcp` e `IconVercel` no padrão de `components/icons`
- [] Task 02: Criar `IconDevops`, `IconWhatsapp` e `IconYoutube` no mesmo padrão

# Fase 04: Componentes dumb da Seita []
- [] Task 01: `TrackTimeline` (timeline vertical mobile first, cada etapa um accordion com `<details>`, ícone SVG por etapa e `IconCaret` como indicador)
- [] Task 02: `GradeLadder` (progressão dos 33 Graus com os 5 gratuitos destacados e o que a assinatura simbólica destrava)
- [] Task 03: `WaitlistDialog` com `<dialog>` nativo, formulário reativo (nome, telefone, e-mail, consentimento), estados idle/sending/success/error, aviso legal de uso dos dados e acessibilidade (`aria-invalid`, `aria-describedby`, `aria-live`)
- [] Task 04: `MenuBar` passa a receber os itens por `input()` e a suportar item de rota (`routerLink`) além de âncora, sem quebrar o `goTo()` atual

# Fase 05: Página /comunidade []
- [] Task 01: Registrar a rota `comunidade` com lazy loading e title em `app.routes.ts`
- [] Task 02: Hero da Seita Dev com selo de "em construção" e CTA de acesso antecipado, mais a seção "O que é a Seita" (grupo aberto, conhecimento compartilhado, jogos com ranking, conteúdo no YouTube)
- [] Task 03: Seção dos 33 Graus com `GradeLadder` e seção da trilha com `TrackTimeline`
- [] Task 04: Seção "Não é sobre certificado" e seção do Conclave (2h semanais para 4 alunos, R$ 150,00, feedback por exercício)
- [] Task 05: Seção final de lista de espera, footer e ligação de todos os CTAs ao `WaitlistDialog` via `WaitlistService`

# Fase 06: CTA na landing []
- [] Task 01: Nova seção `#comunidade` na landing convidando para a Seita, com botão para `/comunidade` e atalho para o modal de lista de espera
- [] Task 02: Item "Comunidade" no `MenuBar` da landing usando o novo suporte a rota

# Fase 07: Acessibilidade e validação []
- [] Task 01: Revisar contraste, foco visível, navegação por teclado no accordion e no `<dialog>`, e `prefers-reduced-motion` nas novas animações
- [] Task 02: Rodar `ng test`, validar no Chrome em 390px, 768px e 1440px sem scroll horizontal e sem erro de console
- [] Task 03: Build de produção (`ng build --configuration production`) e checklist final da spec

## Checklist final
- [] `ng build --configuration production` sem erros
- [] `ng test` verde, incluindo as specs TDD de `CommunityService` e `WaitlistService`
- [] Rota `/comunidade` com lazy loading e CTA na landing levando até ela
- [] Trilha com as 12 etapas em timeline accordion, cada uma com ícone SVG próprio
- [] 33 Graus explicados: gratuito até o Grau 5, R$ 14,99 do 5 em diante
- [] Conclave apresentado com valor, formato e feedback por exercício
- [] Posicionamento "não é sobre certificado" presente
- [] Modal de lista de espera funcional com aviso legal de uso dos dados e envio mockado
- [] Nenhum link externo inventado para WhatsApp ou YouTube
- [] Sem emojis, sem travessões em texto visível, SVGs componentizados
- [] Mobile first validado em 390/768/1440px, `prefers-reduced-motion` respeitado
