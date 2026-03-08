import React, { useState, useEffect } from 'react';
import { scanSubnet, DiscoveredHost } from '@/services/pingAgent';
import { useTopology } from '@/contexts/TopologyContext';
import { NetworkDevice, DeviceType, DeviceInterface } from '@/types/network';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Radar, Loader2, Plus, Check, ChevronDown, ChevronRight, Info, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { DeviceIcon } from '@/components/topology/DeviceIcons';

const SCANNER_CACHE_KEY = 'netscope-scanner-cache';

interface ScannerCache {
  hosts: DiscoveredHost[];
  subnet: string;
  added: string[];
}

const loadCache = (): ScannerCache | null => {
  try {
    const raw = sessionStorage.getItem(SCANNER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const saveCache = (cache: ScannerCache) => {
  sessionStorage.setItem(SCANNER_CACHE_KEY, JSON.stringify(cache));
};

const NetworkScanner: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { devices, addDevice } = useTopology();
  const cache = loadCache();
  const [subnet, setSubnet] = useState(cache?.subnet || '192.168.1.0/24');
  const [community, setCommunity] = useState('');
  const [scanning, setScanning] = useState(false);
  const [hosts, setHosts] = useState<DiscoveredHost[]>(cache?.hosts || []);
  const [added, setAdded] = useState<Set<string>>(new Set(cache?.added || []));
  const [autoAdd, setAutoAdd] = useState(false);

  const existingIps = new Set(devices.map(d => d.ipAddress));

  const speedToLinkSpeed = (speed: string): '100M' | '1G' | '10G' | '40G' => {
    if (speed.includes('10G') || speed.includes('10000')) return '10G';
    if (speed.includes('40G') || speed.includes('40000')) return '40G';
    if (speed.includes('1G') || speed.includes('1000')) return '1G';
    return '100M';
  };

  const createDevice = (host: DiscoveredHost): NetworkDevice => {
    const type = (['switch', 'router', 'firewall', 'server', 'pc', 'docker', 'kubernetes'].includes(host.deviceType)
      ? host.deviceType : 'pc') as DeviceType;
    const category = type === 'switch' || type === 'router' || type === 'firewall' ? 'network' :
                     type === 'docker' || type === 'kubernetes' ? 'container' : 'endpoint';

    // Build interfaces from SNMP data if available
    let interfaces: DeviceInterface[];
    if (host.snmpInterfaces && host.snmpInterfaces.length > 0) {
      interfaces = host.snmpInterfaces.map((si, idx) => ({
        id: `${host.ip.replace(/\./g, '-')}-${si.name.replace(/[\/\s]/g, '-')}-${idx}`,
        name: si.name,
        type: 'ethernet' as const,
        speed: speedToLinkSpeed(si.speed),
        status: si.operStatus as 'up' | 'down',
        rxBytes: 0,
        txBytes: 0,
        enabled: si.adminStatus === 'up',
      }));
    } else {
      interfaces = [{
        id: `${host.ip.replace(/\./g, '-')}-eth0`,
        name: 'eth0',
        type: 'ethernet',
        speed: '1G',
        status: 'up',
        rxBytes: 0,
        txBytes: 0,
        enabled: true,
      }];
    }

    const osDescription = host.snmp?.sysDescr
      ? host.snmp.sysDescr.substring(0, 80)
      : host.description;

    return {
      id: `discovered-${Date.now()}-${host.ip.replace(/\./g, '-')}`,
      hostname: host.hostname,
      type,
      category,
      ipAddress: host.ip,
      os: osDescription,
      uptime: host.snmp?.sysUpTime || '0d 0h',
      cpu: 0,
      memory: 0,
      status: 'up',
      interfaces,
      maxConnections: Math.max(4, interfaces.length),
    };
  };

  // Persist cache whenever hosts/added/subnet change
  useEffect(() => {
    if (hosts.length > 0) {
      saveCache({ hosts, subnet, added: Array.from(added) });
    }
  }, [hosts, added, subnet]);

  const handleScan = async (rediscover = false) => {
    setScanning(true);
    if (!rediscover) {
      setHosts([]);
      setAdded(new Set());
    }
    toast.info(`${rediscover ? 'Rediscovering' : 'Pinging'} ${subnet}${community ? ' with SNMP' : ''}...`);
    const result = await scanSubnet(subnet, community || undefined);

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

    // Merge with existing hosts on rediscover
    if (rediscover) {
      const existingMap = new Map(hosts.map(h => [h.ip, h]));
      for (const h of discoveredHosts) {
        existingMap.set(h.ip, h); // update existing, add new
      }
      setHosts(Array.from(existingMap.values()));
    } else {
      setHosts(discoveredHosts);
    }

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
      toast.success(`Found ${discoveredHosts.length} hosts${result.snmpEnabled ? ' (SNMP enabled)' : ''}`);
    }

    setScanning(false);
  };

  const handleClearResults = () => {
    setHosts([]);
    setAdded(new Set());
    sessionStorage.removeItem(SCANNER_CACHE_KEY);
    toast.success('Ping results cleared');
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
    <div className="w-[420px] h-full border-l border-border bg-background overflow-y-auto fade-in-up">
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
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleScan()} disabled={scanning}>
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radar className="w-3.5 h-3.5" />}
              {scanning ? 'Pinging...' : 'Ping'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">SNMP Community String (optional)</label>
          <Input
            value={community}
            onChange={e => setCommunity(e.target.value)}
            placeholder="public"
            className="h-8 text-xs font-mono"
          />
          <p className="text-[10px] text-muted-foreground">
            Enables vendor, model, OS, and interface discovery via SNMP v2c. Requires <span className="font-mono">pysnmp</span>.
          </p>
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
          Requires the Python agent on <span className="font-mono">localhost:5111</span>
        </p>

        {hosts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">{hosts.length} hosts</Badge>
              {newHosts.length > 0 && <Badge className="text-[10px]">{newHosts.length} new</Badge>}
              {knownHosts.length > 0 && <Badge variant="outline" className="text-[10px]">{knownHosts.length} known</Badge>}
              {hosts.some(h => h.snmp) && <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">SNMP</Badge>}
              <div className="ml-auto flex items-center gap-1">
                <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={() => handleScan(true)} disabled={scanning}>
                  <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} /> Rediscover
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 text-muted-foreground" onClick={handleClearResults}>
                  <X className="w-3 h-3" /> Clear
                </Button>
                {newHosts.filter(h => !added.has(h.ip)).length > 0 && (
                  <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={handleAddAll}>
                    <Plus className="w-3 h-3" /> Add All New
                  </Button>
                )}
              </div>
            </div>

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
  const [expanded, setExpanded] = useState(false);
  const deviceType = (['switch', 'router', 'firewall', 'server', 'pc', 'docker', 'kubernetes'].includes(host.deviceType)
    ? host.deviceType : 'pc') as DeviceType;

  const hasDetails = host.snmp || (host.snmpInterfaces && host.snmpInterfaces.length > 0);

  return (
    <Card className="p-2.5 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="shrink-0">
          <DeviceIcon type={deviceType} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold truncate">{host.hostname}</span>
            <Badge variant="outline" className="text-[9px] h-4 shrink-0">{host.description}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">{host.ip}</span>
            {host.vendor && (
              <Badge variant="secondary" className="text-[9px] h-4">{host.vendor}{host.model ? ` ${host.model}` : ''}</Badge>
            )}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          {hasDetails && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </Button>
          )}
          {isKnown && <Badge variant="secondary" className="text-[10px]">Exists</Badge>}
          {isAdded && <Badge variant="outline" className="text-[10px] gap-1"><Check className="w-3 h-3" /> Added</Badge>}
          {!isKnown && !isAdded && onAdd && (
            <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={onAdd}>
              <Plus className="w-3 h-3" /> Add
            </Button>
          )}
        </div>
      </div>

      {/* Ports */}
      {host.ports && host.ports.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {host.ports.map(p => (
            <Badge key={p.port} variant="secondary" className="text-[9px] h-4 font-mono">
              {p.port}/{p.service}
            </Badge>
          ))}
        </div>
      )}

      {/* Expanded SNMP details */}
      {expanded && hasDetails && (
        <div className="pt-1.5 border-t border-border space-y-2">
          {host.snmp && (
            <div className="space-y-1 text-[10px]">
              {host.snmp.sysDescr && (
                <div>
                  <span className="text-muted-foreground">OS/Description: </span>
                  <span className="font-mono text-foreground">{host.snmp.sysDescr.substring(0, 120)}</span>
                </div>
              )}
              {host.snmp.sysLocation && (
                <div>
                  <span className="text-muted-foreground">Location: </span>
                  <span className="font-mono text-foreground">{host.snmp.sysLocation}</span>
                </div>
              )}
              {host.snmp.sysContact && (
                <div>
                  <span className="text-muted-foreground">Contact: </span>
                  <span className="font-mono text-foreground">{host.snmp.sysContact}</span>
                </div>
              )}
              {host.snmp.sysUpTime && (
                <div>
                  <span className="text-muted-foreground">Uptime: </span>
                  <span className="font-mono text-foreground">{host.snmp.sysUpTime}</span>
                </div>
              )}
            </div>
          )}

          {host.snmpInterfaces && host.snmpInterfaces.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Interfaces ({host.snmpInterfaces.length})
              </span>
              <div className="max-h-32 overflow-y-auto space-y-0.5">
                {host.snmpInterfaces.map((iface, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-1.5 py-0.5 rounded bg-secondary/40 text-[10px]">
                    <div className={`w-1.5 h-1.5 rounded-full ${iface.operStatus === 'up' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-mono flex-1 truncate">{iface.name}</span>
                    <span className="text-muted-foreground">{iface.speed}</span>
                    <span className={`${iface.operStatus === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                      {iface.operStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default NetworkScanner;
