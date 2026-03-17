declare module 'react-grid-layout' {
  import * as React from 'react';
  
  interface Layout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    static?: boolean;
  }

  interface GridLayoutProps {
    className?: string;
    layout?: Layout[];
    cols?: number;
    width: number;
    rowHeight?: number;
    onLayoutChange?: (layout: Layout[]) => void;
    isDraggable?: boolean;
    isResizable?: boolean;
    draggableHandle?: string;
    compactType?: 'vertical' | 'horizontal' | null;
    margin?: [number, number];
    children?: React.ReactNode;
  }

  const GridLayout: React.FC<GridLayoutProps>;
  export default GridLayout;
}
