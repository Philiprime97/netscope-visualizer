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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Box,
  Cpu,
  HardDrive,
  Hexagon,
  LayoutGrid,
  LineChart,
  Lock,
  MonitorSmartphone,
  MoreVertical,
  Network,
  PieChart as PieChartIcon,
  Plus,
  RotateCcw,
  Server,
  Trash2,
  TrendingUp,
  Unlock,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useLocalMetrics } from '@/hooks/useLocalMetrics';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const getBreakpoint = (width: number) => (width >= 1200 ? 'lg' : width >= 768 ? 'md' : 'sm');
const colsMap: Record<string, number> = { lg: 12, md: 10, sm: 6 };

const CHART_COLORS = {
  primary: 'hsl(185, 80%, 50%)',
  network: 'hsl(200, 80%, 55%)',
  endpoint: 'hsl(150, 65%, 50%)',
  container: 'hsl(30, 85%, 55%)',
  kubernetes: 'hsl(220, 75%, 60%)',
  destructive: 'hsl(0, 72%, 55%)',
  rx: 'hsl(185, 80%, 50%)',
  tx: 'hsl(280, 70%, 60%)',
};

const formatBytes = (bytes: number) => {
  if (bytes > 1e12) return `${(bytes / 1e12).toFixed(1)} TB`;
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(1)} KB`;
};

const LAYOUT_KEY = 'netscope-dashboard-layouts-v3';
const PANELS_KEY = 'netscope-dashboard-panels-v3';
const GRID_ROW_HEIGHT = 14;
const GRID_MARGIN: [number, number] = [8, 8];

const PANEL_TYPES: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    defaultSize: { w: number; h: number };
  }
> = {
  kpi: { label: 'Overview', icon: <Server className="w-4 h-4" />, defaultSize: { w: 12, h: 5 } },
  local: { label: 'Local Machine', icon: <MonitorSmartphone className="w-4 h-4" />, defaultSize: { w: 3, h: 7 } },
  categories: { label: 'Device Categories', icon: <PieChartIcon className="w-4 h-4" />, defaultSize: { w: 3, h: 6 } },
  avgResources: { label: 'Avg Resources', icon: <Cpu className="w-4 h-4" />, defaultSize: { w: 3, h: 6 } },
  traffic: { label: 'Network Traffic', icon: <TrendingUp className="w-4 h-4" />, defaultSize: { w: 3, h: 6 } },
  cpuHistory: { label: 'CPU History', icon: <LineChart className="w-4 h-4" />, defaultSize: { w: 4, h: 6 } },
  ramHistory: { label: 'RAM History', icon: <HardDrive className="w-4 h-4" />, defaultSize: { w: 4, h: 6 } },
  deviceResources: { label: 'Device Resources', icon: <BarChart3 className="w-4 h-4" />, defaultSize: { w: 4, h: 6 } },
  linkSpeed: { label: 'Link Speed', icon: <Activity className="w-4 h-4" />, defaultSize: { w: 4, h: 6 } },
  containerResources: { label: 'Container Resources', icon: <Box className="w-4 h-4" />, defaultSize: { w: 4, h: 6 } },
  latency: { label: 'Latency & Uptime', icon: <Activity className="w-4 h-4" />, defaultSize: { w: 4, h: 7 } },
  alerts: { label: 'Active Alerts', icon: <AlertTriangle className="w-4 h-4" />, defaultSize: { w: 12, h: 6 } },
};

const DEFAULT_PANEL_IDS = [
  'kpi',
  'local',
  'categories',
  'avgResources',
  'traffic',
  'cpuHistory',
  'ramHistory',
  'deviceResources',
  'linkSpeed',
  'containerResources',
  'latency',
  'alerts',
];

const normalizeLayoutItem = (item: any, cols: number) => ({
  i: item.i,
  x: Math.max(0, item.x ?? 0),
  y: Math.max(0, item.y ?? 0),
  w: Math.max(1, Math.min(cols, item.w ?? 1)),
  h: Math.max(1, item.h ?? 1),
});

const buildDefaultLayout = (panelIds: string[], cols: number) => {
  const layout: Array<{ i: string; x: number; y: number; w: number; h: number }> = [];
  let x = 0;
  let y = 0;

  for (const id of panelIds) {
    const panel = PANEL_TYPES[id];
    if (!panel) continue;

    const w = Math.min(panel.defaultSize.w, cols);
    const h = panel.defaultSize.h;

    if (x + w > cols) {
      x = 0;
      y = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
    }

    layout.push({ i: id, x, y, w, h });
    x += w;

    if (x >= cols) {
      x = 0;
      y = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
    }
  }

  return layout;
};

const loadPanels = (): string[] => {
  try {
    const saved = localStorage.getItem(PANELS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_PANEL_IDS;
  } catch {
    return DEFAULT_PANEL_IDS;
  }
};

const loadLayouts = (): Record<string, any[]> => {
  try {
    const saved = localStorage.getItem(LAYOUT_KEY);
    if (!saved) return {};

    const parsed = JSON.parse(saved);
    return {
      lg: Array.isArray(parsed.lg) ? parsed.lg.map((item: any) => normalizeLayoutItem(item, colsMap.lg)) : undefined,
      md: Array.isArray(parsed.md) ? parsed.md.map((item: any) => normalizeLayoutItem(item, colsMap.md)) : undefined,
      sm: Array.isArray(parsed.sm) ? parsed.sm.map((item: any) => normalizeLayoutItem(item, colsMap.sm)) : undefined,
    };
  } catch {
    return {};
  }
};

const tooltipStyle = {
  contentStyle: {
    background: 'hsl(220, 18%, 10%)',
    border: '1px solid hsl(220, 15%, 18%)',
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: 'hsl(200, 20%, 90%)' },
  itemStyle: { color: 'hsl(200, 20%, 85%)' },
};

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
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(element);
    setContainerWidth(element.clientWidth);

    return () => resizeObserver.disconnect();
  }, []);

  const breakpoint = getBreakpoint(containerWidth);
  const currentCols = colsMap[breakpoint] || colsMap.lg;

  const persistPanels = useCallback((next: string[]) => {
    setPanelIds(next);
    localStorage.setItem(PANELS_KEY, JSON.stringify(next));
  }, []);

  const persistLayouts = useCallback((next: Record<string, any[]>) => {
    setLayouts(next);
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(next));
  }, []);

  const currentLayout = useMemo(() => {
    const saved = Array.isArray(layouts[breakpoint])
      ? layouts[breakpoint]
          .filter((item) => panelIds.includes(item.i))
          .map((item) => normalizeLayoutItem(item, currentCols))
      : [];

    const missing = panelIds.filter((id) => !saved.some((item) => item.i === id));
    if (missing.length === 0 && saved.length > 0) return saved;

    if (saved.length === 0) return buildDefaultLayout(panelIds, currentCols);

    let nextX = 0;
    const nextY = saved.reduce((max, item) => Math.max(max, item.y + item.h), 0);

    const additions = missing.map((id) => {
      const panel = PANEL_TYPES[id] ?? { defaultSize: { w: 4, h: 4 } };
      const w = Math.min(panel.defaultSize.w, currentCols);
      const item = { i: id, x: nextX, y: nextY, w, h: panel.defaultSize.h };
      nextX += w;
      if (nextX >= currentCols) nextX = 0;
      return item;
    });

    return [...saved, ...additions];
  }, [breakpoint, currentCols, layouts, panelIds]);

  const onLayoutChange = useCallback(
    (nextLayout: any[]) => {
      const normalized = nextLayout.map((item) => normalizeLayoutItem(item, currentCols));
      persistLayouts({ ...layouts, [breakpoint]: normalized });
    },
    [breakpoint, currentCols, layouts, persistLayouts],
  );

  const addPanel = (type: string) => {
    if (panelIds.includes(type)) return;
    persistPanels([...panelIds, type]);
    setAddDialogOpen(false);
  };

  const removePanel = (id: string) => {
    const nextPanels = panelIds.filter((panelId) => panelId !== id);
    persistPanels(nextPanels);

    const nextLayouts = Object.fromEntries(
      Object.entries(layouts).map(([key, value]) => [key, value.filter((item: any) => item.i !== id)]),
    );

    persistLayouts(nextLayouts);
  };

  const resetPanelSize = (id: string) => {
    const panel = PANEL_TYPES[id];
    if (!panel) return;

    const nextLayouts = { ...layouts };
    const nextLayout = (currentLayout.length > 0 ? currentLayout : buildDefaultLayout(panelIds, currentCols)).map((item) =>
      item.i === id
        ? {
            ...item,
            w: Math.min(panel.defaultSize.w, currentCols),
            h: panel.defaultSize.h,
          }
        : item,
    );

    nextLayouts[breakpoint] = nextLayout.map((item) => normalizeLayoutItem(item, currentCols));
    persistLayouts(nextLayouts);
  };

  const resetAll = () => {
    setPanelIds(DEFAULT_PANEL_IDS);
    setLayouts({});
    localStorage.removeItem(PANELS_KEY);
    localStorage.removeItem(LAYOUT_KEY);
  };

  const availableToAdd = Object.keys(PANEL_TYPES).filter((id) => !panelIds.includes(id));

  const totalDevices = devices.length;
  const upDevices = devices.filter((device) => device.status === 'up').length;
  const downDevices = totalDevices - upDevices;
  const networkDevices = devices.filter((device) => device.category === 'network');
  const endpoints = devices.filter((device) => device.category === 'endpoint');
  const containers = devices.filter((device) => device.category === 'container');
  const dockerContainers = devices.filter((device) => device.type === 'docker');
  const k8sPods = devices.filter((device) => device.type === 'kubernetes');
  const alerts = devices.filter((device) => device.status === 'down' || device.cpu > 80 || device.memory > 85);
  const upLinks = links.filter((link) => link.status === 'up').length;
  const downLinks = links.length - upLinks;
  const avgCpu = totalDevices ? Math.round(devices.reduce((sum, device) => sum + device.cpu, 0) / totalDevices) : 0;
  const avgMem = totalDevices ? Math.round(devices.reduce((sum, device) => sum + device.memory, 0) / totalDevices) : 0;

  const resourceData = devices
    .filter((device) => device.category !== 'container')
    .map((device) => ({
      name: device.hostname.length > 10 ? `${device.hostname.slice(0, 10)}…` : device.hostname,
      cpu: device.cpu,
      memory: device.memory,
    }));

  const categoryData = [
    { name: 'Network', value: networkDevices.length, color: CHART_COLORS.network },
    { name: 'Endpoints', value: endpoints.length, color: CHART_COLORS.endpoint },
    { name: 'Docker', value: dockerContainers.length, color: CHART_COLORS.container },
    { name: 'K8s Pods', value: k8sPods.length, color: CHART_COLORS.kubernetes },
  ];

  const containerResourceData = containers.map((container) => ({
    name: container.hostname.length > 12 ? `${container.hostname.slice(0, 12)}…` : container.hostname,
    cpu: container.cpu,
    memory: container.memory,
  }));

  const speedDistribution = links.reduce((accumulator, link) => {
    accumulator[link.speed] = (accumulator[link.speed] || 0) + 1;
    return accumulator;
  }, {} as Record<string, number>);

  const speedData = Object.entries(speedDistribution).map(([speed, value]) => ({ name: speed, value }));

  const getPanelMeta = (id: string) => PANEL_TYPES[id] ?? { label: id, icon: <LayoutGrid className="w-4 h-4" /> };

  const renderPanel = (id: string) => {
    switch (id) {
      case 'kpi':
        return (
          <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-4 lg:grid-cols-8">
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
          <div className="h-full space-y-3 overflow-auto p-3">
            {agentConnected && localMetrics ? (
              <>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5"><Cpu className="h-3 w-3 text-primary" /> CPU</span>
                    <span className="font-mono font-bold">{localMetrics.cpu}%</span>
                  </div>
                  <Progress value={localMetrics.cpu} className="h-2" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5"><HardDrive className="h-3 w-3 text-accent" /> RAM</span>
                    <span className="font-mono font-bold">{localMetrics.memory}%</span>
                  </div>
                  <Progress value={localMetrics.memory} className="h-2" />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-muted-foreground">RAM Used</span><div className="font-mono">{formatBytes(localMetrics.memoryUsed)}</div></div>
                  <div><span className="text-muted-foreground">RAM Total</span><div className="font-mono">{formatBytes(localMetrics.memoryTotal)}</div></div>
                  <div><span className="text-muted-foreground">Net Sent</span><div className="font-mono">{formatBytes(localMetrics.netBytesSent)}</div></div>
                  <div><span className="text-muted-foreground">Net Recv</span><div className="font-mono">{formatBytes(localMetrics.netBytesRecv)}</div></div>
                </div>
              </>
            ) : (
              <EmptyState message={agentConnected ? 'Loading local metrics...' : 'Agent not connected'} sub="Run: pip install psutil && python agent.py" />
            )}
          </div>
        );

      case 'categories':
        return (
          <div className="h-full p-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={30} outerRadius={58} paddingAngle={4} dataKey="value" stroke="none">
                  {categoryData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'avgResources':
        return (
          <div className="h-full space-y-3 overflow-auto p-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5"><Cpu className="h-3 w-3 text-primary" /> Avg CPU</span>
                <span className="font-mono">{avgCpu}%</span>
              </div>
              <Progress value={avgCpu} className="h-2" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5"><HardDrive className="h-3 w-3 text-accent" /> Avg Memory</span>
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
        return trafficHistory.length > 0 ? (
          <div className="h-full p-2">
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
          </div>
        ) : (
          <EmptyState message={agentConnected ? 'Collecting traffic data...' : 'Agent offline'} />
        );

      case 'cpuHistory':
        return resourceHistory.length > 1 ? (
          <div className="h-full p-2">
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
          </div>
        ) : (
          <EmptyState message={agentConnected ? 'Collecting CPU data...' : 'Agent offline'} />
        );

      case 'ramHistory':
        return resourceHistory.length > 1 ? (
          <div className="h-full p-2">
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
          </div>
        ) : (
          <EmptyState message={agentConnected ? 'Collecting RAM data...' : 'Agent offline'} />
        );

      case 'deviceResources':
        return resourceData.length > 0 ? (
          <div className="h-full p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceData} barGap={2}>
                <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={42} />
                <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip {...tooltipStyle} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="cpu" name="CPU %" fill={CHART_COLORS.primary} radius={[3, 3, 0, 0]} />
                <Bar dataKey="memory" name="Memory %" fill={CHART_COLORS.kubernetes} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState message="No device metrics" />
        );

      case 'linkSpeed':
        return speedData.length > 0 ? (
          <div className="h-full p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={speedData}>
                <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState message="No link data" />
        );

      case 'containerResources':
        return containerResourceData.length > 0 ? (
          <div className="h-full p-2">
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
          </div>
        ) : (
          <EmptyState message="No containers found" />
        );

      case 'latency':
        return devices.length > 0 ? (
          <div className="h-full space-y-1 overflow-auto p-2">
            {devices.map((device) => (
              <div key={device.id} className="flex items-center gap-2 rounded-md border border-border/30 bg-secondary/50 px-2 py-1.5 text-xs">
                <DeviceIcon type={device.type} size={14} />
                <span className="w-[80px] truncate font-medium">{device.hostname}</span>
                <span className="w-[90px] truncate font-mono text-[10px] text-muted-foreground">{device.ipAddress}</span>
                <span
                  className={`min-w-[40px] rounded px-1 py-0.5 text-center font-mono text-[10px] ${
                    device.latency == null
                      ? 'text-muted-foreground'
                      : device.latency < 10
                        ? 'bg-success/15 text-success'
                        : device.latency < 50
                          ? 'bg-warning/15 text-warning'
                          : 'bg-destructive/15 text-destructive'
                  }`}
                >
                  {device.latency != null ? `${device.latency}ms` : '—'}
                </span>
                <div className="flex flex-1 items-center gap-[2px]">
                  {(device.uptimeHistory || []).slice(-12).map((entry, index) => (
                    <div key={index} className={`h-3 w-1.5 rounded-sm ${entry.up ? 'bg-success/60' : 'bg-destructive/60'}`} />
                  ))}
                  {(!device.uptimeHistory || device.uptimeHistory.length === 0) && (
                    <span className="text-[10px] text-muted-foreground">No history</span>
                  )}
                </div>
                <Badge variant={device.status === 'up' ? 'default' : 'destructive'} className="h-4 text-[9px]">
                  {device.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No devices" />
        );

      case 'alerts':
        return alerts.length > 0 ? (
          <div className="h-full space-y-1 overflow-auto p-2">
            {alerts.map((device) => (
              <div key={device.id} className="flex items-center gap-2 rounded-md border border-border/30 bg-secondary/50 px-2 py-1.5 text-xs">
                <DeviceIcon type={device.type} size={14} />
                <span className="flex-1 font-medium">{device.hostname}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{device.ipAddress}</span>
                {device.status === 'down' && <Badge variant="destructive" className="h-4 text-[9px]">DOWN</Badge>}
                {device.cpu > 80 && <Badge className="h-4 bg-warning text-[9px] text-warning-foreground">CPU {device.cpu}%</Badge>}
                {device.memory > 85 && <Badge className="h-4 bg-warning text-[9px] text-warning-foreground">MEM {device.memory}%</Badge>}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No active alerts" sub="All systems healthy" />
        );

      default:
        return <EmptyState message="Unknown panel type" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 flex h-12 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-sm">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Network className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold tracking-tight">NetScope</span>
        <Separator orientation="vertical" className="h-5" />
        <span className="hidden text-xs text-muted-foreground sm:inline">Dashboard</span>
        <div className="ml-2 flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${agentConnected ? 'bg-success' : 'bg-destructive'}`} />
          <span className="hidden text-[10px] text-muted-foreground md:inline">{agentConnected ? 'Agent connected' : 'Agent offline'}</span>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]">
                <Plus className="h-3 w-3" /> Add Panel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-sm">Add Panel</DialogTitle>
              </DialogHeader>
              {availableToAdd.length > 0 ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {availableToAdd.map((type) => {
                    const panel = PANEL_TYPES[type];
                    return (
                      <Button
                        key={type}
                        variant="outline"
                        className="flex h-auto flex-col items-center gap-1.5 px-3 py-3 text-xs hover:bg-accent"
                        onClick={() => addPanel(type)}
                      >
                        {panel.icon}
                        <span>{panel.label}</span>
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">All panel types are already on the dashboard.</p>
              )}
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px]" onClick={() => setLocked((value) => !value)}>
            {locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            <span className="hidden sm:inline">{locked ? 'Locked' : 'Unlocked'}</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px]" onClick={resetAll}>
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <Badge variant="outline" className="h-5 text-[10px]">{user?.role}</Badge>
          <span className="hidden text-xs text-muted-foreground md:inline">{user?.username}</span>
        </div>
      </div>

      <div ref={containerRef} className="w-full p-3 md:p-4">
        {panelIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <LayoutGrid className="mb-4 h-12 w-12 opacity-30" />
            <p className="text-sm">No panels added yet</p>
            <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-3 w-3" /> Add your first panel
            </Button>
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={currentLayout}
            cols={currentCols}
            width={containerWidth}
            rowHeight={GRID_ROW_HEIGHT}
            margin={GRID_MARGIN}
            compactType="vertical"
            draggableHandle=".drag-handle"
            resizeHandles={['e', 's', 'se']}
            isDraggable={!locked}
            isResizable={!locked}
            onLayoutChange={onLayoutChange}
          >
            {panelIds.map((id) => {
              const panel = getPanelMeta(id);
              return (
                <div key={id} className="h-full min-h-0 fade-in-up">
                  <PanelWrapper
                    title={panel.label}
                    icon={panel.icon}
                    locked={locked}
                    live={['local', 'traffic', 'cpuHistory', 'ramHistory'].includes(id) ? agentConnected : undefined}
                    onRemove={() => removePanel(id)}
                    onReset={() => resetPanelSize(id)}
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

const PanelWrapper: React.FC<{
  title: string;
  icon: React.ReactNode;
  live?: boolean;
  locked: boolean;
  onRemove: () => void;
  onReset: () => void;
  children: React.ReactNode;
}> = ({ title, icon, live, locked, onRemove, onReset, children }) => (
  <Card className="flex h-full flex-col overflow-hidden border border-border bg-card/90 shadow-sm transition-shadow duration-200 hover:shadow-md">
    <CardHeader className="shrink-0 p-0">
      <div className="flex items-center justify-between border-b border-border/50 px-2.5 py-1.5">
        <div className={`flex min-w-0 flex-1 items-center gap-1.5 ${!locked ? 'drag-handle cursor-grab active:cursor-grabbing' : ''}`}>
          <span className="shrink-0 text-muted-foreground">{icon}</span>
          <CardTitle className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
          {live && <Badge variant="outline" className="ml-1 h-3.5 shrink-0 border-success/30 bg-success/10 text-[8px] text-success">LIVE</Badge>}
        </div>

        {!locked && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-[10px]">Panel Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-xs" onClick={onReset}>
                <RotateCcw className="h-3 w-3" /> Reset Size
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-xs text-destructive focus:text-destructive" onClick={onRemove}>
                <Trash2 className="h-3 w-3" /> Remove Panel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </CardHeader>
    <CardContent className="min-h-0 flex-1 overflow-hidden p-0">{children}</CardContent>
  </Card>
);

const EmptyState: React.FC<{ message: string; sub?: string }> = ({ message, sub }) => (
  <div className="flex h-full flex-col items-center justify-center px-3 py-4 text-muted-foreground">
    <p className="text-center text-xs">{message}</p>
    {sub && <p className="mt-1 text-center text-[10px] opacity-70">{sub}</p>}
  </div>
);

const KpiCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  variant?: string;
  suffix?: string;
}> = ({ icon, label, value, variant, suffix }) => (
  <div className="flex items-center gap-2 rounded-md border border-border/30 bg-secondary/50 p-2">
    {icon}
    <div className="min-w-0">
      <div
        className={`text-base font-bold leading-tight ${
          variant === 'destructive'
            ? 'text-destructive'
            : variant === 'success'
              ? 'text-success'
              : variant === 'warning'
                ? 'text-warning'
                : 'text-foreground'
        }`}
      >
        {value}
        {suffix}
      </div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  </div>
);

export default Dashboard;
