'use client';

import React, { useMemo, useState } from 'react';

export interface PieSlice {
  key: string;
  label: string;
  emoji: string;
  value: number;
}

// Validated categorical slots (dark surface #0b1220) + neutral for the "Baaki" fold.
const SLICE_COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181'];
const REST_COLOR = '#6b7280';
const MAX_SLICES = 5;

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function arcPath(cx: number, cy: number, rOuter: number, rInner: number, start: number, end: number) {
  const large = end - start > Math.PI ? 1 : 0;
  const p = (r: number, a: number) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  return [
    `M ${p(rOuter, start)}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${p(rOuter, end)}`,
    `L ${p(rInner, end)}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${p(rInner, start)}`,
    'Z',
  ].join(' ');
}

export default function MoneyPie({ slices, title }: { slices: PieSlice[]; title: string }) {
  const [active, setActive] = useState<string | null>(null);

  const data = useMemo(() => {
    const sorted = [...slices].filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
    const head = sorted.slice(0, MAX_SLICES).map((s, i) => ({ ...s, color: SLICE_COLORS[i] }));
    const rest = sorted.slice(MAX_SLICES);
    if (rest.length) {
      head.push({
        key: '__rest',
        label: `Baaki ${rest.length} category`,
        emoji: '🧩',
        value: rest.reduce((a, s) => a + s.value, 0),
        color: REST_COLOR,
      });
    }
    return head;
  }, [slices]);

  const total = data.reduce((a, s) => a + s.value, 0);

  if (total <= 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/60">
        Is mahine abhi koi entry nahi hai.
      </div>
    );
  }

  const size = 220;
  const c = size / 2;
  const rOuter = 100;
  const rInner = 62;
  // A tiny angular gap gives each slice a visible surface seam.
  const gap = data.length > 1 ? 0.012 : 0;

  let angle = -Math.PI / 2;
  const arcs = data.map((s) => {
    const sweep = (s.value / total) * Math.PI * 2;
    const start = angle + gap;
    const end = angle + sweep - gap;
    angle += sweep;
    return { ...s, start, end, sweep };
  });

  const focus = data.find((s) => s.key === active) || null;

  return (
    <figure className="space-y-4" aria-label={title}>
      <div className="relative mx-auto" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={title}>
          {arcs.map((s) =>
            data.length === 1 ? (
              <g key={s.key}>
                <circle cx={c} cy={c} r={(rOuter + rInner) / 2} fill="none" stroke={s.color} strokeWidth={rOuter - rInner} />
              </g>
            ) : (
              <path
                key={s.key}
                d={arcPath(c, c, active === s.key ? rOuter + 4 : rOuter, rInner, s.start, Math.max(s.start + 0.001, s.end))}
                fill={s.color}
                opacity={active && active !== s.key ? 0.35 : 1}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setActive(s.key)}
                onMouseLeave={() => setActive(null)}
                onClick={() => setActive(active === s.key ? null : s.key)}
              >
                <title>{`${s.label}: ${inr(s.value)} (${Math.round((s.value / total) * 100)}%)`}</title>
              </path>
            )
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-[11px] uppercase tracking-wider text-white/55">{focus ? focus.label : title}</div>
          <div className="text-xl font-bold text-white">{inr(focus ? focus.value : total)}</div>
          {focus && <div className="text-xs text-white/60">{Math.round((focus.value / total) * 100)}%</div>}
        </div>
      </div>

      <ul className="space-y-1.5">
        {data.map((s) => (
          <li key={s.key}>
            <button
              type="button"
              onClick={() => setActive(active === s.key ? null : s.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                active === s.key ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: s.color }} aria-hidden />
              <span className="flex-1 truncate text-white/85">
                {s.emoji} {s.label}
              </span>
              <span className="tabular-nums text-white/60">{Math.round((s.value / total) * 100)}%</span>
              <span className="w-24 text-right font-semibold tabular-nums text-white">{inr(s.value)}</span>
            </button>
          </li>
        ))}
      </ul>
    </figure>
  );
}
