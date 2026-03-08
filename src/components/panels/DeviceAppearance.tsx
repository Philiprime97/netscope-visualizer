import React from 'react';
import { DeviceType } from '@/types/network';
import { 
  Monitor, Server, Shield, Layers, Hexagon, Box,
  Laptop, Smartphone, Tablet, Cpu, HardDrive, Database,
  Globe, Wifi, Radio, Router, Cloud, CloudCog,
  Container, Package, Boxes, Cog, Terminal, Network,
  MonitorSmartphone, PcCase, Cable, Dock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Icon options per device type
const iconOptions: Record<DeviceType, { name: string; icon: React.ElementType }[]> = {
  switch: [
    { name: 'Layers', icon: Layers },
    { name: 'Network', icon: Network },
    { name: 'Cable', icon: Cable },
    { name: 'Wifi', icon: Wifi },
    { name: 'Radio', icon: Radio },
    { name: 'Globe', icon: Globe },
    { name: 'Database', icon: Database },
    { name: 'HardDrive', icon: HardDrive },
    { name: 'Cpu', icon: Cpu },
    { name: 'Box', icon: Box },
  ],
  router: [
    { name: 'Router', icon: Router },
    { name: 'Globe', icon: Globe },
    { name: 'Wifi', icon: Wifi },
    { name: 'Network', icon: Network },
    { name: 'Radio', icon: Radio },
    { name: 'Cloud', icon: Cloud },
    { name: 'Cable', icon: Cable },
    { name: 'Layers', icon: Layers },
    { name: 'Cpu', icon: Cpu },
    { name: 'Server', icon: Server },
  ],
  firewall: [
    { name: 'Shield', icon: Shield },
    { name: 'Globe', icon: Globe },
    { name: 'Network', icon: Network },
    { name: 'Layers', icon: Layers },
    { name: 'Server', icon: Server },
    { name: 'Cloud', icon: Cloud },
    { name: 'Cpu', icon: Cpu },
    { name: 'HardDrive', icon: HardDrive },
    { name: 'Radio', icon: Radio },
    { name: 'Box', icon: Box },
  ],
  server: [
    { name: 'Server', icon: Server },
    { name: 'Database', icon: Database },
    { name: 'HardDrive', icon: HardDrive },
    { name: 'Cpu', icon: Cpu },
    { name: 'Cloud', icon: Cloud },
    { name: 'CloudCog', icon: CloudCog },
    { name: 'Terminal', icon: Terminal },
    { name: 'Cog', icon: Cog },
    { name: 'Box', icon: Box },
    { name: 'Network', icon: Network },
  ],
  pc: [
    { name: 'Monitor', icon: Monitor },
    { name: 'Laptop', icon: Laptop },
    { name: 'Smartphone', icon: Smartphone },
    { name: 'Tablet', icon: Tablet },
    { name: 'MonitorSmartphone', icon: MonitorSmartphone },
    { name: 'Terminal', icon: Terminal },
    { name: 'Cpu', icon: Cpu },
    { name: 'HardDrive', icon: HardDrive },
    { name: 'Globe', icon: Globe },
    { name: 'PcCase', icon: PcCase },
  ],
  docker: [
    { name: 'Docker', icon: Box },
    { name: 'Container', icon: Container },
    { name: 'Package', icon: Package },
    { name: 'Boxes', icon: Boxes },
    { name: 'Cloud', icon: Cloud },
    { name: 'CloudCog', icon: CloudCog },
    { name: 'Server', icon: Server },
    { name: 'Cog', icon: Cog },
    { name: 'Terminal', icon: Terminal },
    { name: 'Database', icon: Database },
  ],
  kubernetes: [
    { name: 'Hexagon', icon: Hexagon },
    { name: 'Boxes', icon: Boxes },
    { name: 'Container', icon: Container },
    { name: 'Cloud', icon: Cloud },
    { name: 'CloudCog', icon: CloudCog },
    { name: 'Network', icon: Network },
    { name: 'Cog', icon: Cog },
    { name: 'Package', icon: Package },
    { name: 'Server', icon: Server },
    { name: 'Globe', icon: Globe },
  ],
};

const colorOptions = [
  { name: 'Default', value: '' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Slate', value: '#64748b' },
  { name: 'White', value: '#f1f5f9' },
];

// Map icon names back to components for rendering in DeviceNode
export const iconNameMap: Record<string, React.ElementType> = {
  Layers, Network, Cable, Wifi, Radio, Globe, Database, HardDrive, Cpu, Box,
  Router, Cloud, CloudCog, Shield, Server, Terminal, Cog,
  Monitor, Laptop, Smartphone, Tablet, MonitorSmartphone, PcCase,
  Container, Package, Boxes, Hexagon, Dock,
};

interface DeviceAppearanceProps {
  deviceType: DeviceType;
  currentIcon?: string;
  currentColor?: string;
  onIconChange: (iconName: string) => void;
  onColorChange: (color: string) => void;
}

const DeviceAppearance: React.FC<DeviceAppearanceProps> = ({
  deviceType, currentIcon, currentColor, onIconChange, onColorChange,
}) => {
  const icons = iconOptions[deviceType] || [];

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Icon</h4>
        <div className="grid grid-cols-5 gap-1.5">
          {icons.map(({ name, icon: Icon }) => (
            <Button
              key={name}
              variant={currentIcon === name ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8"
              onClick={() => onIconChange(name)}
              title={name}
            >
              <Icon className="w-4 h-4" style={currentColor ? { color: currentIcon === name ? undefined : currentColor } : undefined} />
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Color</h4>
        <div className="flex gap-1.5 flex-wrap">
          {colorOptions.map(({ name, value }) => (
            <button
              key={name}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${currentColor === value ? 'border-primary scale-110' : 'border-transparent hover:scale-110'}`}
              style={{ backgroundColor: value || 'hsl(var(--muted-foreground))' }}
              onClick={() => onColorChange(value)}
              title={name}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeviceAppearance;
