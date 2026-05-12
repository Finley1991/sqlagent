export function ChartPanel() {
  return (
    <div className="flex h-full flex-col bg-panel p-4">
      <h2 className="mb-3 text-lg font-semibold">可视化图表展示</h2>
      <div className="flex-1 rounded-lg border border-dashed border-borderSoft bg-panelSoft p-4">
        <p className="text-sm text-slate-300">Phase 3：已完成图表区域框架。</p>
        <p className="mt-2 text-xs text-slate-400">Phase 4 将接入 ECharts 实时渲染后端返回的 chart config。</p>
      </div>
    </div>
  );
}
