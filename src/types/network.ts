export type DeviceType = 'switch' | 'router' | 'firewall' | 'server' | 'pc' | 'docker' | 'kubernetes';

export type DeviceCategory = 'network' | 'endpoint' | 'container';

export type InterfaceType = 'gigabit' | 'fastethernet' | 'tengig' | 'ethernet' | 'virtual' | 'bridge' | 'loopback';

export type LinkType = 'access' | 'trunk' | 'routed';

export type LinkSpeed = '100M' | '1G' | '10G' | '40G';

export interface DeviceInterface {
  id: string;
  name: string;
  type: InterfaceType;
  speed: LinkSpeed;
  status: 'up' | 'down';
  ipAddress?: string;
  macAddress?: string;
  vlan?: number;
  rxBytes: number;
  txBytes: number;
  enabled: boolean;
}

export interface NetworkDevice {
  id: string;
  hostname: string;
  type: DeviceType;
  category: DeviceCategory;
  ipAddress: string;
  macAddress?: string;
  os: string;
  uptime: string;
  cpu: number;
  memory: number;
  status: 'up' | 'down';
  interfaces: DeviceInterface[];
  parentServerId?: string; // for containers/pods
  containerImage?: string;
  maxConnections: number;
}

export interface NetworkLink {
  id: string;
  sourceDeviceId: string;
  sourceInterfaceId: string;
  targetDeviceId: string;
  targetInterfaceId: string;
  speed: LinkSpeed;
  vlan?: number;
  linkType: LinkType;
  status: 'up' | 'down';
}

export interface TopologyLayout {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  nodes: Array<{ deviceId: string; x: number; y: number }>;
  devices: NetworkDevice[];
  links: NetworkLink[];
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
}
