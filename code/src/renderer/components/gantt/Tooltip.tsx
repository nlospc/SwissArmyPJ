import { useState, useRef, useCallback } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  delay?: number;
}

export function Tooltip({ content, children, delay = 200 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback((e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
    timer.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setVisible(false);
  }, []);

  const move = useCallback((e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <>
      <div onMouseEnter={show} onMouseLeave={hide} onMouseMove={move}>
        {children}
      </div>
      {visible && (
        <div
          className="fixed z-[100] bg-gray-900 text-white text-xs rounded-md px-2 py-1.5 pointer-events-none max-w-[250px] shadow-lg"
          style={{ left: pos.x + 12, top: pos.y + 12 }}
        >
          {content}
        </div>
      )}
    </>
  );
}
