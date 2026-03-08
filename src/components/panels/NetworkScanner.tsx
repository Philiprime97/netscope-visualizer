import React, { useState } from 'react';
import { scanSubnet, DiscoveredHost } from '@/services/pingAgent';
import { useTopology } from '@/contexts/TopologyContext';
import { NetworkDevice, DeviceType } from '@/types/network';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Radar, Loader2, Plus, Check, Monitor, Server, Shield, Layers, Hexagon } from 'lucide-react';
import { toast } from 'sonner';
import { DeviceIcon } from '@/components/topology/DeviceIcons';

const NetworkScanner: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { devices, addDevice } = useTopology();
  const [subnet, setSubnet] = useState('192.168.1.0/24');
  const [scanning, setScanning] = useState(false);
  const [hosts, setHosts] = useState<DiscoveredHost[]>([]);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [autoAdd, setAutoAdd] = useState(false);

  const existingIps = new Set(devices.map(d => d.ipAddress));

  const createDevice = (host: DiscoveredHost): NetworkDevice => {
    const type = (['switch', 'router', 'firewall', 'server', 'pc', 'docker', 'kubernetes'].includes(host.deviceType)
      ? host.deviceType : 'pc') as DeviceType;
    const category = type === 'switch' || type === 'router' || type === 'firewall' ? 'network' :
                     type === 'docker' || type === 'kubernetes' ? 'container' : 'endpoint';
    return {
      id: `discovered-${Date.now()}-${host.ip.replace(/\./g, '-')}`,
      hostname: host.hostname,
      type,
      category,
      ipAddress: host.ip,
      os: host.description,
      uptime: '0d 0h',
      cpu: 0,
      memory: 0,
      status: 'up',
      interfaces: [{
        id: `${host.ip.replace(/\./g, '-')}-eth0`,
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
  };

  const handleScan = async () => {
    setScanning(true);
    setHosts([]);
    setAdded(new Set());
    toast.info('Scanning network... This may take a while.');
    const result = await scanSubnet(subnet);

    if (result.alive.length === 0) {
      toast.error('No hosts found. Is the agent running on port 5111?');
      setScanning(false);
      return;
    }

    const discoveredHosts = result.hosts || result.alive.map(ip => ({
      ip,
      hostname: `Host-${ip.split('.').pop()}`,
      deviceType: 'pc',
      description: 'Unknown Device',
      ports: [],
    }));

    setHosts(discoveredHosts);

    if (autoAdd) {
      const newHosts = discoveredHosts.filter(h => !existingIps.has(h.ip));
      for (const host of newHosts) {
        const dev = createDevice(host);
        addDevice(dev, { x: 300 + Math.random() * 400, y: 300 + Math.random() * 400 });
      }
      if (newHosts.length > 0) {
        toast.success(`Found ${discoveredHosts.length} hosts — auto-added ${newHosts.length} new`);
      } else {
        toast.success(`Found ${discoveredHosts.length} hosts — all already in topology`);
      }
    } else {
      toast.success(`Found ${discoveredHosts.length} hosts`);
    }

    setScanning(false);
  };

  const handleAdd = (host: DiscoveredHost) => {
    const dev = createDevice(host);
    addDevice(dev, { x: 300 + Math.random() * 400, y: 300 + Math.random() * 400 });
    setAdded(prev => new Set(prev).add(host.ip));
    toast.success(`Added ${host.hostname} (${host.ip})`);
  };

  const handleAddAll = () => {
    const newHosts = hosts.filter(h => !existingIps.has(h.ip) && !added.has(h.ip));
    for (const host of newHosts) {
      const dev = createDevice(host);
      addDevice(dev, { x: 300 + Math.random() * 400, y: 300 + Math.random() * 400 });
    }
    setAdded(prev => {
      const next = new Set(prev);
      newHosts.forEach(h => next.add(h.ip));
      return next;
    });
    toast.success(`Added ${newHosts.length} devices`);
  };

  const newHosts = hosts.filter(h => !existingIps.has(h.ip));
  const knownHosts = hosts.filter(h => existingIps.has(h.ip));

  return (
    <div className="w-[400px] h-full border-l border-border bg-background overflow-y-auto fade-in-up">
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

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={autoAdd}
              onChange={e => setAutoAdd(e.target.checked)}
              className="rounded border-border"
            />
            Auto-add new devices to topology
          </label>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Requires the Python agent on <span className="font-mono">localhost:5111</span>.
          The agent resolves hostnames, checks ports, and identifies device types.
        </p>

        {hosts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">{hosts.length} hosts</Badge>
              {newHosts.length > 0 && <Badge className="text-[10px]">{newHosts.length} new</Badge>}
              {knownHosts.length > 0 && <Badge variant="outline" className="text-[10px]">{knownHosts.length} known</Badge>}
              {newHosts.filter(h => !added.has(h.ip)).length > 0 && (
                <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 ml-auto" onClick={handleAddAll}>
                  <Plus className="w-3 h-3" /> Add All New
                </Button>
              )}
            </div>

            {/* New Devices */}
            {newHosts.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Discovered Devices</h3>
                {newHosts.map(host => (
                  <HostCard
                    key={host.ip}
                    host={host}
                    isAdded={added.has(host.ip)}
                    onAdd={() => handleAdd(host)}
                  />
                ))}
              </div>
            )}

            {/* Known Devices */}
            {knownHosts.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Already in Topology</h3>
                {knownHosts.map(host => (
                  <HostCard key={host.ip} host={host} isKnown />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const HostCard: React.FC<{
  host: DiscoveredHost;
  isAdded?: boolean;
  isKnown?: boolean;
  onAdd?: () => void;
}> = ({ host, isAdded, isKnown, onAdd }) => {
  const deviceType = (['switch', 'router', 'firewall', 'server', 'pc', 'docker', 'kubernetes'].includes(host.deviceType)
    ? host.deviceType : 'pc') as DeviceType;

  return (
    <Card className="p-2.5 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="shrink-0">
          <DeviceIcon type={deviceType} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold truncate">{host.hostname}</span>
            <Badge variant="outline" className="text-[9px] h-4 shrink-0">{host.description}</Badge>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{host.ip}</span>
        </div>
        <div className="shrink-0">
          {isKnown && (
            <Badge variant="secondary" className="text-[10px]">Exists</Badge>
          )}
          {isAdded && (
            <Badge variant="outline" className="text-[10px] gap-1"><Check className="w-3 h-3" /> Added</Badge>
          )}
          {!isKnown && !isAdded && onAdd && (
            <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={onAdd}>
              <Plus className="w-3 h-3" /> Add
            </Button>
          )}
        </div>
      </div>
      {host.ports && host.ports.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {host.ports.map(p => (
            <Badge key={p.port} variant="secondary" className="text-[9px] h-4 font-mono">
              {p.port}/{p.service}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
};

export default NetworkScanner;
