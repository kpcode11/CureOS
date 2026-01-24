import { useEffect, useState } from 'react';

interface ScreenSize {
  width: number;
  height: number;
  lessThan: (breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl') => boolean;
  greaterThan: (breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl') => boolean;
}

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export default function useScreenSize(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    width: 0,
    height: 0,
    lessThan: () => false,
    greaterThan: () => false,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({
        width,
        height,
        lessThan: (breakpoint) => width < BREAKPOINTS[breakpoint],
        greaterThan: (breakpoint) => width > BREAKPOINTS[breakpoint],
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}
