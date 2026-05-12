import { ReactNode } from 'react';
import { usePanelSizes, useStoreActions } from '../../stores/chatStore';
import { ResizableSplit } from './ResizableSplit';

interface ThreeColumnLayoutProps {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}

export function ThreeColumnLayout({ left, center, right }: ThreeColumnLayoutProps) {
  const { left: leftWidth, center: centerWidth, right: rightWidth } = usePanelSizes();
  const { setPanelSizes } = useStoreActions();

  const resizeLeft = (delta: number) => {
    const nextLeft = Math.min(35, Math.max(15, leftWidth + delta));
    const deltaApplied = nextLeft - leftWidth;
    setPanelSizes({ left: nextLeft, center: centerWidth - deltaApplied });
  };

  const resizeRight = (delta: number) => {
    const nextRight = Math.min(40, Math.max(20, rightWidth - delta));
    const deltaApplied = rightWidth - nextRight;
    setPanelSizes({ right: nextRight, center: centerWidth + deltaApplied });
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100">
      <aside className="h-full border-r border-borderSoft" style={{ width: `${leftWidth}%` }}>
        {left}
      </aside>
      <ResizableSplit onResize={resizeLeft} />
      <main className="h-full border-r border-borderSoft" style={{ width: `${centerWidth}%` }}>
        {center}
      </main>
      <ResizableSplit onResize={resizeRight} />
      <aside className="h-full" style={{ width: `${rightWidth}%` }}>
        {right}
      </aside>
    </div>
  );
}
