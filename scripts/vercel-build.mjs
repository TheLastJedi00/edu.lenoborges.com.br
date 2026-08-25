/**
 * Build da Vercel: escolhe a configuração do Angular pelo ambiente do deploy.
 *
 * Existe porque o Build Command da Vercel é um só para o projeto inteiro, e
 * `ng build` sem `--configuration` cai na `defaultConfiguration` (`production`).
 * Sem esta ponte, a preview da branch `dev` subia com o `environment.production.ts`
 * embutido — ou seja, falando com a API e o banco reais.
 *
 * `VERCEL_ENV` vale "production", "preview" ou "development". Só o primeiro
 * ganha o build de produção; qualquer outro valor (inclusive ausente, num
 * `vercel build` local) cai em preview, que é o lado seguro do erro.
 */
import { spawnSync } from 'node:child_process';

const configuration = process.env.VERCEL_ENV === 'production' ? 'production' : 'preview';

console.log(`[vercel-build] VERCEL_ENV=${process.env.VERCEL_ENV ?? '(vazio)'} → ng build --configuration ${configuration}`);

const { status } = spawnSync('ng', ['build', '--configuration', configuration], {
  stdio: 'inherit',
  shell: true,
});

process.exit(status ?? 1);
