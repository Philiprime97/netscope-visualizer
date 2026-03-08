import React, { createContext, useContext, useState, useCallback } from 'react';
import { NetworkDevice, NetworkLink, DeviceInterface } from '@/types/network';
import { mockDevices, mockLinks, mockPositions } from '@/data/mockData';

export interface SavedTopology {
  id: string;
  name: string;
  savedAt: string;
  devices: NetworkDevice[];
  links: NetworkLink[];
  positions: Record<string, { x: number; y: number }>;
  notes?: string;
}

interface TopologyContextValue {
  devices: NetworkDevice[];
  links: NetworkLink[];
  positions: Record<string, { x: number; y: number }>;
  selectedDeviceId: string | null;
  selectedLinkId: string | null;
  showLabels: boolean;
  showAnimations: boolean;
  setSelectedDeviceId: (id: string | null) => void;
  setSelectedLinkId: (id: string | null) => void;
  setShowLabels: (v: boolean) => void;
  setShowAnimations: (v: boolean) => void;
  updatePosition: (id: string, x: number, y: number) => void;
  addDevice: (device: NetworkDevice, pos: { x: number; y: number }) => void;
  removeDevice: (id: string) => void;
  updateDevice: (id: string, updates: Partial<NetworkDevice>) => void;
  updateInterface: (deviceId: string, ifaceId: string, updates: Partial<DeviceInterface>) => void;
  addInterface: (deviceId: string, iface: DeviceInterface) => void;
  removeInterface: (deviceId: string, ifaceId: string) => void;
  addLink: (link: NetworkLink) => void;
  removeLink: (id: string) => void;
  updateLink: (id: string, updates: Partial<NetworkLink>) => void;
  getConnectionCount: (deviceId: string) => number;
  exportTopology: () => SavedTopology;
  loadTopology: (topology: SavedTopology) => void;
  notes: string;
  setNotes: (notes: string) => void;
}

const TopologyContext = createContext<TopologyContextValue | null>(null);

export const useTopology = () => {
  const ctx = useContext(TopologyContext);
  if (!ctx) throw new Error('useTopology must be inside TopologyProvider');
  return ctx;
};

export const TopologyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<NetworkDevice[]>(mockDevices);
  const [links, setLinks] = useState<NetworkLink[]>(mockLinks);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(mockPositions);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showAnimations, setShowAnimations] = useState(true);
  const [notes, setNotes] = useState('');

  const updatePosition = useCallback((id: string, x: number, y: number) => {
    setPositions(p => ({ ...p, [id]: { x, y } }));
  }, []);

  const addDevice = useCallback((device: NetworkDevice, pos: { x: number; y: number }) => {
    setDevices(d => [...d, device]);
    setPositions(p => ({ ...p, [device.id]: pos }));
  }, []);

  const removeDevice = useCallback((id: string) => {
    setDevices(d => d.filter(dev => dev.id !== id));
    setLinks(l => l.filter(link => link.sourceDeviceId !== id && link.targetDeviceId !== id));
    setPositions(p => { const next = { ...p }; delete next[id]; return next; });
    setSelectedDeviceId(prev => prev === id ? null : prev);
  }, []);

  const updateDevice = useCallback((id: string, updates: Partial<NetworkDevice>) => {
    setDevices(d => d.map(dev => dev.id === id ? { ...dev, ...updates } : dev));
  }, []);

  const updateInterface = useCallback((deviceId: string, ifaceId: string, updates: Partial<DeviceInterface>) => {
    setDevices(d => d.map(dev => dev.id === deviceId ? {
      ...dev,
      interfaces: dev.interfaces.map(i => i.id === ifaceId ? { ...i, ...updates } : i),
    } : dev));
  }, []);

  const addInterface = useCallback((deviceId: string, iface: DeviceInterface) => {
    setDevices(d => d.map(dev => dev.id === deviceId ? {
      ...dev, interfaces: [...dev.interfaces, iface],
    } : dev));
  }, []);

  const removeInterface = useCallback((deviceId: string, ifaceId: string) => {
    setDevices(d => d.map(dev => dev.id === deviceId ? {
      ...dev, interfaces: dev.interfaces.filter(i => i.id !== ifaceId),
    } : dev));
    setLinks(l => l.filter(link =>
      !(link.sourceDeviceId === deviceId && link.sourceInterfaceId === ifaceId) &&
      !(link.targetDeviceId === deviceId && link.targetInterfaceId === ifaceId)
    ));
  }, []);

  const addLink = useCallback((link: NetworkLink) => {
    setLinks(l => [...l, link]);
  }, []);

  const removeLink = useCallback((id: string) => {
    setLinks(l => l.filter(link => link.id !== id));
    setSelectedLinkId(prev => prev === id ? null : prev);
  }, []);

  const updateLink = useCallback((id: string, updates: Partial<NetworkLink>) => {
    setLinks(l => l.map(link => link.id === id ? { ...link, ...updates } : link));
  }, []);

  const getConnectionCount = useCallback((deviceId: string) => {
    return links.filter(l => l.sourceDeviceId === deviceId || l.targetDeviceId === deviceId).length;
  }, [links]);

  const exportTopology = useCallback((): SavedTopology => {
    return {
      id: `topo-${Date.now()}`,
      name: `Topology ${new Date().toLocaleDateString()}`,
      savedAt: new Date().toISOString(),
      devices,
      links,
      positions,
    };
  }, [devices, links, positions]);

  const loadTopology = useCallback((topology: SavedTopology) => {
    setDevices(topology.devices);
    setLinks(topology.links);
    setPositions(topology.positions);
    setSelectedDeviceId(null);
    setSelectedLinkId(null);
  }, []);

  return (
    <TopologyContext.Provider value={{
      devices, links, positions, selectedDeviceId, selectedLinkId,
      showLabels, showAnimations,
      setSelectedDeviceId, setSelectedLinkId, setShowLabels, setShowAnimations,
      updatePosition, addDevice, removeDevice, updateDevice,
      updateInterface, addInterface, removeInterface,
      addLink, removeLink, updateLink, getConnectionCount,
      exportTopology, loadTopology,
    }}>
      {children}
    </TopologyContext.Provider>
  );
};
