"use client";

import type { EChartsOption } from "echarts";
import { BarChart, BoxplotChart, LineChart, ScatterChart } from "echarts/charts";
import { GridComponent, MarkLineComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { useEffect, useRef } from "react";

// Register only the pieces we use, which keeps the browser bundle smaller.
echarts.use([BarChart, BoxplotChart, LineChart, ScatterChart, GridComponent, MarkLineComponent, TooltipComponent, SVGRenderer]);

export type ChartClick = { seriesIndex: number; dataIndex: number; name: string };

type Props = {
  option: EChartsOption;
  height: number;
  /** Short description for screen readers; the data itself is in a hidden table. */
  label: string;
  onItemClick?: (event: ChartClick) => void;
};

/** Thin React wrapper around an ECharts instance. */
export function EChart({ option, height, label, onItemClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  // Create the chart once, resize it with its container, dispose on unmount.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = echarts.init(container, null, { renderer: "svg" });
    chartRef.current = chart;
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(container);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !onItemClick) return;
    const handler = (params: unknown) => onItemClick(params as ChartClick);
    chart.on("click", handler);
    return () => {
      chart.off("click", handler);
    };
  }, [onItemClick]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={label}
      style={{ height, cursor: onItemClick ? "pointer" : undefined }}
      className="w-full"
    />
  );
}
