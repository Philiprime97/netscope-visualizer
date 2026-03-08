import React from 'react';
import { useTopology } from '@/contexts/TopologyContext';
import { Textarea } from '@/components/ui/textarea';
import { X, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopologyNotesProps {
  onClose: () => void;
}

const TopologyNotes: React.FC<TopologyNotesProps> = ({ onClose }) => {
  const { notes, setNotes } = useTopology();

  return (
    <div className="absolute bottom-4 right-4 w-[320px] z-20 glass-panel border border-border rounded-lg shadow-lg fade-in-up">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
