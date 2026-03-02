import { NetworkDevice, NetworkLink } from '@/types/network';

const makeIf = (id: string, name: string, type: any = 'gigabit', speed: any = '1G', status: any = 'up', ip?: string, mac?: string, vlan?: number): any => ({
  id, name, type, speed, status, ipAddress: ip, macAddress: mac, vlan,
  rxBytes: Math.floor(Math.random() * 5e9),
  txBytes: Math.floor(Math.random() * 5e9),
  enabled: true,
});

export const mockDevices: NetworkDevice[] = [
  {
    id: 'core-sw1', hostname: 'Core-SW1', type: 'switch', category: 'network',
    ipAddress: '10.0.0.1', macAddress: 'AA:BB:CC:00:01:01', os: 'Cisco IOS 15.2',
    uptime: '142d 3h', cpu: 35, memory: 48, status: 'up', maxConnections: 4,
    interfaces: [
      makeIf('core-sw1-gi01', 'Gi0/1', 'gigabit', '10G', 'up', undefined, undefined, 100),
      makeIf('core-sw1-gi02', 'Gi0/2', 'gigabit', '10G', 'up', undefined, undefined, 100),
      makeIf('core-sw1-gi03', 'Gi0/3', 'gigabit', '1G', 'up', undefined, undefined, 200),
      makeIf('core-sw1-gi04', 'Gi0/4', 'gigabit', '1G', 'up'),
    ],
  },
  {
    id: 'core-rtr1', hostname: 'Core-RTR1', type: 'router', category: 'network',
    ipAddress: '10.0.0.254', macAddress: 'AA:BB:CC:00:02:01', os: 'Cisco IOS-XE 17.6',
    uptime: '89d 12h', cpu: 22, memory: 41, status: 'up', maxConnections: 4,
    interfaces: [
      makeIf('core-rtr1-gi01', 'Gi0/0/0', 'gigabit', '10G', 'up', '10.0.0.254'),
      makeIf('core-rtr1-gi02', 'Gi0/0/1', 'gigabit', '1G', 'up', '192.168.1.1'),
      makeIf('core-rtr1-gi03', 'Gi0/0/2', 'gigabit', '1G', 'up'),
      makeIf('core-rtr1-gi04', 'Gi0/0/3', 'gigabit', '1G', 'down'),
    ],
  },
  {
    id: 'fw1', hostname: 'FW-Edge', type: 'firewall', category: 'network',
    ipAddress: '10.0.0.253', macAddress: 'AA:BB:CC:00:03:01', os: 'Palo Alto PAN-OS 11.0',
    uptime: '230d 5h', cpu: 18, memory: 52, status: 'up', maxConnections: 4,
    interfaces: [
      makeIf('fw1-eth1', 'eth1/1', 'gigabit', '10G', 'up', '10.0.0.253'),
      makeIf('fw1-eth2', 'eth1/2', 'gigabit', '1G', 'up', '203.0.113.1'),
      makeIf('fw1-eth3', 'eth1/3', 'gigabit', '1G', 'down'),
      makeIf('fw1-eth4', 'eth1/4', 'gigabit', '1G', 'up'),
    ],
  },
  {
    id: 'acc-sw1', hostname: 'Access-SW1', type: 'switch', category: 'network',
    ipAddress: '10.0.1.1', macAddress: 'AA:BB:CC:00:04:01', os: 'Cisco IOS 15.2',
    uptime: '67d 8h', cpu: 28, memory: 35, status: 'up', maxConnections: 4,
    interfaces: [
      makeIf('acc-sw1-gi01', 'Gi0/1', 'gigabit', '10G', 'up', undefined, undefined, 100),
      makeIf('acc-sw1-fa01', 'Fa0/1', 'fastethernet', '100M', 'up', undefined, undefined, 10),
      makeIf('acc-sw1-fa02', 'Fa0/2', 'fastethernet', '100M', 'up', undefined, undefined, 10),
      makeIf('acc-sw1-fa03', 'Fa0/3', 'fastethernet', '100M', 'down'),
    ],
  },
  {
    id: 'acc-sw2', hostname: 'Access-SW2', type: 'switch', category: 'network',
    ipAddress: '10.0.2.1', macAddress: 'AA:BB:CC:00:05:01', os: 'Cisco IOS 15.2',
    uptime: '67d 8h', cpu: 31, memory: 38, status: 'up', maxConnections: 4,
    interfaces: [
      makeIf('acc-sw2-gi01', 'Gi0/1', 'gigabit', '10G', 'up', undefined, undefined, 100),
      makeIf('acc-sw2-fa01', 'Fa0/1', 'fastethernet', '100M', 'up', undefined, undefined, 20),
      makeIf('acc-sw2-fa02', 'Fa0/2', 'fastethernet', '100M', 'up', undefined, undefined, 20),
      makeIf('acc-sw2-fa03', 'Fa0/3', 'fastethernet', '100M', 'up'),
    ],
  },
  {
    id: 'srv1', hostname: 'SRV-Docker01', type: 'server', category: 'endpoint',
    ipAddress: '10.0.1.10', macAddress: 'AA:BB:CC:00:06:01', os: 'Ubuntu 22.04 LTS',
    uptime: '45d 2h', cpu: 62, memory: 71, status: 'up', maxConnections: 4,
    interfaces: [
      makeIf('srv1-ens33', 'ens33', 'ethernet', '1G', 'up', '10.0.1.10'),
      makeIf('srv1-docker0', 'docker0', 'bridge', '1G', 'up', '172.17.0.1'),
      makeIf('srv1-ens34', 'ens34', 'ethernet', '1G', 'down'),
      makeIf('srv1-lo', 'lo', 'loopback', '1G', 'up', '127.0.0.1'),
    ],
  },
  {
    id: 'srv2', hostname: 'SRV-K8s-Master', type: 'server', category: 'endpoint',
    ipAddress: '10.0.2.10', macAddress: 'AA:BB:CC:00:07:01', os: 'Ubuntu 22.04 LTS',
    uptime: '90d 14h', cpu: 45, memory: 58, status: 'up', maxConnections: 4,
    interfaces: [
      makeIf('srv2-ens33', 'ens33', 'ethernet', '1G', 'up', '10.0.2.10'),
      makeIf('srv2-cni0', 'cni0', 'bridge', '1G', 'up', '10.244.0.1'),
      makeIf('srv2-ens34', 'ens34', 'ethernet', '1G', 'up'),
      makeIf('srv2-lo', 'lo', 'loopback', '1G', 'up', '127.0.0.1'),
    ],
  },
  {
    id: 'pc1', hostname: 'WS-Admin01', type: 'pc', category: 'endpoint',
    ipAddress: '10.0.1.100', macAddress: 'AA:BB:CC:00:08:01', os: 'Windows 11 Pro',
    uptime: '3d 7h', cpu: 15, memory: 45, status: 'up', maxConnections: 4,
    interfaces: [
      makeIf('pc1-eth0', 'Ethernet', 'ethernet', '1G', 'up', '10.0.1.100'),
    ],
  },
  {
    id: 'pc2', hostname: 'WS-Dev01', type: 'pc', category: 'endpoint',
    ipAddress: '10.0.1.101', macAddress: 'AA:BB:CC:00:09:01', os: 'macOS Sonoma',
    uptime: '1d 12h', cpu: 32, memory: 67, status: 'up', maxConnections: 4,
    interfaces: [
      makeIf('pc2-eth0', 'en0', 'ethernet', '1G', 'up', '10.0.1.101'),
    ],
  },
  {
    id: 'pc3', hostname: 'WS-User01', type: 'pc', category: 'endpoint',
    ipAddress: '10.0.2.100', macAddress: 'AA:BB:CC:00:10:01', os: 'Windows 10',
    uptime: '5d 1h', cpu: 8, memory: 35, status: 'up', maxConnections: 4,
    interfaces: [
      makeIf('pc3-eth0', 'Ethernet', 'ethernet', '1G', 'up', '10.0.2.100'),
    ],
  },
  // Docker containers
  {
    id: 'docker1', hostname: 'nginx-proxy', type: 'docker', category: 'container',
    ipAddress: '172.17.0.2', os: 'nginx:1.25-alpine', containerImage: 'nginx:1.25-alpine',
    uptime: '12d 4h', cpu: 5, memory: 12, status: 'up', maxConnections: 4, parentServerId: 'srv1',
    interfaces: [
      makeIf('docker1-eth0', 'eth0', 'virtual', '1G', 'up', '172.17.0.2'),
      makeIf('docker1-veth1', 'veth1a2b3c', 'virtual', '1G', 'up'),
    ],
  },
  {
    id: 'docker2', hostname: 'api-gateway', type: 'docker', category: 'container',
    ipAddress: '172.17.0.3', os: 'node:20-slim', containerImage: 'node:20-slim',
    uptime: '12d 4h', cpu: 18, memory: 28, status: 'up', maxConnections: 4, parentServerId: 'srv1',
    interfaces: [
      makeIf('docker2-eth0', 'eth0', 'virtual', '1G', 'up', '172.17.0.3'),
      makeIf('docker2-veth1', 'veth4d5e6f', 'virtual', '1G', 'up'),
    ],
  },
  {
    id: 'docker3', hostname: 'redis-cache', type: 'docker', category: 'container',
    ipAddress: '172.17.0.4', os: 'redis:7-alpine', containerImage: 'redis:7-alpine',
    uptime: '12d 4h', cpu: 3, memory: 8, status: 'up', maxConnections: 4, parentServerId: 'srv1',
    interfaces: [
      makeIf('docker3-eth0', 'eth0', 'virtual', '1G', 'up', '172.17.0.4'),
    ],
  },
  // Kubernetes pods
  {
    id: 'k8s-pod1', hostname: 'webapp-frontend-7b5d9', type: 'kubernetes', category: 'container',
    ipAddress: '10.244.0.5', os: 'react:latest', containerImage: 'webapp-frontend:v2.1',
    uptime: '5d 8h', cpu: 12, memory: 22, status: 'up', maxConnections: 4, parentServerId: 'srv2',
    interfaces: [
      makeIf('k8s-pod1-eth0', 'eth0', 'virtual', '1G', 'up', '10.244.0.5'),
    ],
  },
  {
    id: 'k8s-pod2', hostname: 'webapp-backend-3c8f2', type: 'kubernetes', category: 'container',
    ipAddress: '10.244.0.6', os: 'go:1.21', containerImage: 'webapp-backend:v3.0',
    uptime: '5d 8h', cpu: 25, memory: 34, status: 'up', maxConnections: 4, parentServerId: 'srv2',
    interfaces: [
      makeIf('k8s-pod2-eth0', 'eth0', 'virtual', '1G', 'up', '10.244.0.6'),
    ],
  },
  {
    id: 'k8s-pod3', hostname: 'postgres-db-1a2b3', type: 'kubernetes', category: 'container',
    ipAddress: '10.244.0.7', os: 'postgres:16', containerImage: 'postgres:16-alpine',
    uptime: '30d 2h', cpu: 38, memory: 55, status: 'up', maxConnections: 4, parentServerId: 'srv2',
    interfaces: [
      makeIf('k8s-pod3-eth0', 'eth0', 'virtual', '1G', 'up', '10.244.0.7'),
    ],
  },
];

