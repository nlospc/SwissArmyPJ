import { useEffect, useState } from 'react';

export const WORKBENCH_COMPACT_BREAKPOINT = 1366;

function getWindowWidth() {
  if (typeof window === 'undefined') {
    return WORKBENCH_COMPACT_BREAKPOINT;
  }

  return window.innerWidth;
}

export function useWorkbenchLayoutMode(breakpoint = WORKBENCH_COMPACT_BREAKPOINT) {
  const [windowWidth, setWindowWidth] = useState(getWindowWidth);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return {
    windowWidth,
    isCompactWorkbench: windowWidth < breakpoint,
  };
}