export const CATEGORY_LABEL: Record<string, string> = {
  REBALANCING: "Rebalancing",
  GRID_TRADING: "Grid trading",
  YIELD_OPTIMIZATION: "Yield optimization",
  HEALTH_FACTOR_MONITORING: "Health factor monitoring",
};

export const CATEGORY_COLOR: Record<string, string> = {
  REBALANCING: "text-rebalancing border-rebalancing/40 bg-rebalancing/10",
  GRID_TRADING: "text-grid border-grid/40 bg-grid/10",
  YIELD_OPTIMIZATION: "text-yield border-yield/40 bg-yield/10",
  HEALTH_FACTOR_MONITORING: "text-health border-health/40 bg-health/10",
};

export const CATEGORIES = Object.keys(CATEGORY_LABEL);
