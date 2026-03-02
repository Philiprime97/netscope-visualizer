import React from 'react';
import { DeviceType } from '@/types/network';
import { Monitor, Server, Shield, Layers, Box, Hexagon } from 'lucide-react';

const iconMap: Record<DeviceType, { icon: React.ElementType; className: string }> = {
  switch: { icon: Layers, className: 'text-noc-network' },
  router: { icon: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-noc-network">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" />
      <path d="m8 8 4 4 4-4M16 16l-4-4-4 4" />
    </svg>
  ), className: 'text-noc-network' },
  firewall: { icon: Shield, className: 'text-noc-firewall' },
  server: { icon: Server, className: 'text-noc-endpoint' },
  pc: { icon: Monitor, className: 'text-noc-endpoint' },
  docker: { icon: Box, className: 'text-noc-container' },
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
