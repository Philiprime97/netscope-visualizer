import React, { useState } from 'react';
import { useTopology } from '@/contexts/TopologyContext';
import { useAuth } from '@/contexts/AuthContext';
import { DeviceIcon, deviceTypeLabel } from '@/components/topology/DeviceIcons';
import { X, Trash2, Terminal, Wifi, WifiOff, Plus, Pencil, Check, Loader2, Activity, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { usePing } from '@/hooks/usePing';
import DeviceAppearance from './DeviceAppearance';

const formatBytes = (b: number) => {
  if (b > 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  if (b > 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  return `${(b / 1e3).toFixed(1)} KB`;
};

const DevicePanel: React.FC = () => {
  const { devices, links, selectedDeviceId, setSelectedDeviceId, removeDevice, removeLink, removeInterface, addInterface, updateDevice, updateInterface } = useTopology();
  const { isAdmin } = useAuth();
  const { results, pinging, ping } = usePing();
  const device = devices.find(d => d.id === selectedDeviceId);
  const [editing, setEditing] = useState(false);
  const [editHostname, setEditHostname] = useState('');
  const [editIp, setEditIp] = useState('');
  const [editOs, setEditOs] = useState('');
  const [editingIfaceId, setEditingIfaceId] = useState<string | null>(null);
  const [editIfaceName, setEditIfaceName] = useState('');
  const [showAppearance, setShowAppearance] = useState(false);

  if (!device) return null;

  const deviceLinks = links.filter(l => l.sourceDeviceId === device.id || l.targetDeviceId === device.id);

  const startEdit = () => {
    setEditing(true);
    setEditHostname(device.hostname);
    setEditIp(device.ipAddress);
    setEditOs(device.containerImage || device.os);
  };

  const saveEdit = () => {
    updateDevice(device.id, {
      hostname: editHostname,
      ipAddress: editIp,
      os: editOs,
      ...(device.containerImage ? { containerImage: editOs } : {}),
    });
    setEditing(false);
    toast.success('Device updated');
  };

  const startIfaceEdit = (ifaceId: string, name: string) => {
    setEditingIfaceId(ifaceId);
    setEditIfaceName(name);
  };

  const saveIfaceEdit = (ifaceId: string) => {
    updateInterface(device.id, ifaceId, { name: editIfaceName });
    setEditingIfaceId(null);
    toast.success('Interface renamed');
  };

  return (
    <div className="w-[380px] h-full glass-panel border-l border-border overflow-y-auto fade-in-up">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <DeviceIcon type={device.type} size={24} customIcon={device.customIcon} customColor={device.customColor} />
          <div>
            {editing ? (
              <Input value={editHostname} onChange={e => setEditHostname(e.target.value)} className="h-7 text-sm font-semibold w-[160px]" />
            ) : (
              <h2 className="text-sm font-semibold">{device.hostname}</h2>
            )}
            <span className="text-xs text-muted-foreground">{deviceTypeLabel[device.type]}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowAppearance(s => !s)} title="Customize appearance">
              <Palette className="w-3.5 h-3.5" />
            </Button>
          )}
          {isAdmin && !editing && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {isAdmin && editing && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-success" onClick={saveEdit}>
              <Check className="w-4 h-4" />
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
              removeDevice(device.id);
              toast.success('Device removed');
            }}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedDeviceId(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Appearance */}
      {showAppearance && isAdmin && (
        <div className="p-4 border-b border-border">
          <DeviceAppearance
            deviceType={device.type}
            currentIcon={device.customIcon}
            currentColor={device.customColor}
            onIconChange={(name) => updateDevice(device.id, { customIcon: name })}
            onColorChange={(color) => updateDevice(device.id, { customColor: color })}
          />
        </div>
      )}

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {editing ? (
            <>
              <div>
                <span className="text-muted-foreground block mb-0.5">IP Address</span>
                <Input value={editIp} onChange={e => setEditIp(e.target.value)} className="h-7 text-xs font-mono" />
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">OS / Image</span>
                <Input value={editOs} onChange={e => setEditOs(e.target.value)} className="h-7 text-xs font-mono" />
              </div>
            </>
          ) : (
            <>
              <InfoRow label="IP Address" value={device.ipAddress} />
              {device.macAddress && <InfoRow label="MAC" value={device.macAddress} />}
              <InfoRow label="OS / Image" value={device.containerImage || device.os} />
            </>
          )}
          <InfoRow label="Uptime" value={device.uptime} />
          <InfoRow label="Status" value={
            isAdmin ? (
              <Select value={device.status} onValueChange={(v) => updateDevice(device.id, { status: v as 'up' | 'down' })}>
                <SelectTrigger className="h-6 w-[70px] text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="up">UP</SelectItem>
                  <SelectItem value="down">DOWN</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant={device.status === 'up' ? 'default' : 'destructive'} className="text-[10px] h-5">
                {device.status.toUpperCase()}
              </Badge>
            )
          } />
        </div>

        <Separator />

        {/* Resource usage */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resources</h3>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">CPU</span>
              <span className="font-mono">{device.cpu}%</span>
            </div>
            <Progress value={device.cpu} className="h-1.5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Memory</span>
              <span className="font-mono">{device.memory}%</span>
            </div>
            <Progress value={device.memory} className="h-1.5" />
          </div>
        </div>

        <Separator />

        {/* Interfaces */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Interfaces ({device.interfaces.length})
            </h3>
            {isAdmin && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                addInterface(device.id, {
                  id: `${device.id}-new-${Date.now()}`,
                  name: `eth${device.interfaces.length}`,
                  type: 'ethernet',
                  speed: '1G',
                  status: 'down',
                  rxBytes: 0,
                  txBytes: 0,
                  enabled: true,
                });
              }}>
                <Plus className="w-3 h-3" />
              </Button>
            )}
          </div>
          <div className="space-y-1">
            {device.interfaces.map(iface => {
              const connectedLink = deviceLinks.find(
                l => l.sourceInterfaceId === iface.id || l.targetInterfaceId === iface.id
              );
              const isEditingThis = editingIfaceId === iface.id;
              return (
                <div key={iface.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-secondary/50 text-xs group">
                  {isAdmin && (
                    <Select value={iface.status} onValueChange={(v) => updateInterface(device.id, iface.id, { status: v as 'up' | 'down' })}>
                      <SelectTrigger className="h-5 w-5 p-0 border-0 bg-transparent [&>svg]:hidden">
                        <div className={`status-dot ${iface.status === 'up' ? 'status-up' : 'status-down'}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="up">Up</SelectItem>
                        <SelectItem value="down">Down</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {!isAdmin && <div className={`status-dot ${iface.status === 'up' ? 'status-up' : 'status-down'}`} />}

                  {isEditingThis ? (
                    <div className="flex items-center gap-1 flex-1">
                      <Input value={editIfaceName} onChange={e => setEditIfaceName(e.target.value)} className="h-5 text-xs font-mono px-1 flex-1" />
                      <button onClick={() => saveIfaceEdit(iface.id)} className="text-success"><Check className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <span className="font-mono font-medium flex-1 cursor-pointer" onDoubleClick={() => isAdmin && startIfaceEdit(iface.id, iface.name)}>
                      {iface.name}
                    </span>
                  )}

                  {isAdmin && (
                    <Select value={iface.speed} onValueChange={(v) => updateInterface(device.id, iface.id, { speed: v as any })}>
                      <SelectTrigger className="h-5 text-[10px] w-[55px] px-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100M">100M</SelectItem>
                        <SelectItem value="1G">1G</SelectItem>
                        <SelectItem value="10G">10G</SelectItem>
                        <SelectItem value="40G">40G</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {!isAdmin && <span className="text-muted-foreground">{iface.speed}</span>}

                  {connectedLink && (
                    <button
                      onClick={() => isAdmin && removeLink(connectedLink.id)}
                      className={`transition-opacity text-destructive ${isAdmin ? 'opacity-0 group-hover:opacity-100' : 'opacity-30'}`}
                      title="Disconnect"
                    >
                      <WifiOff className="w-3 h-3" />
                    </button>
                  )}
                  {!connectedLink && <Wifi className="w-3 h-3 text-muted-foreground/30" />}
                  {isAdmin && (
                    <button
                      onClick={() => removeInterface(device.id, iface.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Traffic */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Traffic</h3>
          {device.interfaces.filter(i => i.status === 'up').map(iface => (
            <div key={iface.id} className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-muted-foreground">{iface.name}</span>
              <span className="text-noc-endpoint">↓{formatBytes(iface.rxBytes)}</span>
              <span className="text-noc-network">↑{formatBytes(iface.txBytes)}</span>
            </div>
          ))}
        </div>

        <Separator />

        {/* Ping */}
        <Button
          variant="outline"
          className="w-full gap-2 text-xs"
          disabled={pinging[device.ipAddress]}
          onClick={async () => {
            const result = await ping(device.ipAddress);
            const now = new Date().toLocaleTimeString();
            const history = [...(device.uptimeHistory || []), { time: now, up: !!result.reachable }].slice(-20);
            if (result.error) {
              toast.error(result.error);
            } else if (result.reachable) {
              const latency = result.output?.match(/time[=<](\d+\.?\d*)/)?.[1];
              toast.success(`${device.ipAddress} is reachable${latency ? ` (${latency}ms)` : ''}`);
              updateDevice(device.id, { status: 'up', latency: latency ? parseFloat(latency) : undefined, uptimeHistory: history });
            } else {
              toast.error(`${device.ipAddress} is unreachable`);
              updateDevice(device.id, { status: 'down', latency: undefined, uptimeHistory: history });
            }
          }}
        >
          {pinging[device.ipAddress] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
          {pinging[device.ipAddress] ? 'Pinging...' : 'Ping Device'}
        </Button>
        {results[device.ipAddress] && (
          <div className={`text-[10px] font-mono p-2 rounded-md ${results[device.ipAddress].reachable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-destructive/10 text-destructive'}`}>
            {results[device.ipAddress].reachable ? '✓ Reachable' : '✗ Unreachable'}
            {results[device.ipAddress].output && (
              <pre className="mt-1 text-[9px] text-muted-foreground whitespace-pre-wrap max-h-20 overflow-y-auto">
                {results[device.ipAddress].output}
              </pre>
            )}
          </div>
        )}

        <Separator />

        {/* Terminal */}
        <Button variant="outline" className="w-full gap-2 text-xs" onClick={() => toast.info('Terminal feature coming soon')}>
          <Terminal className="w-4 h-4" />
          Open Terminal
        </Button>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <span className="text-muted-foreground block mb-0.5">{label}</span>
    <span className="font-mono text-foreground">{typeof value === 'string' ? value : value}</span>
  </div>
);

export default DevicePanel;
