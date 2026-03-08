import React from 'react';
import { DeviceType } from '@/types/network';
import { deviceIconOptions, iconNameMap } from '@/components/panels/DeviceAppearance';

// Default icon per type is the first in its options list
const getDefaultIcon = (type: DeviceType) => deviceIconOptions[type]?.[0]?.icon;

const defaultClassMap: Record<DeviceType, string> = {
  switch: 'text-noc-network',
  router: 'text-noc-network',
  firewall: 'text-noc-firewall',
  server: 'text-noc-endpoint',
  pc: 'text-noc-endpoint',
  docker: 'text-noc-container',
  kubernetes: 'text-noc-kubernetes',
};

interface DeviceIconProps {
  type: DeviceType;
  size?: number;
  customIcon?: string;
  customColor?: string;
}

export const DeviceIcon: React.FC<DeviceIconProps> = ({ type, size = 24, customIcon, customColor }) => {
  const Icon = (customIcon && iconNameMap[customIcon]) || getDefaultIcon(type);
  if (!Icon) return null;
  const colorStyle = customColor ? { color: customColor } : undefined;

  return <Icon className={customColor ? '' : defaultClassMap[type]} style={{ width: size, height: size, ...colorStyle }} />;
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
