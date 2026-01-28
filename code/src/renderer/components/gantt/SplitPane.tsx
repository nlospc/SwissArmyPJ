import { useState, useCallback, useEffect, useRef } from 'react';

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
}

export function SplitPane({ left, right, defaultWidth = 520, minWidth = 300 }: SplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const maxWidth = rect.width - minWidth;
    setLeftWidth(Math.max(minWidth, Math.min(maxWidth, x)));
  }, [isResizing, minWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className="flex overflow-hidden flex-1" data-left-width={leftWidth}>
      <div className="flex-shrink-0 overflow-hidden flex flex-col" style={{ width: leftWidth }}>
        {left}
      </div>
      <div
        className={`flex-shrink-0 relative z-30 cursor-col-resize transition-colors ${
          isResizing ? 'bg-primary' : 'bg-border hover:bg-primary'
        }`}
        style={{ width: 4 }}
        onMouseDown={handleMouseDown}
      />
      <div className="flex-1 relative overflow-hidden flex flex-col min-w-0">
        {right}
      </div>
    </div>
  );
}
