import React, { useState } from 'react';
import { discoverSnmpTopology, SnmpTopologyDevice, SnmpTopologyLink } from '@/services/pingAgent';
import { useTopology } from '@/contexts/TopologyContext';
import { NetworkDevice, NetworkLink, DeviceType, DeviceInterface } from '@/types/network';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Network, Plus, Check, Link2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { DeviceIcon } from '@/components/topology/DeviceIcons';

const SnmpDiscoveryPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { devices, addDevice, addLink } = useTopology();
  const [subnet, setSubnet] = useState('192.168.1.0/24');
  const [community, setCommunity] = useState('public');
  const [discovering, setDiscovering] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<SnmpTopologyDevice[]>([]);
  const [discoveredLinks, setDiscoveredLinks] = useState<SnmpTopologyLink[]>([]);
  const [addedDevices, setAddedDevices] = useState<Set<string>>(new Set());
  const [mappedLinks, setMappedLinks] = useState(false);

  const existingIps = new Set(devices.map(d => d.ipAddress));

  const handleDiscover = async () => {
    if (!community.trim()) {
      toast.error('SNMP community string is required');
      return;
    }
    setDiscovering(true);
    setDiscoveredDevices([]);
    setDiscoveredLinks([]);
    setAddedDevices(new Set());
    setMappedLinks(false);
    toast.info(`Discovering topology on ${subnet} via SNMP...`);

    const result = await discoverSnmpTopology(subnet, community);

    if (result.error) {
      toast.error(result.error);
      setDiscovering(false);
      return;
    }

    if (result.devices.length === 0) {
      toast.error('No devices found. Check subnet and community string.');
      setDiscovering(false);
      return;
    }

    setDiscoveredDevices(result.devices);
    setDiscoveredLinks(result.links);
    toast.success(`Found ${result.deviceCount} devices, ${result.linkCount} connections`);
    setDiscovering(false);
  };

  const createDeviceFromSnmp = (dev: SnmpTopologyDevice): NetworkDevice => {
    const type = (['switch', 'router', 'firewall', 'server', 'pc', 'docker', 'kubernetes'].includes(dev.deviceType)
      ? dev.deviceType : 'pc') as DeviceType;
    const category = type === 'switch' || type === 'router' || type === 'firewall' ? 'network' :
                     type === 'docker' || type === 'kubernetes' ? 'container' : 'endpoint';

    const interfaces: DeviceInterface[] = (dev.interfaces || []).map((si, idx) => ({
      id: `${dev.ip.replace(/\./g, '-')}-${si.name.replace(/[\/\s]/g, '-')}-${idx}`,
      name: si.name,
      type: 'ethernet' as const,
      speed: si.speed.includes('10G') ? '10G' as const : si.speed.includes('1G') || si.speed.includes('1000') ? '1G' as const : '100M' as const,
      status: si.operStatus as 'up' | 'down',
      rxBytes: 0,
      txBytes: 0,
      enabled: si.adminStatus === 'up',
    }));

    if (interfaces.length === 0) {
      interfaces.push({
        id: `${dev.ip.replace(/\./g, '-')}-eth0`,
        name: 'eth0',
        type: 'ethernet',
        speed: '1G',
        status: 'up',
        rxBytes: 0,
        txBytes: 0,
        enabled: true,
      });
    }

    return {
      id: `snmp-${dev.ip.replace(/\./g, '-')}`,
      hostname: dev.hostname,
      type,
      category,
      ipAddress: dev.ip,
      os: dev.system?.sysDescr?.substring(0, 80) || dev.description,
      uptime: dev.system?.sysUpTime || '0d 0h',
      cpu: 0,
      memory: 0,
      status: 'up',
      interfaces,
      maxConnections: Math.max(4, interfaces.length),
    };
  };

  const handleAddAllDevices = () => {
    let added = 0;
    const spacing = 180;
    const cols = Math.ceil(Math.sqrt(discoveredDevices.length));

    for (let i = 0; i < discoveredDevices.length; i++) {
      const dev = discoveredDevices[i];
      if (existingIps.has(dev.ip) || addedDevices.has(dev.ip)) continue;
      const device = createDeviceFromSnmp(dev);
      const row = Math.floor(i / cols);
      const col = i % cols;
      addDevice(device, { x: 100 + col * spacing, y: 100 + row * spacing });
      added++;
    }

    setAddedDevices(new Set(discoveredDevices.map(d => d.ip)));
    toast.success(`Added ${added} devices to topology`);
  };

  const handleMapConnections = () => {
    // Build a map of IP -> device ID in topology
    const ipToDeviceId: Record<string, string> = {};
    for (const d of devices) {
      ipToDeviceId[d.ipAddress] = d.id;
    }

    let created = 0;
    for (const link of discoveredLinks) {
      const srcDevId = ipToDeviceId[link.sourceIp];
      const tgtDevId = ipToDeviceId[link.targetIp];
      if (!srcDevId || !tgtDevId) continue;

      const srcDev = devices.find(d => d.id === srcDevId);
      const tgtDev = devices.find(d => d.id === tgtDevId);
      if (!srcDev || !tgtDev) continue;

      // Find matching interfaces by port name
      const srcIface = srcDev.interfaces.find(i =>
        i.name === link.sourcePort || i.name.includes(link.sourcePort)
      ) || srcDev.interfaces.find(i => i.status === 'up' && i.enabled);

      const tgtIface = tgtDev.interfaces.find(i =>
        i.name === link.targetPort || i.name.includes(link.targetPort)
      ) || tgtDev.interfaces.find(i => i.status === 'up' && i.enabled);

      if (!srcIface || !tgtIface) continue;

      const newLink: NetworkLink = {
        id: `snmp-link-${Date.now()}-${created}`,
        sourceDeviceId: srcDevId,
        sourceInterfaceId: srcIface.id,
        targetDeviceId: tgtDevId,
        targetInterfaceId: tgtIface.id,
        speed: '1G',
        linkType: 'trunk',
        status: 'up',
      };
      addLink(newLink);
      created++;
    }

    setMappedLinks(true);
    toast.success(`Created ${created} connections from LLDP/CDP data`);
  };

  const handleAddAndMap = () => {
    handleAddAllDevices();
    // Delay mapping to let devices state update
    setTimeout(() => {
      handleMapConnections();
    }, 100);
  };

  const newDevices = discoveredDevices.filter(d => !existingIps.has(d.ip));
  const snmpDevices = discoveredDevices.filter(d => d.snmpReachable);

  return (
    <div className="w-[440px] h-full border-l border-border bg-background overflow-y-auto fade-in-up">
      <div className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">SNMP Topology Discovery</h2>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>Close</Button>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Subnet (CIDR)</label>
          <Input
            value={subnet}
            onChange={e => setSubnet(e.target.value)}
            placeholder="192.168.1.0/24"
            className="h-8 text-xs font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">SNMP Community String</label>
          <Input
            value={community}
            onChange={e => setCommunity(e.target.value)}
            placeholder="public"
            className="h-8 text-xs font-mono"
          />
        </div>

        <Button size="sm" className="w-full h-8 text-xs gap-1.5" onClick={handleDiscover} disabled={discovering}>
          {discovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Network className="w-3.5 h-3.5" />}
          {discovering ? 'Discovering...' : 'Discover Topology'}
        </Button>

        <p className="text-[10px] text-muted-foreground">
          Uses SNMP + LLDP/CDP to discover devices and how they are connected. Requires <span className="font-mono">pysnmp</span> on the agent.
        </p>

        {/* Results */}
        {discoveredDevices.length > 0 && (
          <div className="space-y-3">
            <Separator />

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">{discoveredDevices.length} devices</Badge>
              <Badge className="text-[10px]">{snmpDevices.length} SNMP</Badge>
              <Badge variant="outline" className="text-[10px] gap-1">
                <Link2 className="w-3 h-3" /> {discoveredLinks.length} links
              </Badge>
              {newDevices.length > 0 && (
                <Badge variant="default" className="text-[10px]">{newDevices.length} new</Badge>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              {!addedDevices.size && newDevices.length > 0 && (
                <Button size="sm" variant="default" className="w-full h-8 text-xs gap-1.5" onClick={handleAddAndMap}>
                  <Plus className="w-3.5 h-3.5" />
                  Add All & Map Connections ({newDevices.length} devices, {discoveredLinks.length} links)
                </Button>
              )}
              {addedDevices.size > 0 && !mappedLinks && discoveredLinks.length > 0 && (
                <Button size="sm" variant="default" className="w-full h-8 text-xs gap-1.5" onClick={handleMapConnections}>
                  <Link2 className="w-3.5 h-3.5" />
                  Map Connections ({discoveredLinks.length} links)
                </Button>
              )}
              {mappedLinks && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  Topology mapped successfully
                </div>
              )}
            </div>

            {/* Discovered links */}
            {discoveredLinks.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Connections (LLDP/CDP)</h3>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {discoveredLinks.map((link, idx) => (
                    <Card key={idx} className="p-2 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold truncate">{link.sourceHostname}</span>
                        <span className="font-mono text-muted-foreground">{link.sourcePort}</span>
                        <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                        <span className="font-mono text-muted-foreground">{link.targetPort}</span>
                        <span className="font-semibold truncate">{link.targetHostname}</span>
                        <Badge variant="outline" className="text-[8px] h-3.5 ml-auto shrink-0">{link.protocol}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Device list */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Devices</h3>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {discoveredDevices.map(dev => {
                  const type = (['switch', 'router', 'firewall', 'server', 'pc'].includes(dev.deviceType)
                    ? dev.deviceType : 'pc') as DeviceType;
                  const neighborCount = dev.neighbors?.length || 0;

                  return (
                    <Card key={dev.ip} className="p-2.5">
                      <div className="flex items-center gap-2">
                        <DeviceIcon type={type} size={16} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold truncate">{dev.hostname}</span>
                            {dev.snmpReachable && <Badge variant="outline" className="text-[8px] h-3.5 border-green-500/30 text-green-400">SNMP</Badge>}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="font-mono">{dev.ip}</span>
                            {dev.vendor && <span>{dev.vendor}</span>}
                            {neighborCount > 0 && <span>{neighborCount} neighbor{neighborCount > 1 ? 's' : ''}</span>}
                          </div>
                        </div>
                        {addedDevices.has(dev.ip) || existingIps.has(dev.ip) ? (
                          <Badge variant="outline" className="text-[10px] gap-1"><Check className="w-3 h-3" /> Added</Badge>
                        ) : null}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnmpDiscoveryPanel;
