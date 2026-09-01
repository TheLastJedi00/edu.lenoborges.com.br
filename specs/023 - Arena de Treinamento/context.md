# Spec 023: Arena de Treinamento

## Objetivo
A Arena de Treinamento exibe desafios práticos de código em forma de cards, integrados na página da Trilha, posicionados após os vídeos e antes do GYM Challenge. Cada desafio (treinamento) rende XP (padrão 30XP) e possui um modal interativo com passos detalhados, vídeos de apoio e espaço para comentários.

Do lado do admin, a interface permite criar, ordenar e gerenciar os treinamentos na trilha correspondente e conta com uma nova rota global para visualizar e responder comentários recebidos nesses treinamentos.

O par desta spec no backend é a **023**, e as duas entram juntas.

---

## Decisões

### 1. Localização e Ordenação na Trilha
Na página `/dashboard/trilha/:badgeId`, a lista de cards da Arena de Treinamento é renderizada após a lista de vídeos e respostas, mas antes do card do GYM Challenge (introduzido na spec 022).
Cada card na lista exibe:
- Título do treinamento.
- Descrição curta.
- XP que o desafio concede (ex: "30 XP").
- Indicador visual (ex: ícone de check) se já foi concluído pelo membro logado.

### 2. O Modal de Treinamento e Conclusão
Ao clicar em um card da Arena, abre-se um modal expansível.
Estrutura do Modal:
1. **Cabeçalho**: Título e Descrição expandidos.
2. **Passos**: Uma lista enumerada de passos a serem executados no código.
3. **Vídeo**: Um card de player de vídeo renderizado condicionalmente (caso o admin tenha anexado um link).
4. **Comentários**: Seção ao final exibindo os últimos 10 comentários em forma de lista plana (sem threads). Um botão "Mostrar mais" carrega os comentários anteriores. Quando o comentário tem `adminReply`, a resposta aparece recuada logo abaixo dele, com o nome de quem respondeu e a data. É o mesmo dado que o admin escreve na rota da decisão 5, e é ele que fecha o ciclo: sem essa área, o admin responde e o membro nunca vê.
5. **Rodapé/Ação**: Um botão "Concluir Desafio" e um para fechar. 

**Comportamento de Conclusão**: Ao clicar em "Concluir Desafio", a API de conclusão é consumida. O modal exibe um feedback visual de sucesso (ex: animação de ganho de XP) mas **não fecha automaticamente**, permitindo que o usuário interaja com os comentários ou reveja o vídeo.

### 3. Restrição de Comentários por Tier
Apenas membros do **Great Tier** têm permissão para comentar. 
A seção de comentários deve avaliar o tier do membro logado:
- Se for Great Tier, exibe o campo (input/textarea) e botão de envio de comentário.
- Se não for, exibe uma mensagem informativa (ex: "A seção de comentários da Arena de Treinamento é exclusiva para membros do Great Tier.") ocultando ou desabilitando o campo de envio.

### 4. Ações do Admin na Trilha
Em `/dashboard/admin/trilha/:badgeId`, abaixo da gestão de vídeos, haverá uma nova seção "Arena de Treinamento".
O admin poderá criar/editar treinamentos através de um formulário contendo:
- Título.
- Descrição.
- Passos (interface que permite adicionar múltiplos itens de texto).
- Link do vídeo (opcional, URL).
- XP do desafio (input numérico, default 30).

**Ordenação**: A lista de treinamentos reordena por setas para cima e para baixo, de modo idêntico ao funcionamento da organização de vídeos, com atualização otimista em memória e rollback quando a API falha.

**Não é drag-and-drop**, e a decisão é para valer: o projeto não usa `@angular/cdk`, e no toque o arrastar disputa com a rolagem da tela em 360px, que é onde o painel mais é aberto. As setas são um alvo de 48px que funciona igual no teclado, no leitor de tela e no dedo.

**Excluir um treinamento apaga junto os comentários e as conclusões dele**, e o `ConfirmDialog` diz isso com todas as letras antes de confirmar.

### 5. Rota Global de Comentários no Admin
Uma nova rota `/dashboard/admin/treinamentos-comentarios` no painel de admin principal.
Esta tela consolida os treinamentos que receberam comentários (ordenados pelos mais recentes). A tela não apenas lista os comentários, mas permite que o admin os **responda diretamente de forma inline**, economizando cliques e padronizando a experiência com a resposta no Mural de Perguntas.

A resposta é gravada como `adminReply` no próprio comentário: uma resposta por comentário, e responder de novo sobrescreve a anterior. Um comentário já respondido mostra a resposta atual no lugar do campo vazio, com um botão para editá-la, porque a tela lista tudo e não só o que falta responder — sem isso o admin responderia duas vezes a mesma pessoa sem perceber.
