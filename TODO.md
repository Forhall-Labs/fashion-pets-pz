# TODO — Épica 1, Sprint 1 (frontend)

Alcance: **Épica 1 — Gestión de fichas de Dueños y Mascotas** (`docs/User_Histories.md`, HU-1.1 a HU-1.4), solo frontend. Todavía no hay backend/Prisma en este repo (se movió a un repo NestJS aparte) — todo esto se construye contra `mockData` en estado local de React, con los mismos flujos de UI/validación que ya probó `docs/prototype/app.js`, pero como componentes reales en `src/modules/`.

Leer antes de arrancar: `docs/User_Histories.md` HU-1.1–1.4 (los Given/When/Then de abajo son un resumen, no el texto completo) y `docs/ui-spec.md` §3 (Formulario de Dueño, Formulario de Mascota, variantes de Modal).

## Ya hecho (no repetir)

- `OwnersList` (`src/modules/owners/OwnersList.tsx`) y `OwnerDetail` (`src/modules/owners/OwnerDetail.tsx`) — listas/fichas de solo lectura, ya portadas.
- `Modal` / `ModalHeader` genéricos en `src/modules/shared/Modal.tsx` — reusar, no crear otro.
- Botones "+ Nuevo dueño", "+ Agregar mascota", "Editar" (dueño y mascota) ya están en el JSX, **deshabilitados** con `title="Próximamente"` — esta sesión es la que los habilita.
- `mockData` (`src/modules/shared/mock-data.ts`) es un singleton de módulo mutable en memoria — está bien mutarlo directamente desde los handlers de submit (`mockData.owners.push(...)`, etc.) más un `useState`/`router.refresh()` o simplemente estado local para forzar el re-render. No hace falta Context ni store.

## Fuera de alcance esta sesión

- Cualquier escenario `@error` de las HUs (falla de red, timeout, condición de carrera) — son de backend, no aplican a mock local.
- Escenarios `@validation` sobre "requests malformados" (flag no-booleano, id inexistente que llega por API) — tampoco aplican a un form controlado por UI.
- HU-1.3 "la frecuencia rara vez coincide con el día fijo del dueño por bloqueos" y HU-1.4 "el día fijo no sobreescribe el ciclo de frecuencia" — dependen del motor de auto-agendado (Épica 3). Dejar un comentario `// TODO(epic-3)` donde correspondería, no implementar.
- Geocoding real de direcciones — seguir usando lat/lng mock o `null`.

---

## HU-1.1 — Crear dueño

Crear `src/modules/owners/OwnerForm.tsx` (modal, reusa `Modal`/`ModalHeader`). Campos: nombre, teléfono, dirección (opcional), día fijo de visita (`select`, opciones `DAY_OPTIONS` de `src/modules/shared/labels.ts` + "Sin preferencia").

- [ ] Guardar con todos los campos completos → aparece en `OwnersList` (nombre, teléfono, dirección exactos)
- [ ] Guardar sin dirección → se guarda vacía/null, no rompe nada
- [ ] Día fijo elegido en el mismo alta queda guardado
- [ ] Nombre con tildes/apóstrofes (`José O'Connor`) se guarda tal cual (sin trim raro, sin escaping visible)
- [ ] **Duplicado exacto** (mismo nombre + teléfono, comparar case-insensitive + solo dígitos del teléfono): en vez de guardar, modal "¿Ya existe...?" con botones **Abrir existente** / **Guardar de todos modos** / **Cancelar** — puerto de `showDuplicateOwnerModal` en `docs/prototype/app.js`
- [ ] **Mismo teléfono, nombre distinto**: modal de aviso "¿hogar compartido o error?" con **Confirmar y guardar** / **Cancelar** — puerto de `showSharedPhoneModal`
- [ ] Validación: nombre vacío → error inline, no guarda
- [ ] Validación: teléfono con letras → error inline
- [ ] Validación: nombre > 300 caracteres → error inline
- [ ] Validación: teléfono muy largo / muy corto (usar el mismo rango 7–15 dígitos que ya se usa en la plantilla de carga, `docs/plantilla-carga-datos.xlsx`) → error inline

