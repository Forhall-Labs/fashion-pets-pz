# Fashion Pets PZ

Sistema de agenda para una peluquería canina: fichas de dueños y mascotas,
calendario multi-vista con drag-and-drop, agendado automático, lista de
espera, rutas de pickup y recordatorios por WhatsApp. Ver `docs/` para el
detalle completo (requerimientos, historias de usuario, diseño de sistema y
especificación de UI).

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS. Ver `docs/system_design.md`
para la arquitectura completa (backend, base de datos, integraciones).

## Empezar

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando                | Qué hace                                         |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Servidor de desarrollo                           |
| `npm run build`        | Build de producción (incluye chequeo de tipos)   |
| `npm run lint`         | ESLint                                           |
| `npm run format`       | Aplica formato con Prettier                      |
| `npm run format:check` | Verifica formato sin modificar archivos          |
| `npm run spell`        | Chequeo ortográfico (`cspell`, español + inglés) |

## CI/CD

Tres ramas, tres ambientes en Vercel: `dev` → `dev`, `stage` → `stage` (QA),
`main` → producción. Cada Pull Request corre `format:check`, `spell`, `lint`
y `build` vía GitHub Actions; cada push a esas ramas, si los checks pasan,
además dispara el deploy al ambiente correspondiente
(`.github/workflows/ci-cd.yml`). Ver `CONTRIBUTING.md` para el flujo
completo.

## Documentación del proyecto

- [`docs/requeriments.md`](docs/requeriments.md) — requerimientos funcionales y no funcionales
- [`docs/User_Histories.md`](docs/User_Histories.md) — épicas e historias de usuario
- [`docs/system_design.md`](docs/system_design.md) — arquitectura, stack y esquema de base de datos
- [`docs/ui-spec.md`](docs/ui-spec.md) — sistema de diseño y mapa de pantallas

<!-- ci-trigger-diagnostic -->
