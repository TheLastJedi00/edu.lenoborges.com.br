# Fase 01: Paleta e fundação visual moderna [x]
- [x] Task 01: Recriar tokens de cor em `src/styles.scss` ao redor do azul do Logo (ink, superfícies, acento, gradientes suaves), substituindo a paleta LCD "Cartucho"
- [x] Task 02: Trocar sombra deslocada/bordas duras por sombras leves e cantos arredondados (`--radius`, `--shadow-*`) mantendo contraste AA
- [x] Task 03: Suavizar timing/easing das animações globais (`anim-rise`, `anim-pop`, `anim-fade`, `anim-out`) preservando as classes `animate-enter`/`animate-leave` e `prefers-reduced-motion`
- [x] Task 04: Integrar o `Logo` component (registrar `logo.scss`, ajustar host/tamanho responsivo) para uso no header e no hero

# Fase 02: Modelo de dados do educador [x]
- [x] Task 01 (TDD): Escrever spec para o novo computed `teachingStack` de `ProfileService` antes da implementação
- [x] Task 02: Estender `profile.model.ts` com `TeachingStackItem` (id, label) e remover `StackGroup`/`StackTone` (código morto) — CTAs não entram no modelo (ver alteração de escopo acima)
- [x] Task 03: Atualizar `PROFILE` em `profile.service.ts` — identity (role/tagline/summary focados em professor particular), lista das 8 stacks ensinadas, remove o campo `stack` antigo e `StackGroupCard` (órfão sem o tipo), landing page ajustada para não quebrar o build

# Fase 03: Ícones das stacks ensinadas [x]
- [x] Task 01: Criar ícones SVG de HTML & CSS, Java, TypeScript & JavaScript e SQL (`app-icon-*`, seguindo o padrão de `src/app/components/icons/`)
- [x] Task 02: Criar ícones SVG de Angular, Spring, NestJS e Git & GitHub

# Fase 04: Componentes de apresentação [x]
- [x] Task 01: Restilizar `TrainerCard` para a identidade de professor (cargo, tagline, meta) com o novo visual moderno, e `IconCartridge` como selo/monograma de identidade
- [x] Task 02: Criar componente dumb `TeachingStackGrid` (grid de ícone + label das 8 stacks ensinadas) — `StackGroupCard` já foi removido na Fase 02
- [x] Task 03: Criar componente dumb `CtaSplit` (dois CTAs lado a lado — instituição / estudante) reaproveitando `PixelButton` restilizado
- [x] Task 04: Restilizar `MenuBar` (com `Logo` integrado), `ContactLinks` e `PixelPanel` para o visual moderno
- [x] Task 05: Restilizar `StatTile`, `TimelineEntry` e `IconPellet` (marcador simples) para o visual moderno
- [x] Task 06: Restilizar `DialogBox` e `IconCaret` (seta fina), mantendo o efeito de texto revelado progressivamente

# Fase 05: Montagem da landing page [x]
- [x] Task 01: Hero — identidade de professor + `CtaSplit`
- [x] Task 02: Seção "Stacks que ensino" com `TeachingStackGrid`
- [x] Task 03: Seção de credibilidade como educador (reaproveita `educatorExperiences` e `TimelineEntry`, formato enxuto)
- [x] Task 04: Seção de prova social como desenvolvedor (stat tiles condensados, sem timeline)
- [x] Task 05: Seção Formação (reaproveita `education` e `PixelPanel`)
- [x] Task 06: Seção de contato final com `CtaSplit` + `ContactLinks`, e footer

As tasks 01–06 formam um único template/página interdependente, foram implementadas em um só
commit (`feat(landing): ...`) em vez de 6 commits separados. Validado visualmente com screenshots
Playwright em mobile (390px) e desktop (1440px): hero, stacks, credibilidade, prova social,
formação e contato renderizam corretamente, sem erros de console.

# Fase 06: Acessibilidade e revisão []
- [] Task 01: Revisar contraste de texto sobre gradientes e estados de foco visível na nova paleta
- [] Task 02: Revisar `Reveal`/animações com `prefers-reduced-motion` no novo timing

# Fase 07: Validação []
- [] Task 01: Rodar suíte de testes (`ng test`) e testar mobile-first no Chrome (breakpoints do `styles.scss`)
- [] Task 02: Build de produção (`ng build`) e checklist final da spec
