import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTopology } from '@/contexts/TopologyContext';
import { useAuth } from '@/contexts/AuthContext';
import { DeviceIcon } from '@/components/topology/DeviceIcons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Network, Server, Box, Hexagon, AlertTriangle, ArrowLeft,
  Cpu, HardDrive, Activity, Wifi, WifiOff, TrendingUp, MonitorSmartphone,
  Lock, Unlock, MoreVertical, Trash2, RotateCcw, Plus, BarChart3,
  PieChart as PieChartIcon, LineChart, Table, LayoutGrid,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useLocalMetrics } from '@/hooks/useLocalMetrics';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

/* ─── constants ─── */
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

const LAYOUT_KEY = 'netscope-dashboard-layouts-v2';
const PANELS_KEY = 'netscope-dashboard-panels-v2';

/* ─── panel registry ─── */
interface PanelDef {
  id: string;
  type: string;
  label: string;
  icon: React.ReactNode;
  defaultSize: { w: number; h: number };
}

const PANEL_TYPES: Record<string, { label: string; icon: React.ReactNode; defaultSize: { w: number; h: number } }> = {
  kpi: { label: 'Overview KPIs', icon: <Server className="w-4 h-4" />, defaultSize: { w: 12, h: 2 } },
  local: { label: 'Local Machine', icon: <MonitorSmartphone className="w-4 h-4" />, defaultSize: { w: 3, h: 5 } },
  categories: { label: 'Device Categories', icon: <PieChartIcon className="w-4 h-4" />, defaultSize: { w: 3, h: 5 } },
  avgResources: { label: 'Avg Resources', icon: <Cpu className="w-4 h-4" />, defaultSize: { w: 3, h: 5 } },
  traffic: { label: 'Network Traffic', icon: <TrendingUp className="w-4 h-4" />, defaultSize: { w: 3, h: 5 } },
  cpuHistory: { label: 'CPU History', icon: <LineChart className="w-4 h-4" />, defaultSize: { w: 4, h: 5 } },
  ramHistory: { label: 'RAM History', icon: <HardDrive className="w-4 h-4" />, defaultSize: { w: 4, h: 5 } },
  deviceResources: { label: 'Device Resources', icon: <BarChart3 className="w-4 h-4" />, defaultSize: { w: 4, h: 5 } },
  linkSpeed: { label: 'Link Speed', icon: <Activity className="w-4 h-4" />, defaultSize: { w: 4, h: 5 } },
  containerResources: { label: 'Container Resources', icon: <Box className="w-4 h-4" />, defaultSize: { w: 4, h: 5 } },
  latency: { label: 'Latency & Uptime', icon: <Activity className="w-4 h-4" />, defaultSize: { w: 4, h: 5 } },
  alerts: { label: 'Active Alerts', icon: <AlertTriangle className="w-4 h-4" />, defaultSize: { w: 12, h: 4 } },
};

const DEFAULT_PANEL_IDS = ['kpi', 'local', 'categories', 'avgResources', 'traffic', 'cpuHistory', 'ramHistory', 'deviceResources', 'linkSpeed', 'containerResources', 'latency', 'alerts'];

const buildDefaultLayout = (panelIds: string[], cols: number) => {
  const layout: any[] = [];
  let x = 0, y = 0;
  for (const id of panelIds) {
    const pt = PANEL_TYPES[id];
    if (!pt) continue;
    let w = Math.min(pt.defaultSize.w, cols);
    const h = pt.defaultSize.h;
    if (x + w > cols) { x = 0; y = layout.reduce((max, l) => Math.max(max, l.y + l.h), 0); }
    layout.push({ i: id, x, y, w, h, minW: 2, minH: 2 });
    x += w;
    if (x >= cols) { x = 0; y = layout.reduce((max, l) => Math.max(max, l.y + l.h), 0); }
  }
  return layout;
};

