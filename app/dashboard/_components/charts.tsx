"use client";

// Every chart receives small, already-aggregated data from the server
// (e.g. 7 band counts) — never the raw student rows.
import type { EChartsOption } from "echarts";
import { useMemo } from "react";
import {
  EXPECTED_AGE_RANGE,
  isUnexpectedAge,
  type AgeBandKey,
  type StudentFilters,
} from "@/lib/analytics/definitions";
import { formatAge, formatCount, formatPercent, percentOf } from "@/lib/analytics/format";
import type { AgeFrequency, AgeSummary, BandCount, CumulativePoint } from "@/lib/analytics/stats";
import { axisStyle, baseOption, COLORS } from "./chart-theme";
import { EChart } from "./echart";
import { useFilterNavigation } from "./use-filter-navigation";

function ChartEmpty({ height, message }: { height: number; message: string }) {
  return (
    <div style={{ height }} className="flex items-center justify-center text-sm text-gf-muted">
      {message}
    </div>
  );
}

function DataTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: (string | number)[][] }) {
  // sr-only goes on a wrapper div: tables ignore the 1px size/overflow that
  // sr-only relies on, so a hidden table would still stretch the page.
  return (
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>{headers.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function bandColor(key: AgeBandKey) {
  return key === "unknown" ? COLORS.grey : COLORS.blue;
}

function toggleGroup(filters: StudentFilters, key: AgeBandKey): StudentFilters {
  return { ...filters, group: filters.group === key ? null : key };
}

// ---------------------------------------------------------------------------
// Chart 1: students per age band (vertical histogram). Click a bar to filter.

export function AgeBandChart({ bands, matching, filters }: { bands: BandCount[]; matching: number; filters: StudentFilters }) {
  const { navigate } = useFilterNavigation();
  const option = useMemo<EChartsOption>(
    () => ({
      ...baseOption,
      grid: { left: 48, right: 16, top: 28, bottom: 36 },
      tooltip: {
        ...baseOption.tooltip,
        trigger: "item",
        formatter: (p) => {
          const b = bands[(p as { dataIndex: number }).dataIndex];
          return `<b>${b.label}</b> <span style="color:${COLORS.muted}">(${b.rule})</span><br/>${formatCount(b.count)} students · ${formatPercent(percentOf(b.count, matching))} of matching`;
        },
      },
      xAxis: { ...axisStyle, type: "category", data: bands.map((b) => b.label), splitLine: { show: false } },
      yAxis: { ...axisStyle, type: "value", name: "Students", minInterval: 1 },
      series: [
        {
          type: "bar",
          barMaxWidth: 56,
          label: { show: true, position: "top", color: COLORS.text, fontSize: 11 },
          data: bands.map((b) => ({
            value: b.count,
            itemStyle: {
              color: bandColor(b.key),
              opacity: filters.group && filters.group !== b.key ? 0.35 : 1,
            },
          })),
        },
      ],
    }),
    [bands, matching, filters.group],
  );
  if (matching === 0) return <ChartEmpty height={280} message="No students match the current filters." />;
  return (
    <>
      <EChart
        option={option}
        height={280}
        label={`Bar chart of students per age band, ${bands.length} bands including unknown age`}
        onItemClick={(e) => navigate(toggleGroup(filters, bands[e.dataIndex].key))}
      />
      <DataTable
        caption="Students per age band"
        headers={["Age band", "Rule", "Students", "% of matching"]}
        rows={bands.map((b) => [b.label, b.rule, b.count, formatPercent(percentOf(b.count, matching))])}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Chart 2: students per individual observed age. Click a bar to filter to it.

export function AgeCountChart({ frequency, missing, filters }: { frequency: AgeFrequency[]; missing: number; filters: StudentFilters }) {
  const { navigate } = useFilterNavigation();
  const option = useMemo<EChartsOption>(
    () => ({
      ...baseOption,
      grid: { left: 48, right: 16, top: 28, bottom: 44 },
      tooltip: {
        ...baseOption.tooltip,
        trigger: "item",
        formatter: (p) => {
          const f = frequency[(p as { dataIndex: number }).dataIndex];
          const flag = isUnexpectedAge(f.age)
            ? `<br/><span style="color:${COLORS.amber}">⚠ Outside expected range ${EXPECTED_AGE_RANGE.min}–${EXPECTED_AGE_RANGE.max}</span>`
            : "";
          return `<b>Age ${f.age}</b><br/>${formatCount(f.count)} students${flag}`;
        },
      },
      xAxis: {
        ...axisStyle,
        type: "category",
        name: "Age (years) — observed values only",
        nameLocation: "middle",
        nameGap: 28,
        data: frequency.map((f) => String(f.age)),
        splitLine: { show: false },
      },
      yAxis: { ...axisStyle, type: "value", name: "Students", minInterval: 1 },
      series: [
        {
          type: "bar",
          barMaxWidth: 28,
          data: frequency.map((f) => ({
            value: f.count,
            itemStyle: { color: isUnexpectedAge(f.age) ? COLORS.amber : COLORS.blue },
          })),
        },
      ],
    }),
    [frequency],
  );
  if (frequency.length === 0) {
    return <ChartEmpty height={260} message={missing > 0 ? `All ${formatCount(missing)} matching students have an unknown age.` : "No students match the current filters."} />;
  }
  return (
    <>
      <EChart
        option={option}
        height={260}
        label={`Bar chart of students per observed age, from ${frequency[0].age} to ${frequency.at(-1)!.age}`}
        onItemClick={(e) => {
          const age = frequency[e.dataIndex].age;
          const isSame = filters.minAge === age && filters.maxAge === age;
          navigate({ ...filters, group: null, minAge: isSame ? null : age, maxAge: isSame ? null : age });
        }}
      />
      <DataTable caption="Students per observed age" headers={["Age", "Students"]} rows={frequency.map((f) => [f.age, f.count])} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Chart 3: age groups compared side by side (horizontal bars with shares).

export function AgeGroupComparisonChart({ bands, matching, filters }: { bands: BandCount[]; matching: number; filters: StudentFilters }) {
  const { navigate } = useFilterNavigation();
  const option = useMemo<EChartsOption>(
    () => ({
      ...baseOption,
      grid: { left: 92, right: 96, top: 8, bottom: 28 },
      tooltip: {
        ...baseOption.tooltip,
        trigger: "item",
        formatter: (p) => {
          const b = bands[(p as { dataIndex: number }).dataIndex];
          return `<b>${b.label}</b> (${b.rule})<br/>${formatCount(b.count)} of ${formatCount(matching)} matching students`;
        },
      },
      xAxis: { ...axisStyle, type: "value", name: "Students", minInterval: 1 },
      yAxis: { ...axisStyle, type: "category", inverse: true, data: bands.map((b) => b.label), splitLine: { show: false } },
      series: [
        {
          type: "bar",
          barMaxWidth: 22,
          label: {
            show: true,
            position: "right",
            color: COLORS.text,
            fontSize: 11,
            formatter: (p) => {
              const b = bands[(p as { dataIndex: number }).dataIndex];
              return `${formatCount(b.count)} · ${formatPercent(percentOf(b.count, matching))}`;
            },
          },
          data: bands.map((b) => ({
            value: b.count,
            itemStyle: { color: bandColor(b.key), opacity: filters.group && filters.group !== b.key ? 0.35 : 1 },
          })),
        },
      ],
    }),
    [bands, matching, filters.group],
  );
  if (matching === 0) return <ChartEmpty height={280} message="No students match the current filters." />;
  return (
    <>
      <EChart
        option={option}
        height={280}
        label="Horizontal bar chart comparing student counts across age groups"
        onItemClick={(e) => navigate(toggleGroup(filters, bands[e.dataIndex].key))}
      />
      <DataTable
        caption="Students per age group"
        headers={["Age group", "Students", "Share"]}
        rows={bands.map((b) => [b.label, b.count, formatPercent(percentOf(b.count, matching))])}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Chart 4: box plot of known ages (Tukey whiskers, outliers as points).

export function AgeBoxPlot({ summary }: { summary: AgeSummary | null }) {
  const option = useMemo<EChartsOption>(() => {
    if (!summary) return {};
    const s = summary;
    return {
      ...baseOption,
      grid: { left: 24, right: 24, top: 16, bottom: 44 },
      tooltip: { ...baseOption.tooltip, trigger: "item" },
      xAxis: {
        ...axisStyle,
        type: "value",
        name: "Age (years)",
        nameLocation: "middle",
        nameGap: 28,
      },
      yAxis: { type: "category", data: ["Known ages"], show: false },
      series: [
        {
          type: "boxplot",
          boxWidth: [24, 56],
          itemStyle: { color: "rgba(87,148,242,0.25)", borderColor: COLORS.blue, borderWidth: 1.5 },
          data: [[s.whiskerLow, s.q1, s.median, s.q3, s.whiskerHigh]],
          tooltip: {
            formatter: () =>
              [
                `<b>Known ages (n = ${formatCount(s.n)})</b>`,
                `Upper whisker: ${formatAge(s.whiskerHigh)}`,
                `Q3: ${formatAge(s.q3)}`,
                `Median: ${formatAge(s.median)}`,
                `Q1: ${formatAge(s.q1)}`,
                `Lower whisker: ${formatAge(s.whiskerLow)}`,
              ].join("<br/>"),
          },
        },
        {
          type: "scatter",
          name: "Outliers",
          symbolSize: 9,
          itemStyle: { color: COLORS.amber },
          data: s.outliers.map((o) => [o.age, 0]),
          tooltip: {
            formatter: (p) => {
              const o = s.outliers[(p as { dataIndex: number }).dataIndex];
              return `<b>Outlier: age ${o.age}</b><br/>${formatCount(o.count)} student${o.count === 1 ? "" : "s"}`;
            },
          },
        },
      ],
    };
  }, [summary]);
  if (!summary) return <ChartEmpty height={300} message="No known ages among the matching students." />;
  return (
    <>
      <EChart
        option={option}
        height={300}
        label={`Box plot of known ages: median ${formatAge(summary.median)}, quartiles ${formatAge(summary.q1)} to ${formatAge(summary.q3)}, ${summary.outliers.length} outlier ages`}
      />
      <DataTable
        caption="Box plot values"
        headers={["Statistic", "Age"]}
        rows={[
          ["Lower whisker", summary.whiskerLow],
          ["Q1", summary.q1],
          ["Median", summary.median],
          ["Q3", summary.q3],
          ["Upper whisker", summary.whiskerHigh],
          ...summary.outliers.map((o) => [`Outlier (${o.count} students)`, o.age]),
        ]}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Chart 5: cumulative share of known ages (step line).

export function CumulativeAgeChart({ points, known }: { points: CumulativePoint[]; known: number }) {
  const option = useMemo<EChartsOption>(
    () => ({
      ...baseOption,
      grid: { left: 52, right: 44, top: 20, bottom: 44 },
      tooltip: {
        ...baseOption.tooltip,
        trigger: "axis",
        formatter: (raw) => {
          const p = points[(raw as { dataIndex: number }[])[0].dataIndex];
          return `<b>Age ≤ ${p.age}</b><br/>${formatCount(p.atOrBelow)} of ${formatCount(known)} known ages · ${formatPercent(p.cumulativePct)}`;
        },
      },
      xAxis: { ...axisStyle, type: "value", name: "Age (years)", nameLocation: "middle", nameGap: 28, min: "dataMin", max: "dataMax" },
      yAxis: { ...axisStyle, type: "value", min: 0, max: 100, axisLabel: { ...axisStyle.axisLabel, formatter: "{value}%" } },
      series: [
        {
          type: "line",
          step: "end",
          symbol: "none",
          lineStyle: { color: COLORS.blue, width: 2 },
          areaStyle: { color: "rgba(87,148,242,0.12)" },
          data: points.map((p) => [p.age, p.cumulativePct]),
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: { color: COLORS.grey, type: "dashed" },
            data: [{ yAxis: 50, label: { color: COLORS.muted, fontSize: 11, formatter: "50%" } }],
          },
        },
      ],
    }),
    [points, known],
  );
  if (points.length === 0) return <ChartEmpty height={260} message="No known ages among the matching students." />;
  return (
    <>
      <EChart option={option} height={260} label="Step line chart of the cumulative percentage of students at or below each age" />
      <DataTable
        caption="Cumulative share of known ages"
        headers={["Age", "Students at or below", "Cumulative %"]}
        rows={points.map((p) => [p.age, p.atOrBelow, formatPercent(p.cumulativePct)])}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Chart 6: age completeness (records with vs without an age).

export function CompletenessChart({ known, missing }: { known: number; missing: number }) {
  const total = known + missing;
  const rows = useMemo(
    () => [
      { label: "Has age", count: known, color: COLORS.green },
      { label: "Missing age", count: missing, color: COLORS.amber },
    ],
    [known, missing],
  );
  const option = useMemo<EChartsOption>(
    () => ({
      ...baseOption,
      grid: { left: 92, right: 104, top: 8, bottom: 24 },
      tooltip: {
        ...baseOption.tooltip,
        trigger: "item",
        formatter: (p) => {
          const r = rows[(p as { dataIndex: number }).dataIndex];
          return `<b>${r.label}</b><br/>${formatCount(r.count)} of ${formatCount(total)} records · ${formatPercent(percentOf(r.count, total))}`;
        },
      },
      xAxis: { ...axisStyle, type: "value", minInterval: 1 },
      yAxis: { ...axisStyle, type: "category", inverse: true, data: rows.map((r) => r.label), splitLine: { show: false } },
      series: [
        {
          type: "bar",
          barMaxWidth: 26,
          label: {
            show: true,
            position: "right",
            color: COLORS.text,
            fontSize: 11,
            formatter: (p) => {
              const r = rows[(p as { dataIndex: number }).dataIndex];
              return `${formatCount(r.count)} · ${formatPercent(percentOf(r.count, total))}`;
            },
          },
          data: rows.map((r) => ({ value: r.count, itemStyle: { color: r.color } })),
        },
      ],
    }),
    [rows, total],
  );
  if (total === 0) return <ChartEmpty height={150} message="No records to examine." />;
  return (
    <>
      <EChart option={option} height={150} label={`Bar chart: ${known} records have an age, ${missing} are missing an age, out of ${total}`} />
      <DataTable
        caption="Age completeness"
        headers={["Status", "Records", "Share"]}
        rows={rows.map((r) => [r.label, r.count, formatPercent(percentOf(r.count, total))])}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Chart 7: data quality check results.

type CheckBar = { title: string; severity: "info" | "warning" | "error"; count: number };

const SEVERITY_COLOR = { info: COLORS.blue, warning: COLORS.amber, error: COLORS.red } as const;

export function QualityChecksChart({ checks }: { checks: CheckBar[] }) {
  const option = useMemo<EChartsOption>(
    () => ({
      ...baseOption,
      grid: { left: 24, right: 56, top: 8, bottom: 24, containLabel: true },
      tooltip: {
        ...baseOption.tooltip,
        trigger: "item",
        formatter: (p) => {
          const c = checks[(p as { dataIndex: number }).dataIndex];
          return `<b>${c.title}</b><br/>Severity: ${c.severity}<br/>${formatCount(c.count)} rows`;
        },
      },
      xAxis: { ...axisStyle, type: "value", minInterval: 1, name: "Rows" },
      yAxis: { ...axisStyle, type: "category", inverse: true, data: checks.map((c) => c.title), splitLine: { show: false } },
      series: [
        {
          type: "bar",
          barMaxWidth: 18,
          label: { show: true, position: "right", color: COLORS.text, fontSize: 11 },
          data: checks.map((c) => ({ value: c.count, itemStyle: { color: SEVERITY_COLOR[c.severity] } })),
        },
      ],
    }),
    [checks],
  );
  return (
    <>
      <EChart option={option} height={40 + checks.length * 34} label="Bar chart of rows flagged by each data quality check" />
      <DataTable caption="Rows flagged per check" headers={["Check", "Severity", "Rows"]} rows={checks.map((c) => [c.title, c.severity, c.count])} />
    </>
  );
}
