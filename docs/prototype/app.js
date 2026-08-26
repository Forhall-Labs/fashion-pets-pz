'use strict';

/* ============================================================
   UTILITIES
   ============================================================ */
let idCounter = 100;
function uid(prefix) { return prefix + '-' + (++idCounter); }

function pad2(n) { return String(n).padStart(2, '0'); }

function toISODate(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(iso, n) {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}
function addMonths(iso, n) {
  const d = fromISODate(iso);
  d.setMonth(d.getMonth() + n);
  return toISODate(d);
}
const WEEKDAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatDateLong(iso) {
  const d = fromISODate(iso);
  return WEEKDAY_NAMES[d.getDay()] + ' ' + d.getDate() + ' de ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
}
function formatDateShort(iso) {
  const d = fromISODate(iso);
  return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()].slice(0, 3) + '.';
}
function timeToMinutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function minutesToTime(mins) { return pad2(Math.floor(mins / 60)) + ':' + pad2(mins % 60); }
function rangesOverlap(startA, endA, startB, endB) { return startA < endB && startB < endA; }

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function digitsOnly(s) { return String(s || '').replace(/\D/g, ''); }

const SIZE_LABEL = { small: 'Pequeño', medium: 'Mediano', extra_large: 'Extra grande' };
const FREQ_LABEL = { twice_a_month: 'Dos veces al mes', once_a_month: 'Una vez al mes', once_every_two_months: 'Cada dos meses' };
const SERVICE_LABEL = { full_groom: 'Grooming completo', quick_service: 'Servicio rápido' };
const STATUS_LABEL = { scheduled: 'Agendada', completed: 'Completada', cancelled: 'Cancelada' };
const DAY_OPTIONS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABEL = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' };

/* ============================================================
   MOCK DATA
   ============================================================ */
const TODAY_ISO = toISODate(new Date());

function buildInitialState() {
  const owners = [
    { id: 'o1', name: 'María Fernández', phone: '+54 9 11 5555-0101', address: 'Av. Corrientes 1234, CABA', lat: -34.6037, lng: -58.3816, fixedVisitDay: 'saturday' },
    { id: 'o2', name: 'Diego Torres', phone: '+54 9 11 5555-0202', address: 'Av. Santa Fe 2500, CABA', lat: -34.5952, lng: -58.4055, fixedVisitDay: null },
    { id: 'o3', name: 'Lucía Gómez', phone: '+54 9 11 5555-0303', address: 'Av. Rivadavia 4800, CABA', lat: -34.6157, lng: -58.4333, fixedVisitDay: 'wednesday' },
    { id: 'o4', name: 'Pablo Ibarra', phone: '+54 9 11 5555-0404', address: 'Av. Cabildo 2100, CABA', lat: -34.5623, lng: -58.4562, fixedVisitDay: null },
  ];

  const pets = [
    { id: 'p1', ownerId: 'o1', name: 'Rex', breed: 'Labrador', size: 'extra_large', isAggressive: false, groomingFrequency: 'once_a_month', needsPickup: true, locationAddress: null, lat: null, lng: null, avgServiceDuration: 60 },
    { id: 'p2', ownerId: 'o1', name: 'Nina', breed: 'Caniche', size: 'small', isAggressive: false, groomingFrequency: 'twice_a_month', needsPickup: false, locationAddress: null, lat: null, lng: null, avgServiceDuration: 30 },
    { id: 'p3', ownerId: 'o2', name: 'Toby', breed: 'Bulldog', size: 'medium', isAggressive: true, groomingFrequency: 'once_every_two_months', needsPickup: true, locationAddress: null, lat: null, lng: null, avgServiceDuration: 45 },
    { id: 'p4', ownerId: 'o3', name: 'Luna', breed: 'Border Collie', size: 'medium', isAggressive: false, groomingFrequency: null, needsPickup: false, locationAddress: null, lat: null, lng: null, avgServiceDuration: null },
    { id: 'p5', ownerId: 'o4', name: 'Simón', breed: 'Schnauzer', size: 'small', isAggressive: false, groomingFrequency: 'once_a_month', needsPickup: true, locationAddress: null, lat: null, lng: null, avgServiceDuration: 30 },
    { id: 'p6', ownerId: 'o2', name: 'Coco', breed: 'Shih Tzu', size: 'small', isAggressive: false, groomingFrequency: 'twice_a_month', needsPickup: false, locationAddress: null, lat: null, lng: null, avgServiceDuration: 25 },
    { id: 'p7', ownerId: 'o4', name: 'Duque', breed: 'Gran Danés', size: 'extra_large', isAggressive: false, groomingFrequency: 'once_a_month', needsPickup: true, locationAddress: null, lat: null, lng: null, avgServiceDuration: 70 },
    { id: 'p8', ownerId: 'o3', name: 'Mora', breed: 'Cocker', size: 'medium', isAggressive: false, groomingFrequency: 'once_a_month', needsPickup: false, locationAddress: null, lat: null, lng: null, avgServiceDuration: 40 },
  ];

  const appointments = [
    { id: 'a1', petId: 'p1', date: TODAY_ISO, startTime: '09:00', durationMinutes: 60, serviceType: 'full_groom', status: 'scheduled', source: 'manual', flaggedReason: null },
    { id: 'a2', petId: 'p5', date: TODAY_ISO, startTime: '10:30', durationMinutes: 30, serviceType: 'full_groom', status: 'scheduled', source: 'manual', flaggedReason: null },
    { id: 'a3', petId: 'p3', date: addDays(TODAY_ISO, 1), startTime: '11:00', durationMinutes: 45, serviceType: 'full_groom', status: 'scheduled', source: 'auto_scheduled', flaggedReason: null },
    { id: 'a4', petId: 'p2', date: addDays(TODAY_ISO, 3), startTime: '15:00', durationMinutes: 30, serviceType: 'full_groom', status: 'scheduled', source: 'manual', flaggedReason: null },
    { id: 'a5', petId: 'p1', date: addDays(TODAY_ISO, 14), startTime: '09:00', durationMinutes: 60, serviceType: 'full_groom', status: 'scheduled', source: 'manual', flaggedReason: 'Excepción: cita dejada dentro de un período de bloqueo' },
    { id: 'a6', petId: 'p2', date: addDays(TODAY_ISO, 21), startTime: '09:30', durationMinutes: 30, serviceType: 'full_groom', status: 'scheduled', source: 'auto_scheduled', flaggedReason: null },
    { id: 'a7', petId: 'p5', date: addDays(TODAY_ISO, 200), startTime: '09:00', durationMinutes: 30, serviceType: 'full_groom', status: 'scheduled', source: 'auto_scheduled', flaggedReason: null },
    { id: 'a8', petId: 'p3', date: addDays(TODAY_ISO, -5), startTime: '10:00', durationMinutes: 45, serviceType: 'full_groom', status: 'completed', source: 'manual', flaggedReason: null },
    { id: 'a9', petId: 'p1', date: addDays(TODAY_ISO, -2), startTime: '09:00', durationMinutes: 60, serviceType: 'full_groom', status: 'cancelled', source: 'manual', flaggedReason: null },
  ];

  const waitingList = [
    { id: 'w1', petId: 'p6', preferredStartDate: null, preferredEndDate: null, status: 'active', fulfilledAppointmentId: null, createdAt: addDays(TODAY_ISO, -10) },
    { id: 'w2', petId: 'p8', preferredStartDate: null, preferredEndDate: null, status: 'active', fulfilledAppointmentId: null, createdAt: addDays(TODAY_ISO, -5) },
    { id: 'w3', petId: 'p7', preferredStartDate: null, preferredEndDate: null, status: 'active', fulfilledAppointmentId: null, createdAt: addDays(TODAY_ISO, -2) },
  ];

  const blackoutPeriods = [
    { id: 'b1', startDate: addDays(TODAY_ISO, 12), endDate: addDays(TODAY_ISO, 16), label: 'Vacaciones de invierno' },
  ];

  const shopConfig = { maxPetsPerDay: 6, quickServiceDurationMinutes: 20, openTime: '09:00', closeTime: '18:00' };

  return { owners, pets, appointments, waitingList, blackoutPeriods, shopConfig };
}

let db = buildInitialState();

const ui = {
  loggedIn: false,
  screen: 'agenda',
  navOpen: false,
  calView: 'month',
  calAnchor: TODAY_ISO,
  currentOwnerId: null,
  pickupDate: TODAY_ISO,
  pickupRoute: null,
  pendingRecommendation: null,
  movingApptId: null,
};

/* ============================================================
   DOMAIN HELPERS
   ============================================================ */
function getOwner(id) { return db.owners.find(o => o.id === id); }
function getPet(id) { return db.pets.find(p => p.id === id); }
function getAppt(id) { return db.appointments.find(a => a.id === id); }
function petsOfOwner(ownerId) { return db.pets.filter(p => p.ownerId === ownerId); }
function isIncomplete(pet) { return !pet.groomingFrequency || !pet.avgServiceDuration; }

function petLocation(pet) {
  if (pet.lat != null && pet.lng != null) return { lat: pet.lat, lng: pet.lng, address: pet.locationAddress, has: true };
  const owner = getOwner(pet.ownerId);
  if (owner && owner.lat != null && owner.lng != null) return { lat: owner.lat, lng: owner.lng, address: owner.address, has: true };
  return { lat: null, lng: null, address: null, has: false };
}

