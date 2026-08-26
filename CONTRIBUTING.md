# Flujo de trabajo

1. Rama nueva desde `main`: `git checkout -b feat/nombre-corto`.
2. Al commitear, un hook de pre-commit (husky + lint-staged) corre Prettier,
   ESLint y cspell sobre los archivos modificados — si algo no pasa, el
   commit se cancela y hay que corregirlo antes de reintentar.
3. Abrí el Pull Request contra `main` (se completa solo con el template de
   `.github/pull_request_template.md`). GitHub Actions corre `format:check`,
   `spell`, `lint` y `build` — tiene que quedar en verde antes de mergear.
4. Merge por **squash** (es la única opción habilitada): el historial de
   `main` queda un commit por PR. La rama se borra sola al mergear.
5. Un push a `main` dispara el deploy a producción en Vercel
   (`.github/workflows/deploy.yml`), solo si la CI pasó.

## Antes de abrir el PR

```bash
npm run format:check
npm run lint
npm run spell
npm run build
```

Si alguno falla, `npm run format` corrige lo que se pueda automáticamente.
