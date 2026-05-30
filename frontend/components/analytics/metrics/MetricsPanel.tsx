// Path: components/analytics/metrics/MetricsPanel.tsx
import {
  ChartCard,
  BarList,
  StatRing,
  KpiCard,
  SERIES_COLORS,
} from "@/components/ui/charts";
import { BoltIcon, GaugeIcon, WrenchIcon, SparkIcon } from "@/components/ui/icons";
import { fmtMs, fmtRatioPercent, humanize } from "@/lib/format";
import type { AggregateMetrics } from "@/lib/types";

export function MetricsPanel({ metrics }: { metrics: AggregateMetrics | null }) {
  if (!metrics || metrics.callsWithMetrics === 0) return null;

  const confidencePct = metrics.avgConfidence * 100;
  // Healthy confidence is high; gauge color shifts to amber/rose when low.
  const confColor =
    confidencePct >= 80 ? SERIES_COLORS[2] : confidencePct >= 60 ? SERIES_COLORS[3] : SERIES_COLORS[4];

  const toolItems = metrics.toolUsage.slice(0, 8).map((t) => ({
    label: humanize(t.name),
    value: t.count,
    hint: `${t.count.toLocaleString()} · ${fmtMs(t.avgDurationMs)} avg`,
  }));

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Call performance</div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Avg response"
          value={fmtMs(metrics.avgResponseTimeMs)}
          sub="LLM + tool turn"
          icon={<BoltIcon />}
          color={SERIES_COLORS[0]}
        />
        <KpiCard
          label="P95 response"
          value={fmtMs(metrics.p95ResponseTimeMs)}
          sub="slowest 5%"
          icon={<BoltIcon />}
          color={SERIES_COLORS[3]}
        />
        <KpiCard
          label="LLM calls / call"
          value={metrics.avgLlmCallsPerCall}
          sub={`${metrics.avgTtsChunksPerCall} TTS chunks`}
          icon={<SparkIcon />}
          color={SERIES_COLORS[5]}
        />
        <KpiCard
          label="Calls measured"
          value={metrics.callsWithMetrics.toLocaleString()}
          sub="with metrics captured"
          icon={<GaugeIcon />}
          color={SERIES_COLORS[1]}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <ChartCard title="Speech confidence" subtitle="Average STT confidence">
          <div className="flex items-center justify-around py-1">
            <StatRing
              percent={confidencePct}
              caption="avg confidence"
              color={confColor}
            />
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-2xl font-semibold tabular-nums">
                  {fmtRatioPercent(metrics.lowConfidenceRate)}
                </div>
                <div style={{ color: "rgb(var(--muted))" }}>low-confidence turns</div>
              </div>
              <div style={{ color: "rgb(var(--muted))" }} className="text-xs max-w-[12rem]">
                Share of recognized speech under 60% confidence — high values hint at audio or
                accent issues.
              </div>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Tool usage"
          subtitle="Function calls invoked by the assistant"
          className="lg:col-span-2"
          right={<WrenchIcon size={18} className="opacity-50" />}
        >
          <BarList items={toolItems} colorful emptyText="No tool calls recorded." />
        </ChartCard>
      </div>
    </div>
  );
}
