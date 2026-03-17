import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTopology } from '@/contexts/TopologyContext';
import { useAuth } from '@/contexts/AuthContext';
import { DeviceIcon } from '@/components/topology/DeviceIcons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Network, Server, Box, Hexagon, AlertTriangle, ArrowLeft,
  Cpu, HardDrive, Activity, Wifi, WifiOff, TrendingUp, MonitorSmartphone,
  Lock, Unlock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
  Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useLocalMetrics } from '@/hooks/useLocalMetrics';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const getBreakpoint = (w: number) => w >= 1200 ? 'lg' : w >= 768 ? 'md' : 'sm';
const colsMap: Record<string, number> = { lg: 12, md: 10, sm: 6 };

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
  rx: 'hsl(185, 80%, 50%)',
  tx: 'hsl(280, 70%, 60%)',
};

const formatBytes = (b: number) => {
  if (b > 1e12) return `${(b / 1e12).toFixed(1)} TB`;
  if (b > 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  if (b > 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  return `${(b / 1e3).toFixed(1)} KB`;
};

const STORAGE_KEY = 'netscope-dashboard-layouts';

const defaultLayouts = {
  lg: [
    { i: 'kpi', x: 0, y: 0, w: 12, h: 3, minH: 2, minW: 6 },
    { i: 'local', x: 0, y: 3, w: 3, h: 6, minH: 4, minW: 3 },
    { i: 'categories', x: 3, y: 3, w: 3, h: 6, minH: 4, minW: 3 },
    { i: 'avgResources', x: 6, y: 3, w: 3, h: 6, minH: 4, minW: 3 },
    { i: 'traffic', x: 9, y: 3, w: 3, h: 6, minH: 4, minW: 3 },
    { i: 'cpuHistory', x: 0, y: 9, w: 4, h: 6, minH: 4, minW: 3 },
    { i: 'ramHistory', x: 4, y: 9, w: 4, h: 6, minH: 4, minW: 3 },
    { i: 'deviceResources', x: 8, y: 9, w: 4, h: 6, minH: 4, minW: 3 },
    { i: 'linkSpeed', x: 0, y: 15, w: 4, h: 6, minH: 4, minW: 3 },
    { i: 'containerResources', x: 4, y: 15, w: 4, h: 6, minH: 4, minW: 3 },
    { i: 'latency', x: 8, y: 15, w: 4, h: 6, minH: 4, minW: 3 },
    { i: 'alerts', x: 0, y: 21, w: 12, h: 5, minH: 3, minW: 4 },
  ],
  md: [
    { i: 'kpi', x: 0, y: 0, w: 10, h: 3, minH: 2, minW: 6 },
    { i: 'local', x: 0, y: 3, w: 5, h: 6, minH: 4, minW: 3 },
    { i: 'categories', x: 5, y: 3, w: 5, h: 6, minH: 4, minW: 3 },
    { i: 'avgResources', x: 0, y: 9, w: 5, h: 6, minH: 4, minW: 3 },
    { i: 'traffic', x: 5, y: 9, w: 5, h: 6, minH: 4, minW: 3 },
    { i: 'cpuHistory', x: 0, y: 15, w: 5, h: 6, minH: 4, minW: 3 },
    { i: 'ramHistory', x: 5, y: 15, w: 5, h: 6, minH: 4, minW: 3 },
    { i: 'deviceResources', x: 0, y: 21, w: 5, h: 6, minH: 4, minW: 3 },
    { i: 'linkSpeed', x: 5, y: 21, w: 5, h: 6, minH: 4, minW: 3 },
    { i: 'containerResources', x: 0, y: 27, w: 5, h: 6, minH: 4, minW: 3 },
    { i: 'latency', x: 5, y: 27, w: 5, h: 6, minH: 4, minW: 3 },
    { i: 'alerts', x: 0, y: 33, w: 10, h: 5, minH: 3, minW: 4 },
  ],
  sm: [
    { i: 'kpi', x: 0, y: 0, w: 6, h: 4, minH: 2, minW: 4 },
    { i: 'local', x: 0, y: 4, w: 6, h: 6, minH: 4, minW: 3 },
    { i: 'categories', x: 0, y: 10, w: 6, h: 6, minH: 4, minW: 3 },
    { i: 'avgResources', x: 0, y: 16, w: 6, h: 6, minH: 4, minW: 3 },
    { i: 'traffic', x: 0, y: 22, w: 6, h: 6, minH: 4, minW: 3 },
    { i: 'cpuHistory', x: 0, y: 28, w: 6, h: 6, minH: 4, minW: 3 },
    { i: 'ramHistory', x: 0, y: 34, w: 6, h: 6, minH: 4, minW: 3 },
    { i: 'deviceResources', x: 0, y: 40, w: 6, h: 6, minH: 4, minW: 3 },
    { i: 'linkSpeed', x: 0, y: 46, w: 6, h: 6, minH: 4, minW: 3 },
    { i: 'containerResources', x: 0, y: 52, w: 6, h: 6, minH: 4, minW: 3 },
    { i: 'latency', x: 0, y: 58, w: 6, h: 6, minH: 4, minW: 3 },
    { i: 'alerts', x: 0, y: 64, w: 6, h: 5, minH: 3, minW: 4 },
  ],
};

const loadLayouts = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultLayouts;
  } catch {
    return defaultLayouts;
  }
};

