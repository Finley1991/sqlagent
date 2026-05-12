import { MouseEvent, useRef } from 'react';

interface ResizableSplitProps {
  onResize: (deltaPercent: number) => void;
}

export function ResizableSplit({ onResize }: ResizableSplitProps) {
  const draggingRef = useRef(false);

  const onMouseDown = () => {
    draggingRef.current = true;
  };

  const onMouseUp = () => {
    draggingRef.current = false;
  };

  const onMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!draggingRef.current) {
      return;
    }
    const width = window.innerWidth || 1;
    onResize((event.movementX / width) * 100);
  };

  return (
    <div
      className="w-1 cursor-col-resize bg-borderSoft hover:bg-accent"
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onMouseMove={onMouseMove}
      role="separator"
      aria-orientation="vertical"
      aria-label="resize"
    />
  );
}
