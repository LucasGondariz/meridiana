// data.js — Mocked KPI data for the service dashboard.
// 12 months: jun-25 → may-26. Numbers are plausible for a mid-size IT service.

const MONTHS_12 = [
  { key: 'jun-25', short: 'JUN', full: 'Junio 2025' },
  { key: 'jul-25', short: 'JUL', full: 'Julio 2025' },
  { key: 'ago-25', short: 'AGO', full: 'Agosto 2025' },
  { key: 'sep-25', short: 'SEP', full: 'Septiembre 2025' },
  { key: 'oct-25', short: 'OCT', full: 'Octubre 2025' },
  { key: 'nov-25', short: 'NOV', full: 'Noviembre 2025' },
  { key: 'dic-25', short: 'DIC', full: 'Diciembre 2025' },
  { key: 'ene-26', short: 'ENE', full: 'Enero 2026' },
  { key: 'feb-26', short: 'FEB', full: 'Febrero 2026' },
  { key: 'mar-26', short: 'MAR', full: 'Marzo 2026' },
  { key: 'abr-26', short: 'ABR', full: 'Abril 2026' },
  { key: 'may-26', short: 'MAY', full: 'Mayo 2026' },
];

// 1) VOLUMETRÍA — stacked columns by severity ───────────────────────────────
// Critical / Alta / Media / Baja
const VOLUME_12M = [
  { m: 'jun-25', critica: 38, alta: 142, media: 412, baja: 318 },
  { m: 'jul-25', critica: 41, alta: 155, media: 438, baja: 305 },
  { m: 'ago-25', critica: 29, alta: 124, media: 386, baja: 281 },
  { m: 'sep-25', critica: 47, alta: 168, media: 471, baja: 342 },
  { m: 'oct-25', critica: 52, alta: 181, media: 503, baja: 367 },
  { m: 'nov-25', critica: 44, alta: 159, media: 462, baja: 351 },
  { m: 'dic-25', critica: 36, alta: 138, media: 391, baja: 274 },
  { m: 'ene-26', critica: 49, alta: 172, media: 488, baja: 339 },
  { m: 'feb-26', critica: 34, alta: 147, media: 421, baja: 312 },
  { m: 'mar-26', critica: 31, alta: 134, media: 405, baja: 298 },
  { m: 'abr-26', critica: 27, alta: 121, media: 378, baja: 286 },
  { m: 'may-26', critica: 24, alta: 109, media: 352, baja: 271 },
];

// 90 días: ~13 semanas (mar..may 2026)
const VOLUME_90D = [
  { m: 'S1',  critica: 8, alta: 32, media: 102, baja: 76 },
  { m: 'S2',  critica: 7, alta: 30, media: 96,  baja: 70 },
  { m: 'S3',  critica: 9, alta: 35, media: 108, baja: 80 },
  { m: 'S4',  critica: 7, alta: 28, media: 99,  baja: 72 },
  { m: 'S5',  critica: 6, alta: 31, media: 94,  baja: 68 },
  { m: 'S6',  critica: 7, alta: 29, media: 92,  baja: 71 },
  { m: 'S7',  critica: 8, alta: 33, media: 101, baja: 74 },
  { m: 'S8',  critica: 5, alta: 27, media: 88,  baja: 67 },
  { m: 'S9',  critica: 6, alta: 26, media: 85,  baja: 65 },
  { m: 'S10', critica: 7, alta: 30, media: 91,  baja: 70 },
  { m: 'S11', critica: 5, alta: 24, media: 82,  baja: 64 },
  { m: 'S12', critica: 6, alta: 27, media: 86,  baja: 66 },
  { m: 'S13', critica: 4, alta: 22, media: 79,  baja: 61 },
];

// 30 días: días
const VOLUME_30D = (() => {
  const days = [];
  const base = [22, 28, 30, 26, 19, 14, 16, 25, 31, 33, 27, 22, 18, 15, 17, 24, 29, 32, 28, 23, 19, 16, 18, 25, 28, 30, 26, 22, 18, 16];
  for (let i = 0; i < 30; i++) {
    const total = base[i];
    days.push({
      m: `${i + 1}`,
      critica: Math.round(total * 0.05),
      alta:    Math.round(total * 0.22),
      media:   Math.round(total * 0.46),
      baja:    Math.round(total * 0.27),
    });
  }
  return days;
})();

// 2) MTTR — line per month (horas), with SLA target ──────────────────────────
const MTTR_12M = [
  { m: 'jun-25', val: 6.4 },
  { m: 'jul-25', val: 6.1 },
  { m: 'ago-25', val: 5.8 },
  { m: 'sep-25', val: 6.7 },
  { m: 'oct-25', val: 7.2 },
  { m: 'nov-25', val: 6.5 },
  { m: 'dic-25', val: 5.4 },
  { m: 'ene-26', val: 5.9 },
  { m: 'feb-26', val: 5.2 },
  { m: 'mar-26', val: 4.8 },
  { m: 'abr-26', val: 4.5 },
  { m: 'may-26', val: 4.2 },
];
const MTTR_SLA = 5.0;  // horas

// 3) MTTG — 30 días sparkline ────────────────────────────────────────────────
const MTTG_30D = [
  2.4, 2.5, 2.6, 2.4, 2.3, 2.5, 2.7, 2.6, 2.4, 2.3,
  2.2, 2.3, 2.5, 2.4, 2.2, 2.1, 2.3, 2.2, 2.0, 2.1,
  2.2, 2.0, 1.9, 2.0, 2.1, 1.9, 1.8, 1.9, 1.7, 1.8,
];
const MTTG_CURRENT_H = 2.23; // 2h 14m

