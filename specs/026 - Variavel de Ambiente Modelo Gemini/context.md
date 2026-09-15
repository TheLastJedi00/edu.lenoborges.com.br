# Spec 026: Variável de Ambiente para Modelo Gemini

## Objetivo
Esta spec diz respeito exclusivamente à refatoração do backend para utilização de variável de ambiente (`GEMINI_MODEL`) na configuração do modelo de IA (Gemini) consumido pelos serviços (Arena e Jogos). 

Nenhuma alteração é necessária no frontend. A interface gráfica continua consumindo os mesmos endpoints que já estavam sendo servidos.
Este arquivo existe apenas para manter a paridade de numeração e rastreabilidade das specs entre os repositórios front e back.

O par desta spec no backend é a **026**, e ela entra sozinha.

---

## Decisões

### 1. Nenhuma alteração no projeto front-end
As duas telas que disparam geração por IA — o `ai-generate-dialog` do banco de questões (spec 022) e o `ai-generate-trainings-dialog` da Arena (spec 025) — falam com `POST /admin/badges/:badgeId/questions/generate` e `POST /admin/badges/:badgeId/trainings/generate`, e **nenhuma das duas sabe qual modelo responde do outro lado**. Corpo, resposta, o `discarded` que a tela mostra e o `503` sem chave continuam iguais.

### 2. O que o front sente, e não é código
Trocar de modelo muda a **qualidade do rascunho**, e o admin descobre isso aqui, revisando a lista do passo 2. É mais uma razão para o passo 2 existir: o rascunho passa por gente antes de virar registro, e um modelo novo entra em teste sem que nada possa ser gravado por engano.
