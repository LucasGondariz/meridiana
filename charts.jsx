// charts.jsx — Reusable chart primitives + tooltip portal.
//
// All charts share a single Tooltip helper that positions a fixed-coord tooltip
// at the user's mouse, regardless of the page's CSS scale.

const { useState, useRef, useEffect, useMemo, useLayoutEffect } = React;

// useSize: measure a DOM element with ResizeObserver
function useSize(ref, fallback = { width: 800, height: 240 }) {
  const [size, setSize] = useState(fallback);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const measure = () => {
      const w = el.clientWidth || el.offsetWidth;
      const h = el.clientHeight || el.offsetHeight;
      if (w > 0 && h > 0) setSize({ width: w, height: h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Re-measure once layout settles
    const t = setTimeout(measure, 50);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, []);
  return size;
}

// ─── Tooltip portal ─────────────────────────────────────────────────────────
function Tooltip({ x, y, children }) {
  if (x == null || y == null) return null;
  return ReactDOM.createPortal(
    <div className="tt" style={{ left: x, top: y }}>{children}</div>,
    document.body
  );
}

function useTooltip() {
  const [tt, setTt] = useState(null);
  const show = (e, content) => {
    setTt({ x: e.clientX, y: e.clientY, content });
  };
  const hide = () => setTt(null);
  return [tt, show, hide];
}

// ─── Stacked Columns (Volumetría) ──────────────────────────────────────────
function StackedColumns({ data, xLabel = 'Mes' }) {
  const ref = useRef(null);
  const { width, height } = useSize(ref);
  const [tt, show, hide] = useTooltip();
  const m = { t: 14, r: 18, b: 32, l: 48 };
  const W = Math.max(0, width - m.l - m.r);
  const H = Math.max(0, height - m.t - m.b);

  const SERIES = [
    { key: 'critica', label: 'Crítica', color: 'var(--sev-crit)' },
    { key: 'alta',    label: 'Alta',    color: 'var(--sev-high)' },
    { key: 'media',   label: 'Media',   color: 'var(--sev-med)'  },
    { key: 'baja',    label: 'Baja',    color: 'var(--sev-low)'  },
  ];

  const max = Math.max(...data.map(d => d.critica + d.alta + d.media + d.baja), 1);
  const yMax = Math.ceil(max / 200) * 200;
  const yTicks = 5;
  const tickStep = yMax / yTicks;

  const colW = W / data.length;
  const barW = colW * 0.62;

  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }}>
      {width > 0 && (
        <svg width={width} height={height}>
          {/* Grid */}
          {Array.from({ length: yTicks + 1 }).map((_, i) => {
            const y = m.t + H - (i * H) / yTicks;
            return (
              <g key={i}>
                <line className="grid-line" x1={m.l} x2={m.l + W} y1={y} y2={y} />
                <text className="axis-tick" x={m.l - 8} y={y + 3.5} textAnchor="end">
                  {Math.round(i * tickStep)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d, i) => {
            const cx = m.l + i * colW + colW / 2;
            let yCursor = m.t + H;
            const total = d.critica + d.alta + d.media + d.baja;
            return (
              <g key={d.m} className="bar-group">
                {SERIES.map((s) => {
                  const v = d[s.key];
                  const h = (v / yMax) * H;
                  yCursor -= h;
                  return (
                    <rect
                      key={s.key}
                      className="bar"
                      x={cx - barW / 2}
                      y={yCursor}
                      width={barW}
                      height={h}
                      fill={s.color}
                      onMouseMove={(e) => show(e, { kind: 'volume', d, total })}
                      onMouseLeave={hide}
                    />
                  );
                })}
                <text className="axis-tick" x={cx} y={m.t + H + 18} textAnchor="middle">
                  {String(d.m).slice(0, 3).toUpperCase()}
                </text>
              </g>
            );
          })}

          <text className="axis-label" x={m.l} y={height - 6}>{xLabel}</text>
        </svg>
      )}

      <Tooltip x={tt?.x} y={tt?.y}>
        {tt?.content?.kind === 'volume' && (() => {
          const d = tt.content.d;
          return (
            <>
              <div className="tt-title">{String(d.m).toUpperCase()}</div>
              {SERIES.map(s => (
                <div className="tt-row" key={s.key}>
                  <span className="tt-key"><span className="sw" style={{ background: s.color }} />{s.label}</span>
                  <span className="tt-val">{d[s.key]}</span>
                </div>
              ))}
              <div className="tt-total">
                <span>Total</span><span>{tt.content.total}</span>
              </div>
            </>
          );
        })()}
      </Tooltip>
    </div>
  );
}

// ─── Line with SLA target (MTTR) ───────────────────────────────────────────
function LineWithTarget({ data, target, yUnit = 'h', yMaxOverride }) {
  const ref = useRef(null);
  const { width, height } = useSize(ref);
  const [hover, setHover] = useState(null);
  const m = { t: 16, r: 18, b: 32, l: 40 };
  const W = Math.max(0, width - m.l - m.r);
  const H = Math.max(0, height - m.t - m.b);

  const maxVal = Math.max(...data.map(d => d.val), target);
  const yMax = yMaxOverride ?? Math.ceil(maxVal + 1);
  const yTicks = 4;

  const pts = data.map((d, i) => ({
    x: m.l + (i / (data.length - 1)) * W,
    y: m.t + H - (d.val / yMax) * H,
    d,
    i,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = pts.length
    ? `M ${pts[0].x} ${m.t + H} ` + pts.map(p => `L ${p.x} ${p.y}`).join(' ') + ` L ${pts[pts.length - 1].x} ${m.t + H} Z`
    : '';

  const slaY = m.t + H - (target / yMax) * H;

  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }}>
      {width > 0 && (
        <svg width={width} height={height}>
          <defs>
            <linearGradient id="mttrFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="var(--c-accent)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--c-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid Y */}
          {Array.from({ length: yTicks + 1 }).map((_, i) => {
            const y = m.t + H - (i * H) / yTicks;
            const v = (i * yMax) / yTicks;
            return (
              <g key={i}>
                <line className="grid-line" x1={m.l} x2={m.l + W} y1={y} y2={y} />
                <text className="axis-tick" x={m.l - 8} y={y + 3.5} textAnchor="end">
                  {v.toFixed(0)}{yUnit}
                </text>
              </g>
            );
          })}

          {/* SLA target line */}
          <line className="sla-line" x1={m.l} x2={m.l + W} y1={slaY} y2={slaY} />
          <text className="sla-label" x={m.l + W} y={slaY - 6} textAnchor="end">
            SLA {target}{yUnit}
          </text>

          {/* Area + line */}
          <path d={areaPath} fill="url(#mttrFill)" />
          <path d={linePath} fill="none" stroke="var(--c-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {/* Hover targets + dots */}
          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="var(--c-accent)" strokeWidth="2" />
              <rect
                x={p.x - 18} y={m.t}
                width={36} height={H}
                fill="transparent"
                onMouseMove={(e) => setHover({ x: e.clientX, y: e.clientY, p })}
                onMouseLeave={() => setHover(null)}
              />
              <text className="axis-tick" x={p.x} y={m.t + H + 18} textAnchor="middle">
                {String(p.d.m).slice(0, 3).toUpperCase()}
              </text>
            </g>
          ))}

          {/* Hover vertical line */}
          {hover && (
            <line
              x1={hover.p.x} x2={hover.p.x}
              y1={m.t} y2={m.t + H}
              stroke="var(--ink-2)" strokeWidth="1" strokeDasharray="2 3"
              opacity="0.4"
            />
          )}
        </svg>
      )}

      <Tooltip x={hover?.x} y={hover?.y}>
        {hover && (
          <>
            <div className="tt-title">{String(hover.p.d.m).toUpperCase()}</div>
            <div className="tt-row">
              <span className="tt-key"><span className="sw" style={{ background: 'var(--c-accent)' }} />MTTR</span>
              <span className="tt-val">{hover.p.d.val.toFixed(1)} h</span>
            </div>
            <div className="tt-row">
              <span className="tt-key"><span className="sw" style={{ background: 'var(--c-coral)' }} />SLA</span>
              <span className="tt-val">{target.toFixed(1)} h</span>
            </div>
            <div className="tt-row">
              <span className="tt-key">vs SLA</span>
              <span className="tt-val" style={{ color: hover.p.d.val <= target ? '#7ee2a8' : '#ffb4ad' }}>
                {hover.p.d.val <= target ? '✓ Cumple' : `+${(hover.p.d.val - target).toFixed(1)}h`}
              </span>
            </div>
          </>
        )}
      </Tooltip>
    </div>
  );
}