function isBlackoutDate(iso) {
  return db.blackoutPeriods.some(b => iso >= b.startDate && iso <= b.endDate);
}
function getBlackoutPeriod(iso) {
  return db.blackoutPeriods.find(b => iso >= b.startDate && iso <= b.endDate);
}
function appointmentsOnDate(iso) {
  return db.appointments.filter(a => a.date === iso);
}
function scheduledCountOnDate(iso, excludeApptId) {
  return db.appointments.filter(a => a.date === iso && a.status === 'scheduled' && a.id !== excludeApptId).length;
}
function hasActiveAppointment(petId) {
  return db.appointments.some(a => a.petId === petId && a.status === 'scheduled');
}
function petHasOverlap(petId, dateIso, startTime, durationMinutes, excludeApptId) {
  const startMin = timeToMinutes(startTime), endMin = startMin + durationMinutes;
  return db.appointments.some(a => {
    if (a.id === excludeApptId || a.petId !== petId || a.date !== dateIso || a.status !== 'scheduled') return false;
    const aStart = timeToMinutes(a.startTime), aEnd = aStart + a.durationMinutes;
    return rangesOverlap(startMin, endMin, aStart, aEnd);
  });
}
function isWithinBusinessHours(startTime, durationMinutes) {
  const startMin = timeToMinutes(startTime), endMin = startMin + durationMinutes;
  const openMin = timeToMinutes(db.shopConfig.openTime), closeMin = timeToMinutes(db.shopConfig.closeTime);
  return startMin >= openMin && endMin <= closeMin;
}

// Core validation shared by manual booking, editing, and drag-and-drop (NFR-2, HU-2.3).
function validateAppointmentSlot({ petId, date, time, duration, excludeApptId }) {
  if (isBlackoutDate(date)) {
    return { ok: false, reason: 'blackout', message: 'Ese día está dentro de un período de bloqueo (vacaciones). No se puede agendar ahí.' };
  }
  if (!isWithinBusinessHours(time, duration)) {
    return { ok: false, reason: 'hours', message: `El horario elegido cae fuera del horario de atención (${db.shopConfig.openTime}–${db.shopConfig.closeTime}).` };
  }
  if (scheduledCountOnDate(date, excludeApptId) >= db.shopConfig.maxPetsPerDay) {
    return { ok: false, reason: 'capacity', message: `Ese día ya alcanzó la capacidad máxima (${db.shopConfig.maxPetsPerDay} mascotas).` };
  }
  if (petHasOverlap(petId, date, time, duration, excludeApptId)) {
    return { ok: false, reason: 'overlap', message: 'Esta mascota ya tiene otra cita que se superpone con ese horario.' };
  }
  return { ok: true };
}

function evaluateVacatedSlot(dateIso, timeStr, size, durationMinutes) {
  const candidates = db.waitingList
    .filter(w => w.status === 'active')
    .filter(w => {
      const pet = getPet(w.petId);
      if (!pet || pet.size !== size) return false;
      if (hasActiveAppointment(pet.id)) return false;
      if (w.preferredStartDate && dateIso < w.preferredStartDate) return false;
      if (w.preferredEndDate && dateIso > w.preferredEndDate) return false;
      return true;
    })
    .sort((a, b) => a.createdAt < b.createdAt ? -1 : 1);

  if (candidates.length) {
    ui.pendingRecommendation = { slotDate: dateIso, slotTime: timeStr, size, durationMinutes, candidateEntryIds: candidates.map(c => c.id) };
    toast(`Hay una recomendación de lista de espera para el turno liberado del ${formatDateShort(dateIso)} a las ${timeStr}.`, 'suggestion', {
      actionLabel: 'Ver', onAction: () => navigateTo('waiting-list'),
    });
  } else {
    ui.pendingRecommendation = null;
  }
}

function attemptMoveAppointment(apptId, newDate, newTime) {
  const appt = getAppt(apptId);
  if (!appt) return;
  const result = validateAppointmentSlot({ petId: appt.petId, date: newDate, time: newTime, duration: appt.durationMinutes, excludeApptId: appt.id });
  if (!result.ok) {
    toast(result.message, 'error');
    return;
  }
  const pet = getPet(appt.petId);
  const origDate = appt.date, origTime = appt.startTime;
  appt.date = newDate;
  appt.startTime = newTime;
  toast(`Cita de ${pet.name} movida a ${formatDateShort(newDate)} ${newTime}.`, 'success');
  evaluateVacatedSlot(origDate, origTime, pet.size, appt.durationMinutes);
  renderCurrentScreen();
}

/* ============================================================
   TOASTS
   ============================================================ */
function toast(message, type, opts) {
  opts = opts || {};
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast toast-' + (type || 'info');
  el.innerHTML = `<span>${escapeHtml(message)}</span><span style="display:flex;gap:6px;align-items:center;">` +
    (opts.actionLabel ? `<button data-toast-action>${escapeHtml(opts.actionLabel)}</button>` : '') +
    `<button class="toast-close" data-toast-close aria-label="Cerrar">×</button></span>`;
  container.appendChild(el);
  if (opts.onAction) {
    el.querySelector('[data-toast-action]')?.addEventListener('click', () => { opts.onAction(); el.remove(); });
  }
  el.querySelector('[data-toast-close]').addEventListener('click', () => el.remove());
  if (type === 'success' || type === 'info') {
    setTimeout(() => el.remove(), 4000);
  }
}

/* ============================================================
   MODALS
   ============================================================ */
function openModal(html, opts) {
  opts = opts || {};
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-overlay" data-modal-overlay><div class="modal ${opts.wide ? 'modal-wide' : ''}" role="dialog" aria-modal="true">${html}</div></div>`;
  root.querySelector('[data-modal-overlay]').addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-modal-overlay') && !opts.blocking) closeModal();
  });
  return root.querySelector('.modal');
}
function closeModal() { document.getElementById('modal-root').innerHTML = ''; }

/* ============================================================
   NAVIGATION / RENDER DISPATCH
   ============================================================ */
function navigateTo(screen, opts) {
  endMovingMode();
  ui.screen = screen;
  ui.navOpen = false;
  if (opts && opts.ownerId) ui.currentOwnerId = opts.ownerId;
  document.querySelectorAll('.screen').forEach(s => { s.hidden = s.dataset.screen !== screen; });
  document.querySelectorAll('.nav-link').forEach(b => b.classList.toggle('is-active', b.dataset.nav === screen));
  document.getElementById('main-nav').classList.remove('is-open');
  window.scrollTo(0, 0);
  renderCurrentScreen();
}
function renderCurrentScreen() {
  switch (ui.screen) {
    case 'agenda': renderAgenda(); break;
    case 'owners': renderOwnersList(); break;
    case 'owner-detail': renderOwnerDetail(ui.currentOwnerId); break;
    case 'waiting-list': renderWaitingList(); break;
    case 'pickups': renderPickups(); break;
    case 'config': renderConfig(); break;
  }
}

/* ============================================================
   SHARED UI FRAGMENTS
   ============================================================ */
function sizeBadge(size) { return `<span class="badge badge-size">${SIZE_LABEL[size] || size}</span>`; }
function serviceBadge(type) { return `<span class="badge badge-service">${SERVICE_LABEL[type] || type}</span>`; }
function statusBadge(status) { return `<span class="badge badge-status-${status}">${STATUS_LABEL[status] || status}</span>`; }
function suggestedBadge() { return `<span class="badge badge-suggested">Sugerido por el sistema</span>`; }
function aggressiveBadge() { return `<span class="badge badge-aggressive">⚠ Agresivo</span>`; }
function pickupBadge() { return `<span class="badge badge-pickup">🚗 Necesita pickup</span>`; }
function incompleteBadge() { return `<span class="badge badge-incomplete">Incompleto para agendar</span>`; }
function exceptionBadge() { return `<span class="badge badge-exception">Excepción de bloqueo</span>`; }

function apptTileClasses(appt) {
  const c = ['appt-tile'];
  if (appt.serviceType === 'quick_service') c.push('is-quick');
  if (appt.source === 'auto_scheduled') c.push('is-auto');
  if (appt.flaggedReason) c.push('is-exception');
  return c.join(' ');
}
function apptTileHTML(appt) {
  const pet = getPet(appt.petId);
  return `<div class="${apptTileClasses(appt)}" draggable="true" data-appt-id="${appt.id}" data-action="open-appointment" data-id="${appt.id}" title="${escapeHtml(pet.name)} — ${appt.startTime}">
    <span class="appt-time">${appt.startTime}</span>${escapeHtml(pet.name)}${appt.status === 'cancelled' ? ' (cancelada)' : ''}
  </div>`;
}

/* ============================================================
   SCREEN: AGENDA (CALENDAR)
   ============================================================ */
function renderAgenda() {
  document.querySelectorAll('.view-tab').forEach(t => t.classList.toggle('is-active', t.dataset.view === ui.calView));
  const label = document.getElementById('agenda-current-label');
  const root = document.getElementById('calendar-root');
  const anchor = fromISODate(ui.calAnchor);

  if (ui.calView === 'day') {
    label.textContent = formatDateLong(ui.calAnchor);
    root.innerHTML = renderDayOrWeek([ui.calAnchor]);
  } else if (ui.calView === 'week') {
    const monday = new Date(anchor);
    monday.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7));
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return toISODate(d); });
    label.textContent = formatDateShort(days[0]) + ' – ' + formatDateShort(days[6]);
    root.innerHTML = renderDayOrWeek(days);
  } else if (ui.calView === 'month') {
    label.textContent = MONTH_NAMES[anchor.getMonth()] + ' ' + anchor.getFullYear();
    root.innerHTML = renderMonth(anchor.getFullYear(), anchor.getMonth());
  } else {
    label.textContent = String(anchor.getFullYear());
    root.innerHTML = renderYear(anchor.getFullYear());
  }
  attachCalendarDnD(root);
}