const loadPanels = (): string[] => {
  try {
    const s = localStorage.getItem(PANELS_KEY);
    return s ? JSON.parse(s) : DEFAULT_PANEL_IDS;
  } catch { return DEFAULT_PANEL_IDS; }
};

const loadLayouts = (): Record<string, any[]> => {
  try {
    const s = localStorage.getItem(LAYOUT_KEY);
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
};

const tooltipStyle = {
  contentStyle: { background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 15%, 18%)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: 'hsl(200, 20%, 90%)' },
  itemStyle: { color: 'hsl(200, 20%, 85%)' },
};

/* ─── Dashboard ─── */
const Dashboard: React.FC = () => {
  const { devices, links } = useTopology();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { metrics: localMetrics, trafficHistory, resourceHistory, connected: agentConnected } = useLocalMetrics(5000);
  const [panelIds, setPanelIds] = useState<string[]>(loadPanels);
  const [layouts, setLayouts] = useState<Record<string, any[]>>(loadLayouts);
  const [locked, setLocked] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const bp = getBreakpoint(containerWidth);
  const currentCols = colsMap[bp] || 12;

  const currentLayout = useMemo(() => {
    if (layouts[bp]) {
      // Filter to only panels that exist, and add missing ones
      const existing = layouts[bp].filter((l: any) => panelIds.includes(l.i));
      const missing = panelIds.filter(id => !existing.find((l: any) => l.i === id));
      if (missing.length === 0) return existing;
      const maxY = existing.reduce((m: number, l: any) => Math.max(m, l.y + l.h), 0);
      let x = 0;
      const added = missing.map(id => {
        const pt = PANEL_TYPES[id] || { defaultSize: { w: 4, h: 5 } };
        const w = Math.min(pt.defaultSize.w, currentCols);
        const h = pt.defaultSize.h;
        const item = { i: id, x, y: maxY, w, h, minW: 2, minH: 2 };
        x += w;
        if (x >= currentCols) x = 0;
        return item;
      });
      return [...existing, ...added];
    }
    return buildDefaultLayout(panelIds, currentCols);
  }, [layouts, bp, panelIds, currentCols]);

  const onLayoutChange = useCallback((newLayout: any) => {
    setLayouts(prev => {
      const updated = { ...prev, [bp]: newLayout };
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [bp]);

  const savePanels = (ids: string[]) => {
    setPanelIds(ids);
    localStorage.setItem(PANELS_KEY, JSON.stringify(ids));
  };

  const removePanel = (id: string) => {
    const next = panelIds.filter(p => p !== id);
    savePanels(next);
    // Remove from layouts too
    setLayouts(prev => {
      const updated: Record<string, any[]> = {};
      for (const key of Object.keys(prev)) {
        updated[key] = prev[key].filter((l: any) => l.i !== id);
      }
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const addPanel = (type: string) => {
    if (panelIds.includes(type)) return;
    savePanels([...panelIds, type]);
    setAddDialogOpen(false);
  };

  const resetAll = () => {
    savePanels(DEFAULT_PANEL_IDS);
    setLayouts({});
    localStorage.removeItem(LAYOUT_KEY);
    localStorage.removeItem(PANELS_KEY);
  };

  const availableToAdd = Object.keys(PANEL_TYPES).filter(k => !panelIds.includes(k));

  // Data
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

  /* ─── Panel content renderer ─── */
  const renderPanel = (id: string) => {
    switch (id) {
      case 'kpi':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 p-3">
            <KpiCard icon={<Server className="w-4 h-4" />} label="Devices" value={totalDevices} />
            <KpiCard icon={<Wifi className="w-4 h-4 text-success" />} label="Up" value={upDevices} variant="success" />
            <KpiCard icon={<WifiOff className="w-4 h-4 text-destructive" />} label="Down" value={downDevices} variant="destructive" />
            <KpiCard icon={<Activity className="w-4 h-4" />} label="Links" value={links.length} />
            <KpiCard icon={<Box className="w-4 h-4 text-noc-container" />} label="Docker" value={dockerContainers.length} />
            <KpiCard icon={<Hexagon className="w-4 h-4 text-noc-kubernetes" />} label="K8s Pods" value={k8sPods.length} />
            <KpiCard icon={<AlertTriangle className="w-4 h-4 text-warning" />} label="Alerts" value={alerts.length} variant={alerts.length > 0 ? 'warning' : undefined} />
            <KpiCard icon={<MonitorSmartphone className="w-4 h-4 text-primary" />} label="Host CPU" value={localMetrics?.cpu ?? 0} suffix="%" />
          </div>
        );

      case 'local':
        return (
          <div className="p-3 space-y-3 overflow-auto h-full">
            {agentConnected && localMetrics ? (
              <>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3 text-primary" /> CPU</span>
                    <span className="font-mono font-bold">{localMetrics.cpu}%</span>
                  </div>
                  <Progress value={localMetrics.cpu} className="h-2" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5"><HardDrive className="w-3 h-3 text-accent" /> RAM</span>
                    <span className="font-mono font-bold">{localMetrics.memory}%</span>
                  </div>
                  <Progress value={localMetrics.memory} className="h-2" />
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
              <EmptyState message={agentConnected ? 'Loading...' : 'Agent not connected'} sub="Run: pip install psutil && python agent.py" />
            )}
          </div>
        );

      case 'categories':
        return (
          <div className="p-2 h-full min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} dataKey="value" stroke="none">
                  {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'avgResources':
        return (
          <div className="p-3 space-y-3 overflow-auto h-full">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3 text-primary" /> Avg CPU</span>
                <span className="font-mono">{avgCpu}%</span>
              </div>
              <Progress value={avgCpu} className="h-2" />
            </div>
            <div className="space-y-1.5">
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
        );

      case 'traffic':
        return (
          <div className="p-2 h-full min-h-[120px]">
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
                  <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(value: number) => `${value.toFixed(2)} Mbps`} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="rxMbps" name="Download" stroke={CHART_COLORS.rx} fill="url(#rxGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="txMbps" name="Upload" stroke={CHART_COLORS.tx} fill="url(#txGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message={agentConnected ? 'Collecting traffic data...' : 'Agent offline'} />
            )}
          </div>
        );

      case 'cpuHistory':
        return (
          <div className="p-2 h-full min-h-[120px]">
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
                  <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip {...tooltipStyle} formatter={(value: number) => `${value}%`} />
                  <Area type="monotone" dataKey="cpu" name="CPU %" stroke={CHART_COLORS.primary} fill="url(#cpuGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message={agentConnected ? 'Collecting CPU data...' : 'Agent offline'} />
            )}
          </div>
        );

      case 'ramHistory':
        return (
          <div className="p-2 h-full min-h-[120px]">
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
                  <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip {...tooltipStyle} formatter={(value: number) => `${value}%`} />
                  <Area type="monotone" dataKey="memory" name="RAM %" stroke={CHART_COLORS.kubernetes} fill="url(#memGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message={agentConnected ? 'Collecting RAM data...' : 'Agent offline'} />
            )}
          </div>
        );

      case 'deviceResources':
        return (
          <div className="p-2 h-full min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceData} barGap={2}>
                <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip {...tooltipStyle} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="cpu" name="CPU %" fill={CHART_COLORS.primary} radius={[3, 3, 0, 0]} />
                <Bar dataKey="memory" name="Memory %" fill={CHART_COLORS.kubernetes} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'linkSpeed':
        return (
          <div className="p-2 h-full min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={speedData}>
                <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'containerResources':
        return (
          <div className="p-2 h-full min-h-[120px]">
            {containerResourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={containerResourceData} barGap={2}>
                  <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip {...tooltipStyle} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="cpu" name="CPU %" fill={CHART_COLORS.container} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="memory" name="Memory %" fill={CHART_COLORS.kubernetes} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No containers found" />
            )}
          </div>
        );

      case 'latency':
        return (
          <div className="p-2 space-y-1 overflow-auto h-full">
            {devices.length > 0 ? devices.map(d => (
              <div key={d.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-secondary/50 text-xs">
                <DeviceIcon type={d.type} size={14} />
                <span className="font-medium w-[80px] truncate">{d.hostname}</span>
                <span className="font-mono text-muted-foreground w-[90px] text-[10px]">{d.ipAddress}</span>
                <span className={`font-mono text-[10px] px-1 py-0.5 rounded min-w-[40px] text-center ${
                  d.latency == null ? 'text-muted-foreground' :
                  d.latency < 10 ? 'bg-green-500/15 text-green-400' :
                  d.latency < 50 ? 'bg-yellow-500/15 text-yellow-400' :
                  'bg-red-500/15 text-red-400'
                }`}>
                  {d.latency != null ? `${d.latency}ms` : '—'}
                </span>
                <div className="flex items-center gap-[2px] flex-1">
                  {(d.uptimeHistory || []).slice(-12).map((h, i) => (
                    <div key={i} className={`w-1.5 h-3 rounded-sm ${h.up ? 'bg-green-500/60' : 'bg-red-500/60'}`} title={`${h.time}: ${h.up ? 'UP' : 'DOWN'}`} />
                  ))}
                  {(!d.uptimeHistory || d.uptimeHistory.length === 0) && (
                    <span className="text-[10px] text-muted-foreground">No history</span>
                  )}
                </div>
                <Badge variant={d.status === 'up' ? 'default' : 'destructive'} className="text-[9px] h-4">
                  {d.status.toUpperCase()}
                </Badge>
              </div>
            )) : (
              <EmptyState message="No devices" />
            )}
          </div>
        );

      case 'alerts':
        return (
          <div className="p-2 space-y-1 overflow-auto h-full">
            {alerts.length > 0 ? alerts.map(d => (
              <div key={d.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-secondary/50 text-xs">
                <DeviceIcon type={d.type} size={14} />
                <span className="font-medium flex-1">{d.hostname}</span>
                <span className="text-muted-foreground font-mono text-[10px]">{d.ipAddress}</span>
                {d.status === 'down' && <Badge variant="destructive" className="text-[9px] h-4">DOWN</Badge>}
                {d.cpu > 80 && <Badge className="text-[9px] h-4 bg-warning text-warning-foreground">CPU {d.cpu}%</Badge>}
                {d.memory > 85 && <Badge className="text-[9px] h-4 bg-warning text-warning-foreground">MEM {d.memory}%</Badge>}
              </div>
            )) : (
              <EmptyState message="No active alerts" sub="All systems healthy" />
            )}
          </div>
        );

      default:
        return <EmptyState message="Unknown panel type" />;
    }
  };

  const getPanelMeta = (id: string) => PANEL_TYPES[id] || { label: id, icon: <LayoutGrid className="w-3.5 h-3.5" />, defaultSize: { w: 4, h: 5 } };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="h-12 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3 sticky top-0 z-50">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Network className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold tracking-tight">NetScope</span>
        <Separator orientation="vertical" className="h-5" />
        <span className="text-xs text-muted-foreground hidden sm:inline">Dashboard</span>
        <div className="flex items-center gap-1.5 ml-2">
          <div className={`w-1.5 h-1.5 rounded-full ${agentConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-[10px] text-muted-foreground hidden md:inline">{agentConnected ? 'Agent connected' : 'Agent offline'}</span>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1">
                <Plus className="w-3 h-3" /> Add Panel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-sm">Add Panel</DialogTitle>
              </DialogHeader>
              {availableToAdd.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableToAdd.map(type => {
                    const pt = PANEL_TYPES[type];
                    return (
                      <Button
                        key={type}
                        variant="outline"
                        className="h-auto py-3 px-3 flex flex-col items-center gap-1.5 text-xs hover:bg-accent"
                        onClick={() => addPanel(type)}
                      >
                        {pt.icon}
                        <span>{pt.label}</span>
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">All panels are already added.</p>
              )}
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setLocked(l => !l)}>
            {locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            <span className="hidden sm:inline">{locked ? 'Locked' : 'Unlocked'}</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={resetAll}>
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline ml-1">Reset</span>
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <Badge variant="outline" className="text-[10px] h-5">{user?.role}</Badge>
          <span className="text-xs text-muted-foreground hidden md:inline">{user?.username}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="p-3 md:p-4 w-full" ref={containerRef}>
        {panelIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <LayoutGrid className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm">No panels added yet</p>
            <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-3 h-3" /> Add your first panel
            </Button>
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={currentLayout}
            cols={currentCols}
            width={containerWidth}
            rowHeight={28}
            onLayoutChange={onLayoutChange}
            isDraggable={!locked}
            isResizable={!locked}
            draggableHandle=".drag-handle"
            compactType="vertical"
            margin={[8, 8]}
            
          >
            {panelIds.map(id => {
              const meta = getPanelMeta(id);
              return (
                <div key={id} className="h-full">
                  <PanelWrapper
                    title={meta.label}
                    icon={meta.icon}
                    live={['local', 'traffic', 'cpuHistory', 'ramHistory'].includes(id) ? agentConnected : undefined}
                    locked={locked}
                    onRemove={() => removePanel(id)}
                  >
                    {renderPanel(id)}
                  </PanelWrapper>
                </div>
              );
            })}
          </GridLayout>
        )}
      </div>
    </div>
  );
};

/* ─── Sub-components ─── */
const PanelWrapper: React.FC<{
  title: string;
  icon: React.ReactNode;
  live?: boolean;
  locked: boolean;
  onRemove: () => void;
  children: React.ReactNode;
}> = ({ title, icon, live, locked, onRemove, children }) => (
  <Card className="border border-border bg-card/90 backdrop-blur-sm h-full flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
    <CardHeader className="p-0 shrink-0">
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/50">
        <div className={`flex items-center gap-1.5 flex-1 min-w-0 ${!locked ? 'drag-handle cursor-grab active:cursor-grabbing' : ''}`}>
          <span className="text-muted-foreground shrink-0">{icon}</span>
          <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">
            {title}
          </CardTitle>
          {live && <Badge variant="outline" className="text-[8px] h-3.5 ml-1 bg-green-500/10 text-green-400 border-green-500/30 shrink-0">LIVE</Badge>}
        </div>
        {!locked && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-muted-foreground hover:text-foreground">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuLabel className="text-[10px]">Panel Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive" onClick={onRemove}>
                <Trash2 className="w-3 h-3" /> Remove Panel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </CardHeader>
    <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
      {children}
    </CardContent>
  </Card>
);

const EmptyState: React.FC<{ message: string; sub?: string }> = ({ message, sub }) => (
  <div className="flex flex-col items-center justify-center h-full py-4 text-muted-foreground">
    <p className="text-xs">{message}</p>
    {sub && <p className="text-[10px] mt-1 opacity-60">{sub}</p>}
  </div>
);

const KpiCard: React.FC<{ icon: React.ReactNode; label: string; value: number; variant?: string; suffix?: string }> = ({ icon, label, value, variant, suffix }) => (
  <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/50 border border-border/30">
    {icon}
    <div className="min-w-0">
      <div className={`text-base font-bold font-mono leading-tight ${variant === 'destructive' ? 'text-destructive' : variant === 'success' ? 'text-success' : variant === 'warning' ? 'text-warning' : 'text-foreground'}`}>
        {value}{suffix}
      </div>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  </div>
);

export default Dashboard;
