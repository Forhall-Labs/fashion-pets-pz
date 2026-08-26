# UI-Spec — Sistema de Agenda para Peluquería Canina

> Documento fuente de verdad para el diseño visual y de interacción del
> prototipo. No contiene código de implementación. Basado en
> `requeriments.md`, `User_Histories.md` y `system_design.md`.

## 1. Fundamentos de marca

### Personalidad / tono
Esta no es una app de consumo para dueños de mascotas — es una **herramienta
operativa de uso diario** para quien atiende el mostrador, revisa la agenda
y sale a hacer pickups. El dueño de la mascota nunca ve esta interfaz; solo
recibe un WhatsApp que el Admin decide enviar. Eso define el tono:

- **Eficiente y legible antes que decorativa.** La información crítica
  (nombre de la mascota, hora, tamaño, si necesita pickup) debe leerse de
  un vistazo en una grilla de calendario densa. Nada de layouts que
  prioricen estética sobre densidad de información.
- **Cálida pero profesional.** Es un negocio de cuidado animal — un toque
  de calidez (paleta terracota/salvia, iconografía sutil relacionada a
  mascotas) es apropiado y esperable — pero sin caer en lo infantil o
  "cute" excesivo propio de apps sociales de mascotas. Es una herramienta
  de trabajo, no un feed.
- **Control humano siempre visible.** El sistema sugiere (auto-agendado,
  recomendaciones de lista de espera) pero nunca actúa solo — cada
  sugerencia debe leerse visualmente como *propuesta*, no como *hecho
  consumado*, hasta que el Admin la aprueba explícitamente (FR-13b,
  FR-17a). Esto se traduce en un color de acento distintivo para todo lo
  "sugerido por el sistema", separado del color de acciones confirmadas.
- **Usable en movimiento, con una mano.** El Admin puede estar en la
  calle haciendo un pickup con el teléfono (`system_design.md` §2.6):
  áreas táctiles grandes, texto legible bajo luz solar, poca dependencia
  de hover, y un fallback táctil claro para el drag-and-drop (mantener
  presionado / tocar-y-mover).

### Público objetivo
Dueño/a o encargado/a de una peluquería canina pequeña o mediana, sin
perfil técnico, que opera el negocio día a día: atiende el mostrador, arma
la agenda, sale a buscar mascotas y manda recordatorios. Es el **único**
rol del sistema (`requeriments.md` §2 — el Cliente/dueño de mascota no
tiene acceso).

## 2. Design Tokens

### 2.1 Paleta de colores
| Token | Hex | Uso | Justificación |
|---|---|---|---|
| `color-primary` (Terracota) | `#D9713C` | Acciones principales: Guardar, Aprobar, Generar ruta, CTAs | Cálido y asociado a cuidado/hogar sin ser un rojo de alarma; suficiente contraste sobre el fondo hueso para ser el color de acción por defecto. |
| `color-secondary` (Verde salvia) | `#6E8F76` | Estados de éxito/confirmado, botones secundarios, badge "Completado" | Verde desaturado y cálido (no un verde-menta frío de app genérica) — comunica "todo en orden" sin romper la paleta cálida general. |
| `color-accent` (Mostaza) | `#E3A93B` | Todo lo que es **sugerencia del sistema, no acción confirmada**: recomendaciones de lista de espera, citas auto-generadas, badges "Sugerido" | Deliberadamente distinto del primario — así el Admin distingue de un vistazo "esto lo decidí yo" (terracota) de "esto lo propuso el sistema" (mostaza), reforzando el principio de control humano visible. |
| `color-danger` (Terracota oscuro) | `#B8402F` | Errores, validaciones, cancelaciones, conflictos de capacidad/blackout, mascota agresiva | Suficientemente distinto del primario para no confundirse en botones adyacentes (p. ej. "Guardar" vs. "Cancelar cita"), manteniéndose dentro de la misma familia cromática cálida. |
| `color-neutral-900` (Carbón cálido) | `#2B2622` | Texto principal, íconos | Negro cálido (no azulado) — coherente con el resto de la paleta y con mejor legibilidad que un gris puro sobre el fondo hueso. |
| `color-neutral-50` (Hueso) | `#FAF5EF` | Fondo de la app | Blanco roto cálido — evita el blanco puro clínico, refuerza la personalidad "cálida pero profesional" sin sacrificar contraste. |

