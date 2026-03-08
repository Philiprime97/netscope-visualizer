import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SavedTopology } from '@/contexts/TopologyContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, Download, Upload, Trash2, ArrowLeft, FileJson, Clock, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Login from './Login';

const STORAGE_KEY = 'netscope-saved-topologies';

const getTopologies = (): SavedTopology[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
};

const saveTopologies = (list: SavedTopology[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

const TopologiesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [topologies, setTopologies] = useState<SavedTopology[]>(getTopologies);

  useEffect(() => { saveTopologies(topologies); }, [topologies]);

  if (!user) return <Login />;

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as SavedTopology;
        if (!data.devices || !data.links || !data.positions) {
          toast.error('Invalid topology file');
          return;
        }
        const imported: SavedTopology = {
          ...data,
          id: data.id || `topo-${Date.now()}`,
          savedAt: data.savedAt || new Date().toISOString(),
          name: data.name || file.name.replace('.json', ''),
        };
        setTopologies(prev => [...prev, imported]);
        toast.success(`Imported "${imported.name}"`);
      } catch {
        toast.error('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportFile = (topo: SavedTopology) => {
    const blob = new Blob([JSON.stringify(topo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topo.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded');
  };

  const handleRemove = (id: string) => {
    setTopologies(prev => prev.filter(t => t.id !== id));
    toast.success('Topology removed');
  };

  const handleLoad = (topo: SavedTopology) => {
    // Store in sessionStorage so Index page can pick it up
    sessionStorage.setItem('netscope-load-topology', JSON.stringify(topo));
    navigate('/');
    toast.success(`Loading "${topo.name}"`);
  };

  const handleNew = () => {
    const name = prompt('New topology name:', `Topology ${new Date().toLocaleDateString()}`);
    if (!name) return;
    const empty: SavedTopology = {
      id: `topo-${Date.now()}`,
      name,
      savedAt: new Date().toISOString(),
      devices: [],
      links: [],
      positions: {},
    };
    sessionStorage.setItem('netscope-load-topology', JSON.stringify(empty));
    navigate('/');
    toast.success(`Created "${name}" — add devices to get started`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="h-14 border-b border-border flex items-center px-4 gap-3">
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={() => navigate('/')}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>
        <Network className="w-5 h-5 text-primary" />
        <span className="text-sm font-bold tracking-tight">Saved Topologies</span>
        <div className="ml-auto">
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5" />
            Import JSON
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {topologies.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground space-y-3">
            <FileJson className="w-12 h-12 mx-auto opacity-40" />
            <p className="text-sm">No saved topologies yet.</p>
            <p className="text-xs">Save from the topology view or import a JSON file.</p>
          </div>
        ) : (
          topologies.map(topo => (
            <Card key={topo.id} className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{topo.name}</span>
                  <Badge variant="secondary" className="text-[10px] h-5">{topo.devices.length} devices</Badge>
                  <Badge variant="outline" className="text-[10px] h-5">{topo.links.length} links</Badge>
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {new Date(topo.savedAt).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => handleLoad(topo)}>
                  Load
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleExportFile(topo)}>
                  <Download className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemove(topo.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TopologiesPage;
