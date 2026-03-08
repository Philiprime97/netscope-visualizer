import React, { useState } from 'react';
import { scanSubnet } from '@/services/pingAgent';
import { useTopology } from '@/contexts/TopologyContext';
import { NetworkDevice } from '@/types/network';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Radar, Loader2, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';

const NetworkScanner: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { devices, addDevice } = useTopology();
  const [subnet, setSubnet] = useState('192.168.1.0/24');
  const [scanning, setScanning] = useState(false);
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const existingIps = new Set(devices.map(d => d.ipAddress));

  const handleScan = async () => {
    setScanning(true);
    setDiscovered([]);
    toast.info('Scanning network... This may take a while.');
    const result = await scanSubnet(subnet);
    if (result.alive.length === 0) {
      toast.error('No hosts found. Is the agent running on port 5111?');
    } else {
      const newIps = result.alive.filter(ip => !existingIps.has(ip));
      // Auto-add all new devices
      for (const ip of newIps) {
        const newDevice: NetworkDevice = {
          id: `discovered-${Date.now()}-${ip.replace(/\./g, '-')}`,
          hostname: `Host-${ip.split('.').pop()}`,
          type: 'pc',
          category: 'endpoint',
          ipAddress: ip,
          os: 'Unknown',
          uptime: '0d 0h',
          cpu: 0,
          memory: 0,
          status: 'up',
          interfaces: [{
            id: `${ip.replace(/\./g, '-')}-eth0`,
            name: 'eth0',
            type: 'ethernet',
            speed: '1G',
            status: 'up',
            rxBytes: 0,
            txBytes: 0,
            enabled: true,
          }],
          maxConnections: 4,
        };
        addDevice(newDevice, { x: 300 + Math.random() * 400, y: 300 + Math.random() * 400 });
      }
      if (newIps.length > 0) {
        toast.success(`Found ${result.alive.length} hosts — added ${newIps.length} new devices`);
      } else {
        toast.success(`Found ${result.alive.length} hosts — all already in topology`);
      }
    }
    setDiscovered(result.alive);
    setScanning(false);
  };

  const handleAdd = (ip: string) => {
    const newDevice: NetworkDevice = {
      id: `discovered-${Date.now()}-${ip.replace(/\./g, '-')}`,
      hostname: `Host-${ip.split('.').pop()}`,
      type: 'pc',
      category: 'endpoint',
      ipAddress: ip,
      os: 'Unknown',
      uptime: '0d 0h',
      cpu: 0,
      memory: 0,
      status: 'up',
      interfaces: [{
        id: `${ip.replace(/\./g, '-')}-eth0`,
        name: 'eth0',
        type: 'ethernet',
        speed: '1G',
        status: 'up',
        rxBytes: 0,
        txBytes: 0,
        enabled: true,
      }],
      maxConnections: 4,
    };
    addDevice(newDevice, { x: 300 + Math.random() * 400, y: 300 + Math.random() * 400 });
    setAdded(prev => new Set(prev).add(ip));
    toast.success(`Added ${ip} to topology`);
  };

  const newHosts = discovered.filter(ip => !existingIps.has(ip));
  const knownHosts = discovered.filter(ip => existingIps.has(ip));

  return (
    <div className="w-[380px] h-full border-l border-border bg-background overflow-y-auto fade-in-up">
      <div className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Network Scanner</h2>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>Close</Button>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Subnet (CIDR)</label>
          <div className="flex gap-2">
            <Input
              value={subnet}
              onChange={e => setSubnet(e.target.value)}
              placeholder="192.168.1.0/24"
              className="h-8 text-xs font-mono"
            />
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleScan} disabled={scanning}>
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radar className="w-3.5 h-3.5" />}
              {scanning ? 'Scanning...' : 'Scan'}
            </Button>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Requires the Python agent running on <span className="font-mono">localhost:5111</span>
        </p>

        {discovered.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">{discovered.length} hosts found</Badge>
              {newHosts.length > 0 && <Badge className="text-[10px]">{newHosts.length} new</Badge>}
            </div>

            {newHosts.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Devices</h3>
                {newHosts.map(ip => (
                  <Card key={ip} className="p-2 flex items-center justify-between">
                    <span className="text-xs font-mono">{ip}</span>
                    {added.has(ip) ? (
                      <Badge variant="outline" className="text-[10px] gap-1"><Check className="w-3 h-3" /> Added</Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={() => handleAdd(ip)}>
                        <Plus className="w-3 h-3" /> Add
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {knownHosts.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Already in Topology</h3>
                {knownHosts.map(ip => (
                  <Card key={ip} className="p-2 flex items-center justify-between">
                    <span className="text-xs font-mono">{ip}</span>
                    <Badge variant="secondary" className="text-[10px]">Exists</Badge>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkScanner;
