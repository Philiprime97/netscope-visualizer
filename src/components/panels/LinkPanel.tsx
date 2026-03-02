import React from 'react';
import { useTopology } from '@/contexts/TopologyContext';
import { useAuth } from '@/contexts/AuthContext';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const LinkPanel: React.FC = () => {
  const { devices, links, selectedLinkId, setSelectedLinkId, removeLink, updateLink } = useTopology();
  const { isAdmin } = useAuth();

  const link = links.find(l => l.id === selectedLinkId);
  if (!link) return null;

  const srcDevice = devices.find(d => d.id === link.sourceDeviceId);
  const tgtDevice = devices.find(d => d.id === link.targetDeviceId);
  const srcIf = srcDevice?.interfaces.find(i => i.id === link.sourceInterfaceId);
  const tgtIf = tgtDevice?.interfaces.find(i => i.id === link.targetInterfaceId);

  return (
    <div className="w-[380px] h-full glass-panel border-l border-border overflow-y-auto fade-in-up">
      <div className="p-4 flex items-center justify-between border-b border-border">
        <h2 className="text-sm font-semibold">Link Details</h2>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
              removeLink(link.id);
              toast.success('Link removed');
            }}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedLinkId(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="text-center py-3 rounded-lg bg-secondary/50 font-mono text-sm">
          <span className="text-noc-network">{srcDevice?.hostname}</span>
          <span className="text-muted-foreground"> {srcIf?.name}</span>
          <span className="text-primary mx-2">↔</span>
          <span className="text-noc-network">{tgtDevice?.hostname}</span>
          <span className="text-muted-foreground"> {tgtIf?.name}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground block mb-1">Status</span>
            <Badge variant={link.status === 'up' ? 'default' : 'destructive'} className="text-[10px]">
              {link.status.toUpperCase()}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Speed</span>
            <span className="font-mono">{link.speed}</span>
          </div>
          {link.vlan && (
            <div>
              <span className="text-muted-foreground block mb-1">VLAN</span>
              <span className="font-mono">{link.vlan}</span>
            </div>
          )}
        </div>

        {isAdmin && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Link Type</label>
                <Select value={link.linkType} onValueChange={(v) => updateLink(link.id, { linkType: v as any })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="access">Access</SelectItem>
                    <SelectItem value="trunk">Trunk</SelectItem>
                    <SelectItem value="routed">Routed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Speed</label>
                <Select value={link.speed} onValueChange={(v) => updateLink(link.id, { speed: v as any })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100M">100M</SelectItem>
                    <SelectItem value="1G">1G</SelectItem>
                    <SelectItem value="10G">10G</SelectItem>
                    <SelectItem value="40G">40G</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Status</label>
                <Select value={link.status} onValueChange={(v) => updateLink(link.id, { status: v as any })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="up">Up</SelectItem>
                    <SelectItem value="down">Down</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LinkPanel;