function renderDayOrWeek(days) {
  const openMin = timeToMinutes(db.shopConfig.openTime), closeMin = timeToMinutes(db.shopConfig.closeTime);
  const hours = [];
  for (let m = openMin; m < closeMin; m += 60) hours.push(m);
  const cols = days.length;
  let html = `<div class="cal-grid" style="grid-template-columns:70px repeat(${cols},1fr)">`;
  html += `<div class="cal-day-col-header"></div>`;
  days.forEach(d => {
    const dObj = fromISODate(d);
    html += `<div class="cal-day-col-header">${WEEKDAY_SHORT[dObj.getDay()]} ${dObj.getDate()}</div>`;
  });
  hours.forEach(hMin => {
    html += `<div class="cal-hour-label">${minutesToTime(hMin)}</div>`;
    days.forEach(d => {
      const blackout = isBlackoutDate(d);
      const cellAppts = appointmentsOnDate(d).filter(a => {
        const s = timeToMinutes(a.startTime);
        return s >= hMin && s < hMin + 60;
      });
      html += `<div class="cal-cell ${blackout ? 'is-blackout' : ''}" data-dropdate="${d}" data-droptime="${minutesToTime(hMin)}" data-action="${cellAppts.length ? '' : 'new-appointment'}" data-date="${d}" data-time="${minutesToTime(hMin)}">`;
      cellAppts.forEach(a => { html += apptTileHTML(a); });
      html += `</div>`;
    });
  });
  html += `</div>`;
  return html;
}

function renderMonth(year, monthIndex) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startOffset);

  let html = `<div class="cal-month-grid">` + ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => `<div class="cal-month-weekday">${d}</div>`).join('');

  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const iso = toISODate(d);
    const otherMonth = d.getMonth() !== monthIndex;
    const blackout = isBlackoutDate(iso);
    const dayAppts = appointmentsOnDate(iso);
    const isToday = iso === TODAY_ISO;
    html += `<div class="cal-month-day ${otherMonth ? 'is-other-month' : ''} ${blackout ? 'is-blackout' : ''} ${isToday ? 'is-today' : ''}" data-dropdate="${iso}" data-droptime="09:00" data-action="${dayAppts.length ? '' : 'new-appointment'}" data-date="${iso}" data-time="09:00">`;
    html += `<span class="cal-month-daynum">${d.getDate()}</span>`;
    dayAppts.slice(0, 3).forEach(a => { html += apptTileHTML(a); });
    if (dayAppts.length > 3) html += `<span class="cal-month-more">+${dayAppts.length - 3} más</span>`;
    html += `</div>`;
  }
  html += `</div>`;
  return html;
}

function renderYear(year) {
  let html = `<div class="cal-year-grid">`;
  for (let m = 0; m < 12; m++) {
    const firstOfMonth = new Date(year, m, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - startOffset);
    html += `<div class="cal-year-month" data-action="cal-goto-month" data-year="${year}" data-month="${m}">
      <div class="cal-year-month-title">${MONTH_NAMES[m]}</div><div class="cal-year-mini-grid">`;
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      if (d.getMonth() !== m) { html += `<div class="cal-year-mini-day"></div>`; continue; }
      const iso = toISODate(d);
      const has = appointmentsOnDate(iso).length > 0;
      const blackout = isBlackoutDate(iso);
      html += `<div class="cal-year-mini-day ${has ? 'has-appt' : ''} ${blackout ? 'is-blackout' : ''}">${d.getDate()}</div>`;
    }
    html += `</div></div>`;
  }
  html += `</div>`;
  return html;
}

function shiftCalendar(dir) {
  if (ui.calView === 'day') ui.calAnchor = addDays(ui.calAnchor, dir);
  else if (ui.calView === 'week') ui.calAnchor = addDays(ui.calAnchor, dir * 7);
  else if (ui.calView === 'month') ui.calAnchor = addMonths(ui.calAnchor, dir);
  else ui.calAnchor = addMonths(ui.calAnchor, dir * 12);
  renderAgenda();
}

/* ---- Drag and drop (desktop native + touch long-press fallback) ---- */
function attachCalendarDnD(root) {
  root.querySelectorAll('.appt-tile').forEach(tile => {
    tile.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', tile.dataset.apptId);
      tile.classList.add('is-dragging');
    });
    tile.addEventListener('dragend', () => tile.classList.remove('is-dragging'));
    tile.addEventListener('pointerdown', onTilePointerDown);
  });
  root.querySelectorAll('[data-dropdate]').forEach(cell => {
    cell.addEventListener('dragover', (e) => { e.preventDefault(); cell.classList.add('is-dragover'); });
    cell.addEventListener('dragleave', () => cell.classList.remove('is-dragover'));
    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      cell.classList.remove('is-dragover');
      const apptId = e.dataTransfer.getData('text/plain');
      if (apptId) attemptMoveAppointment(apptId, cell.dataset.dropdate, cell.dataset.droptime);
    });
    cell.addEventListener('click', (e) => {
      if (ui.movingApptId && e.target === cell) {
        e.stopPropagation();
        attemptMoveAppointment(ui.movingApptId, cell.dataset.dropdate, cell.dataset.droptime);
        endMovingMode();
      }
    });
  });
}

let longPressTimer = null, longPressMoved = false, suppressNextTileClick = false;
function onTilePointerDown(e) {
  const tile = e.currentTarget;
  longPressMoved = false;
  longPressTimer = setTimeout(() => {
    if (!longPressMoved) { suppressNextTileClick = true; startMovingMode(tile.dataset.apptId); }
  }, 450);
  const onMove = () => { longPressMoved = true; };
  const onUp = () => { clearTimeout(longPressTimer); document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); };
  document.addEventListener('pointermove', onMove, { once: true });
  document.addEventListener('pointerup', onUp, { once: true });
}
function startMovingMode(apptId) {
  ui.movingApptId = apptId;
  const pet = getPet(getAppt(apptId).petId);
  const bar = document.createElement('div');
  bar.id = 'moving-bar';
  bar.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);background:var(--color-neutral-900);color:#fff;padding:10px 16px;border-radius:999px;box-shadow:var(--shadow-lg);z-index:90;display:flex;gap:10px;align-items:center;font-size:13px;';
  bar.innerHTML = `Moviendo cita de <strong>${escapeHtml(pet.name)}</strong> — tocá un día para soltar <button data-action="cancel-moving" style="background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:6px;padding:4px 10px;">Cancelar</button>`;
  document.body.appendChild(bar);
}
function endMovingMode() {
  ui.movingApptId = null;
  document.getElementById('moving-bar')?.remove();
}

/* ============================================================
   MODAL: APPOINTMENT DETAIL / FORM
   ============================================================ */
function openAppointmentDetail(apptId) {
  const appt = getAppt(apptId);
  if (!appt) { toast('Esta cita ya no existe.', 'error'); return; }
  const pet = getPet(appt.petId);
  const owner = getOwner(pet.ownerId);
  const loc = petLocation(pet);
  const modal = openModal(`
    <div class="modal-header"><h2 class="text-h2">Detalle de cita</h2><button class="modal-close" data-action="close-modal">×</button></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
      ${statusBadge(appt.status)} ${serviceBadge(appt.serviceType)} ${sizeBadge(pet.size)}
      ${pet.isAggressive ? aggressiveBadge() : ''} ${pet.needsPickup ? pickupBadge() : ''} ${appt.flaggedReason ? exceptionBadge() : ''}
    </div>
    <p><strong>${escapeHtml(pet.name)}</strong> · dueño/a <a href="#" data-action="open-owner-from-modal" data-id="${owner.id}">${escapeHtml(owner.name)}</a></p>
    <p class="text-small">${formatDateLong(appt.date)} · ${appt.startTime} (${appt.durationMinutes} min)</p>
    ${appt.flaggedReason ? `<p class="text-small">${escapeHtml(appt.flaggedReason)}</p>` : ''}
    ${pet.needsPickup ? `<p class="text-small">📍 ${escapeHtml(loc.address || 'Ubicación faltante')}</p>` : ''}
    <div class="modal-actions" style="justify-content:flex-start;">
      <button class="btn btn-secondary btn-sm" data-action="whatsapp-appt" data-id="${appt.id}">Enviar por WhatsApp</button>
    </div>
    <p class="text-small" style="margin-top:4px;">Se abrirá WhatsApp con el mensaje listo — vos lo enviás.</p>
    <div class="modal-actions">
      ${appt.status === 'scheduled' ? `<button class="btn btn-ghost" data-action="edit-appointment" data-id="${appt.id}">Editar / Reprogramar</button>` : ''}
      ${appt.status === 'scheduled' ? `<button class="btn btn-destructive" data-action="cancel-appointment" data-id="${appt.id}">Cancelar cita</button>` : ''}
      <button class="btn btn-ghost" data-action="close-modal">Cerrar</button>
    </div>
  `);
}

