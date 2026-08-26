# Fix — E-mails caindo na aba de Promoções

**Data:** 2026-08-25  
**Problema:** E-mails recebidos pelos membros estão sendo classificados na aba "Promoções" do Gmail.
**Scope reportado:** O envio de e-mails via `AdminEmailsPage` (`emails.page.ts`).

---

## 1. Diagnóstico

A interface de disparo no admin coleta o texto do e-mail via um campo `<textarea>`, ou seja, o frontend já envia apenas **texto simples** com quebras de linha para o backend. 

O problema da classificação em "Promoções" decorre estritamente da forma como o HTML está sendo envelopado e renderizado no servidor.

## 2. Correção necessária (Frontend)

**Nenhuma ação no código frontend é requerida.**
A arquitetura do módulo de e-mail (conforme documentado na *Spec 014*) prevê de propósito que o admin não escreve HTML. Isso assegura que:
- O frontend mantém o envio cru de dados via payload (`SendEmailRequest`).
- Qualquer mudança para corrigir a diagramação pesada do e-mail é feita num ponto único de falha: a função `renderEmail` no **Backend**.

Essa decisão de arquitetura se provou acertada, pois nos permite resolver o problema da aba de Promoções alterando apenas 1 arquivo no backend (`email-template.ts`), sem precisar lidar com editores WYSIWYG ou limpeza de HTML do lado do cliente.

---

## 3. Resumo de Ação

| # | Ação | Arquivo | Status |
|---|---|---|---|
| 1 | Nenhuma alteração no envio (Manter textarea de texto puro) | `src/app/pages/admin/emails/emails.page.ts` | ✅ Sem ação |
