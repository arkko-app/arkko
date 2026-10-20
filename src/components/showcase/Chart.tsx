"use client";

import { useId, useState } from "react";
import type { Chart as ChartData } from "@/lib/types";
import { Icon } from "../icons";

const W = 560;
const H = 240;
const PAD = { top: 20, right: 16, bottom: 34, left: 40 };

function niceMax(v: number) {
  if (v <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

const fmt = (v: number) => (Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 1 }));

/** Single-series bar or line chart. Values come only from the payload; nothing is computed or invented. */
export function Chart({ chart, cite }: { chart: ChartData; cite?: React.ReactNode }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const titleId = useId();

  const values = chart.points.map((p) => p.value);
  const min = Math.min(0, ...values);
  const max = niceMax(Math.max(...values));
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + ih - ((v - min) / (max - min)) * ih;
  const band = iw / chart.points.length;
  const cx = (i: number) => PAD.left + band * i + band / 2;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => min + (max - min) * t);
  const barW = Math.min(56, band * 0.5);

  return (
    <figure className="rounded-xl border border-line bg-surface p-4 sm:p-5" aria-labelledby={titleId}>
      <div className="flex items-start justify-between gap-3">
        <figcaption>
          <div id={titleId} className="text-[15px] font-semibold text-ink">{chart.title}</div>
          <div className="mt-0.5 text-xs text-muted">{chart.unit}</div>
        </figcaption>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-ink-2 hover:bg-surface-2"
          aria-pressed={asTable}
        >
          <Icon name={asTable ? "chart" : "table"} size={13} />
          {asTable ? "Chart" : "Table"}
        </button>
      </div>

      {asTable ? (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="py-2 font-medium">Label</th>
              <th className="py-2 text-right font-medium">{chart.unit}</th>
            </tr>
          </thead>
          <tbody>
            {chart.points.map((p) => (
              <tr key={p.label} className="border-b border-line last:border-0">
                <td className="py-2 text-ink-2">{p.label}</td>
                <td className="py-2 text-right tabular-nums text-ink">{fmt(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative mt-3">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${chart.title}, ${chart.unit}`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--muted)">
                  {fmt(t)}
                </text>
              </g>
            ))}
            {chart.points.map((p, i) => (
              <text key={p.label} x={cx(i)} y={H - 10} textAnchor="middle" fontSize={12} fill="var(--ink-2)">
                {p.label}
              </text>
            ))}

            {chart.type === "bar" &&
              chart.points.map((p, i) => {
                const top = y(Math.max(p.value, 0));
                const h = Math.abs(y(p.value) - y(0));
                const r = Math.min(4, h);
                return (
                  <path
                    key={p.label}
                    d={`M${cx(i) - barW / 2},${top + h} V${top + r} q0,-${r} ${r},-${r} H${cx(i) + barW / 2 - r} q${r},0 ${r},${r} V${top + h} Z`}
                    fill="var(--brand)"
                    opacity={hover === null || hover === i ? 1 : 0.45}
                  />
                );
              })}

            {chart.type === "line" && (
              <>
                <polyline
                  points={chart.points.map((p, i) => `${cx(i)},${y(p.value)}`).join(" ")}
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
                {hover !== null && (
                  <line x1={cx(hover)} x2={cx(hover)} y1={PAD.top} y2={PAD.top + ih} stroke="var(--line-strong)" />
                )}
                {chart.points.map((p, i) => (
                  <circle
                    key={p.label}
                    cx={cx(i)}
                    cy={y(p.value)}
                    r={hover === i ? 5 : 4}
                    fill="var(--brand)"
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                ))}
              </>
            )}

            {/* Selective direct label: the highest value only */}
            {(() => {
              const i = values.indexOf(Math.max(...values));
              return (
                <text x={cx(i)} y={y(values[i]) - 8} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--ink)">
                  {fmt(values[i])}
                </text>
              );
            })()}

            {/* Hit targets wider than the marks */}
            {chart.points.map((p, i) => (
              <rect
                key={p.label}
                x={PAD.left + band * i}
                y={PAD.top}
                width={band}
                height={ih}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs shadow-md"
              style={{
                left: `${(cx(hover) / W) * 100}%`,
                top: `${(y(chart.points[hover].value) / H) * 100}%`,
                marginTop: -10,
              }}
            >
              <div className="text-muted">{chart.points[hover].label}</div>
              <div className="font-semibold tabular-nums text-ink">
                {fmt(chart.points[hover].value)} <span className="font-normal text-muted">{chart.unit}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {cite}
        {chart.note && <span>{chart.note}</span>}
      </div>
    </figure>
  );
}