function openAppointmentForm(apptId, presetDate, presetTime) {
  const editing = apptId ? getAppt(apptId) : null;
  const petOptions = db.pets.map(p => `<option value="${p.id}" ${editing && editing.petId === p.id ? 'selected' : ''}>${escapeHtml(p.name)} (${escapeHtml(getOwner(p.ownerId).name)})</option>`).join('');
  const html = `
    <div class="modal-header"><h2 class="text-h2">${editing ? 'Editar cita' : 'Nueva cita'}</h2><button class="modal-close" data-action="close-modal">×</button></div>
    <form id="appointment-form">
      <div class="field"><label for="af-pet">Mascota</label>
        <select id="af-pet" required><option value="">Seleccioná una mascota…</option>${petOptions}</select>
        <span class="error-msg">Elegí una mascota.</span>
      </div>
      <div class="field-row">
        <div class="field"><label for="af-service">Tipo de servicio</label>
          <select id="af-service">
            <option value="full_groom" ${!editing || editing.serviceType === 'full_groom' ? 'selected' : ''}>Grooming completo</option>
            <option value="quick_service" ${editing && editing.serviceType === 'quick_service' ? 'selected' : ''}>Servicio rápido</option>
          </select>
        </div>
        <div class="field"><label for="af-duration">Duración (min)</label>
          <input type="number" id="af-duration" min="5" value="${editing ? editing.durationMinutes : ''}">
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label for="af-date">Fecha</label>
          <input type="date" id="af-date" value="${editing ? editing.date : (presetDate || TODAY_ISO)}" required>
          <span class="error-msg">Elegí una fecha válida.</span>
        </div>
        <div class="field"><label for="af-time">Hora</label>
          <input type="time" id="af-time" value="${editing ? editing.startTime : (presetTime || db.shopConfig.openTime)}" required>
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar</button>
      </div>
    </form>
  `;
  openModal(html);
  const petSel = document.getElementById('af-pet');
  const serviceSel = document.getElementById('af-service');
  const durationInput = document.getElementById('af-duration');

  function autofillDuration() {
    if (durationInput.value) return;
    const pet = getPet(petSel.value);
    if (!pet) return;
    durationInput.value = serviceSel.value === 'quick_service' ? (db.shopConfig.quickServiceDurationMinutes || '') : (pet.avgServiceDuration || '');
  }
  petSel.addEventListener('change', autofillDuration);
  serviceSel.addEventListener('change', () => {
    if (serviceSel.value === 'quick_service' && !db.shopConfig.quickServiceDurationMinutes) {
      toast('Configurá primero la duración del servicio rápido en Configuración de tienda.', 'error');
      serviceSel.value = 'full_groom';
      return;
    }
    durationInput.value = '';
    autofillDuration();
  });
  if (editing) autofillDuration();

  document.getElementById('appointment-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const petId = petSel.value, date = document.getElementById('af-date').value, time = document.getElementById('af-time').value;
    const duration = Number(durationInput.value);
    let ok = true;
    toggleFieldError('af-pet', !petId); if (!petId) ok = false;
    toggleFieldError('af-date', !date); if (!date) ok = false;
    if (!ok) return;
    const result = validateAppointmentSlot({ petId, date, time, duration: duration || 30, excludeApptId: editing ? editing.id : null });
    if (!result.ok) { toast(result.message, 'error'); return; }
    if (editing) {
      const origDate = editing.date, origTime = editing.startTime;
      const pet = getPet(editing.petId);
      Object.assign(editing, { petId, date, time: undefined, startTime: time, durationMinutes: duration || 30, serviceType: serviceSel.value });
      toast('Cita actualizada.', 'success');
      if (origDate !== date || origTime !== time) evaluateVacatedSlot(origDate, origTime, pet.size, editing.durationMinutes);
    } else {
      db.appointments.push({ id: uid('a'), petId, date, startTime: time, durationMinutes: duration || 30, serviceType: serviceSel.value, status: 'scheduled', source: 'manual', flaggedReason: null });
      toast('Cita creada.', 'success');
    }
    closeModal();
    renderCurrentScreen();
  });
}

function toggleFieldError(inputId, hasError) {
  document.getElementById(inputId).closest('.field').classList.toggle('has-error', !!hasError);
}

/* ============================================================
   SCREEN: OWNERS LIST
   ============================================================ */
