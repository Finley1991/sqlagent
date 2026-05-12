import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ChartConfig } from '../../types';

interface Props {
  config: ChartConfig;
}

export function EChartsRenderer({ config }: Props) {
  const holderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!holderRef.current || config.type === 'table') {
      return;
    }
    const chart = echarts.init(holderRef.current);
    chart.setOption(config as unknown as echarts.EChartsOption, true);
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [config]);

  return <div ref={holderRef} className="h-[420px] w-full" />;
}