const Dashboard: React.FC = () => {
  const { devices, links } = useTopology();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { metrics: localMetrics, trafficHistory, resourceHistory, connected: agentConnected } = useLocalMetrics(5000);
  const [layouts, setLayouts] = useState(loadLayouts);
  const [locked, setLocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const bp = getBreakpoint(containerWidth);
  const currentLayout = layouts[bp] || layouts.lg || defaultLayouts.lg;
  const currentCols = colsMap[bp] || 12;

  const onLayoutChange = useCallback((newLayout: any) => {
    setLayouts((prev: any) => {
      const updated = { ...prev, [bp]: newLayout };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [bp]);

  const resetLayout = () => {
    setLayouts(defaultLayouts);
    localStorage.removeItem(STORAGE_KEY);
  };

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

  const resourceData = devices
    .filter(d => d.category !== 'container')
    .map(d => ({ name: d.hostname.length > 10 ? d.hostname.slice(0, 10) + '…' : d.hostname, cpu: d.cpu, memory: d.memory }));

  const categoryData = [
    { name: 'Network', value: networkDevices.length, color: CHART_COLORS.network },
    { name: 'Endpoints', value: endpoints.length, color: CHART_COLORS.endpoint },
    { name: 'Docker', value: dockerContainers.length, color: CHART_COLORS.container },
    { name: 'K8s Pods', value: k8sPods.length, color: CHART_COLORS.kubernetes },
  ];

  const containerResourceData = containers.map(c => ({
    name: c.hostname.length > 12 ? c.hostname.slice(0, 12) + '…' : c.hostname,
    cpu: c.cpu, memory: c.memory, type: c.type,
  }));

  const speedDist = links.reduce((acc, l) => { acc[l.speed] = (acc[l.speed] || 0) + 1; return acc; }, {} as Record<string, number>);
  const speedData = Object.entries(speedDist).map(([speed, count]) => ({ name: speed, value: count }));

  const avgCpu = totalDevices ? Math.round(devices.reduce((s, d) => s + d.cpu, 0) / totalDevices) : 0;
  const avgMem = totalDevices ? Math.round(devices.reduce((s, d) => s + d.memory, 0) / totalDevices) : 0;

  const tooltipStyle = {
    contentStyle: { background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 15%, 18%)', borderRadius: 8, fontSize: 12 },
    labelStyle: { color: 'hsl(200, 20%, 90%)' },
    itemStyle: { color: 'hsl(200, 20%, 85%)' },
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
        <div className="flex items-center gap-2 ml-3">
          <div className={`w-2 h-2 rounded-full ${agentConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-[10px] text-muted-foreground">{agentConnected ? 'Agent connected' : 'Agent offline'}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setLocked(l => !l)}>
            {locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            {locked ? 'Locked' : 'Unlocked'}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={resetLayout}>
            Reset Layout
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Badge variant="outline" className="text-[10px] h-5">{user?.role}</Badge>
          <span className="text-xs text-muted-foreground">{user?.username}</span>
        </div>
      </div>

      <div className="p-4 md:p-6 w-full" ref={containerRef}>
        <GridLayout
          className="layout"
          layout={currentLayout}
          cols={currentCols}
          width={containerWidth}
          rowHeight={30}
          onLayoutChange={onLayoutChange}
          isDraggable={!locked}
          isResizable={!locked}
          draggableHandle=".drag-handle"
          compactType="vertical"
          margin={[12, 12]}
        >
          {/* KPI Cards */}
          <div key="kpi" className="h-full">
            <PanelWrapper title="Overview" icon={<Server className="w-3.5 h-3.5" />}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 p-3">
                <KpiCard icon={<Server className="w-4 h-4" />} label="Devices" value={totalDevices} />
                <KpiCard icon={<Wifi className="w-4 h-4 text-success" />} label="Up" value={upDevices} variant="success" />
                <KpiCard icon={<WifiOff className="w-4 h-4 text-destructive" />} label="Down" value={downDevices} variant="destructive" />
                <KpiCard icon={<Activity className="w-4 h-4" />} label="Links" value={links.length} />
                <KpiCard icon={<Box className="w-4 h-4 text-noc-container" />} label="Docker" value={dockerContainers.length} />
                <KpiCard icon={<Hexagon className="w-4 h-4 text-noc-kubernetes" />} label="K8s Pods" value={k8sPods.length} />
                <KpiCard icon={<AlertTriangle className="w-4 h-4 text-warning" />} label="Alerts" value={alerts.length} variant={alerts.length > 0 ? 'warning' : undefined} />
                <KpiCard icon={<MonitorSmartphone className="w-4 h-4 text-primary" />} label="Host CPU" value={localMetrics?.cpu ?? 0} suffix="%" />
              </div>
            </PanelWrapper>
          </div>

          {/* Local Machine */}
          <div key="local" className="h-full">
            <PanelWrapper title="Local Machine (Live)" icon={<MonitorSmartphone className="w-3.5 h-3.5" />}>
              <div className="p-4 space-y-4 overflow-auto h-[calc(100%-2.5rem)]">
                {agentConnected && localMetrics ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3 text-primary" /> CPU</span>
                        <span className="font-mono font-bold">{localMetrics.cpu}%</span>
                      </div>
                      <Progress value={localMetrics.cpu} className="h-2.5" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1.5"><HardDrive className="w-3 h-3 text-accent" /> RAM</span>
                        <span className="font-mono font-bold">{localMetrics.memory}%</span>
                      </div>
                      <Progress value={localMetrics.memory} className="h-2.5" />
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div><span className="text-muted-foreground">RAM Used</span><div className="font-mono text-foreground">{formatBytes(localMetrics.memoryUsed)}</div></div>
                      <div><span className="text-muted-foreground">RAM Total</span><div className="font-mono text-foreground">{formatBytes(localMetrics.memoryTotal)}</div></div>
                      <div><span className="text-muted-foreground">Net Sent</span><div className="font-mono text-foreground">{formatBytes(localMetrics.netBytesSent)}</div></div>
                      <div><span className="text-muted-foreground">Net Recv</span><div className="font-mono text-foreground">{formatBytes(localMetrics.netBytesRecv)}</div></div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    <p>Agent not connected</p>
                    <p className="text-[10px] mt-1">Run: <span className="font-mono">pip install psutil && python agent.py</span></p>
                  </div>
                )}
              </div>
            </PanelWrapper>
          </div>

          {/* Categories */}
          <div key="categories">
            <PanelWrapper title="Device Categories" icon={<Network className="w-3.5 h-3.5" />}>
              <div className="p-4 h-[calc(100%-2.5rem)]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </PanelWrapper>
          </div>

          {/* Avg Resources */}
          <div key="avgResources">
            <PanelWrapper title="Avg Topology Resources" icon={<Cpu className="w-3.5 h-3.5" />}>
              <div className="p-4 space-y-4 overflow-auto h-[calc(100%-2.5rem)]">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3 text-primary" /> Avg CPU</span>
                    <span className="font-mono">{avgCpu}%</span>
                  </div>
                  <Progress value={avgCpu} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5"><HardDrive className="w-3 h-3 text-accent" /> Avg Memory</span>
                    <span className="font-mono">{avgMem}%</span>
                  </div>
                  <Progress value={avgMem} className="h-2" />
                </div>
                <Separator />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Links Up: {upLinks}</span>
                  <span>Links Down: {downLinks}</span>
                </div>
              </div>
            </PanelWrapper>
          </div>

          {/* Network Traffic */}
          <div key="traffic">
            <PanelWrapper title="Network Traffic — Local Machine" icon={<TrendingUp className="w-3.5 h-3.5" />} live={agentConnected}>
              <div className="p-4 h-[calc(100%-2.5rem)]">
                {trafficHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trafficHistory}>
                      <defs>
                        <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.rx} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={CHART_COLORS.rx} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.tx} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={CHART_COLORS.tx} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip {...tooltipStyle} formatter={(value: number) => `${value.toFixed(2)} Mbps`} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="rxMbps" name="Download" stroke={CHART_COLORS.rx} fill="url(#rxGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="txMbps" name="Upload" stroke={CHART_COLORS.tx} fill="url(#txGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                    {agentConnected ? 'Collecting traffic data...' : 'Agent offline'}
                  </div>
                )}
              </div>
            </PanelWrapper>
          </div>

          {/* CPU History */}
          <div key="cpuHistory">
            <PanelWrapper title="CPU Usage — Local Machine" icon={<Cpu className="w-3.5 h-3.5" />} live={agentConnected}>
              <div className="p-4 h-[calc(100%-2.5rem)]">
                {resourceHistory.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={resourceHistory}>
                      <defs>
                        <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip {...tooltipStyle} formatter={(value: number) => `${value}%`} />
                      <Area type="monotone" dataKey="cpu" name="CPU %" stroke={CHART_COLORS.primary} fill="url(#cpuGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                    {agentConnected ? 'Collecting CPU data...' : 'Agent offline'}
                  </div>
                )}
              </div>
            </PanelWrapper>
          </div>

          {/* RAM History */}
          <div key="ramHistory">
            <PanelWrapper title="RAM Usage — Local Machine" icon={<HardDrive className="w-3.5 h-3.5" />} live={agentConnected}>
              <div className="p-4 h-[calc(100%-2.5rem)]">
                {resourceHistory.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={resourceHistory}>
                      <defs>
                        <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.kubernetes} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={CHART_COLORS.kubernetes} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip {...tooltipStyle} formatter={(value: number) => `${value}%`} />
                      <Area type="monotone" dataKey="memory" name="RAM %" stroke={CHART_COLORS.kubernetes} fill="url(#memGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                    {agentConnected ? 'Collecting RAM data...' : 'Agent offline'}
                  </div>
                )}
              </div>
            </PanelWrapper>
          </div>

          {/* Device Resources */}
          <div key="deviceResources">
            <PanelWrapper title="CPU & Memory by Device" icon={<Activity className="w-3.5 h-3.5" />}>
              <div className="p-4 h-[calc(100%-2.5rem)]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourceData} barGap={2}>
                    <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip {...tooltipStyle} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="cpu" name="CPU %" fill={CHART_COLORS.primary} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="memory" name="Memory %" fill={CHART_COLORS.kubernetes} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PanelWrapper>
          </div>

          {/* Link Speed */}
          <div key="linkSpeed">
            <PanelWrapper title="Link Speed Distribution" icon={<Activity className="w-3.5 h-3.5" />}>
              <div className="p-4 h-[calc(100%-2.5rem)]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={speedData}>
                    <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PanelWrapper>
          </div>

          {/* Container Resources */}
          <div key="containerResources">
            <PanelWrapper title="Container & Pod Resources" icon={<Box className="w-3.5 h-3.5" />}>
              <div className="p-4 h-[calc(100%-2.5rem)]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={containerResourceData} barGap={2}>
                    <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip {...tooltipStyle} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="cpu" name="CPU %" fill={CHART_COLORS.container} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="memory" name="Memory %" fill={CHART_COLORS.kubernetes} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PanelWrapper>
          </div>

          {/* Latency & Uptime */}
          <div key="latency">
            <PanelWrapper title="Device Latency & Uptime" icon={<Activity className="w-3.5 h-3.5" />}>
              <div className="p-4 space-y-2 overflow-auto h-[calc(100%-2.5rem)]">
                {devices.map(d => (
                  <div key={d.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/50 text-xs">
                    <DeviceIcon type={d.type} size={16} />
                    <span className="font-medium w-[100px] truncate">{d.hostname}</span>
                    <span className="font-mono text-muted-foreground w-[110px]">{d.ipAddress}</span>
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded min-w-[50px] text-center ${
                      d.latency == null ? 'text-muted-foreground' :
                      d.latency < 10 ? 'bg-green-500/15 text-green-400' :
                      d.latency < 50 ? 'bg-yellow-500/15 text-yellow-400' :
                      'bg-red-500/15 text-red-400'
                    }`}>
                      {d.latency != null ? `${d.latency}ms` : '—'}
                    </span>
                    <div className="flex items-center gap-[2px] flex-1">
                      {(d.uptimeHistory || []).slice(-15).map((h, i) => (
                        <div key={i} className={`w-2 h-4 rounded-sm ${h.up ? 'bg-green-500/60' : 'bg-red-500/60'}`} title={`${h.time}: ${h.up ? 'UP' : 'DOWN'}`} />
                      ))}
                      {(!d.uptimeHistory || d.uptimeHistory.length === 0) && (
                        <span className="text-[10px] text-muted-foreground">No ping history</span>
                      )}
                    </div>
                    <Badge variant={d.status === 'up' ? 'default' : 'destructive'} className="text-[10px] h-5">
                      {d.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </PanelWrapper>
          </div>

          {/* Alerts */}
          <div key="alerts">
            <PanelWrapper title="Active Alerts" icon={<AlertTriangle className="w-3.5 h-3.5 text-warning" />}>
              <div className="p-4 space-y-1 overflow-auto h-[calc(100%-2.5rem)]">
                {alerts.length > 0 ? alerts.map(d => (
                  <div key={d.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/50 text-xs">
                    <DeviceIcon type={d.type} size={16} />
                    <span className="font-medium flex-1">{d.hostname}</span>
                    <span className="text-muted-foreground font-mono">{d.ipAddress}</span>
                    {d.status === 'down' && <Badge variant="destructive" className="text-[10px] h-5">DOWN</Badge>}
                    {d.cpu > 80 && <Badge className="text-[10px] h-5 bg-warning text-warning-foreground">CPU {d.cpu}%</Badge>}
                    {d.memory > 85 && <Badge className="text-[10px] h-5 bg-warning text-warning-foreground">MEM {d.memory}%</Badge>}
                  </div>
                )) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No active alerts</div>
                )}
              </div>
            </PanelWrapper>
          </div>
        </GridLayout>
      </div>
    </div>
  );
};

const PanelWrapper: React.FC<{ title: string; icon: React.ReactNode; live?: boolean; children: React.ReactNode }> = ({ title, icon, live, children }) => (
  <Card className="glass-panel border-border h-full flex flex-col overflow-hidden">
    <CardHeader className="pb-0 pt-2 px-3 shrink-0 drag-handle cursor-grab active:cursor-grabbing">
      <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {icon} {title}
        {live && <Badge variant="outline" className="text-[9px] h-4 ml-1 bg-green-500/10 text-green-400 border-green-500/30">LIVE</Badge>}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0 flex-1 min-h-0">
      {children}
    </CardContent>
  </Card>
);

const KpiCard: React.FC<{ icon: React.ReactNode; label: string; value: number; variant?: string; suffix?: string }> = ({ icon, label, value, variant, suffix }) => (
  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/50">
    {icon}
    <div>
      <div className={`text-lg font-bold font-mono ${variant === 'destructive' ? 'text-destructive' : variant === 'success' ? 'text-success' : variant === 'warning' ? 'text-warning' : 'text-foreground'}`}>
        {value}{suffix}
      </div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  </div>
);

export default Dashboard;