function renderOwnersList(filterText) {
  const root = document.getElementById('owners-table');
  const q = (filterText || document.getElementById('owners-search')?.value || '').trim().toLowerCase();
  const owners = db.owners.filter(o => !q || o.name.toLowerCase().includes(q) || o.phone.includes(q));
  if (!owners.length) {
    root.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🔍</span>No se encontraron dueños.</div>`;
    return;
  }
  root.innerHTML = owners.map(o => {
    const petCount = petsOfOwner(o.id).length;
    return `<div class="data-row" data-action="open-owner" data-id="${o.id}">
      <div class="data-row-main"><strong>${escapeHtml(o.name)}</strong><span class="text-small">${escapeHtml(o.phone)}</span></div>
      <div class="data-row-meta">
        ${o.fixedVisitDay ? `<span class="badge badge-size">Día fijo: ${DAY_LABEL[o.fixedVisitDay]}</span>` : ''}
        <span class="text-small">${petCount} mascota${petCount === 1 ? '' : 's'}</span>
      </div>
    </div>`;
  }).join('');
}

function openOwnerForm(ownerId) {
  const editing = ownerId ? getOwner(ownerId) : null;
  const dayOptions = `<option value="">Sin preferencia</option>` + DAY_OPTIONS.map(d => `<option value="${d}" ${editing && editing.fixedVisitDay === d ? 'selected' : ''}>${DAY_LABEL[d]}</option>`).join('');
  openModal(`
    <div class="modal-header"><h2 class="text-h2">${editing ? 'Editar dueño' : 'Nuevo dueño'}</h2><button class="modal-close" data-action="close-modal">×</button></div>
    <form id="owner-form">
      <div class="field"><label for="of-name">Nombre</label><input id="of-name" value="${editing ? escapeHtml(editing.name) : ''}" required><span class="error-msg">El nombre es obligatorio.</span></div>
      <div class="field"><label for="of-phone">Teléfono</label><input id="of-phone" value="${editing ? escapeHtml(editing.phone) : '+54 9 11 '}" required><span class="error-msg">Ingresá un teléfono válido (7 a 15 dígitos).</span></div>
      <div class="field"><label for="of-address">Dirección</label><input id="of-address" value="${editing ? escapeHtml(editing.address || '') : ''}"><span class="hint">Se usa como ubicación por defecto de sus mascotas.</span></div>
      <div class="field"><label for="of-day">Día fijo de visita</label><select id="of-day">${dayOptions}</select></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar</button>
      </div>
    </form>
  `);
  document.getElementById('owner-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('of-name').value.trim();
    const phone = document.getElementById('of-phone').value.trim();
    const address = document.getElementById('of-address').value.trim();
    const fixedVisitDay = document.getElementById('of-day').value || null;
    let ok = true;
    toggleFieldError('of-name', !name); if (!name) ok = false;
    const phoneDigits = digitsOnly(phone);
    const phoneInvalid = phoneDigits.length < 7 || phoneDigits.length > 15;
    toggleFieldError('of-phone', phoneInvalid); if (phoneInvalid) ok = false;
    if (!ok) return;

    if (!editing) {
      const dup = db.owners.find(o => o.name.trim().toLowerCase() === name.toLowerCase() && digitsOnly(o.phone) === phoneDigits);
      if (dup) { showDuplicateOwnerModal(dup, { name, phone, address, fixedVisitDay }); return; }
      const samePhone = db.owners.find(o => digitsOnly(o.phone) === phoneDigits);
      if (samePhone) { showSharedPhoneModal(samePhone, { name, phone, address, fixedVisitDay }); return; }
      createOwner({ name, phone, address, fixedVisitDay });
    } else {
      Object.assign(editing, { name, phone, address, fixedVisitDay });
      toast('Dueño actualizado.', 'success');
      closeModal();
      renderCurrentScreen();
    }
  });
}

function createOwner(data) {
  const owner = { id: uid('o'), lat: -34.60 + (Math.random() - 0.5) * 0.08, lng: -58.42 + (Math.random() - 0.5) * 0.08, ...data };
  db.owners.push(owner);
  toast('Dueño creado.', 'success');
  closeModal();
  navigateTo('owner-detail', { ownerId: owner.id });
  return owner;
}

function showDuplicateOwnerModal(existing, data) {
  openModal(`
    <div class="modal-header"><h2 class="text-h2">Posible dueño duplicado</h2><button class="modal-close" data-action="close-modal">×</button></div>
    <p class="modal-body-text">Ya existe un dueño con el mismo nombre y teléfono: <strong>${escapeHtml(existing.name)}</strong> (${escapeHtml(existing.phone)}).</p>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-action="open-owner" data-id="${existing.id}">Abrir existente</button>
      <button class="btn btn-destructive" id="dup-cancel">Cancelar</button>
      <button class="btn btn-primary" id="dup-save-anyway">Guardar de todos modos</button>
    </div>
  `);
  document.getElementById('dup-cancel').addEventListener('click', closeModal);
  document.getElementById('dup-save-anyway').addEventListener('click', () => createOwner(data));
}
function showSharedPhoneModal(existing, data) {
  openModal(`
    <div class="modal-header"><h2 class="text-h2">Teléfono ya registrado</h2><button class="modal-close" data-action="close-modal">×</button></div>
    <p class="modal-body-text">El teléfono ${escapeHtml(data.phone)} ya está asociado a <strong>${escapeHtml(existing.name)}</strong>. ¿Es un teléfono compartido del hogar o un error?</p>
    <div class="modal-actions">
      <button class="btn btn-ghost" id="shared-cancel">Cancelar</button>
      <button class="btn btn-primary" id="shared-confirm">Es un teléfono compartido — guardar</button>
    </div>
  `);
  document.getElementById('shared-cancel').addEventListener('click', closeModal);
  document.getElementById('shared-confirm').addEventListener('click', () => createOwner(data));
}

/* ============================================================
   SCREEN: OWNER DETAIL
   ============================================================ */
function renderOwnerDetail(ownerId) {
  const owner = getOwner(ownerId);
  const root = document.getElementById('owner-detail-root');
  if (!owner) { root.innerHTML = `<div class="empty-state">Dueño no encontrado.</div>`; return; }
  const pets = petsOfOwner(owner.id);
  const upcoming = db.appointments.filter(a => pets.some(p => p.id === a.petId) && a.status === 'scheduled' && a.date >= TODAY_ISO)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  root.innerHTML = `
    <div class="owner-detail-grid">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h2 class="text-h2">${escapeHtml(owner.name)}</h2>
          <button class="btn btn-text btn-sm" data-action="edit-owner" data-id="${owner.id}">Editar</button>
        </div>
        <p class="text-small">${escapeHtml(owner.phone)}</p>
        <p class="text-small">${escapeHtml(owner.address || 'Sin dirección registrada')}</p>
        <p class="text-small">Día fijo de visita: ${owner.fixedVisitDay ? DAY_LABEL[owner.fixedVisitDay] : 'Sin preferencia'}</p>
        <button class="btn btn-secondary btn-sm" style="margin-top:8px;" data-action="whatsapp-owner-all" data-id="${owner.id}" ${!upcoming.length ? 'disabled' : ''}>Enviar por WhatsApp (todas las próximas)</button>
        <p class="text-small" style="margin-top:4px;">Se abrirá WhatsApp con el mensaje listo — vos lo enviás.</p>
        ${upcoming.length ? `<h3 class="text-h3" style="margin-top:16px;">Próximas citas</h3>` + upcoming.map(a => {
          const pet = getPet(a.petId);
          return `<div class="data-row" style="padding:8px 10px;" data-action="open-appointment" data-id="${a.id}"><span class="text-small">${escapeHtml(pet.name)} · ${formatDateShort(a.date)} ${a.startTime}</span></div>`;
        }).join('') : `<p class="text-small" style="margin-top:16px;">Sin próximas citas.</p>`}
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2 class="text-h2">Mascotas</h2>
          <button class="btn btn-primary btn-sm" data-action="new-pet" data-owner-id="${owner.id}">+ Agregar mascota</button>
        </div>
        <div class="data-table">
          ${pets.length ? pets.map(p => `
            <div class="card pet-card">
              <div class="pet-card-main">
                <strong>${escapeHtml(p.name)}</strong>
                <span class="text-small">${escapeHtml(p.breed)}</span>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
                  ${sizeBadge(p.size)}
                  ${p.isAggressive ? aggressiveBadge() : ''}
                  ${p.needsPickup ? pickupBadge() : ''}
                  ${isIncomplete(p) ? incompleteBadge() : ''}
                  ${p.groomingFrequency ? `<span class="badge badge-size">${FREQ_LABEL[p.groomingFrequency]}</span>` : ''}
                </div>
              </div>
              <button class="btn btn-ghost btn-sm" data-action="edit-pet" data-id="${p.id}">Editar</button>
            </div>`).join('') : `<div class="empty-state">Sin mascotas todavía.</div>`}
        </div>
      </div>
    </div>
  `;
}

function openPetForm(petId, ownerId) {
  const editing = petId ? getPet(petId) : null;
  const owner = getOwner(editing ? editing.ownerId : ownerId);
  const freqOptions = `<option value="">Sin definir</option>` + Object.entries(FREQ_LABEL).map(([k, v]) => `<option value="${k}" ${editing && editing.groomingFrequency === k ? 'selected' : ''}>${v}</option>`).join('');
  openModal(`
    <div class="modal-header"><h2 class="text-h2">${editing ? 'Editar mascota' : 'Agregar mascota'} — ${escapeHtml(owner.name)}</h2><button class="modal-close" data-action="close-modal">×</button></div>
    <form id="pet-form">
      <div class="field-row">
        <div class="field"><label for="pf-name">Nombre</label><input id="pf-name" value="${editing ? escapeHtml(editing.name) : ''}" required><span class="error-msg">El nombre es obligatorio.</span></div>
        <div class="field"><label for="pf-breed">Raza</label><input id="pf-breed" value="${editing ? escapeHtml(editing.breed || '') : ''}" required><span class="error-msg">La raza es obligatoria.</span></div>
      </div>
      <div class="field"><label for="pf-size">Tamaño</label>
        <select id="pf-size" required>
          <option value="">Seleccioná un tamaño…</option>
          <option value="small" ${editing && editing.size === 'small' ? 'selected' : ''}>Pequeño</option>
          <option value="medium" ${editing && editing.size === 'medium' ? 'selected' : ''}>Mediano</option>
          <option value="extra_large" ${editing && editing.size === 'extra_large' ? 'selected' : ''}>Extra grande</option>
        </select>
        <span class="error-msg">Elegí un tamaño.</span>
      </div>
      <div class="checkbox-field"><input type="checkbox" id="pf-aggressive" ${editing && editing.isAggressive ? 'checked' : ''}><label for="pf-aggressive">Es agresivo</label></div>
      <div class="checkbox-field"><input type="checkbox" id="pf-pickup" ${editing && editing.needsPickup ? 'checked' : ''}><label for="pf-pickup">Necesita pickup</label></div>
      <div class="field"><label for="pf-location">Ubicación</label><input id="pf-location" value="${editing ? escapeHtml(editing.locationAddress || '') : ''}" placeholder="Dejar vacío para usar la del dueño"><span class="hint">Dueño: ${escapeHtml(owner.address || 'sin dirección')}</span></div>
      <div class="field-row">
        <div class="field"><label for="pf-freq">Frecuencia de grooming</label><select id="pf-freq">${freqOptions}</select></div>
        <div class="field"><label for="pf-duration">Duración promedio (min)</label><input type="number" id="pf-duration" min="5" value="${editing && editing.avgServiceDuration ? editing.avgServiceDuration : ''}"></div>
      </div>
      ${editing && isIncomplete(editing) ? `<p>${incompleteBadge()}</p>` : ''}
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar</button>
      </div>
    </form>
  `);

  document.getElementById('pf-aggressive').addEventListener('change', (e) => {
    if (e.target.checked) {
      e.target.checked = false;
      openModal(`
        <div class="modal-header"><h2 class="text-h2">Confirmar mascota agresiva</h2></div>
        <p class="modal-body-text">Vas a marcar esta mascota como agresiva. Esto agregará una nota visible de manejo especial en su ficha y en cada cita. ¿Confirmás?</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" id="agg-cancel">Cancelar</button>
          <button class="btn btn-destructive" id="agg-confirm">Entendido, marcar como agresivo</button>
        </div>
      `, { blocking: true });
      document.getElementById('agg-cancel').addEventListener('click', () => { openPetForm(petId, ownerId); });
      document.getElementById('agg-confirm').addEventListener('click', () => { openPetForm(petId, ownerId); setTimeout(() => { document.getElementById('pf-aggressive').checked = true; }, 0); });
    }
  });

  document.getElementById('pet-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('pf-name').value.trim();
    const breed = document.getElementById('pf-breed').value.trim();
    const size = document.getElementById('pf-size').value;
    let ok = true;
    toggleFieldError('pf-name', !name); if (!name) ok = false;
    toggleFieldError('pf-breed', !breed); if (!breed) ok = false;
    toggleFieldError('pf-size', !size); if (!size) ok = false;
    if (!ok) return;

    const newFreq = document.getElementById('pf-freq').value || null;
    const data = {
      name, breed, size,
      isAggressive: document.getElementById('pf-aggressive').checked,
      needsPickup: document.getElementById('pf-pickup').checked,
      locationAddress: document.getElementById('pf-location').value.trim() || null,
      groomingFrequency: newFreq,
      avgServiceDuration: Number(document.getElementById('pf-duration').value) || null,
    };

    if (editing) {
      const freqChanged = editing.groomingFrequency !== newFreq;
      const futureAppts = db.appointments.filter(a => a.petId === editing.id && a.status === 'scheduled' && a.date >= TODAY_ISO);
      if (freqChanged && futureAppts.length) {
        openModal(`
          <div class="modal-header"><h2 class="text-h2">¿Mantener o regenerar citas futuras?</h2></div>
          <p class="modal-body-text">${escapeHtml(editing.name)} tiene ${futureAppts.length} cita(s) futura(s) generada(s) con la frecuencia anterior. ¿Qué querés hacer?</p>
          <div class="modal-actions">
            <button class="btn btn-ghost" id="freq-keep">Mantener citas existentes</button>
            <button class="btn btn-primary" id="freq-regen">Regenerar citas futuras</button>
          </div>
        `, { blocking: true });
        document.getElementById('freq-keep').addEventListener('click', () => { Object.assign(editing, data); toast('Mascota actualizada. Se mantuvieron las citas futuras.', 'success'); closeModal(); renderCurrentScreen(); });
        document.getElementById('freq-regen').addEventListener('click', () => {
          futureAppts.forEach(a => { a.status = 'cancelled'; });
          Object.assign(editing, data);
          toast('Mascota actualizada. Las citas futuras se regenerarán en el próximo agendado automático.', 'success');
          closeModal(); renderCurrentScreen();
        });
        return;
      }
      Object.assign(editing, data);
      toast('Mascota actualizada.', 'success');
    } else {
      db.pets.push({ id: uid('p'), ownerId: owner.id, lat: null, lng: null, ...data });
      toast('Mascota agregada.', 'success');
    }
    closeModal();
    renderCurrentScreen();
  });
}

/* ============================================================
   SCREEN: WAITING LIST
   ============================================================ */
function renderWaitingList() {
  renderRecommendation();
  const root = document.getElementById('waiting-list-root');
  const active = db.waitingList.filter(w => w.status === 'active').sort((a, b) => a.createdAt < b.createdAt ? -1 : 1);
  if (!active.length) {
    root.innerHTML = `<div class="empty-state"><span class="empty-state-icon">⏳</span>No hay mascotas en la lista de espera.</div>`;
    return;
  }
  root.innerHTML = `<h2 class="text-h2" style="margin-bottom:8px;">Todas las entradas</h2>` + active.map(w => {
    const pet = getPet(w.petId);
    const owner = getOwner(pet.ownerId);
    const days = Math.round((fromISODate(TODAY_ISO) - fromISODate(w.createdAt)) / 86400000);
    return `<div class="data-row">
      <div class="data-row-main"><strong>${escapeHtml(pet.name)}</strong><span class="text-small">${escapeHtml(owner.name)}</span></div>
      <div class="data-row-meta">
        ${sizeBadge(pet.size)}
        <span class="text-small">${w.preferredStartDate ? formatDateShort(w.preferredStartDate) + ' – ' + formatDateShort(w.preferredEndDate) : 'Sin rango preferido'}</span>
        <span class="text-small">Esperando hace ${days} día${days === 1 ? '' : 's'}</span>
      </div>
    </div>`;
  }).join('');
}

function renderRecommendation() {
  const root = document.getElementById('recommendation-root');
  const rec = ui.pendingRecommendation;
  if (!rec) { root.innerHTML = ''; return; }
  const entries = rec.candidateEntryIds.map(id => db.waitingList.find(w => w.id === id)).filter(Boolean);
  if (!entries.length) { ui.pendingRecommendation = null; root.innerHTML = ''; return; }
  const top = entries[0];
  const topPet = getPet(top.petId);
  const alternates = entries.slice(1);
  root.innerHTML = `
    <div class="recommendation-card">
      <div class="recommendation-header">
        <div><strong>Turno liberado</strong><br><span class="text-small">${formatDateLong(rec.slotDate)} · ${rec.slotTime} · ${SIZE_LABEL[rec.size]}</span></div>
        ${suggestedBadge()}
      </div>
      <div class="recommendation-candidate">
        <div><strong>${escapeHtml(topPet.name)}</strong> <span class="text-small">(${escapeHtml(getOwner(topPet.ownerId).name)})</span></div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary btn-sm" data-action="approve-recommendation" data-entry-id="${top.id}">Aprobar</button>
        </div>
      </div>
      <div class="modal-actions" style="justify-content:flex-start;margin-top:8px;">
        <button class="btn btn-ghost btn-sm" data-action="reject-manual-book">Rechazar y reservar manual</button>
        <button class="btn btn-text btn-sm" data-action="reject-leave-open">Rechazar y dejar libre</button>
      </div>
      ${alternates.length ? `<div class="recommendation-alternates"><strong>Alternativos</strong>` + alternates.map(a => {
        const p = getPet(a.petId);
        return `<div class="recommendation-alt-row"><span>${escapeHtml(p.name)} (${escapeHtml(getOwner(p.ownerId).name)})</span><button class="btn btn-text btn-sm" data-action="approve-recommendation" data-entry-id="${a.id}">Aprobar este</button></div>`;
      }).join('') + `</div>` : ''}
    </div>
  `;
}

function approveRecommendation(entryId) {
  const rec = ui.pendingRecommendation;
  const entry = db.waitingList.find(w => w.id === entryId);
  if (!rec || !entry) return;
  const pet = getPet(entry.petId);
  const appt = { id: uid('a'), petId: pet.id, date: rec.slotDate, startTime: rec.slotTime, durationMinutes: pet.avgServiceDuration || rec.durationMinutes, serviceType: 'full_groom', status: 'scheduled', source: 'waiting_list_approval', flaggedReason: null };
  db.appointments.push(appt);
  entry.status = 'fulfilled';
  entry.fulfilledAppointmentId = appt.id;
  ui.pendingRecommendation = null;
  toast(`${pet.name} fue agendado para el turno liberado.`, 'success');
  renderCurrentScreen();
}
function rejectLeaveOpen() {
  ui.pendingRecommendation = null;
  toast('El turno queda libre.', 'info');
  renderCurrentScreen();
}
function rejectManualBook() {
  const rec = ui.pendingRecommendation;
  if (!rec) return;
  const petOptions = db.pets.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(getOwner(p.ownerId).name)}) — ${SIZE_LABEL[p.size]}</option>`).join('');
  openModal(`
    <div class="modal-header"><h2 class="text-h2">Reservar manualmente</h2><button class="modal-close" data-action="close-modal">×</button></div>
    <p class="modal-body-text">Turno del ${formatDateLong(rec.slotDate)} a las ${rec.slotTime} (originalmente ${SIZE_LABEL[rec.size]}).</p>
    <div class="field"><label for="mb-pet">Mascota</label><select id="mb-pet">${petOptions}</select></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-action="close-modal">Cancelar</button>
      <button class="btn btn-primary" id="mb-confirm">Reservar</button>
    </div>
  `);
  document.getElementById('mb-confirm').addEventListener('click', () => {
    const petId = document.getElementById('mb-pet').value;
    const pet = getPet(petId);
    const proceed = () => {
      const appt = { id: uid('a'), petId: pet.id, date: rec.slotDate, startTime: rec.slotTime, durationMinutes: pet.avgServiceDuration || rec.durationMinutes, serviceType: 'full_groom', status: 'scheduled', source: 'manual', flaggedReason: pet.size !== rec.size ? 'Excepción: reservado manualmente pese a diferencia de tamaño' : null };
      db.appointments.push(appt);
      const entry = db.waitingList.find(w => w.petId === pet.id && w.status === 'active');
      if (entry) { entry.status = 'fulfilled'; entry.fulfilledAppointmentId = appt.id; }
      ui.pendingRecommendation = null;
      toast(`${pet.name} fue reservado en el turno.`, 'success');
      closeModal();
      renderCurrentScreen();
    };
    if (pet.size !== rec.size) {
      openModal(`
        <div class="modal-header"><h2 class="text-h2">El tamaño no coincide</h2></div>
        <p class="modal-body-text">El turno era para tamaño ${SIZE_LABEL[rec.size]} y elegiste una mascota ${SIZE_LABEL[pet.size]}. ¿Reservar de todos modos?</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" id="mm-cancel">Cancelar</button>
          <button class="btn btn-primary" id="mm-confirm">Reservar de todos modos</button>
        </div>
      `, { blocking: true });
      document.getElementById('mm-cancel').addEventListener('click', closeModal);
      document.getElementById('mm-confirm').addEventListener('click', proceed);
    } else {
      proceed();
    }
  });
}