Wiring: botón "+ Nuevo dueño" en `OwnersList.tsx` abre el modal en modo creación. Agregar también botón "Editar" en `OwnerDetail.tsx` que abre el mismo form en modo edición (sin la lógica de duplicados, que es solo al crear).

## HU-1.2 — Crear mascota (vinculada a un dueño)

Crear `src/modules/owners/PetForm.tsx` (modal). Campos: nombre, raza, tamaño (`select`: Pequeño/Mediano/Extra grande), agresivo (checkbox), necesita pickup (checkbox), ubicación (opcional, placeholder "usar la del dueño"), frecuencia de grooming (`select` + "Sin definir"), duración promedio (número, min).

- [ ] Guardar con todos los campos → mascota vinculada al `ownerId` correcto, aparece en la ficha del dueño
- [ ] Ubicación vacía → hereda visualmente la dirección del dueño (mostrar el fallback en la UI, igual que `petLocation()` en `src/modules/shared/selectors.ts` — esa función ya existe, solo hay que guardar `locationAddress: null` y dejar que el selector resuelva)
- [ ] Ubicación distinta a la del dueño → se guarda y se usa la propia
- [ ] Segundo/tercer mascota bajo el mismo dueño → cada una con su propio estado de agendado
- [ ] **Checkbox "Es agresivo"**: al tildarlo dispara un modal bloqueante de confirmación ("esto va a marcar la mascota...") antes de dejarlo marcado de verdad — puerto exacto del flujo en `openPetForm()` (`pf-aggressive` change handler) de `docs/prototype/app.js`. Cancelar en el modal destilda el checkbox.
- [ ] Nombre duplicado bajo el mismo dueño → advertencia no bloqueante, deja guardar si se confirma
- [ ] Validación: nombre / raza / tamaño vacíos → error inline por campo
- [ ] Badge "Incompleto para agendar" (`IncompleteBadge`, ya existe en `Badge.tsx`) visible en el form mientras falte frecuencia o duración — ya se muestra en `OwnerDetail`, replicar la condición en el form también

Wiring: "+ Agregar mascota" en `OwnerDetail.tsx` abre el modal con `ownerId` fijo. "Editar" en cada `pet-card` abre el mismo form en modo edición.

## HU-1.3 — Frecuencia de grooming (dentro del mismo `PetForm`)

- [ ] Fijar frecuencia por primera vez (pet sin frecuencia previa) → sin modal de conflicto
- [ ] Cambiar frecuencia cuando el pet **no** tiene citas futuras agendadas → se aplica directo, sin preguntar
- [ ] Cambiar frecuencia cuando el pet **sí** tiene citas futuras (`status: "scheduled"`, `date >= TODAY_ISO` en `mockData.appointments`) → modal bloqueante "¿Mantener o regenerar citas futuras?" con dos botones, puerto de la sección `freqChanged` en `openPetForm()` del prototipo
  - [ ] "Mantener" → guarda la frecuencia, no toca `appointments`
  - [ ] "Regenerar" → guarda la frecuencia, marca esas citas futuras como `cancelled` (el re-agendado real es Épica 3 — acá solo cancelar, dejar comentado que el re-agendado llega después)
- [ ] Sin frecuencia seleccionada → el pet queda con `IncompleteBadge`, no bloquea el guardado del resto del form

## HU-1.4 — Día fijo de visita (dentro de `OwnerForm`)

- [ ] Fijar por primera vez
- [ ] Cambiar a otro día
- [ ] Volver a "Sin preferencia" → se guarda como `null`

---

## Checklist de cierre (antes de dar por terminada la sesión)

- [ ] `npm run format:check && npm run spell && npm run lint && npm run build` — los cuatro en verde
- [ ] Levantar `npm run dev` y probar a mano cada flujo de arriba en el navegador (crear dueño duplicado, marcar agresivo, cambiar frecuencia con citas futuras) — no alcanza con que compile
- [ ] Los botones que quedaban `disabled title="Próximamente"` en `OwnersList.tsx` y `OwnerDetail.tsx` — sacarles el `disabled` a medida que se van habilitando, no dejar ninguno mock si ya tiene form real
- [ ] Commit + push a `Forhall-Labs/fashion-pets-pz`, confirmar que la CI de GitHub Actions pasa (`gh run watch`)
