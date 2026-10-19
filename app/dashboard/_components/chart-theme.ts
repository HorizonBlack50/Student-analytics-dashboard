// Chart colours. They mirror the --color-gf-* tokens in app/globals.css
// (ECharts draws into SVG and needs literal colour values).
export const COLORS = {
  text: "#d8d9e0",
  muted: "#a0a3b1",
  grid: "#2c3038",
  raised: "#22252b",
  blue: "#5794f2",
  green: "#73bf69",
  amber: "#ffb357",
  red: "#f2495c",
  grey: "#7b7f8c",
} as const;

export const baseOption = {
  animation: false,
  backgroundColor: "transparent",
  textStyle: { color: COLORS.text, fontFamily: "inherit" },
  tooltip: {
    backgroundColor: COLORS.raised,
    borderColor: COLORS.grid,
    textStyle: { color: COLORS.text, fontSize: 12 },
    confine: true,
  },
} as const;

export const axisStyle = {
  axisLine: { lineStyle: { color: COLORS.grid } },
  axisTick: { show: false },
  axisLabel: { color: COLORS.muted, fontSize: 11 },
  splitLine: { lineStyle: { color: COLORS.grid, type: "dashed" as const } },
  nameTextStyle: { color: COLORS.muted, fontSize: 11 },
};