function openAddToWaitingList() {
  const eligible = db.pets.filter(p => !hasActiveAppointment(p.id));
  if (!eligible.length) {
    openModal(`<div class="modal-header"><h2 class="text-h2">Agregar a lista de espera</h2><button class="modal-close" data-action="close-modal">×</button></div><p class="modal-body-text">No hay mascotas elegibles: todas tienen una cita activa este año.</p>`);
    return;
  }
  const petOptions = eligible.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(getOwner(p.ownerId).name)}) — ${SIZE_LABEL[p.size]}</option>`).join('');
  openModal(`
    <div class="modal-header"><h2 class="text-h2">Agregar a lista de espera</h2><button class="modal-close" data-action="close-modal">×</button></div>
    <form id="wl-form">
      <div class="field"><label for="wl-pet">Mascota</label><select id="wl-pet">${petOptions}</select><span class="hint">Solo se muestran mascotas sin cita activa este año.</span></div>
      <div class="field-row">
        <div class="field"><label for="wl-start">Rango preferido — desde</label><input type="date" id="wl-start"></div>
        <div class="field"><label for="wl-end">hasta</label><input type="date" id="wl-end"><span class="error-msg">La fecha final debe ser posterior o igual a la inicial.</span></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button>
        <button type="submit" class="btn btn-primary">Agregar</button>
      </div>
    </form>
  `);
  document.getElementById('wl-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const petId = document.getElementById('wl-pet').value;
    const start = document.getElementById('wl-start').value || null;
    const end = document.getElementById('wl-end').value || null;
    if (start && end && end < start) { toggleFieldError('wl-end', true); return; }
    toggleFieldError('wl-end', false);
    db.waitingList.push({ id: uid('w'), petId, preferredStartDate: start, preferredEndDate: end, status: 'active', fulfilledAppointmentId: null, createdAt: TODAY_ISO });
    toast('Mascota agregada a la lista de espera.', 'success');
    closeModal();
    renderCurrentScreen();
  });
}

/* ============================================================
   SCREEN: PICKUPS
   ============================================================ */
function renderPickups() {
  document.getElementById('pickup-date').value = ui.pickupDate;
  const root = document.getElementById('pickups-root');
  const dayAppts = db.appointments.filter(a => a.date === ui.pickupDate && a.status === 'scheduled');
  const pickupAppts = dayAppts.filter(a => getPet(a.petId).needsPickup);

  if (!pickupAppts.length) {
    ui.pickupRoute = null;
    root.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🚗</span>No hay pickups programados para este día.</div>`;
    return;
  }

  const currentSignature = pickupAppts.map(a => a.id).sort().join(',');
  const stale = ui.pickupRoute && ui.pickupRoute.date === ui.pickupDate && ui.pickupRoute.signature !== currentSignature;

  let html = '';
  if (ui.pickupRoute && ui.pickupRoute.date === ui.pickupDate && !stale) {
    html += renderRouteResult(ui.pickupRoute);
  } else {
    if (stale) html += `<div class="route-banner"><span>La lista de pickups cambió desde que generaste la ruta.</span><button class="btn btn-primary btn-sm" data-action="generate-route">Regenerar ruta</button></div>`;
    html += `<div class="data-table">` + pickupAppts.map(a => pickupRowHTML(a)).join('') + `</div>`;
    html += `<div class="map-buttons"><button class="btn btn-primary" data-action="generate-route">Generar ruta</button></div>`;
  }
  root.innerHTML = html;
}

