import React from 'react';
import { useTopology } from '@/contexts/TopologyContext';
import { useAuth } from '@/contexts/AuthContext';
import { DeviceIcon, deviceTypeLabel } from '@/components/topology/DeviceIcons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Network, Server, Box, Hexagon, AlertTriangle, ArrowLeft,
  Cpu, HardDrive, Activity, Wifi, WifiOff, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar,
  Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const CHART_COLORS = {
  primary: 'hsl(185, 80%, 50%)',
  network: 'hsl(200, 80%, 55%)',
  endpoint: 'hsl(150, 65%, 50%)',
  container: 'hsl(30, 85%, 55%)',
  kubernetes: 'hsl(220, 75%, 60%)',
  firewall: 'hsl(0, 70%, 55%)',
  success: 'hsl(150, 70%, 45%)',
  destructive: 'hsl(0, 72%, 55%)',
  muted: 'hsl(215, 15%, 50%)',
};

const Dashboard: React.FC = () => {
  const { devices, links } = useTopology();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const totalDevices = devices.length;
  const upDevices = devices.filter(d => d.status === 'up').length;
  const downDevices = totalDevices - upDevices;
  const networkDevices = devices.filter(d => d.category === 'network');
  const endpoints = devices.filter(d => d.category === 'endpoint');
  const containers = devices.filter(d => d.category === 'container');
  const dockerContainers = devices.filter(d => d.type === 'docker');
  const k8sPods = devices.filter(d => d.type === 'kubernetes');
  const alerts = devices.filter(d => d.status === 'down' || d.cpu > 80 || d.memory > 85);
  const upLinks = links.filter(l => l.status === 'up').length;
  const downLinks = links.length - upLinks;

  // CPU/Memory data per device
  const resourceData = devices
    .filter(d => d.category !== 'container')
    .map(d => ({ name: d.hostname.length > 10 ? d.hostname.slice(0, 10) + '…' : d.hostname, cpu: d.cpu, memory: d.memory }));

  // Category breakdown for pie
  const categoryData = [
    { name: 'Network', value: networkDevices.length, color: CHART_COLORS.network },
    { name: 'Endpoints', value: endpoints.length, color: CHART_COLORS.endpoint },
    { name: 'Docker', value: dockerContainers.length, color: CHART_COLORS.container },
    { name: 'K8s Pods', value: k8sPods.length, color: CHART_COLORS.kubernetes },
  ];

  // Simulated traffic over time
  const trafficData = Array.from({ length: 12 }, (_, i) => ({
    time: `${(i * 2).toString().padStart(2, '0')}:00`,
    inbound: Math.floor(Math.random() * 800 + 200),
    outbound: Math.floor(Math.random() * 600 + 100),
  }));

  // Container resource usage
  const containerResourceData = containers.map(c => ({
    name: c.hostname.length > 12 ? c.hostname.slice(0, 12) + '…' : c.hostname,
    cpu: c.cpu,
    memory: c.memory,
    type: c.type,
  }));

  // Link speed distribution
  const speedDist = links.reduce((acc, l) => {
    acc[l.speed] = (acc[l.speed] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const speedData = Object.entries(speedDist).map(([speed, count]) => ({ name: speed, value: count }));

  const avgCpu = Math.round(devices.reduce((s, d) => s + d.cpu, 0) / totalDevices);
  const avgMem = Math.round(devices.reduce((s, d) => s + d.memory, 0) / totalDevices);

  const tooltipStyle = {
    contentStyle: { background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 15%, 18%)', borderRadius: 8, fontSize: 12 },
    labelStyle: { color: 'hsl(200, 20%, 90%)' },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="h-14 glass-panel border-b border-border flex items-center px-4 gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Network className="w-5 h-5 text-primary" />
        <span className="text-sm font-bold tracking-tight">NetScope</span>
        <Separator orientation="vertical" className="h-6" />
        <span className="text-xs text-muted-foreground">Monitoring Dashboard</span>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] h-5">{user?.role}</Badge>
          <span className="text-xs text-muted-foreground">{user?.username}</span>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <KpiCard icon={<Server className="w-4 h-4" />} label="Devices" value={totalDevices} />
          <KpiCard icon={<Wifi className="w-4 h-4 text-success" />} label="Up" value={upDevices} variant="success" />
          <KpiCard icon={<WifiOff className="w-4 h-4 text-destructive" />} label="Down" value={downDevices} variant="destructive" />
          <KpiCard icon={<Activity className="w-4 h-4" />} label="Links" value={links.length} />
          <KpiCard icon={<Box className="w-4 h-4 text-noc-container" />} label="Docker" value={dockerContainers.length} />
          <KpiCard icon={<Hexagon className="w-4 h-4 text-noc-kubernetes" />} label="K8s Pods" value={k8sPods.length} />
          <KpiCard icon={<AlertTriangle className="w-4 h-4 text-warning" />} label="Alerts" value={alerts.length} variant={alerts.length > 0 ? 'warning' : undefined} />
        </div>

        {/* Avg gauges + Category Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="glass-panel border-border">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Average Resource Usage</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3 text-primary" /> CPU</span>
                  <span className="font-mono">{avgCpu}%</span>
                </div>
                <Progress value={avgCpu} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5"><HardDrive className="w-3 h-3 text-accent" /> Memory</span>
                  <span className="font-mono">{avgMem}%</span>
                </div>
                <Progress value={avgMem} className="h-2" />
              </div>
              <Separator />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Links Up: {upLinks}</span>
                <span>Links Down: {downLinks}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Device Categories</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Link Speed Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={speedData}>
                  <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* CPU/Mem per device */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-panel border-border">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">CPU & Memory by Device</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={resourceData} barGap={2}>
                  <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip {...tooltipStyle} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="cpu" name="CPU %" fill={CHART_COLORS.primary} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="memory" name="Memory %" fill={CHART_COLORS.kubernetes} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Network Traffic (Simulated)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.endpoint} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART_COLORS.endpoint} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="inbound" name="Inbound (Mbps)" stroke={CHART_COLORS.primary} fill="url(#inGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="outbound" name="Outbound (Mbps)" stroke={CHART_COLORS.endpoint} fill="url(#outGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Container resources */}
        <Card className="glass-panel border-border">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Container & Pod Resource Usage</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={containerResourceData} barGap={2}>
                <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip {...tooltipStyle} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="cpu" name="CPU %" fill={CHART_COLORS.container} radius={[3, 3, 0, 0]} />
                <Bar dataKey="memory" name="Memory %" fill={CHART_COLORS.kubernetes} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alerts table */}
        {alerts.length > 0 && (
          <Card className="glass-panel border-border">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-warning" /> Active Alerts</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1">
                {alerts.map(d => (
                  <div key={d.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/50 text-xs">
                    <DeviceIcon type={d.type} size={16} />
                    <span className="font-medium flex-1">{d.hostname}</span>
                    <span className="text-muted-foreground font-mono">{d.ipAddress}</span>
                    {d.status === 'down' && <Badge variant="destructive" className="text-[10px] h-5">DOWN</Badge>}
                    {d.cpu > 80 && <Badge className="text-[10px] h-5 bg-warning text-warning-foreground">CPU {d.cpu}%</Badge>}
                    {d.memory > 85 && <Badge className="text-[10px] h-5 bg-warning text-warning-foreground">MEM {d.memory}%</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ icon: React.ReactNode; label: string; value: number; variant?: string }> = ({ icon, label, value, variant }) => (
  <Card className="glass-panel border-border">
    <CardContent className="p-3 flex items-center gap-2.5">
      {icon}
      <div>
        <div className={`text-lg font-bold font-mono ${variant === 'destructive' ? 'text-destructive' : variant === 'success' ? 'text-success' : variant === 'warning' ? 'text-warning' : 'text-foreground'}`}>{value}</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      </div>
    </CardContent>
  </Card>
);

export default Dashboard;
