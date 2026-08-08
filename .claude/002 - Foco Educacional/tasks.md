# Fase 01: Paleta e fundação visual moderna []
- [] Task 01: Recriar tokens de cor em `src/styles.scss` ao redor do azul do Logo (ink, superfícies, acento, gradientes suaves), substituindo a paleta LCD "Cartucho"
- [] Task 02: Trocar sombra deslocada/bordas duras por sombras leves e cantos arredondados (`--radius`, `--shadow-*`) mantendo contraste AA
- [] Task 03: Suavizar timing/easing das animações globais (`anim-rise`, `anim-pop`, `anim-fade`, `anim-out`) preservando as classes `animate-enter`/`animate-leave` e `prefers-reduced-motion`
- [] Task 04: Integrar o `Logo` component (registrar `logo.scss`, ajustar host/tamanho responsivo) para uso no header e no hero

# Fase 02: Modelo de dados do educador []
- [] Task 01 (TDD): Escrever specs para os novos computeds de `ProfileService` (stacks ensinadas e CTAs de instituição/estudante) antes da implementação
- [] Task 02: Estender `profile.model.ts` com o tipo de stack ensinada (id, label, ícone) e os CTAs (instituição/estudante)
- [] Task 03: Atualizar `PROFILE` em `profile.service.ts` — identity (role/tagline/summary focados em professor particular), lista das 8 stacks ensinadas, CTAs, prova social dev condensada

# Fase 03: Ícones das stacks ensinadas []
- [] Task 01: Criar ícones SVG de HTML & CSS, Java, TypeScript & JavaScript e SQL (`app-icon-*`, seguindo o padrão de `src/app/components/icons/`)
- [] Task 02: Criar ícones SVG de Angular, Spring, NestJS e Git & GitHub

# Fase 04: Componentes de apresentação []
- [] Task 01: Restilizar `TrainerCard` para a identidade de professor (cargo, tagline, meta) com o novo visual moderno
- [] Task 02: Criar componente dumb `TeachingStackGrid` (grid de ícone + label das 8 stacks ensinadas)
- [] Task 03: Criar componente dumb `CtaSplit` (dois CTAs lado a lado — instituição / estudante) reaproveitando `PixelButton` restilizado
- [] Task 04: Restilizar `MenuBar` e `ContactLinks` para o visual moderno

# Fase 05: Montagem da landing page []
- [] Task 01: Hero — identidade de professor + `CtaSplit`
- [] Task 02: Seção "Stacks que ensino" com `TeachingStackGrid`
- [] Task 03: Seção de credibilidade como educador (reaproveita `educatorExperiences` e `TimelineEntry`, formato enxuto)
- [] Task 04: Seção de prova social como desenvolvedor (stat tiles condensados, sem timeline)
- [] Task 05: Seção Formação (reaproveita `education` e `PixelPanel`)
- [] Task 06: Seção de contato final com `CtaSplit` + `ContactLinks`, e footer

# Fase 06: Acessibilidade e revisão []
- [] Task 01: Revisar contraste de texto sobre gradientes e estados de foco visível na nova paleta
- [] Task 02: Revisar `Reveal`/animações com `prefers-reduced-motion` no novo timing

# Fase 07: Validação []
- [] Task 01: Rodar suíte de testes (`ng test`) e testar mobile-first no Chrome (breakpoints do `styles.scss`)
- [] Task 02: Build de produção (`ng build`) e checklist final da spec