Escala neutra extendida para bordes/estados deshabilitados (no forma parte
de los 4-6 colores de marca, es utilitaria): `#E4DCD1` (borde/divider),
`#8A8177` (texto secundario/placeholder), `#FFFFFF` (superficie de card
sobre el fondo hueso).

### 2.2 Tipografía
| Uso | Fuente | Fuente (Google Fonts) | Motivo |
|---|---|---|---|
| Display (títulos, h1–h3) | **Poppins** | `Poppins` | Sans geométrica de trazo redondeado — transmite calidez y cercanía sin dejar de ser clara a tamaños grandes; balancea el lado "profesional" con el lado "cálido" mejor que una serif editorial. |
| Body (texto de UI, datos, formularios) | **Inter** | `Inter` | Diseñada para interfaces densas y legibilidad en tamaños chicos — crítico para grillas de calendario y tablas con mucha información por pantalla. |

Jerarquía de tamaños:
| Token | Tamaño | Peso | Fuente | Uso |
|---|---|---|---|---|
| `text-h1` | 28px / 1.75rem | 600 | Poppins | Título de pantalla ("Agenda", "Dueños") |
| `text-h2` | 22px / 1.375rem | 600 | Poppins | Título de sección dentro de una pantalla |
| `text-h3` | 18px / 1.125rem | 600 | Poppins | Título de card/modal |
| `text-body` | 15px / 0.9375rem | 400 | Inter | Texto de UI general, valores de formulario |
| `text-small` | 13px / 0.8125rem | 400 | Inter | Metadata, timestamps, texto dentro de badges |
| `text-micro` | 11px / 0.6875rem | 500 | Inter | Texto dentro de tiles de cita muy comprimidos (vista mes) |

### 2.3 Escala de espaciado
`space-1` 4px · `space-2` 8px · `space-3` 12px · `space-4` 16px ·
`space-5` 24px · `space-6` 32px · `space-7` 48px · `space-8` 64px.
Base de 4px, consistente con las utilidades por defecto de Tailwind.

### 2.4 Radios de borde
| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | 6px | Inputs, badges pequeños |
| `radius-md` | 10px | Botones, cards, tiles de cita |
| `radius-lg` | 16px | Modales, paneles laterales |
| `radius-full` | 999px | Badges de estado, avatares, pills de filtro |

