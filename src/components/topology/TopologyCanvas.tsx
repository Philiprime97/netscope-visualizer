import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import DeviceNode from './DeviceNode';
import { useTopology } from '@/contexts/TopologyContext';
import { NetworkLink } from '@/types/network';

const nodeTypes = { device: DeviceNode };

const TopologyCanvas: React.FC = () => {
  const {
    devices, links, positions, showAnimations, showLabels,
    setSelectedDeviceId, setSelectedLinkId,
    updatePosition, addLink, getConnectionCount,
  } = useTopology();

  const nodes: Node[] = useMemo(() =>
    devices.map(device => ({
      id: device.id,
      type: 'device',
      position: positions[device.id] || { x: 0, y: 0 },
      data: { device },
    })),
    [devices, positions]
  );

  const edges: Edge[] = useMemo(() =>
    links.map(link => {
      const srcDevice = devices.find(d => d.id === link.sourceDeviceId);
      const tgtDevice = devices.find(d => d.id === link.targetDeviceId);
      const srcIf = srcDevice?.interfaces.find(i => i.id === link.sourceInterfaceId);
      const tgtIf = tgtDevice?.interfaces.find(i => i.id === link.targetInterfaceId);
      return {
        id: link.id,
        source: link.sourceDeviceId,
        target: link.targetDeviceId,
        animated: showAnimations && link.status === 'up',
        label: showLabels ? `${srcIf?.name || '?'} ↔ ${tgtIf?.name || '?'}` : undefined,
        labelStyle: { fill: 'hsl(215, 15%, 50%)', fontSize: 10, fontFamily: 'JetBrains Mono' },
        labelBgStyle: { fill: 'hsl(220, 18%, 10%)', fillOpacity: 0.9 },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
        style: {
          stroke: link.status === 'up' ? 'hsl(185, 80%, 50%)' : 'hsl(0, 70%, 55%)',
          strokeWidth: link.speed === '10G' ? 3 : link.speed === '1G' ? 2 : 1.5,
          opacity: link.status === 'up' ? 0.7 : 0.35,
        },
        data: { link },
      };
    }),
    [links, devices, showAnimations, showLabels]
  );

  const [localNodes, setLocalNodes] = React.useState<Node[]>(nodes);
  const [localEdges, setLocalEdges] = React.useState<Edge[]>(edges);

  useEffect(() => { setLocalNodes(nodes); }, [nodes]);
  useEffect(() => { setLocalEdges(edges); }, [edges]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setLocalNodes(nds => applyNodeChanges(changes, nds));
    changes.forEach(change => {
      if (change.type === 'position' && change.position && change.dragging === false && change.id) {
        updatePosition(change.id, change.position.x, change.position.y);
      }
    });
  }, [updatePosition]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    setLocalEdges(eds => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;

    const srcCount = getConnectionCount(connection.source);
    const tgtCount = getConnectionCount(connection.target);
    const srcDevice = devices.find(d => d.id === connection.source);
    const tgtDevice = devices.find(d => d.id === connection.target);

    if (!srcDevice || !tgtDevice) return;
    if (srcCount >= srcDevice.maxConnections || tgtCount >= tgtDevice.maxConnections) return;

    const usedSrcIfs = links.filter(l => l.sourceDeviceId === connection.source).map(l => l.sourceInterfaceId);
    const usedTgtIfs = links.filter(l => l.targetDeviceId === connection.target).map(l => l.targetInterfaceId);
    const srcIf = srcDevice.interfaces.find(i => !usedSrcIfs.includes(i.id));
    const tgtIf = tgtDevice.interfaces.find(i => !usedTgtIfs.includes(i.id));

    if (!srcIf || !tgtIf) return;

    const newLink: NetworkLink = {
      id: `link-${Date.now()}`,
      sourceDeviceId: connection.source,
      sourceInterfaceId: srcIf.id,
      targetDeviceId: connection.target,
      targetInterfaceId: tgtIf.id,
      speed: '1G',
      linkType: 'access',
      status: 'up',
    };
    addLink(newLink);
  }, [devices, links, addLink, getConnectionCount]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedDeviceId(node.id);
    setSelectedLinkId(null);
  }, [setSelectedDeviceId, setSelectedLinkId]);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedLinkId(edge.id);
    setSelectedDeviceId(null);
  }, [setSelectedLinkId, setSelectedDeviceId]);

  const onPaneClick = useCallback(() => {
    setSelectedDeviceId(null);
    setSelectedLinkId(null);
  }, [setSelectedDeviceId, setSelectedLinkId]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={localNodes}
        edges={localEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        snapToGrid
        snapGrid={[12, 12]}
        deleteKeyCode="Delete"
        className="topology-grid"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="hsl(220, 15%, 15%)" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => {
            const dev = (n.data as any)?.device;
            if (!dev) return 'hsl(220, 15%, 30%)';
            return dev.category === 'network' ? 'hsl(200, 80%, 55%)' :
                   dev.category === 'container' ? 'hsl(30, 85%, 55%)' :
                   'hsl(150, 65%, 50%)';
          }}
          maskColor="hsl(220, 20%, 7%, 0.8)"
          style={{ background: 'hsl(220, 18%, 10%)' }}
        />
      </ReactFlow>
    </div>
  );
};

export default TopologyCanvas;
