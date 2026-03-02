import React from 'react';
import { useTopology } from '@/contexts/TopologyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Network, Server, Box, Hexagon, AlertTriangle, Eye, EyeOff, Sparkles, LogOut, Search, Plus, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeviceType, NetworkDevice } from '@/types/network';
import { toast } from 'sonner';

interface DashboardBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterCategory: string;
  setFilterCategory: (c: string) => void;
}

const DashboardBar: React.FC<DashboardBarProps> = ({ searchQuery, setSearchQuery, filterCategory, setFilterCategory }) => {
  const navigate = useNavigate();
  const { devices, links, showLabels, showAnimations, setShowLabels, setShowAnimations, addDevice } = useTopology();
  const { user, logout, isAdmin } = useAuth();

  const totalDevices = devices.length;
  const upDevices = devices.filter(d => d.status === 'up').length;
  const downDevices = totalDevices - upDevices;
  const containers = devices.filter(d => d.type === 'docker').length;
  const pods = devices.filter(d => d.type === 'kubernetes').length;
  const networkDevices = devices.filter(d => d.category === 'network').length;
  const alerts = devices.filter(d => d.status === 'down' || d.cpu > 80 || d.memory > 85).length;

  const handleAddDevice = (type: DeviceType) => {
    const category = type === 'switch' || type === 'router' || type === 'firewall' ? 'network' :
                     type === 'docker' || type === 'kubernetes' ? 'container' : 'endpoint';
    const newDevice: NetworkDevice = {
      id: `${type}-${Date.now()}`,
      hostname: `New-${type}-${Math.floor(Math.random() * 100)}`,
      type,
      category,
      ipAddress: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      os: 'Unknown',
      uptime: '0d 0h',
      cpu: 0,
      memory: 0,
      status: 'up',
      interfaces: [
        { id: `${type}-${Date.now()}-eth0`, name: 'eth0', type: 'ethernet', speed: '1G', status: 'up', rxBytes: 0, txBytes: 0, enabled: true },
      ],
      maxConnections: 4,
    };
    addDevice(newDevice, { x: 300 + Math.random() * 200, y: 300 + Math.random() * 200 });
    toast.success(`Added ${type}`);
  };

  return (
    <div className="h-14 glass-panel border-b border-border flex items-center px-4 gap-3 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <Network className="w-5 h-5 text-primary" />
        <span className="text-sm font-bold tracking-tight">NetScope</span>
      </div>

      <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={() => navigate('/dashboard')}>
        <BarChart3 className="w-3.5 h-3.5" />
        Dashboard
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Stats */}
      <div className="flex items-center gap-3 text-[11px]">
        <StatBadge icon={<Server className="w-3 h-3" />} label="Devices" value={totalDevices} />
        <StatBadge icon={<Box className="w-3 h-3 text-noc-container" />} label="Docker" value={containers} />
        <StatBadge icon={<Hexagon className="w-3 h-3 text-noc-kubernetes" />} label="Pods" value={pods} />
        <div className="flex items-center gap-1">
          <div className="status-dot status-up" />
          <span className="text-muted-foreground">{upDevices}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="status-dot status-down" />
          <span className="text-muted-foreground">{downDevices}</span>
        </div>
        {alerts > 0 && (
          <Badge variant="destructive" className="text-[10px] h-5 gap-1">
            <AlertTriangle className="w-3 h-3" /> {alerts}
          </Badge>
        )}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Search & Filter */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-8 text-xs pl-8 bg-secondary/50 border-border"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="network">Network</SelectItem>
            <SelectItem value="endpoint">Endpoint</SelectItem>
            <SelectItem value="container">Container</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Toggles */}
      <div className="flex items-center gap-3 text-[11px]">
        <div className="flex items-center gap-1.5">
          {showLabels ? <Eye className="w-3.5 h-3.5 text-muted-foreground" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
          <Switch checked={showLabels} onCheckedChange={setShowLabels} className="scale-75" />
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
          <Switch checked={showAnimations} onCheckedChange={setShowAnimations} className="scale-75" />
        </div>
      </div>

      {/* Add device */}
      {isAdmin && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <Select onValueChange={(v) => handleAddDevice(v as DeviceType)}>
            <SelectTrigger className="h-8 w-[110px] text-xs gap-1">
              <Plus className="w-3 h-3" />
              <SelectValue placeholder="Add Device" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="switch">Switch</SelectItem>
              <SelectItem value="router">Router</SelectItem>
              <SelectItem value="firewall">Firewall</SelectItem>
              <SelectItem value="server">Server</SelectItem>
              <SelectItem value="pc">PC</SelectItem>
              <SelectItem value="docker">Docker</SelectItem>
              <SelectItem value="kubernetes">K8s Pod</SelectItem>
            </SelectContent>
          </Select>
        </>
      )}

      {/* User */}
      <div className="ml-auto flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] h-5">{user?.role}</Badge>
        <span className="text-xs text-muted-foreground">{user?.username}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={logout}>
          <LogOut className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

const StatBadge: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-1 text-muted-foreground">
    {icon}
    <span>{value}</span>
  </div>
);

export default DashboardBar;
