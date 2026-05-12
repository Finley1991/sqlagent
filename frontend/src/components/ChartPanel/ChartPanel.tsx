import { useState } from 'react';
import { useCurrentChart, useCurrentSession, useStoreActions } from '../../stores/chatStore';
import { ChartConfig } from '../../types';
import { EChartsRenderer } from './EChartsRenderer';

const chartTypes: ChartConfig['type'][] = ['bar', 'line', 'pie', 'table'];

export function ChartPanel() {
  const session = useCurrentSession();
  const chartConfig = useCurrentChart();
  const { setChartConfig } = useStoreActions();
  const [manualType, setManualType] = useState<ChartConfig['type'] | ''>('');

  if (!session) {
    return <div className="flex h-full items-center justify-center bg-panel text-sm text-slate-400">请选择会话</div>;
  }

  const activeConfig = chartConfig
    ? ({
        ...chartConfig,
        type: manualType || chartConfig.type
      } as ChartConfig)
    : null;

  const renderTable = (config: ChartConfig) => (
    <div className="max-h-[420px] overflow-auto rounded border border-borderSoft">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="bg-slate-800">
          <tr>
            {(config.columns ?? []).map((col) => (
              <th key={col} className="border-b border-borderSoft px-2 py-2">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(config.data ?? []).map((row, idx) => (
            <tr key={idx} className="odd:bg-slate-900 even:bg-slate-800/70">
              {(config.columns ?? []).map((col) => (
                <td key={col} className="px-2 py-1.5">
                  {String(row[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-panel p-4">
      <h2 className="mb-3 text-lg font-semibold">可视化图表展示</h2>
      {!activeConfig ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-borderSoft bg-panelSoft p-4">
          <p className="text-sm text-slate-400">发送问题后将在此显示图表</p>
        </div>
      ) : (
        <div className="flex-1 rounded-lg border border-borderSoft bg-panelSoft p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">会话：{session.title}</span>
            <div className="flex gap-2">
              <select
                className="rounded border border-borderSoft bg-slate-800 px-2 py-1 text-xs"
                value={manualType}
                onChange={(e) => setManualType(e.target.value as ChartConfig['type'] | '')}
              >
                <option value="">自动类型</option>
                {chartTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <button
                className="rounded border border-borderSoft px-2 py-1 text-xs"
                onClick={() => {
                  setManualType('');
                  setChartConfig(session.id, null);
                }}
              >
                清空
              </button>
            </div>
          </div>
          {activeConfig.type === 'table' ? renderTable(activeConfig) : <EChartsRenderer config={activeConfig} />}
        </div>
      )}
      <div className="mt-3 rounded bg-slate-900/80 p-2 text-xs text-slate-400">
        支持类型：bar / line / pie / table，可通过下拉切换进行快速核对。
      </div>
    </div>
  );
}