function pickupRowHTML(appt) {
  const pet = getPet(appt.petId);
  const owner = getOwner(pet.ownerId);
  const loc = petLocation(pet);
  return `<div class="data-row" data-action="open-appointment" data-id="${appt.id}">
    <div class="data-row-main"><strong>${escapeHtml(pet.name)}</strong><span class="text-small">${escapeHtml(owner.name)} · ${appt.startTime}</span></div>
    <div class="data-row-meta">${loc.has ? `<span class="pickup-row-status">${escapeHtml(loc.address)}</span>` : `<span class="badge badge-incomplete">Ubicación faltante</span>`}</div>
  </div>`;
}

function renderRouteResult(route) {
  const stopsHtml = route.stops.map((s, i) => {
    const pet = getPet(s.petId);
    const owner = getOwner(pet.ownerId);
    return `<div class="data-row"><div class="route-stop"><span class="route-stop-num">${i + 1}</span><div class="data-row-main"><strong>${escapeHtml(pet.name)}</strong><span class="text-small">${escapeHtml(owner.name)} · ${escapeHtml(s.address)}</span></div></div></div>`;
  }).join('');
  const excludedHtml = route.excluded.map(a => {
    const pet = getPet(a.petId);
    return `<div class="data-row"><div class="data-row-main"><strong>${escapeHtml(pet.name)}</strong><span class="text-small">Excluido — ubicación faltante</span></div><button class="btn btn-text btn-sm" data-action="edit-pet" data-id="${pet.id}">Corregir dirección</button></div>`;
  }).join('');
  const hasStops = route.stops.length > 0;
  return `
    <h2 class="text-h2" style="margin-bottom:8px;">Ruta generada</h2>
    <div class="data-table">${stopsHtml}${excludedHtml}</div>
    <div class="map-buttons">
      <button class="btn btn-primary" data-action="open-waze" ${hasStops ? '' : 'disabled'}>Abrir en Waze</button>
      <button class="btn btn-primary" data-action="open-google-maps" ${hasStops ? '' : 'disabled'}>Abrir en Google Maps</button>
      <button class="btn btn-ghost btn-sm" data-action="generate-route">Regenerar</button>
      ${!hasStops ? `<span class="text-small">Sin paradas válidas — corregí las direcciones faltantes.</span>` : `<span class="text-small">Waze solo admite una parada a la vez: se abre la primera.</span>`}
    </div>
  `;
}

function generateRoute() {
  const dayAppts = db.appointments.filter(a => a.date === ui.pickupDate && a.status === 'scheduled');
  const pickupAppts = dayAppts.filter(a => getPet(a.petId).needsPickup);
  const withLoc = [], excluded = [];
  pickupAppts.forEach(a => {
    const loc = petLocation(getPet(a.petId));
    if (loc.has) withLoc.push({ petId: a.petId, lat: loc.lat, lng: loc.lng, address: loc.address });
    else excluded.push(a);
  });

  const ordered = [];
  const pool = withLoc.slice();
  if (pool.length) {
    let current = pool.shift();
    ordered.push(current);
    while (pool.length) {
      let nearestIdx = 0, nearestDist = Infinity;
      pool.forEach((s, i) => {
        const d = haversineKm(current.lat, current.lng, s.lat, s.lng);
        if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
      });
      current = pool.splice(nearestIdx, 1)[0];
      ordered.push(current);
    }
  }
  const signature = pickupAppts.map(a => a.id).sort().join(',');
  ui.pickupRoute = { date: ui.pickupDate, stops: ordered, excluded, signature };
  renderPickups();
}

function openWaze() {
  const route = ui.pickupRoute;
  if (!route || !route.stops.length) return;
  const first = route.stops[0];
  window.open(`https://waze.com/ul?ll=${first.lat},${first.lng}&navigate=yes`, '_blank');
}
function openGoogleMaps() {
  const route = ui.pickupRoute;
  if (!route || !route.stops.length) return;
  const last = route.stops[route.stops.length - 1];
  const waypoints = route.stops.slice(0, -1).map(s => `${s.lat},${s.lng}`).join('|');
  let url = `https://www.google.com/maps/dir/?api=1&destination=${last.lat},${last.lng}&travelmode=driving`;
  if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;
  window.open(url, '_blank');
}

/* ============================================================
   WHATSAPP
   ============================================================ */
function sendWhatsAppForAppointment(apptId) {
  const appt = getAppt(apptId);
  const pet = getPet(appt.petId);
  const owner = getOwner(pet.ownerId);
  const phoneDigits = digitsOnly(owner.phone);
  if (phoneDigits.length < 7) { toast('Este dueño no tiene un teléfono válido registrado.', 'error'); return; }
  const kind = appt.serviceType === 'quick_service' ? 'un servicio rápido' : 'un turno de grooming';
  const message = `Hola ${owner.name}! Te recordamos ${kind} para ${pet.name} el ${formatDateLong(appt.date)} a las ${appt.startTime}. ¡Te esperamos en la peluquería! 🐾`;
  window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`, '_blank');
}
function sendWhatsAppForAllUpcoming(ownerId) {
  const owner = getOwner(ownerId);
  const phoneDigits = digitsOnly(owner.phone);
  if (phoneDigits.length < 7) { toast('Este dueño no tiene un teléfono válido registrado.', 'error'); return; }
  const pets = petsOfOwner(ownerId);
  const upcoming = db.appointments.filter(a => pets.some(p => p.id === a.petId) && a.status === 'scheduled' && a.date >= TODAY_ISO)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  if (!upcoming.length) { toast('Este dueño no tiene próximas citas.', 'error'); return; }
  const lines = upcoming.map(a => `• ${getPet(a.petId).name}: ${formatDateLong(a.date)} a las ${a.startTime}`).join('\n');
  const message = `Hola ${owner.name}! Te recordamos las próximas citas:\n${lines}\n¡Te esperamos! 🐾`;
  window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`, '_blank');
}

/* ============================================================
   SCREEN: CONFIG
   ============================================================ */
