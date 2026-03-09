import React, { memo, useState, useRef, useEffect } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Trash2, ArrowUp, ArrowDown, Sun, Minus, Plus } from 'lucide-react';
import { type CanvasShape, type ShapeType } from '@/contexts/TopologyContext';

interface ShapeNodeData {
  shape: CanvasShape;
  onUpdate: (id: string, updates: Partial<CanvasShape>) => void;
  onRemove: (id: string) => void;
  [key: string]: unknown;
}

const SHAPE_COLORS = [
  'hsl(200, 80%, 55%)',
  'hsl(150, 65%, 50%)',
  'hsl(30, 85%, 55%)',
  'hsl(0, 70%, 55%)',
  'hsl(270, 65%, 60%)',
  'hsl(45, 90%, 55%)',
  'hsl(180, 60%, 45%)',
  'hsl(340, 75%, 55%)',
];

const ShapeNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const { shape, onUpdate, onRemove } = data as ShapeNodeData;
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(shape.label || '');
  const [showControls, setShowControls] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingLabel && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingLabel]);

  useEffect(() => {
    setLabelValue(shape.label || '');
  }, [shape.label]);

  const commitLabel = () => {
    setEditingLabel(false);
    onUpdate(id, { label: labelValue });
  };

  const renderShape = () => {
    const { shapeType, width, height, color, opacity, borderColor, borderWidth } = shape;
    const fill = color;
    const stroke = borderColor || 'hsl(var(--border))';
    const sw = borderWidth ?? 2;

    const commonStyle: React.CSSProperties = {
      opacity,
      transition: 'opacity 0.2s',
    };

    switch (shapeType) {
      case 'rectangle':
        return (
          <div
            style={{
              width, height,
              backgroundColor: fill,
              border: `${sw}px solid ${stroke}`,
              borderRadius: 6,
              ...commonStyle,
            }}
          />
        );
      case 'circle':
        return (
          <div
            style={{
              width: Math.max(width, height),
              height: Math.max(width, height),
              backgroundColor: fill,
              border: `${sw}px solid ${stroke}`,
              borderRadius: '50%',
              ...commonStyle,
            }}
          />
        );
      case 'ellipse':
        return (
          <div
            style={{
              width, height,
              backgroundColor: fill,
              border: `${sw}px solid ${stroke}`,
              borderRadius: '50%',
              ...commonStyle,
            }}
          />
        );
      case 'diamond':
        return (
          <div style={{ width, height, ...commonStyle, position: 'relative' }}>
            <div
              style={{
                width: width * 0.7,
                height: height * 0.7,
                backgroundColor: fill,
                border: `${sw}px solid ${stroke}`,
                transform: 'rotate(45deg)',
                position: 'absolute',
                top: '15%',
                left: '15%',
                borderRadius: 4,
              }}
            />
          </div>
        );
      case 'triangle':
        return (
          <svg width={width} height={height} style={commonStyle}>
            <polygon
              points={`${width / 2},${sw} ${width - sw},${height - sw} ${sw},${height - sw}`}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="group relative cursor-move"
      style={{ zIndex: shape.zIndex }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Shape */}
      {renderShape()}

      {/* Label */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: shape.zIndex + 1 }}
      >
        {editingLabel ? (
          <input
            ref={inputRef}
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault();
                commitLabel();
              }
            }}
            className="pointer-events-auto bg-background/80 backdrop-blur-sm text-foreground text-xs font-mono px-2 py-0.5 rounded border border-border outline-none text-center w-3/4"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="pointer-events-auto text-xs font-semibold text-foreground drop-shadow-md select-none cursor-text px-1"
            onDoubleClick={(e) => { e.stopPropagation(); setEditingLabel(true); }}
          >
            {shape.label || ''}
          </span>
        )}
      </div>

      {/* Selection ring */}
      {selected && (
        <div className="absolute inset-0 border-2 border-primary rounded-md pointer-events-none" style={{ margin: -2 }} />
      )}

      {/* Controls toolbar */}
      {(showControls || selected) && (
        <div
          className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-background/95 backdrop-blur-sm border border-border rounded-md px-1 py-0.5 shadow-lg"
          style={{ zIndex: 999 }}
        >
          {/* Opacity controls */}
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate(id, { opacity: Math.max(0.1, shape.opacity - 0.1) }); }}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Decrease opacity"
          >
            <Sun className="w-3 h-3 opacity-50" />
          </button>
          <span className="text-[9px] text-muted-foreground w-6 text-center">{Math.round(shape.opacity * 100)}%</span>
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate(id, { opacity: Math.min(1, shape.opacity + 0.1) }); }}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Increase opacity"
          >
            <Sun className="w-3 h-3" />
          </button>

          <div className="w-px h-4 bg-border mx-0.5" />

          {/* Z-index controls */}
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate(id, { zIndex: shape.zIndex + 1 }); }}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Bring forward"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate(id, { zIndex: Math.max(-10, shape.zIndex - 1) }); }}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Send backward"
          >
            <ArrowDown className="w-3 h-3" />
          </button>

          <div className="w-px h-4 bg-border mx-0.5" />

          {/* Size controls */}
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate(id, { width: shape.width + 20, height: shape.height + 20 }); }}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Increase size"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate(id, { width: Math.max(40, shape.width - 20), height: Math.max(40, shape.height - 20) }); }}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Decrease size"
          >
            <Minus className="w-3 h-3" />
          </button>

          <div className="w-px h-4 bg-border mx-0.5" />

          {/* Color swatches */}
          <div className="flex items-center gap-px">
            {SHAPE_COLORS.map((c) => (
              <button
                key={c}
                onClick={(e) => { e.stopPropagation(); onUpdate(id, { color: c }); }}
                className="h-4 w-4 rounded-sm border border-border/50 hover:scale-125 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="w-px h-4 bg-border mx-0.5" />

          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(id); }}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
            title="Remove shape"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(ShapeNode);
