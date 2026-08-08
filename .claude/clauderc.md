# Regras de UI
1. Nunca usar emojis, componentizar SVGs
2. Focar em Mobile First
3. testar no chrome sempre
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