// ─── Sparkline (MTTG) ──────────────────────────────────────────────────────
function Sparkline({ data, width = 180, height = 40, color = 'var(--c-primary)' }) {
  const m = { t: 4, r: 4, b: 4, l: 4 };
  const W = width - m.l - m.r;
  const H = height - m.t - m.b;
  const min = Math.min(...data) * 0.85;
  const max = Math.max(...data) * 1.05;
  const span = max - min;

  const pts = data.map((v, i) => ({
    x: m.l + (i / (data.length - 1)) * W,
    y: m.t + H - ((v - min) / span) * H,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `M ${pts[0].x} ${m.t + H} ` + pts.map(p => `L ${p.x} ${p.y}`).join(' ') + ` L ${pts[pts.length - 1].x} ${m.t + H} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkFill)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={color} />
    </svg>
  );
}

// ─── Donut + Ranking (Tecnologías) ─────────────────────────────────────────
function DonutWithRanking({ data, total }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const [tt, show, hide] = useTooltip();

  const size = 200;
  const cx = size / 2, cy = size / 2;
  const r = 78, ir = 54;

  const sum = total ?? data.reduce((a, b) => a + b.count, 0);
  let acc = 0;

  const arcs = data.map((d, i) => {
    const start = acc / sum;
    acc += d.count;
    const end = acc / sum;
    const a0 = start * Math.PI * 2 - Math.PI / 2;
    const a1 = end * Math.PI * 2 - Math.PI / 2;
    const large = end - start > 0.5 ? 1 : 0;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const xi0 = cx + ir * Math.cos(a0), yi0 = cy + ir * Math.sin(a0);
    const xi1 = cx + ir * Math.cos(a1), yi1 = cy + ir * Math.sin(a1);
    const path = `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${ir} ${ir} 0 ${large} 0 ${xi0} ${yi0} Z`;
    return { ...d, path, pct: (d.count / sum) * 100 };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: '100%' }}>
      <div style={{ flex: '0 0 200px' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {arcs.map((a, i) => (
            <path
              key={i}
              className="donut-arc"
              d={a.path}
              fill={a.color}
              opacity={hoverIdx == null || hoverIdx === i ? 1 : 0.35}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseMove={(e) => show(e, { name: a.name, count: a.count, pct: a.pct, color: a.color })}
              onMouseLeave={() => { setHoverIdx(null); hide(); }}
            />
          ))}
          <text className="donut-center-value" x={cx} y={cy - 1} textAnchor="middle" dominantBaseline="middle">
            {hoverIdx == null ? sum.toLocaleString() : arcs[hoverIdx].count.toLocaleString()}
          </text>
          <text className="donut-center-label" x={cx} y={cy + 18} textAnchor="middle" dominantBaseline="middle">
            {hoverIdx == null ? 'Incidentes' : arcs[hoverIdx].name}
          </text>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="rank-list">
          {arcs.map((a, i) => (
            <div
              key={i}
              className="rank-row"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ opacity: hoverIdx == null || hoverIdx === i ? 1 : 0.5 }}
            >
              <span className="sw" style={{ background: a.color }} />
              <span className="label">{a.name}</span>
              <span className="count">{a.count}</span>
              <span className="pct">{a.pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      <Tooltip x={tt?.x} y={tt?.y}>
        {tt && (
          <>
            <div className="tt-title">Tecnología</div>
            <div className="tt-row">
              <span className="tt-key"><span className="sw" style={{ background: tt.content.color }} />{tt.content.name}</span>
              <span className="tt-val">{tt.content.count}</span>
            </div>
            <div className="tt-row">
              <span className="tt-key">Participación</span>
              <span className="tt-val">{tt.content.pct.toFixed(1)}%</span>
            </div>
          </>
        )}
      </Tooltip>
    </div>
  );
}

// ─── Heatmap ───────────────────────────────────────────────────────────────
function Heatmap({ techs, data, months }) {
  const ref = useRef(null);
  const { width, height } = useSize(ref);
  const [tt, show, hide] = useTooltip();

  const labelW = 88;
  const headerH = 20;
  const footerH = 28;
  const gap = 3;

  const cellW = Math.max(0, (width - labelW - 8) / months.length - gap);
  const cellH = Math.max(0, (height - headerH - footerH) / techs.length - gap);

  const max = Math.max(...data.flat(), 1);

  const colorScale = (v) => {
    if (v === 0) return 'var(--bg-deep)';
    const t = v / max;
    const r = Math.round(246 - (246 - 15) * t);
    const g = Math.round(245 - (245 - 157) * t);
    const b = Math.round(241 - (241 - 138) * t);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }}>
      {width > 0 && (
        <svg width={width} height={height}>
          {/* Month labels */}
          {months.map((m, i) => (
            <text key={i}
              className="axis-tick"
              x={labelW + i * (cellW + gap) + cellW / 2}
              y={headerH - 6}
              textAnchor="middle"
              style={{ fontSize: 10.5 }}
            >
              {m.short}
            </text>
          ))}

          {/* Cells + row labels */}
          {techs.map((tech, ri) => (
            <g key={tech}>
              <text
                x={labelW - 10}
                y={headerH + ri * (cellH + gap) + cellH / 2 + 4}
                textAnchor="end"
                style={{ fontSize: 12, fill: 'var(--ink-2)', fontWeight: 500 }}
              >
                {tech}
              </text>
              {data[ri].map((v, ci) => (
                <rect
                  key={ci}
                  className="heat-cell"
                  x={labelW + ci * (cellW + gap)}
                  y={headerH + ri * (cellH + gap)}
                  width={cellW}
                  height={cellH}
                  rx={3}
                  fill={colorScale(v)}
                  stroke="var(--surface)"
                  strokeWidth={0.5}
                  onMouseMove={(e) => show(e, { tech, month: months[ci], v })}
                  onMouseLeave={hide}
                />
              ))}
            </g>
          ))}

          {/* Legend */}
          <g transform={`translate(${labelW}, ${headerH + techs.length * (cellH + gap) + 8})`}>
            <text x={0} y={10} style={{ fontSize: 10.5, fill: 'var(--muted)' }}>Menos</text>
            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
              <rect key={i}
                x={42 + i * 16}
                y={1}
                width={14}
                height={11}
                rx={2}
                fill={colorScale(t * max)}
              />
            ))}
            <text x={42 + 5 * 16 + 6} y={10} style={{ fontSize: 10.5, fill: 'var(--muted)' }}>Más</text>
          </g>
        </svg>
      )}

      <Tooltip x={tt?.x} y={tt?.y}>
        {tt && (
          <>
            <div className="tt-title">{tt.content.tech} · {tt.content.month.short}</div>
            <div className="tt-row">
              <span className="tt-key">Recurrencias</span>
              <span className="tt-val">{tt.content.v}</span>
            </div>
          </>
        )}
      </Tooltip>
    </div>
  );
}

// ─── Stacked horizontal bars (Niveles) ─────────────────────────────────────
function LevelsBars({ levels }) {
  const [hover, setHover] = useState(null);
  const total = levels.reduce((a, b) => a + b.count, 0);

  return (
    <div style={{ width: '100%' }}>
      {/* Per-level rows */}
      {levels.map((l, i) => (
        <div
          key={i}
          className="levels-row"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          style={{ opacity: hover != null && hover !== i ? 0.55 : 1 }}
        >
          <span className="levels-name">{l.name}</span>
          <div className="levels-bar-track">
            <div
              className="levels-bar-seg"
              style={{ width: `${l.pct}%`, background: l.color }}
            >
              {l.count}
            </div>
          </div>
          <span className="levels-pct">{l.pct}%</span>
        </div>
      ))}

      {/* Footer: total */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 14, paddingTop: 10,
        borderTop: '1px solid var(--line-soft)',
        fontSize: 11.5, color: 'var(--muted)',
      }}>
        <span>Total resueltas</span>
        <span style={{ color: 'var(--ink)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ─── Timeline (Mejoras de gestión) ─────────────────────────────────────────
function Timeline({ events, months }) {
  // Distribute events to "up" / "down" lanes
  const [tt, show, hide] = useTooltip();
  const monthsCount = months.length;

  return (
    <div className="timeline" style={{ position: 'relative', height: '100%' }}>
      {/* Axis */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '2%', right: '2%',
        height: 2,
        background: 'linear-gradient(90deg, var(--line) 0%, var(--ink-2) 50%, var(--line) 100%)',
        opacity: 0.5,
      }} />

      {/* Month ticks */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '2%', right: '2%',
        display: 'grid',
        gridTemplateColumns: `repeat(${monthsCount}, 1fr)`,
        transform: 'translateY(8px)',
      }}>
        {months.map((m, i) => (
          <div key={i} style={{
            textAlign: 'center',
            fontSize: 10,
            color: i === monthsCount - 1 ? 'var(--ink)' : 'var(--muted)',
            fontWeight: i === monthsCount - 1 ? 600 : 400,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {m.short}
          </div>
        ))}
      </div>

      {/* Event pins */}
      {events.map((ev, i) => {
        // Position based on month index
        const xPct = 2 + ((ev.monthIdx + 0.5) / monthsCount) * 96;
        const isUp = ev.pos === 'up';
        return (
          <div key={i}
            className={`tl-event t-${ev.type} ${ev.pos}`}
            style={{
              position: 'absolute',
              left: `${xPct}%`,
              width: 200,
              transform: 'translateX(-50%)',
              top: isUp ? 'calc(50% - 110px)' : 'calc(50% + 12px)',
            }}
            onMouseMove={(e) => show(e, { ev })}
            onMouseLeave={hide}
          >
            {isUp && (
              <>
                <div className="tl-card">
                  <span className={`tag t-${ev.type}`}>{labelFor(ev.type)}</span>
                  <div className="ttl">{ev.title}</div>
                  <div className="impact">
                    <b>{ev.impact}</b>
                  </div>
                </div>
                <div className="stem" style={{ height: 36, margin: '4px auto 0', width: 1, background: 'var(--line)' }} />
                <div className="pin" style={{ position: 'relative', top: -7 }} />
              </>
            )}
            {!isUp && (
              <>
                <div className="pin" style={{ position: 'relative', top: -7 }} />
                <div className="stem" style={{ height: 36, margin: '-3px auto 4px', width: 1, background: 'var(--line)' }} />
                <div className="tl-card">
                  <span className={`tag t-${ev.type}`}>{labelFor(ev.type)}</span>
                  <div className="ttl">{ev.title}</div>
                  <div className="impact">
                    <b>{ev.impact}</b>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}

      <Tooltip x={tt?.x} y={tt?.y}>
        {tt && (
          <>
            <div className="tt-title">{tt.content.ev.month.toUpperCase()} · {labelFor(tt.content.ev.type)}</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{tt.content.ev.title}</div>
            <div style={{ opacity: 0.8, fontSize: 11 }}>{tt.content.ev.impact}</div>
          </>
        )}
      </Tooltip>
    </div>
  );
}

function labelFor(type) {
  return {
    process: 'Proceso',
    tech:    'Tecnología',
    org:     'Equipo',
    sla:     'SLA',
  }[type] || type;
}

// ─── Providers bars ────────────────────────────────────────────────────────
function ProviderBars({ providers }) {
  const [hover, setHover] = useState(null);
  // Scale: 92% → 100% maps to 0..100% bar width
  const min = 92;
  const scale = (pct) => ((pct - min) / (100 - min)) * 100;

  return (
    <div style={{ width: '100%' }}>
      {providers.map((p, i) => {
        const status = p.pct >= p.target ? 'good' : (p.pct >= p.target - 1.5 ? 'warn' : 'bad');
        const color = status === 'good' ? 'var(--good)' : (status === 'warn' ? 'var(--warn)' : 'var(--bad)');
        return (
          <div
            key={i}
            className="prov-row"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ opacity: hover != null && hover !== i ? 0.55 : 1 }}
          >
            <span className="prov-name">{p.name}</span>
            <div className="prov-bar-track">
              <div className="prov-bar-fill" style={{ width: `${scale(p.pct)}%`, background: color }} />
              <div className="prov-target" style={{ left: `${scale(p.target)}%` }} />
            </div>
            <span className={`prov-pct ${status}`}>{p.pct.toFixed(2)}%</span>
          </div>
        );
      })}
      {/* Scale legend */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '92px 1fr 62px',
        gap: 12,
        marginTop: 6,
        fontSize: 10.5,
        color: 'var(--muted)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        <span></span>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>92%</span>
          <span>94%</span>
          <span>96%</span>
          <span>98%</span>
          <span>100%</span>
        </div>
        <span></span>
      </div>
    </div>
  );
}

// Export to window for cross-script use
Object.assign(window, {
  StackedColumns,
  LineWithTarget,
  Sparkline,
  DonutWithRanking,
  Heatmap,
  LevelsBars,
  Timeline,
  ProviderBars,
  Tooltip,
});
