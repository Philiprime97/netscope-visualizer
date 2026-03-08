import React, { memo, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { DeviceIcon } from './DeviceIcons';
import { NetworkDevice } from '@/types/network';
import { useTopology } from '@/contexts/TopologyContext';

interface DeviceNodeData {
  device: NetworkDevice;
  [key: string]: unknown;
}

/** Distribute N handles evenly across 4 sides with equal spacing */
function buildHandles(count: number) {
  const sides: { position: Position; axis: 'left' | 'top' }[] = [
    { position: Position.Top, axis: 'left' },
    { position: Position.Right, axis: 'top' },
    { position: Position.Bottom, axis: 'left' },
    { position: Position.Left, axis: 'top' },
  ];

  // Distribute handles round-robin across sides
  const perSide = [0, 0, 0, 0];
  for (let i = 0; i < count; i++) {
    perSide[i % 4]++;
  }

  const handles: { id: string; position: Position; style: React.CSSProperties }[] = [];

  // Legacy IDs for the first handle on each side (backward compat)
  const legacyIds = ['top', 'right', 'bottom', 'left'];

  perSide.forEach((n, si) => {
    for (let i = 0; i < n; i++) {
      const pct = ((i + 1) / (n + 1)) * 100;
      const id = i === 0 ? legacyIds[si] : `${sides[si].position}-${i}`;
      handles.push({
        id,
        position: sides[si].position,
        style: { [sides[si].axis]: `${pct}%` },
      });
    }
  });

  return handles;
}

const handleClasses: Record<string, string> = {
  [Position.Top]: '!-top-1.5',
  [Position.Bottom]: '!-bottom-1.5',
  [Position.Left]: '!-left-1.5',
  [Position.Right]: '!-right-1.5',
};

const DeviceNode: React.FC<NodeProps> = ({ data, selected }) => {
  const device = (data as DeviceNodeData).device;
  const { showLabels } = useTopology();
  const connectorCount = device.connectors ?? 4;
  const handles = useMemo(() => buildHandles(connectorCount), [connectorCount]);

  const customColor = device.customColor;

  const borderStyle = customColor
    ? { borderColor: `${customColor}4D` }
    : undefined;

  const categoryBorder = customColor
    ? ''
    : {
        network: 'border-noc-network/30',
        endpoint: 'border-noc-endpoint/30',
        container: 'border-noc-container/30',
      }[device.category] || '';

  return (
    <div
      className={`device-node min-w-[100px] ${categoryBorder} ${selected ? 'selected' : ''}`}
      style={borderStyle}
    >
      {handles.map(h => (
        <Handle
          key={h.id}
          type="source"
          position={h.position}
          id={h.id}
          isConnectableEnd
          className={handleClasses[h.position]}
          style={h.style}
        />
      ))}

      <div className="flex flex-col items-center gap-1.5 relative">
        <div className={`w-3 h-3 rounded-full absolute -top-1.5 -right-1.5 z-10 ${device.status === 'up' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'}`} />
        <DeviceIcon type={device.type} size={28} customIcon={device.customIcon} customColor={device.customColor} />
        <span className="text-[11px] font-semibold text-foreground truncate max-w-[90px]">
          {device.hostname}
        </span>
        <span className="text-[10px] font-mono text-primary/90 bg-primary/10 px-1.5 py-0.5 rounded">
          {device.ipAddress}
        </span>
        {device.latency != null && (
          <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
            device.latency < 10 ? 'bg-green-500/15 text-green-400' :
            device.latency < 50 ? 'bg-yellow-500/15 text-yellow-400' :
            'bg-red-500/15 text-red-400'
          }`}>
            {device.latency}ms
          </span>
        )}
      </div>
    </div>
  );
};

export default memo(DeviceNode);
