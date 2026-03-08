import React, { useState, useRef, useCallback } from 'react';
import { useTopology } from '@/contexts/TopologyContext';
import { Textarea } from '@/components/ui/textarea';
import { X, StickyNote, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopologyNotesProps {
  onClose: () => void;
}

const TopologyNotes: React.FC<TopologyNotesProps> = ({ onClose }) => {
  const { notes, setNotes } = useTopology();
  const [pos, setPos] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 280 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      className="fixed w-[320px] z-50 glass-panel border border-border rounded-lg shadow-lg fade-in-up"
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-border cursor-grab active:cursor-grabbing select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <GripHorizontal className="w-3.5 h-3.5" />
          <StickyNote className="w-3.5 h-3.5" />
          Topology Notes
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="p-3">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this topology..."
          className="min-h-[120px] max-h-[300px] resize-y text-xs bg-secondary/30 border-border"
        />
        <p className="text-[10px] text-muted-foreground mt-1.5">Notes are saved with the topology when exported.</p>
      </div>
    </div>
  );
};

export default TopologyNotes;