function renderConfig() {
  const c = db.shopConfig;
  const root = document.getElementById('config-root');
  root.innerHTML = `
    <div class="config-section card">
      <h2 class="text-h2">Capacidad y servicio rápido</h2>
      <span class="text-small">Máximo de mascotas por día y duración del servicio rápido.</span>
      <form id="capacity-form" class="field-row">
        <div class="field"><label for="cf-max">Máximo de mascotas por día</label><input type="number" id="cf-max" min="1" value="${c.maxPetsPerDay}"><span class="error-msg">Ingresá un número entero positivo.</span></div>
        <div class="field"><label for="cf-quick">Duración de servicio rápido (min)</label><input type="number" id="cf-quick" min="1" value="${c.quickServiceDurationMinutes || ''}"></div>
        <div class="field" style="justify-content:flex-end;"><button type="submit" class="btn btn-primary">Guardar</button></div>
      </form>
    </div>

    <div class="config-section card">
      <h2 class="text-h2">Horario de atención</h2>
      <span class="text-small">Las citas solo pueden agendarse dentro de este horario.</span>
      <form id="hours-form" class="field-row">
        <div class="field"><label for="cf-open">Apertura</label><input type="time" id="cf-open" value="${c.openTime}"></div>
        <div class="field"><label for="cf-close">Cierre</label><input type="time" id="cf-close" value="${c.closeTime}"><span class="error-msg">El cierre debe ser posterior a la apertura.</span></div>
        <div class="field" style="justify-content:flex-end;"><button type="submit" class="btn btn-primary">Guardar</button></div>
      </form>
    </div>

    <div class="config-section card">
      <h2 class="text-h2">Períodos de bloqueo (vacaciones)</h2>
      <span class="text-small">Ningún turno se agenda dentro de estas fechas.</span>
      <div class="blackout-list">
        ${db.blackoutPeriods.length ? db.blackoutPeriods.map(b => `
          <div class="blackout-item">
            <span>${escapeHtml(b.label || 'Sin nombre')} — ${formatDateShort(b.startDate)} a ${formatDateShort(b.endDate)}</span>
            <button class="btn btn-text btn-sm" data-action="remove-blackout" data-id="${b.id}">Eliminar</button>
          </div>`).join('') : `<span class="text-small">Sin períodos configurados.</span>`}
      </div>
      <form id="blackout-form" class="field-row">
        <div class="field"><label for="bf-start">Desde</label><input type="date" id="bf-start"><span class="error-msg">Elegí una fecha de inicio.</span></div>
        <div class="field"><label for="bf-end">Hasta</label><input type="date" id="bf-end"><span class="error-msg">La fecha final debe ser igual o posterior al inicio.</span></div>
        <div class="field"><label for="bf-label">Etiqueta</label><input id="bf-label" placeholder="Ej: Vacaciones de verano"></div>
        <div class="field" style="justify-content:flex-end;"><button type="submit" class="btn btn-primary">Agregar</button></div>
      </form>
    </div>
  `;

  document.getElementById('capacity-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const max = Number(document.getElementById('cf-max').value);
    const invalid = !Number.isInteger(max) || max <= 0;
    toggleFieldError('cf-max', invalid);
    if (invalid) return;
    c.maxPetsPerDay = max;
    c.quickServiceDurationMinutes = Number(document.getElementById('cf-quick').value) || null;
    toast('Configuración guardada.', 'success');
    renderConfig();
  });

  document.getElementById('hours-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const open = document.getElementById('cf-open').value, close = document.getElementById('cf-close').value;
    const invalid = !open || !close || close <= open;
    toggleFieldError('cf-close', invalid);
    if (invalid) return;
    c.openTime = open; c.closeTime = close;
    toast('Horario de atención actualizado.', 'success');
    renderConfig();
  });

  document.getElementById('blackout-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const start = document.getElementById('bf-start').value, end = document.getElementById('bf-end').value;
    const label = document.getElementById('bf-label').value.trim();
    let ok = true;
    toggleFieldError('bf-start', !start); if (!start) ok = false;
    toggleFieldError('bf-end', !end || (start && end < start)); if (!end || (start && end < start)) ok = false;
    if (!ok) return;
    const conflicts = db.appointments.filter(a => a.status === 'scheduled' && a.date >= start && a.date <= end);
    if (conflicts.length) {
      showBlackoutConflictModal({ start, end, label }, conflicts);
    } else {
      addBlackoutPeriod({ start, end, label });
    }
  });
}

function addBlackoutPeriod({ start, end, label }) {
  db.blackoutPeriods.push({ id: uid('b'), startDate: start, endDate: end, label: label || null });
  toast('Período de bloqueo agregado.', 'success');
  closeModal();
  renderConfig();
}

function showBlackoutConflictModal(data, conflicts) {
  openModal(`
    <div class="modal-header"><h2 class="text-h2">Conflicto con citas existentes</h2></div>
    <p class="modal-body-text">${conflicts.length} cita(s) caen dentro de ese rango. ¿Qué querés hacer con ellas?</p>
    <div class="modal-actions" style="justify-content:flex-start;flex-direction:column;align-items:stretch;">
      <button class="btn btn-ghost btn-block" id="bc-reschedule">Reprogramar automáticamente al día siguiente disponible</button>
      <button class="btn btn-destructive btn-block" id="bc-cancel-appts">Cancelar esas citas</button>
      <button class="btn btn-secondary btn-block" id="bc-exception">Dejarlas como excepción</button>
    </div>
  `, { blocking: true });

  document.getElementById('bc-reschedule').addEventListener('click', () => {
    conflicts.forEach(a => {
      let candidate = addDays(data.end, 1);
      while (isBlackoutDate(candidate) || scheduledCountOnDate(candidate, a.id) >= db.shopConfig.maxPetsPerDay) candidate = addDays(candidate, 1);
      a.date = candidate;
    });
    addBlackoutPeriod(data);
  });
  document.getElementById('bc-cancel-appts').addEventListener('click', () => {
    conflicts.forEach(a => { a.status = 'cancelled'; });
    addBlackoutPeriod(data);
  });
  document.getElementById('bc-exception').addEventListener('click', () => {
    conflicts.forEach(a => { a.flaggedReason = 'Excepción: cita dejada dentro de un período de bloqueo'; });
    addBlackoutPeriod(data);
  });
}

/* ============================================================
   GLOBAL EVENT DELEGATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    ui.loggedIn = true;
    document.getElementById('screen-login').hidden = true;
    document.getElementById('app-shell').hidden = false;
    navigateTo('agenda');
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    ui.loggedIn = false;
    document.getElementById('app-shell').hidden = true;
    document.getElementById('screen-login').hidden = false;
  });

  document.getElementById('mobile-nav-toggle').addEventListener('click', () => {
    document.getElementById('main-nav').classList.toggle('is-open');
  });

  document.getElementById('view-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.view-tab');
    if (!btn) return;
    endMovingMode();
    ui.calView = btn.dataset.view;
    renderAgenda();
  });

  document.getElementById('owners-search').addEventListener('input', () => renderOwnersList());
  document.getElementById('pickup-date').addEventListener('change', (e) => { ui.pickupDate = e.target.value; ui.pickupRoute = null; renderPickups(); });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (ui.movingApptId) endMovingMode(); else closeModal(); } });

  document.addEventListener('click', onGlobalClick);
});

function onGlobalClick(e) {
  const navBtn = e.target.closest('.nav-link');
  if (navBtn) { navigateTo(navBtn.dataset.nav); return; }

  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  if (!action) return;

  switch (action) {
    case 'close-modal': closeModal(); break;
    case 'cancel-moving': endMovingMode(); break;

    case 'new-appointment': e.preventDefault(); openAppointmentForm(null, el.dataset.date, el.dataset.time); break;
    case 'open-appointment':
      if (suppressNextTileClick) { suppressNextTileClick = false; break; }
      openAppointmentDetail(el.dataset.id);
      break;
    case 'edit-appointment': closeModal(); openAppointmentForm(el.dataset.id); break;
    case 'cancel-appointment': {
      const appt = getAppt(el.dataset.id);
      const pet = getPet(appt.petId);
      openModal(`
        <div class="modal-header"><h2 class="text-h2">Cancelar cita</h2></div>
        <p class="modal-body-text">¿Cancelar la cita de ${escapeHtml(pet.name)} del ${formatDateLong(appt.date)} a las ${appt.startTime}?</p>
        <div class="modal-actions"><button class="btn btn-ghost" id="cc-no">Volver</button><button class="btn btn-destructive" id="cc-yes">Sí, cancelar</button></div>
      `, { blocking: true });
      document.getElementById('cc-no').addEventListener('click', () => openAppointmentDetail(appt.id));
      document.getElementById('cc-yes').addEventListener('click', () => {
        const origDate = appt.date, origTime = appt.startTime;
        appt.status = 'cancelled';
        toast('Cita cancelada.', 'success');
        evaluateVacatedSlot(origDate, origTime, pet.size, appt.durationMinutes);
        closeModal();
        renderCurrentScreen();
      });
      break;
    }
    case 'whatsapp-appt': sendWhatsAppForAppointment(el.dataset.id); break;
    case 'whatsapp-owner-all': sendWhatsAppForAllUpcoming(el.dataset.id); break;

    case 'new-owner': openOwnerForm(null); break;
    case 'edit-owner': closeModal(); openOwnerForm(el.dataset.id); break;
    case 'open-owner': closeModal(); navigateTo('owner-detail', { ownerId: el.dataset.id }); break;
    case 'open-owner-from-modal': e.preventDefault(); closeModal(); navigateTo('owner-detail', { ownerId: el.dataset.id }); break;
    case 'back-to-owners': navigateTo('owners'); break;

    case 'new-pet': openPetForm(null, el.dataset.ownerId); break;
    case 'edit-pet': closeModal(); openPetForm(el.dataset.id); break;

    case 'add-to-waiting-list': openAddToWaitingList(); break;
    case 'approve-recommendation': approveRecommendation(el.dataset.entryId); break;
    case 'reject-leave-open': rejectLeaveOpen(); break;
    case 'reject-manual-book': rejectManualBook(); break;

    case 'generate-route': generateRoute(); break;
    case 'open-waze': openWaze(); break;
    case 'open-google-maps': openGoogleMaps(); break;

    case 'remove-blackout': db.blackoutPeriods = db.blackoutPeriods.filter(b => b.id !== el.dataset.id); toast('Período de bloqueo eliminado.', 'info'); renderConfig(); break;

    case 'cal-prev': shiftCalendar(-1); break;
    case 'cal-next': shiftCalendar(1); break;
    case 'cal-today': ui.calAnchor = TODAY_ISO; renderAgenda(); break;
    case 'cal-goto-month': ui.calAnchor = toISODate(new Date(Number(el.dataset.year), Number(el.dataset.month), 1)); ui.calView = 'month'; renderAgenda(); break;
  }
}
