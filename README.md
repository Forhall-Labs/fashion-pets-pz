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

Cada Pull Request corre `format:check`, `spell`, `lint` y `build` vía GitHub
Actions (`.github/workflows/ci.yml`). El deploy a producción en Vercel
(`.github/workflows/deploy.yml`) se dispara solo si esa CI pasó en `main`.

## Documentación del proyecto

- [`docs/requeriments.md`](docs/requeriments.md) — requerimientos funcionales y no funcionales
- [`docs/User_Histories.md`](docs/User_Histories.md) — épicas e historias de usuario
- [`docs/system_design.md`](docs/system_design.md) — arquitectura, stack y esquema de base de datos
- [`docs/ui-spec.md`](docs/ui-spec.md) — sistema de diseño y mapa de pantallas