// 4) Resolución por niveles (current month) ─────────────────────────────────
const LEVELS = [
  { name: 'Nivel 1', pct: 64, count: 484, color: 'var(--c-primary)' },
  { name: 'Nivel 2', pct: 27, count: 204, color: 'var(--c-accent)'  },
  { name: 'Nivel 3', pct:  9, count:  68, color: 'var(--c-slate)'   },
];

// 5) Tecnologías — donut ────────────────────────────────────────────────────
const TECH = [
  { name: 'Red',          count: 412, color: 'var(--c-primary)' },
  { name: 'Servidores',   count: 318, color: 'var(--c-accent)'  },
  { name: 'Aplicaciones', count: 286, color: 'var(--c-teal)'    },
  { name: 'Telefonía',    count: 192, color: 'var(--c-amber)'   },
  { name: 'Seguridad',    count: 108, color: 'var(--c-violet)'  },
  { name: 'Otros',        count:  74, color: 'var(--c-slate)'   },
];

// 6) Heatmap recurrencias — meses × tecnologías ─────────────────────────────
// Valores: nº de incidentes recurrentes (mismo CI, <30d)
const HEAT_TECHS = ['Red', 'Servidores', 'Aplicaciones', 'Telefonía', 'Seguridad'];
const HEAT = [
  // jun jul ago sep oct nov dic ene feb mar abr may
  [ 12, 14, 11, 18, 22, 19, 13, 17, 12,  9,  7,  6 ], // Red
  [  9, 11, 14, 15, 17, 13, 10, 12,  9,  8,  6,  5 ], // Servidores
  [ 18, 21, 17, 24, 28, 25, 19, 22, 18, 14, 12, 11 ], // Aplicaciones
  [  6,  7,  5,  9, 11,  8,  6,  7,  6,  5,  4,  3 ], // Telefonía
  [  4,  5,  3,  6,  8, 12, 14,  9,  7,  5,  4,  3 ], // Seguridad
];

// 7) Timeline — mejoras de gestión implementadas ────────────────────────────
const TIMELINE = [
  { month: 'jul-25', monthIdx: 1,  type: 'process',
    title: 'Nueva matriz de severidad',
    impact: 'Reclasificación de tickets',
    pos: 'up' },
  { month: 'ago-25', monthIdx: 2,  type: 'tech',
    title: 'Monitoreo proactivo de red',
    impact: 'Detección −38% MTTD',
    pos: 'down' },
  { month: 'sep-25', monthIdx: 3,  type: 'org',
    title: 'Refuerzo equipo N2 (+3 FTE)',
    impact: 'Backlog −24%',
    pos: 'up' },
  { month: 'nov-25', monthIdx: 5,  type: 'sla',
    title: 'Renegociación de SLAs',
    impact: 'Nuevas penalizaciones',
    pos: 'down' },
  { month: 'dic-25', monthIdx: 6,  type: 'process',
    title: 'Runbook automatización L1',
    impact: 'MTTR −18% en L1',
    pos: 'up' },
  { month: 'feb-26', monthIdx: 8,  type: 'tech',
    title: 'Self-healing alertas red',
    impact: 'Recurrencias −41%',
    pos: 'down' },
  { month: 'abr-26', monthIdx: 10, type: 'process',
    title: 'Postmortems obligatorios',
    impact: 'Reducción reincidencia',
    pos: 'up' },
];

// 8) SLA por proveedores ────────────────────────────────────────────────────
const PROVIDERS = [
  { name: 'ISP Norte',    pct: 99.82, target: 99.5 },
  { name: 'ISP Sur',      pct: 99.41, target: 99.5 },
  { name: 'Carrier MPLS', pct: 97.12, target: 99.0 },
  { name: 'Cloud Hub',    pct: 99.95, target: 99.9 },
  { name: 'Datacenter',   pct: 98.74, target: 99.0 },
  { name: 'Soporte HW',   pct: 95.40, target: 97.0 },
];

// Aggregate helpers ─────────────────────────────────────────────────────────
function sumMonth(d) { return d.critica + d.alta + d.media + d.baja; }

const PERIOD_DATA = {
  '12m': { volume: VOLUME_12M, label: 'mensual',  xLabel: 'Mes' },
  '90d': { volume: VOLUME_90D, label: 'semanal',  xLabel: 'Semana' },
  '30d': { volume: VOLUME_30D, label: 'diario',   xLabel: 'Día' },
};

// Stats globales
const STATS = {
  '12m': {
    incidentes: VOLUME_12M.reduce((a, b) => a + sumMonth(b), 0),
    delta_incidentes: -8.4,
    mttr: 5.7,           // promedio anual
    delta_mttr: -22.3,
    mttg: 2.23,
    delta_mttg: -15.6,
    sla: 98.8,
    delta_sla: +0.6,
  },
  '90d': {
    incidentes: 3221,
    delta_incidentes: -12.1,
    mttr: 4.5,
    delta_mttr: -18.4,
    mttg: 2.0,
    delta_mttg: -14.2,
    sla: 99.1,
    delta_sla: +0.9,
  },
  '30d': {
    incidentes: VOLUME_30D.reduce((a, b) => a + sumMonth(b), 0),
    delta_incidentes: -14.8,
    mttr: 4.2,
    delta_mttr: -8.7,
    mttg: 1.85,
    delta_mttg: -6.4,
    sla: 99.4,
    delta_sla: +0.4,
  },
};

window.__DATA = {
  MONTHS_12,
  VOLUME_12M, VOLUME_90D, VOLUME_30D, PERIOD_DATA,
  MTTR_12M, MTTR_SLA,
  MTTG_30D, MTTG_CURRENT_H,
  LEVELS,
  TECH,
  HEAT_TECHS, HEAT,
  TIMELINE,
  PROVIDERS,
  STATS,
  sumMonth,
};
