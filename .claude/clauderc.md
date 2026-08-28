# Regras de UI
1. Nunca usar emojis, componentizar SVGs
2. Focar em Mobile First
3. testar no chrome sempre
4. Não use travesssões nos textos
5. Visual moderno com gradientes suaves e animações suaves (em .scss)
6. Animações sempre com animate-enter e animate-leave
7. Dumb Components e Smart Pages (Pages fazem requisição)
8. Se uma página faz múltiplas requisições para popular conteúdo em tela, usar Promise.all se não prejudicar a lógica

# Fluxo de Trabalho
1. Ler context.md da spec
2. Aperfeicoar o context.md com mais informação necessária pra levantar a spec
3. Criar um tasks.md divido em fases e fases divididas em tasks
4. Se, somente se, for usado o comando "executar", iniciar a execução das tasks imediatamente após criá-las
5. Se, somente se, no meio da execução de uma spec aparecer alguma alteração de escopo por necessidade pra completar a task, destacar no topo do context.md
6. Em caso de service, usar TDD, criar testes antes da lógica dos services

# Exemplo de tasks.md
```
    # Fase 01:<Título> []
    - [] Tasks 01:<Nome/Objetivo> 
```
- Marcar com [x] tasks e fases concluídas

# Versionamento
1. Abrir uma branch feat/ para cada fase sendo cada task um commit
2. Cada fase é um push
3. Ao fim da spec abrir uma branch release/ unindo todas as feat/ da spec
4. Merge em dev a release
5. PR contra a main (se houver origin, se não, merge de dev contra main local)

# Ambientes e URLs

| Ambiente | Front | API |
|---|---|---|
| Produção | `https://liga.lenoborges.com.br` | `https://api.lenoborges.com.br` |
| Preview (branch `dev`) | `https://ligapreview.lenoborges.com.br` | `https://apipreview.lenoborges.com.br` |

Front e API são **subdomínios do mesmo domínio registrável** (`lenoborges.com.br`), e isso não é
cosmético: é o que faz o cookie `HttpOnly; SameSite=Lax` do refresh token ser first-party e o F5 dentro
do painel não deslogar (spec 011). Nunca apontar `apiUrl` para um `*.vercel.app` — `vercel.app` está na
Public Suffix List, e o sintoma é login funcionando e F5 deslogando.

**Cada ambiente tem seu próprio projeto do Firebase**, e três configurações de console são por projeto e
por URL de front:

| Projeto | Front que ele atende | Action URL (spec 020) |
|---|---|---|
| produção | `liga.lenoborges.com.br` | `https://liga.lenoborges.com.br/acesso` |
| `dev-liga-dev` | `ligapreview.lenoborges.com.br` | `https://ligapreview.lenoborges.com.br/acesso` |

Ao mexer em `action URL`, `continueUrl` ou `Authorized domains`, **são sempre dois lugares**. Configurar
só um produz o defeito que não aparece em teste nenhum: o fluxo funciona em preview e manda o membro de
produção para a tela do Google (ou para um domínio não autorizado, com `UNAUTHORIZED_DOMAIN` no log e
ninguém recebendo e-mail).

> O comentário do topo de `src/environments/environment.production.ts` diz `edu.lenoborges.com.br`, e
> está desatualizado — o domínio é `liga.`. Mesma coisa em exemplos do repositório do backend.