### 2.5 Sombras
| Token | Valor | Uso |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(43,38,34,.06)` | Card en reposo |
| `shadow-md` | `0 4px 12px rgba(43,38,34,.12)` | Hover de card, tile de cita mientras se arrastra |
| `shadow-lg` | `0 12px 32px rgba(43,38,34,.18)` | Modal, popover, panel de detalle flotante |

## 3. Inventario de componentes

### Genéricos
**Botón**
- Variantes: primario, secundario, destructivo, texto/ghost, ícono-only.
- Estados: default, hover, focus, disabled, loading (spinner interno,
  bloquea doble click — relevante para HU-5.1 "duplicate submission from a
  double click").
- Props/comportamiento: label, ícono opcional, ancho completo (para
  formularios en mobile).

**Input de texto / Select / Textarea**
- Variantes: texto simple, teléfono (con selector de código de país —
  necesario por HU-7.1 "phone number missing a country code"), numérico,
  select de opción única.
- Estados: default, focus, disabled, error (borde + texto en
  `color-danger` + mensaje de validación debajo), con valor.
- Props: label, placeholder, texto de ayuda, mensaje de error, requerido
  (asterisco).

**Checkbox / Toggle**
- Variantes: checkbox simple (ej. "es agresivo", "necesita pickup"),
  toggle (ej. activar/desactivar un blackout period).
- Estados: default, checked, disabled.

**Card**
- Variantes: card de contenido simple, card interactiva (clickeable, con
  hover), card de estado (ej. resumen de mascota con badges).
- Estados: default, hover, seleccionada.

**Modal / Diálogo**
- Variantes:
  - Confirmación simple (Aceptar/Cancelar).
  - Confirmación con opción de "override" (ej. HU-1.1 duplicado de
    dueño: "Abrir existente" / "Guardar de todos modos" / "Cancelar").
  - Elección múltiple (ej. HU-4.1 conflicto de blackout: "Reprogramar
    automáticamente" / "Cancelar citas" / "Dejar como excepción").
  - Formulario embebido (ej. formulario de mascota abierto en modal desde
    la ficha del dueño).
- Estados: abierto, cargando (mientras confirma una acción), con error.
- Props: título, cuerpo, lista de acciones, cerrable con click afuera o
  Escape (excepto cuando hay una acción irreversible pendiente).

**Tabla / Lista**
- Variantes: tabla de datos (ej. Dueños), lista de tarjetas (ej. Lista de
  espera, Pickups del día).
- Estados: con datos, vacía (con mensaje + ilustración simple), cargando
  (skeleton rows), error de carga (con botón "Reintentar").

**Badge / Etiqueta**
- Variantes: tamaño de mascota (Pequeño/Mediano/Extra grande — colores
  neutros diferenciados por texto, no por semántica de color, ya que no
  son "estados"), tipo de servicio (Full groom / Quick service), estado de
  cita (Agendada/Completada/Cancelada), "Sugerido por el sistema" (usa
  `color-accent`), "Agresivo" (usa `color-danger`), "Necesita pickup",
  "Incompleto para agendar", "Excepción" (cita dentro de un blackout
  dejada a propósito).
- Estados: solo default (no interactivo).

**Toast / Banner de sistema**
- Variantes: éxito, error, información, "acción sugerida disponible" (usa
  `color-accent`, con botón de acción directa — ej. "Hay una recomendación
  para el turno liberado de hoy → Ver").
- Estados: entrante, visible, saliente (auto-dismiss en éxito/información;
  persistente hasta que se resuelve en error/sugerencia).

**Tooltip**
- Uso: aclarar íconos sin label (ej. ícono de pickup, ícono de mascota
  agresiva) en vistas comprimidas (mes/año).

**Selector de rango de fechas**
- Uso: blackout periods (HU-4.1), rango preferido de lista de espera
  (HU-5.1).
- Estados: default, rango inválido (fin antes que inicio — borde en
  `color-danger`), rango superpuesto con uno existente (advertencia
  inline, no bloqueante hasta submit).

**Spinner / Skeleton**
- Uso: estados de carga en cualquier componente que dependa de datos
  remotos (calendario, lista de espera, pickups).

### Específicos del dominio

**Calendario multi-vista** (FR-5, FR-6, FR-7 / HU-2.1, HU-2.2, HU-2.3)
- Variantes: vista Día, Semana, Mes, Año (selector de vista tipo tabs).
- Estados: con citas, vacía (mensaje "no hay citas este mes/día"),
  cargando, error de carga (con "Reintentar").
- Comportamiento: cada celda de día/hora acepta drop de un Tile de Cita;
  en Mes/Año las celdas muestran una versión comprimida (conteo +
  primeros nombres); en Día/Semana se ve el detalle completo por franja
  horaria. Fallback táctil: mantener presionado el tile activa el modo
  arrastre en pantallas táctiles.

**Tile de Cita** (appointment tile)
- Variantes: full-groom, quick-service (borde/ícono distinto — más corto
  visualmente, ya que ocupa menos franja horaria), auto-generada (borde
  `color-accent`), excepción de blackout (borde `color-danger` punteado).
- Estados: default, hover, seleccionada/abierta, arrastrando (`shadow-md`
  + opacidad reducida en la posición original), cancelada (tachada, solo
  visible un instante antes de desaparecer), conflicto (parpadeo breve +
  reversión si el drop es rechazado).
- Props/comportamiento: muestra nombre de mascota + hora (mínimo, FR-6);
  íconos pequeños opcionales (pickup, agresivo); click abre Detalle de
  Cita; draggable dentro de las reglas de negocio (capacidad, blackout,
  solapamiento — validado por el backend, la UI revierte visualmente si
  el servidor rechaza).

**Panel/Modal de Detalle de Cita**
- Contenido: mascota, dueño, tipo de servicio, duración, estado, si
  necesita pickup + ubicación, botón "Enviar por WhatsApp", acciones
  Editar/Reprogramar/Cancelar.
- Estados: cargando, cargado, error parcial (ej. sección de dueño falló
  pero el resto cargó — se marca solo esa sección como error, no todo el
  panel), "ya no existe" (cita cancelada/eliminada por otra acción).

**Formulario de Dueño**
- Campos: nombre, teléfono (con código de país), dirección, día fijo de
  visita (select de 7 días + "sin preferencia").
- Estados: default, guardando, error de validación por campo, modal de
  duplicado detectado.

**Formulario de Mascota**
- Campos: nombre, raza, tamaño (S/M/XL), agresivo (checkbox + modal de
  confirmación al activarlo), frecuencia de grooming (select de presets),
  necesita pickup (checkbox), ubicación (con opción "usar la del dueño"),
  duración promedio de servicio.
- Estados: default, guardando, error de validación por campo, badge
  "Incompleto para agendar" visible si falta frecuencia o duración,
  modal "mantener o regenerar citas futuras" al cambiar la frecuencia de
  una mascota con citas ya generadas.

**Recommendation Card** (recomendación de lista de espera para un slot
liberado — FR-13, FR-13b / HU-5.2, HU-5.3)
- Contenido: datos del slot liberado (fecha, hora, tamaño), candidato
  recomendado (con badge `color-accent` "Sugerido"), candidatos
  alternativos colapsados debajo.
- Estados: con candidato, sin candidato ("sin coincidencias en lista de
  espera"), acción en curso (aprobando), error al aprobar.
- Props/comportamiento: botones "Aprobar", "Rechazar y reservar manual",
  "Rechazar y dejar libre"; al elegir reserva manual abre un buscador de
  mascotas (lista de espera o cualquier mascota) con advertencia si el
  tamaño no coincide.

**Panel de Lista de Espera**
- Contenido: tabla/lista de entradas activas (mascota, tamaño, rango de
  fechas preferido, tiempo en espera), acceso a Recommendation Card
  cuando aplica.
- Estados: vacía, con entradas, entrada resaltada por recomendación
  pendiente.

**Vista de Pickups del día**
- Contenido: lista de mascotas que necesitan pickup ese día (dueño,
  ubicación, hora de cita), botón "Generar ruta".
- Estados: sin pickups ese día, con pickups sin ruta generada, con ruta
  generada (lista reordenada con número de parada), ruta desactualizada
  (banner "la lista cambió, regenerá la ruta"), mascota con "ubicación
  faltante" (excluida de la ruta, con acceso directo a corregir la
  dirección).

**Botones "Abrir en Waze" / "Abrir en Google Maps"**
- Estados: habilitado (ruta con al menos una parada válida), deshabilitado
  (cero paradas válidas, con tooltip explicando por qué).

**Botón "Enviar por WhatsApp"**
- Variantes: para una cita puntual, para "todas las próximas citas" del
  dueño.
- Estados: habilitado, deshabilitado (sin teléfono válido en el dueño —
  con acceso directo a completarlo), cargando (componiendo el mensaje).
- Comportamiento: nunca envía nada — solo compone el mensaje y abre el
  chat externo de WhatsApp (FR-17a); esto debe quedar claro visualmente
  (microcopy tipo "Se abrirá WhatsApp con el mensaje listo — vos lo
  enviás").

**Configuración de Tienda**
- Sub-componentes: input de capacidad máxima por día, input de duración
  de quick service, lista de blackout periods (cada uno editable/
  eliminable) + selector de rango de fechas para agregar uno nuevo.
- Estados: guardando, advertencia de sobre-capacidad en días existentes,
  modal de conflicto al crear un blackout que choca con citas existentes.

## 4. Mapa de pantallas

### 1. Login
- **Objetivo:** autenticarse como Admin (único rol del sistema).
- **Componentes:** Input (usuario/email), Input (contraseña), Botón
  primario.
- **Datos:** credenciales del Admin (gestionadas por Supabase Auth,
  `system_design.md` §3.4).
- **Navegación:** al autenticarse → Agenda.

### 2. Agenda (Calendario)
- **Objetivo:** ver y gestionar todas las citas; es la pantalla principal
  del día a día.
- **Componentes:** Calendario multi-vista, Tile de Cita, Toast de sistema
  (recomendación disponible tras liberar un slot), Botón "Nueva cita".
- **Datos:** citas (`appointments`), derivados de capacidad/blackout para
  validar drops.
- **Navegación:** → Detalle de Cita (click en tile) · → Formulario de Cita
  (Nueva cita) · → Lista de Espera (desde el toast de recomendación) ·
  acceso directo a Dueños, Configuración, Pickups, Lista de Espera desde
  la navegación principal.

### 3. Detalle de Cita
- **Objetivo:** ver toda la información de una cita puntual y actuar sobre
  ella (editar, reprogramar, cancelar, enviar WhatsApp).
- **Componentes:** Panel/Modal de Detalle de Cita, Botón "Enviar por
  WhatsApp".
- **Datos:** `appointments` + `pets` + `owners` relacionados.
- **Navegación:** ← Agenda · → Formulario de Cita (Editar) · → Ficha del
  Dueño (desde el nombre del dueño).

### 4. Formulario de Cita
- **Objetivo:** crear o editar una cita, incluyendo quick service.
- **Componentes:** Select de mascota/dueño, Select de tipo de servicio,
  selector de fecha/hora, Input numérico de duración (autocompletado
  según mascota/tipo de servicio).
- **Datos:** `appointments`.
- **Navegación:** ← Agenda / ← Detalle de Cita · → Agenda (al guardar).

### 5. Dueños — Lista
- **Objetivo:** buscar y acceder a dueños existentes, crear uno nuevo.
- **Componentes:** Tabla/Lista, Input de búsqueda, Botón "Nuevo dueño".
- **Datos:** `owners` (nombre, teléfono, cantidad de mascotas).
- **Navegación:** → Ficha del Dueño (click en una fila) · → Formulario de
  Dueño (Nuevo dueño).

### 6. Ficha del Dueño
- **Objetivo:** ver/editar los datos del dueño y gestionar sus mascotas.
- **Componentes:** Formulario de Dueño (datos + día fijo de visita), lista
  de mascotas del dueño (cards), Botón "Agregar mascota", Botón "Enviar
  por WhatsApp" (todas las próximas citas).
- **Datos:** `owners` + `pets` asociados.
- **Navegación:** ← Dueños · → Formulario de Mascota (por mascota o
  "Agregar mascota") · → Detalle de Cita (desde una cita próxima listada).

### 7. Formulario de Mascota
- **Objetivo:** crear/editar los datos de una mascota, incluida su
  configuración de agendado automático.
- **Componentes:** Formulario de Mascota completo.
- **Datos:** `pets`.
- **Navegación:** ← Ficha del Dueño · → Ficha del Dueño (al guardar).

### 8. Lista de Espera
- **Objetivo:** ver mascotas sin cita confirmada y actuar sobre
  recomendaciones de slots liberados.
- **Componentes:** Panel de Lista de Espera, Recommendation Card.
- **Datos:** `waiting_list_entries` + `pets` relacionados.
- **Navegación:** ← Agenda (desde toast) o navegación principal · →
  Detalle de Cita (tras aprobar, ver la cita recién creada) · → búsqueda
  de mascota (reserva manual).

### 9. Pickups del Día
- **Objetivo:** ver qué mascotas hay que buscar hoy (o un día futuro) y
  generar/abrir la ruta.
- **Componentes:** Vista de Pickups, botones "Abrir en Waze"/"Abrir en
  Google Maps".
- **Datos:** `appointments` del día filtradas por `needs_pickup`, más
  `location_lat/lng` geocodificado de cada `pet`.
- **Navegación:** ← navegación principal · → Detalle de Cita (por
  entrada) · → Formulario de Mascota (para corregir una ubicación
  faltante).

### 10. Configuración de Tienda
- **Objetivo:** definir capacidad máxima diaria, duración de quick
  service y blackout periods.
- **Componentes:** Configuración de Tienda (sub-componentes descritos en
  §3), Modal de conflicto de blackout.
- **Datos:** `shop_config` + `blackout_periods`.
- **Navegación:** ← navegación principal · → Agenda (para revisar días
  marcados como sobre-capacidad tras bajar el máximo).

## 5. Flujos clave

### Flujo A — Alta de dueño y mascota, lista para agendar
*(HU-1.1, HU-1.2, HU-1.3, HU-1.4)*
1. **Dueños — Lista** → click "Nuevo dueño".
2. **Formulario de Dueño** (modal o pantalla completa): completa nombre,
   teléfono, dirección y, opcionalmente, día fijo de visita → Guardar. Si
   el sistema detecta nombre+teléfono duplicados, aparece el Modal de
   confirmación con override antes de continuar.
3. Redirige a **Ficha del Dueño** → click "Agregar mascota".
4. **Formulario de Mascota**: completa nombre, raza, tamaño, agresivo,
   necesita pickup, ubicación (o deja que herede la del dueño) → Guardar.
   Mientras falte frecuencia o duración, la mascota queda con badge
   "Incompleto para agendar".
5. Vuelve a **Ficha del Dueño**, abre la mascota recién creada → completa
   frecuencia de grooming y duración promedio → Guardar. El badge
   "Incompleto para agendar" desaparece y la mascota queda elegible para
   el auto-agendado (FR-8).

### Flujo B — Reprogramar una cita y cubrir el slot liberado desde la lista de espera
*(HU-2.3, HU-5.2, HU-5.3)*
1. **Agenda** (vista Semana o Mes): el Admin arrastra el Tile de Cita de
   "Rex" del martes al jueves, a un horario con capacidad disponible.
2. El sistema valida (capacidad, blackout, solapamiento) y confirma el
   movimiento; el tile se redibuja en el jueves.
3. Aparece un **Toast de sistema** ("acción sugerida disponible"): "Hay
   una recomendación para el slot liberado del martes → Ver".
4. Click en el toast → **Lista de Espera**, con la **Recommendation Card**
   ya resaltada mostrando el candidato del mismo tamaño que "Rex",
   ordenado por tiempo de espera.
5. El Admin revisa el candidato sugerido (o abre los alternativos) y
   clickea "Aprobar" (o "Rechazar y reservar manual" para elegir otra
   mascota).
6. El sistema crea la nueva cita y quita la entrada de la lista de
   espera; el Admin puede volver a **Agenda** y ver el martes cubierto de
   nuevo.

### Flujo C — Generar la ruta de pickups del día y abrirla en el mapa
*(HU-6.1, HU-6.2, HU-6.3)*
1. Desde la navegación principal → **Pickups del Día** (por defecto, hoy).
2. La pantalla lista las mascotas del día flageadas "necesita pickup",
   cada una con dueño, ubicación y hora de cita. Si alguna tiene
   "ubicación faltante", aparece marcada y excluida de la ruta.
3. Click en "Generar ruta" → el sistema geocodifica/ordena por proximidad
   y redibuja la lista como paradas numeradas.
4. El Admin elige "Abrir en Waze" o "Abrir en Google Maps"; se abre la
   app correspondiente con las paradas cargadas en ese orden.
5. Si la lista de pickups cambia después de generar la ruta (ej. se
   cancela una cita), la pantalla muestra el banner "ruta desactualizada"
   y bloquea "Abrir en..." hasta que el Admin regenere.

## 6. Stack de implementación sugerido
*(Solo como referencia — nada de esto se implementa en esta tarea.)*

- **Sistema de componentes: shadcn/ui (Radix UI + Tailwind CSS).**
  Elección natural dado que `system_design.md` ya fija Next.js + Tailwind:
  shadcn/ui no es una dependencia opaca sino componentes que se copian al
  repo, así que se puede themear directamente con los tokens de la
  Sección 2 (colores, radios, tipografía) sin pelear contra los estilos
  por defecto de una librería cerrada. Radix aporta accesibilidad
  (foco, teclado, ARIA) gratis para Modal, Select, Tooltip, Toast, etc.

- **Calendario multi-vista con drag-and-drop** — la pieza técnica más
  particular del proyecto (FR-5/FR-7), no es un detalle menor:
  - *FullCalendar* — maduro, trae Día/Semana/Mes listos y un plugin de
    interacción para drag-and-drop, pero su estilado por defecto no está
    pensado para Tailwind (requiere sobreescribir bastante CSS propio) y
    algunos plugins avanzados son de pago.
  - *react-big-calendar* — open source, se integra mejor con un theming
    a medida en Tailwind, y tiene addon de drag-and-drop
    (`react-big-calendar/lib/addons/dragAndDrop`). Punto en contra: no
    trae una vista "Año" nativa (FR-5 la pide explícitamente), así que
    esa vista habría que construirla a medida de todos modos.
  - *Construir sobre `dnd-kit` + una grilla de calendario propia* — máximo
    control visual y el único camino directo para el fallback táctil de
    "mantener presionado para arrastrar" que pide `system_design.md`
    §2.6, pero implica más esfuerzo de desarrollo que adoptar una
    librería con drag-and-drop ya resuelto.
  - **Recomendación:** `react-big-calendar` (Día/Semana/Mes + drag-and-drop
    del addon) combinado con una vista "Año" construida a medida y un
    wrapper de `dnd-kit` para el fallback táctil — dado que la vista Año
    y el soporte táctil ya obligan a personalizar de todos modos, no se
    pierde tanto frente a construir todo desde cero, y se aprovecha el
    resto de la librería (navegación, franjas horarias, choque de
    eventos) ya resuelto.
  - Complementar con `date-fns` para manejo de fechas (compatible con
    react-big-calendar).

- **Formularios y validación: `react-hook-form` + `zod`.** El volumen de
  formularios (Dueño, Mascota, Blackout period, Configuración de tienda)
  y la cantidad de reglas de validación detalladas en las HU (campos
  requeridos, largos máximos/mínimos, formato de teléfono, rangos de
  fecha fin ≥ inicio, valores numéricos positivos, etc.) mapean
  directamente a schemas de `zod`, con `react-hook-form` manejando estado
  y mensajes de error por campo sin re-renders innecesarios.

- **Iconos: `lucide-react`.** Es la librería de íconos por defecto de
  shadcn/ui, así que no suma una dependencia extra y mantiene consistencia
  visual con el resto del sistema de componentes.

## 7. Pendientes / dudas

### Cobertura verificada
Se recorrieron los 17 FR (FR-1 a FR-17a) del documento de requerimientos y
las 17 HU de `User_Histories.md`. Todos quedan cubiertos por al menos una
pantalla o componente de este spec. Dos casos requirieron agregar
componentes que no eran obvios a partir de una lectura superficial de las
HU, y se los dejo explícitos acá porque son fáciles de perder al pasar de
este spec a un prototipo:

- **FR-8/FR-9 y HU-3.1 (auto-agendado)** no tienen una "pantalla" propia
  dedicada — es un proceso de fondo (job nocturno, `system_design.md`
  §2.3). Lo cubrí con: el badge "Incompleto para agendar" en el
  Formulario de Mascota, y dejando implícito que si una corrida falla o
  se salta una mascota, eso debería visibilizarse en algún punto (banner
  de sistema o directamente en Configuración de Tienda). **No definí una
  pantalla específica de "estado del auto-agendado / última corrida /
  ejecutar ahora"** porque ninguna HU pide una pantalla dedicada para
  eso, solo pide que el sistema "flaguee" el problema — dejo abierto si
  eso amerita su propia sección en Configuración de Tienda o alcanza con
  badges/toasts puntuales. Ver duda más abajo.
- **HU-5.1 (agregar a lista de espera)** no tiene un punto de entrada
  explícito en ninguna HU — las escenarios asumen que la acción "Add to
  waiting list" ya está disponible, pero ninguna HU dice desde dónde se
  dispara. Lo resolví agregando la acción implícitamente al contexto de
  Mascota (Ficha del Dueño / Formulario de Mascota), que es el lugar más
  natural, pero es una decisión de diseño mía, no algo que estuviera
  explícito en las HU.

### Resuelto
- **Auto-agendado (FR-8/FR-9, HU-3.1): es completamente invisible para el
  Admin.** No hay pantalla ni sección de "estado del auto-agendado / última
  corrida / ejecutar ahora" — el proceso corre de fondo sin ninguna
  superficie de UI dedicada. El único punto de contacto con el Admin sigue
  siendo el badge "Incompleto para agendar" en el Formulario de Mascota
  (cuando falta frecuencia o duración); fallas de la corrida en sí
  (HU-3.1 @error) no requieren ningún indicador visible — se resuelven o
  reintentan puramente a nivel de backend, sin acción ni visibilidad del
  Admin. Se elimina del mapa de pantallas cualquier necesidad de una
  sección de "Ejecutar ahora" en Configuración de Tienda.
- **Horario de atención (business hours) es un requisito real (FR-11a,
  agregado a `requeriments.md`).** `shop_config` ahora incluye
  `open_time`/`close_time` (`system_design.md` §3.2). En la pantalla
  **Configuración de Tienda** se agrega un tercer bloque de configuración,
  al mismo nivel que "Capacidad máxima por día" y "Períodos de bloqueo":
  - **Horario de atención**: dos selectores de hora (`Time Picker`),
    "Apertura" y "Cierre". Mismas variantes/estados que el resto de los
    inputs del inventario (§3): default, focus, error (`close_time` debe
    ser posterior a `open_time`, validado igual que el rango de fechas de
    un período de bloqueo).
  - Este horario es la referencia contra la que se valida cualquier
    creación o movimiento de cita (manual, automática, o drag-and-drop —
    HU-2.3), igual que capacidad máxima y períodos de bloqueo: rechazo
    antes de persistir, con mensaje explicando que el horario solicitado
    cae fuera del horario de atención.

### Resuelto
- **Buscador de mascotas en "Agregar a lista de espera" (HU-5.1, FR-12):
  solo busca sobre mascotas sin cita activa en lo que resta del año.**
  Una mascota con una cita ya completada o cancelada este año sigue
  siendo elegible; una mascota con una cita futura confirmada no aparece
  en el buscador (intentar agregarla se rechaza directamente, sin opción
  de "confirmar de todos modos" — ver HU-5.1 actualizada). Este filtro
  aplica solo a "Agregar a lista de espera"; el buscador de la reserva
  manual (HU-5.3, cuando el Admin rechaza una recomendación y asigna otra
  mascota al slot) es un caso distinto — ahí sí se busca sobre todas las
  mascotas, y la única validación es que el horario elegido no se solape
  con otra cita de esa misma mascota (igual que en HU-5.4, donde una
  mascota puede tener un servicio rápido y un grooming completo
  coexistiendo en fechas distintas).
