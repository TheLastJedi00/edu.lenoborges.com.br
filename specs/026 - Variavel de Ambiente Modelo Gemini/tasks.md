# Spec 026 (front): Variável de Ambiente para Modelo Gemini — Tasks

> **Esta spec não tem trabalho no front.** O arquivo existe porque toda spec deste repositório tem
> um `tasks.md` (fluxo de trabalho do `clauderc.md`) e porque a numeração é compartilhada com o
> backend: uma pasta 026 sem tasks aqui e com tasks lá é o tipo de assimetria que, daqui a três
> meses, parece task esquecida em vez de decisão.

---

# Fase 01: Nenhuma [x]

- [x] Task 01: Conferir que a troca do modelo do Gemini por variável de ambiente não toca contrato
  nenhum que o front consome. As rotas de geração — `POST /admin/badges/:badgeId/trainings/generate`
  (spec 025) e `POST /admin/badges/:badgeId/questions/generate` (spec 022) — mantêm corpo, resposta e
  o `503` sem chave. Nada muda em `admin.service.ts`, em `ai-generate-dialog` nem em
  `ai-generate-trainings-dialog`.
- [x] Task 02: Nenhum arquivo do front alterado. **Não há branch `feat/` nem release desta spec neste
  repositório**; o versionamento dela é todo do backend.