export const mockLinks: NetworkLink[] = [
  { id: 'link1', sourceDeviceId: 'core-sw1', sourceInterfaceId: 'core-sw1-gi01', targetDeviceId: 'core-rtr1', targetInterfaceId: 'core-rtr1-gi01', speed: '10G', vlan: 100, linkType: 'trunk', status: 'up' },
  { id: 'link2', sourceDeviceId: 'core-rtr1', sourceInterfaceId: 'core-rtr1-gi02', targetDeviceId: 'fw1', targetInterfaceId: 'fw1-eth1', speed: '1G', linkType: 'routed', status: 'up' },
  { id: 'link3', sourceDeviceId: 'core-sw1', sourceInterfaceId: 'core-sw1-gi02', targetDeviceId: 'acc-sw1', targetInterfaceId: 'acc-sw1-gi01', speed: '10G', vlan: 100, linkType: 'trunk', status: 'up' },
  { id: 'link4', sourceDeviceId: 'core-sw1', sourceInterfaceId: 'core-sw1-gi03', targetDeviceId: 'acc-sw2', targetInterfaceId: 'acc-sw2-gi01', speed: '1G', vlan: 100, linkType: 'trunk', status: 'up' },
  { id: 'link5', sourceDeviceId: 'acc-sw1', sourceInterfaceId: 'acc-sw1-fa01', targetDeviceId: 'srv1', targetInterfaceId: 'srv1-ens33', speed: '1G', vlan: 10, linkType: 'access', status: 'up' },
  { id: 'link6', sourceDeviceId: 'acc-sw1', sourceInterfaceId: 'acc-sw1-fa02', targetDeviceId: 'pc1', targetInterfaceId: 'pc1-eth0', speed: '100M', vlan: 10, linkType: 'access', status: 'up' },
  { id: 'link7', sourceDeviceId: 'acc-sw1', sourceInterfaceId: 'acc-sw1-fa03', targetDeviceId: 'pc2', targetInterfaceId: 'pc2-eth0', speed: '100M', vlan: 10, linkType: 'access', status: 'up' },
  { id: 'link8', sourceDeviceId: 'acc-sw2', sourceInterfaceId: 'acc-sw2-fa01', targetDeviceId: 'srv2', targetInterfaceId: 'srv2-ens33', speed: '1G', vlan: 20, linkType: 'access', status: 'up' },
  { id: 'link9', sourceDeviceId: 'acc-sw2', sourceInterfaceId: 'acc-sw2-fa02', targetDeviceId: 'pc3', targetInterfaceId: 'pc3-eth0', speed: '100M', vlan: 20, linkType: 'access', status: 'up' },
  { id: 'link10', sourceDeviceId: 'srv1', sourceInterfaceId: 'srv1-docker0', targetDeviceId: 'docker1', targetInterfaceId: 'docker1-eth0', speed: '1G', linkType: 'access', status: 'up' },
  { id: 'link11', sourceDeviceId: 'srv1', sourceInterfaceId: 'srv1-docker0', targetDeviceId: 'docker2', targetInterfaceId: 'docker2-eth0', speed: '1G', linkType: 'access', status: 'up' },
  { id: 'link12', sourceDeviceId: 'srv1', sourceInterfaceId: 'srv1-docker0', targetDeviceId: 'docker3', targetInterfaceId: 'docker3-eth0', speed: '1G', linkType: 'access', status: 'up' },
  { id: 'link13', sourceDeviceId: 'srv2', sourceInterfaceId: 'srv2-cni0', targetDeviceId: 'k8s-pod1', targetInterfaceId: 'k8s-pod1-eth0', speed: '1G', linkType: 'access', status: 'up' },
  { id: 'link14', sourceDeviceId: 'srv2', sourceInterfaceId: 'srv2-cni0', targetDeviceId: 'k8s-pod2', targetInterfaceId: 'k8s-pod2-eth0', speed: '1G', linkType: 'access', status: 'up' },
  { id: 'link15', sourceDeviceId: 'srv2', sourceInterfaceId: 'srv2-cni0', targetDeviceId: 'k8s-pod3', targetInterfaceId: 'k8s-pod3-eth0', speed: '1G', linkType: 'access', status: 'up' },
];

export const mockPositions: Record<string, { x: number; y: number }> = {
  'fw1': { x: 600, y: 0 },
  'core-rtr1': { x: 400, y: 100 },
  'core-sw1': { x: 400, y: 250 },
  'acc-sw1': { x: 200, y: 400 },
  'acc-sw2': { x: 600, y: 400 },
  'srv1': { x: 80, y: 560 },
  'pc1': { x: 250, y: 560 },
  'pc2': { x: 350, y: 560 },
  'srv2': { x: 520, y: 560 },
  'pc3': { x: 720, y: 560 },
  'docker1': { x: 0, y: 720 },
  'docker2': { x: 120, y: 720 },
  'docker3': { x: 240, y: 720 },
  'k8s-pod1': { x: 440, y: 720 },
  'k8s-pod2': { x: 570, y: 720 },
  'k8s-pod3': { x: 700, y: 720 },
};
