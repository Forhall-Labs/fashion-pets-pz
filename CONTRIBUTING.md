# Flujo de trabajo

Tres ramas — cada una con su propio deploy en Vercel:

| Rama    | Target Vercel | Qué es                                    |
| ------- | ------------- | ----------------------------------------- |
| `dev`   | Preview       | Integración diaria, sin revisión de QA    |
| `stage` | Preview       | QA — lo que se prueba antes de producción |
| `main`  | Production    | Lo que ven los usuarios reales            |

`dev` y `stage` deployan como **Preview** de Vercel (no hay Custom
Environments configurados — el proyecto solo tiene los tres ambientes
nativos: Production, Preview, Development). Cada push a `dev`/`stage` genera
una URL de preview nueva (no una fija por rama) — la URL de cada deploy
queda en el Job Summary de la Action en GitHub. Si más adelante hace falta
una URL estable por rama, se resuelve con un "branch domain" en Project
Settings → Domains del proyecto en Vercel (no automatizado todavía).

1. Rama nueva desde `dev`: `git checkout -b feat/nombre-corto dev`.
2. Al commitear, un hook de pre-commit (husky + lint-staged) corre Prettier,
   ESLint y cspell sobre los archivos modificados — si algo no pasa, el
   commit se cancela y hay que corregirlo antes de reintentar.
3. PR contra `dev` (se completa solo con el template de
   `.github/pull_request_template.md`). GitHub Actions corre `format:check`,
   `spell`, `lint` y `build` — tiene que quedar en verde antes de mergear.
   Al mergear, el push a `dev` dispara un deploy Preview.
4. Cuando `dev` está estable, PR de `dev` → `stage`. Al mergear, otro deploy
   Preview — ahí es donde QA prueba antes de dejarlo pasar.
5. Una vez aprobado en `stage`, PR de `stage` → `main`. Al mergear, deploy
   automático a producción.

Merge siempre por **squash** (es la única opción habilitada); la rama de
origen se borra sola.

## Antes de abrir el PR

```bash
npm run format:check
npm run lint
npm run spell
npm run build
```

Si alguno falla, `npm run format` corrige lo que se pueda automáticamente.

## Notas sobre el deploy

- `.github/workflows/ci-cd.yml` tiene un solo workflow con dos jobs: `checks`
  (siempre) y `deploy` (`needs: checks`, solo en push a `dev`/`stage`/`main`)
  — así un build roto nunca llega a ningún ambiente. `main` deploya con
  `--target=production`; `dev`/`stage` con `--target=preview`.
- Branch protection clásica en `main`/`stage` no está disponible: la org
  está en plan Free de GitHub y eso requiere GHAS en repos privados. La
  disciplina de "PR en orden dev → stage → main" es manual por ahora.
