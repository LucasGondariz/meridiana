// dashboard.jsx — Main composition for the service KPI dashboard.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "period": "12m",
  "skeleton": false
}/*EDITMODE-END*/;

const D = window.__DATA;

function fmtNum(n) {
  return n.toLocaleString('es-ES');
}

function fmtDelta(v, invertColor = false) {
  // invertColor: for metrics where DOWN is GOOD (e.g. incidents, MTTR)
  const isUp = v > 0;
  const sign = isUp ? '↑' : (v < 0 ? '↓' : '→');
  const cls = (invertColor ? !isUp : isUp) || v === 0
    ? (v === 0 ? 'flat' : 'up')
    : 'down';
  return { text: `${sign} ${Math.abs(v).toFixed(1)}%`, cls };
}

function fmtHours(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh}h ${String(mm).padStart(2, '0')}m`;
}

// ─── KPI Cards ──────────────────────────────────────────────────────────────
function Kpi({ label, value, unit, delta, deltaInvert = false, footer, sparkData, sparkColor }) {
  const d = fmtDelta(delta, deltaInvert);
  return (
    <div className="kpi">
      <div className="kpi-head">
        <span className="kpi-label">{label}</span>
        <span className={`kpi-delta ${d.cls}`}>{d.text}</span>
      </div>
      <div className="kpi-value">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div className="kpi-foot">
        <span className="kpi-foot-label">{footer}</span>
        {sparkData && (
          <div className="kpi-sparkline">
            <Sparkline data={sparkData} width={160} height={36} color={sparkColor} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Period switcher ────────────────────────────────────────────────────────
function PeriodSwitch({ value, onChange }) {
  const opts = [
    { v: '30d', l: '30 días' },
    { v: '90d', l: '90 días' },
    { v: '12m', l: '12 meses' },
  ];
  return (
    <div className="period-switch" role="tablist">
      {opts.map(o => (
        <button
          key={o.v}
          className={value === o.v ? 'is-active' : ''}
          onClick={() => onChange(o.v)}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

// ─── Section header on top of each block (visual rhythm) ───────────────────
function BlockBanner({ idx, title, sub }) {
  return (
    <div style={{
      gridColumn: '1 / -1',
      display: 'flex',
      alignItems: 'baseline',
      gap: 14,
      paddingLeft: 2,
    }}>
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.14em',
        color: 'var(--muted)',
        textTransform: 'uppercase',
        fontVariantNumeric: 'tabular-nums',
      }}>
        Bloque {String(idx).padStart(2, '0')}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{title}</span>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{sub}</span>
      <span style={{ flex: 1, height: 1, background: 'var(--line)', marginLeft: 8 }} />
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const period = t.period || '12m';

  const periodData = D.PERIOD_DATA[period];
  const stats = D.STATS[period];

  const periodLabel = {
    '30d': 'Últimos 30 días',
    '90d': 'Últimos 90 días',
    '12m': 'Últimos 12 meses',
  }[period];

  return (
    <div className={"dash" + (t.skeleton ? " is-skeleton" : "")}>
      {/* HEADER */}
      <header className="header">
        <div className="brand">
          <div className="brand-mark">KPI</div>
          <div>
            <div className="brand-title">Operación y Calidad del Servicio</div>
            <div className="brand-sub">Dashboard ejecutivo · IT Service Management</div>
          </div>
        </div>
        <div className="header-meta">
          <span className="sk-banner">
            <span className="sk-dot" />
            Datos enmascarados
          </span>
          <div className="meta-chip">
            <span className="dot" />
            <span className="meta-label">En vivo</span>
          </div>
          <div className="meta-chip">
            <span className="meta-label">Período</span>
            <span style={{ fontWeight: 500 }}>{periodLabel}</span>
          </div>
          <div className="meta-chip">
            <span className="meta-label">Actualizado</span>
            <span style={{ fontWeight: 500 }}>Hoy · 09:42</span>
          </div>
          <PeriodSwitch value={period} onChange={(v) => setTweak('period', v)} />
        </div>
      </header>

      {/* KPI ROW */}
      <section className="kpis">
        <Kpi
          label="Volumen de incidencias"
          value={fmtNum(stats.incidentes)}
          delta={stats.delta_incidentes}
          deltaInvert={true}
          footer="Tickets totales en el período"
          sparkData={D.MTTG_30D.map((_, i) => stats.incidentes / 30 + (Math.sin(i / 3) * 8))}
          sparkColor="var(--c-primary)"
        />
        <Kpi
          label="MTTR · Tiempo medio de resolución"
          value={stats.mttr.toFixed(1)}
          unit="h"
          delta={stats.delta_mttr}
          deltaInvert={true}
          footer={`SLA objetivo · ${D.MTTR_SLA.toFixed(1)} h`}
          sparkData={D.MTTR_12M.map(d => d.val)}
          sparkColor="var(--c-accent)"
        />
        <Kpi
          label="MTTG · Tiempo medio de gestión"
          value={fmtHours(stats.mttg)}
          delta={stats.delta_mttg}
          deltaInvert={true}
          footer="Promedio · últimos 30 días"
          sparkData={D.MTTG_30D}
          sparkColor="var(--c-teal)"
        />
        <Kpi
          label="SLA cumplimiento global"
          value={stats.sla.toFixed(1)}
          unit="%"
          delta={stats.delta_sla}
          deltaInvert={false}
          footer={`${D.PROVIDERS.filter(p => p.pct >= p.target).length} de ${D.PROVIDERS.length} proveedores en SLA`}
          sparkData={[98.1, 98.3, 98.0, 98.4, 98.7, 98.5, 98.9, 99.0, 99.1, 99.2, 99.3, 99.4]}
          sparkColor="var(--good)"
        />
      </section>

      {/* GRID — Bloque 1 + Bloque 2 */}
      <section className="grid">
        {/* Volumetría */}
        <div className="card g-volume">
          <div className="card-head">
            <div className="card-title-wrap">
              <div className="card-title">Volumetría de incidencias</div>
              <div className="card-sub">Por severidad · vista {periodData.label}</div>
            </div>
            <div className="card-legend">
              <span className="lg"><span className="sw" style={{ background: 'var(--sev-crit)' }} />Crítica</span>
              <span className="lg"><span className="sw" style={{ background: 'var(--sev-high)' }} />Alta</span>
              <span className="lg"><span className="sw" style={{ background: 'var(--sev-med)' }} />Media</span>
              <span className="lg"><span className="sw" style={{ background: 'var(--sev-low)' }} />Baja</span>
            </div>
          </div>
          <div className="card-body">
            <StackedColumns
              data={periodData.volume}
              xLabel={periodData.xLabel}
            />
          </div>
        </div>

        {/* MTTR */}
        <div className="card g-mttr">
          <div className="card-head">
            <div className="card-title-wrap">
              <div className="card-title">Tiempo medio de resolución</div>
              <div className="card-sub">MTTR mensual vs SLA objetivo · horas</div>
            </div>
            <div className="card-legend">
              <span className="lg"><span className="sw" style={{ background: 'var(--c-accent)' }} />MTTR</span>
              <span className="lg"><span className="sw" style={{ background: 'var(--c-coral)' }} />SLA 5h</span>
            </div>
          </div>
          <div className="card-body">
            <LineWithTarget
              data={D.MTTR_12M}
              target={D.MTTR_SLA}
              yUnit="h"
              yMaxOverride={9}
            />
          </div>
        </div>

        {/* Niveles */}
        <div className="card g-levels">
          <div className="card-head">
            <div className="card-title-wrap">
              <div className="card-title">Tasa de resolución por nivel</div>
              <div className="card-sub">Distribución por línea de soporte</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start' }}>
            <LevelsBars levels={D.LEVELS} />
          </div>
        </div>

        {/* Tecnologías */}
        <div className="card g-tech">
          <div className="card-head">
            <div className="card-title-wrap">
              <div className="card-title">Segmentación por tecnologías</div>
              <div className="card-sub">Distribución de incidentes</div>
            </div>
          </div>
          <div className="card-body">
            <DonutWithRanking data={D.TECH} />
          </div>
        </div>

        {/* Heatmap */}
        <div className="card g-heat">
          <div className="card-head">
            <div className="card-title-wrap">
              <div className="card-title">Gestión de recurrencias</div>
              <div className="card-sub">Mismo CI &lt; 30 días · meses × tecnología</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center' }}>
            <Heatmap
              techs={D.HEAT_TECHS}
              data={D.HEAT}
              months={D.MONTHS_12}
            />
          </div>
        </div>
      </section>

      {/* GRID 2 — Bloque 3 */}
      <section className="grid-2">
        <div className="card g-timeline">
          <div className="card-head">
            <div className="card-title-wrap">
              <div className="card-title">Evolución y mejoras de gestión</div>
              <div className="card-sub">Acciones implementadas en los últimos 12 meses</div>
            </div>
            <div className="card-legend">
              <span className="lg"><span className="sw" style={{ background: 'var(--c-teal)' }} />Proceso</span>
              <span className="lg"><span className="sw" style={{ background: 'var(--c-accent)' }} />Tecnología</span>
              <span className="lg"><span className="sw" style={{ background: 'var(--c-amber)' }} />Equipo</span>
              <span className="lg"><span className="sw" style={{ background: 'var(--c-violet)' }} />SLA</span>
            </div>
          </div>
          <div className="card-body">
            <Timeline events={D.TIMELINE} months={D.MONTHS_12} />
          </div>
        </div>

        <div className="card g-providers">
          <div className="card-head">
            <div className="card-title-wrap">
              <div className="card-title">SLA segmentado por proveedores</div>
              <div className="card-sub">Disponibilidad medida vs SLA contractual</div>
            </div>
            <div className="card-legend">
              <span className="lg"><span className="sw" style={{ background: 'var(--good)' }} />Cumple</span>
              <span className="lg"><span className="sw" style={{ background: 'var(--warn)' }} />En riesgo</span>
              <span className="lg"><span className="sw" style={{ background: 'var(--bad)' }} />Incumple</span>
            </div>
          </div>
          <div className="card-body">
            <ProviderBars providers={D.PROVIDERS} />
          </div>
        </div>
      </section>

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Período" />
        <TweakRadio
          label="Ventana"
          value={period}
          options={['30d', '90d', '12m']}
          onChange={(v) => setTweak('period', v)}
        />
        <TweakSection label="Privacidad" />
        <TweakToggle
          label="Datos en skeleton"
          value={!!t.skeleton}
          onChange={(v) => setTweak('skeleton', v)}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
