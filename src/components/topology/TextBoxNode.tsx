import React, { memo, useState, useRef, useEffect } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Trash2 } from 'lucide-react';

interface TextBoxNodeData {
  text: string;
  onTextChange: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  [key: string]: unknown;
}

const TextBoxNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const { text, onTextChange, onRemove } = data as TextBoxNodeData;
  const [editing, setEditing] = useState(!text);
  const [value, setValue] = useState(text);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setValue(text);
  }, [text]);

  const commit = () => {
    setEditing(false);
    onTextChange(id, value);
  };

  return (
    <div
      className={`group relative min-w-[80px] max-w-[280px] rounded-md border px-2.5 py-1.5 text-xs font-mono transition-colors
        ${selected ? 'border-primary bg-primary/15 shadow-md' : 'border-border bg-muted/80 backdrop-blur-sm'}
      `}
      onDoubleClick={() => setEditing(true)}
    >
      {editing ? (
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
              e.preventDefault();
              commit();
            }
          }}
          className="w-full min-w-[120px] bg-transparent text-foreground text-xs font-mono resize-none outline-none border-none p-0"
          rows={Math.max(1, value.split('\n').length)}
          style={{ field: 'none' } as any}
        />
      ) : (
        <span className="text-foreground whitespace-pre-wrap break-words select-none">
          {text || 'Double-click to edit'}
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(id); }}
        className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-2.5 h-2.5" />
      </button>
    </div>
  );
};

export default memo(TextBoxNode);
