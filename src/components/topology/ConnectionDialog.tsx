import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeviceIcon } from './DeviceIcons';
import { NetworkDevice, NetworkLink, DeviceInterface } from '@/types/network';
import { Badge } from '@/components/ui/badge';

interface ConnectionDialogProps {
  open: boolean;
  onClose: () => void;
  sourceDevice: NetworkDevice;
  targetDevice: NetworkDevice;
  usedSourceIfaceIds: string[];
  usedTargetIfaceIds: string[];
  onConfirm: (srcIfaceId: string, tgtIfaceId: string) => void;
}

const ConnectionDialog: React.FC<ConnectionDialogProps> = ({
  open, onClose, sourceDevice, targetDevice,
  usedSourceIfaceIds, usedTargetIfaceIds, onConfirm,
}) => {
  const availableSrcIfaces = sourceDevice.interfaces.filter(i => !usedSourceIfaceIds.includes(i.id));
  const availableTgtIfaces = targetDevice.interfaces.filter(i => !usedTargetIfaceIds.includes(i.id));

  const [srcIfaceId, setSrcIfaceId] = useState(availableSrcIfaces[0]?.id || '');
  const [tgtIfaceId, setTgtIfaceId] = useState(availableTgtIfaces[0]?.id || '');

  const canConfirm = srcIfaceId && tgtIfaceId;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[440px] glass-panel border-border">
        <DialogHeader>
          <DialogTitle className="text-sm">Create Connection</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Source */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <DeviceIcon type={sourceDevice.type} size={18} />
              <span className="font-semibold">{sourceDevice.hostname}</span>
              <Badge variant="outline" className="text-[10px]">Source</Badge>
            </div>
            <Select value={srcIfaceId} onValueChange={setSrcIfaceId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select source interface" />
              </SelectTrigger>
              <SelectContent>
                {availableSrcIfaces.map(iface => (
                  <SelectItem key={iface.id} value={iface.id}>
                    <span className="font-mono">{iface.name}</span>
                    <span className="text-muted-foreground ml-2">{iface.speed}</span>
                  </SelectItem>
                ))}
                {availableSrcIfaces.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">No available interfaces</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center text-muted-foreground text-lg">↕</div>

          {/* Target */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <DeviceIcon type={targetDevice.type} size={18} />
              <span className="font-semibold">{targetDevice.hostname}</span>
              <Badge variant="outline" className="text-[10px]">Target</Badge>
            </div>
            <Select value={tgtIfaceId} onValueChange={setTgtIfaceId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select target interface" />
              </SelectTrigger>
              <SelectContent>
                {availableTgtIfaces.map(iface => (
                  <SelectItem key={iface.id} value={iface.id}>
                    <span className="font-mono">{iface.name}</span>
                    <span className="text-muted-foreground ml-2">{iface.speed}</span>
                  </SelectItem>
                ))}
                {availableTgtIfaces.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">No available interfaces</div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!canConfirm} onClick={() => {
            onConfirm(srcIfaceId, tgtIfaceId);
            onClose();
          }}>
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionDialog;
