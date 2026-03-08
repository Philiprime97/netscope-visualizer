import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { DeviceIcon } from './DeviceIcons';
import { NetworkDevice } from '@/types/network';
import { useTopology } from '@/contexts/TopologyContext';

interface DeviceNodeData {
  device: NetworkDevice;
  [key: string]: unknown;
}

const DeviceNode: React.FC<NodeProps> = ({ data, selected }) => {
  const device = (data as DeviceNodeData).device;
  const { showLabels } = useTopology();

  const customColor = device.customColor;

  const borderStyle = customColor
    ? { borderColor: `${customColor}4D` } // 30% opacity hex
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
      <Handle type="source" position={Position.Top} id="top" isConnectableEnd className="!-top-1.5" />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectableEnd className="!-bottom-1.5" />
      <Handle type="source" position={Position.Left} id="left" isConnectableEnd className="!-left-1.5" />
      <Handle type="source" position={Position.Right} id="right" isConnectableEnd className="!-right-1.5" />

      <div className="flex flex-col items-center gap-1.5 relative">
        <div className={`w-3 h-3 rounded-full absolute -top-1.5 -right-1.5 z-10 ${device.status === 'up' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'}`} />
        <DeviceIcon type={device.type} size={28} customIcon={device.customIcon} customColor={device.customColor} />
        <span className="text-[11px] font-semibold text-foreground truncate max-w-[90px]">
          {device.hostname}
        </span>
        <span className="text-[10px] font-mono text-primary/90 bg-primary/10 px-1.5 py-0.5 rounded">
          {device.ipAddress}
        </span>
      </div>
    </div>
  );
};

export default memo(DeviceNode);
