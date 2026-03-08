import React from 'react';
import { DeviceType } from '@/types/network';
import { Monitor, Server, Shield, Layers, Box, Hexagon } from 'lucide-react';

const iconMap: Record<DeviceType, { icon: React.ElementType; className: string }> = {
  switch: { icon: Layers, className: 'text-noc-network' },
  router: { icon: ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" />
      <path d="m8 8 4 4 4-4M16 16l-4-4-4 4" />
    </svg>
  ), className: 'text-noc-network' },
  firewall: { icon: Shield, className: 'text-noc-firewall' },
  server: { icon: Server, className: 'text-noc-endpoint' },
  pc: { icon: Monitor, className: 'text-noc-endpoint' },
  docker: { icon: ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <svg viewBox="0 0 640 512" fill="currentColor" className={className} style={style}>
      <path d="M349.9 236.3h-66.1v-59.4h66.1v59.4zm0-204.3h-66.1v60.7h66.1V32zm78.2 144.8H362v59.4h66.1v-59.4zm-156.3-72.1h-66.1v60.1h66.1v-60.1zm78.1 0h-66.1v60.1h66.1v-60.1zm276.8 100c-14.4-9.7-47.6-13.2-73.1-8.4-3.3-24-16.7-44.9-41.1-63.7l-14-9.3-9.3 14c-18.4 27.8-23.4 73.6-3.7 103.8-8.7 4.7-25.8 11.1-48.4 10.7H2.4c-8.7 50.4 5.8 116.8 44 162.1 37.1 43.9 92.7 66.2 165.4 66.2 157.4 0 273.9-72.5 328.4-204.2 21.4.4 67.6.1 91.3-45.2 1.5-2.5 6.6-13.2 8.5-17.1l-13.3-8.9zm-511.1-27.9h-66v59.4h66.1v-59.4zm78.1 0h-66.1v59.4h66.1v-59.4zm78.1 0h-66.1v59.4h66.1v-59.4zm-78.1-72.1h-66.1v60.1h66.1v-60.1z"/>
    </svg>
  ), className: 'text-noc-container' },
  kubernetes: { icon: Hexagon, className: 'text-noc-kubernetes' },
};

interface DeviceIconProps {
  type: DeviceType;
  size?: number;
}

export const DeviceIcon: React.FC<DeviceIconProps> = ({ type, size = 24 }) => {
  const { icon: Icon, className } = iconMap[type];
  return <Icon className={className} style={{ width: size, height: size }} />;
};

export const deviceTypeLabel: Record<DeviceType, string> = {
  switch: 'Switch',
  router: 'Router',
  firewall: 'Firewall',
  server: 'Server',
  pc: 'PC',
  docker: 'Docker',
  kubernetes: 'K8s Pod',
};
