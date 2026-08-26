# Flujo de trabajo

Tres ambientes, tres ramas — cada una con su propio deploy en Vercel:

| Rama    | Ambiente Vercel | Qué es                                    |
| ------- | --------------- | ----------------------------------------- |
| `dev`   | `dev`           | Integración diaria, sin revisión de QA    |
| `stage` | `stage`         | QA — lo que se prueba antes de producción |
| `main`  | `production`    | Lo que ven los usuarios reales            |

1. Rama nueva desde `dev`: `git checkout -b feat/nombre-corto dev`.
2. Al commitear, un hook de pre-commit (husky + lint-staged) corre Prettier,
   ESLint y cspell sobre los archivos modificados — si algo no pasa, el
   commit se cancela y hay que corregirlo antes de reintentar.
3. PR contra `dev` (se completa solo con el template de
   `.github/pull_request_template.md`). GitHub Actions corre `format:check`,
   `spell`, `lint` y `build` — tiene que quedar en verde antes de mergear.
   Al mergear, el push a `dev` dispara el deploy al ambiente `dev` en Vercel.
4. Cuando `dev` está estable, PR de `dev` → `stage`. Al mergear, deploy
   automático al ambiente `stage` (QA). Ahí es donde QA prueba antes de
   dejarlo pasar.
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

- `.github/workflows/deploy.yml` corre después de que `CI` termina en
  `dev`/`stage`/`main` (nunca antes, para que un build roto no llegue a
  ningún ambiente) y mapea la rama al target de Vercel correspondiente
  (`vercel deploy --target=<dev|stage|production>`).
- Los ambientes `dev` y `stage` son **Custom Environments** de Vercel — se
  crean solos la primera vez que se despliega con ese `--target`, no hace
  falta configurarlos a mano en el dashboard.
- Branch protection clásica en `main`/`stage` no está disponible: la org
  está en plan Free de GitHub y eso requiere GHAS en repos privados. La
  disciplina de "PR en orden dev → stage → main" es manual por ahora.
