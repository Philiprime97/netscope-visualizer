import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
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
import ConnectionDialog from './ConnectionDialog';
import { useTopology } from '@/contexts/TopologyContext';
import { NetworkLink } from '@/types/network';
import { toast } from 'sonner';

const nodeTypes = { device: DeviceNode };

const TopologyCanvas: React.FC = () => {
  const {
    devices, links, positions, showAnimations, showLabels,
    setSelectedDeviceId, setSelectedLinkId,
    updatePosition, addLink, removeLink, getConnectionCount,
  } = useTopology();

  // Connection dialog state
  const [pendingConnection, setPendingConnection] = useState<{ sourceId: string; targetId: string } | null>(null);

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
    // Handle edge removal via Delete key
    changes.forEach(change => {
      if (change.type === 'remove') {
        removeLink(change.id);
        toast.success('Connection removed');
      }
    });
  }, [removeLink]);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;

    const srcDevice = devices.find(d => d.id === connection.source);
    const tgtDevice = devices.find(d => d.id === connection.target);
    if (!srcDevice || !tgtDevice) return;

    const srcCount = getConnectionCount(connection.source);
    const tgtCount = getConnectionCount(connection.target);
    if (srcCount >= srcDevice.maxConnections) {
      toast.error(`${srcDevice.hostname} has reached max connections (${srcDevice.maxConnections})`);
      return;
    }
    if (tgtCount >= tgtDevice.maxConnections) {
      toast.error(`${tgtDevice.hostname} has reached max connections (${tgtDevice.maxConnections})`);
      return;
    }

    // Open interface picker dialog
    setPendingConnection({ sourceId: connection.source, targetId: connection.target });
  }, [devices, getConnectionCount]);

  const handleConnectionConfirm = useCallback((srcIfaceId: string, tgtIfaceId: string) => {
    if (!pendingConnection) return;
    const newLink: NetworkLink = {
      id: `link-${Date.now()}`,
      sourceDeviceId: pendingConnection.sourceId,
      sourceInterfaceId: srcIfaceId,
      targetDeviceId: pendingConnection.targetId,
      targetInterfaceId: tgtIfaceId,
      speed: '1G',
      linkType: 'access',
      status: 'up',
    };
    addLink(newLink);
    toast.success('Connection created');
    setPendingConnection(null);
  }, [pendingConnection, addLink]);

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

  // Get used interface IDs for connection dialog
  const pendingSrcDevice = pendingConnection ? devices.find(d => d.id === pendingConnection.sourceId) : null;
  const pendingTgtDevice = pendingConnection ? devices.find(d => d.id === pendingConnection.targetId) : null;
  const usedSrcIfaceIds = pendingConnection
    ? links.filter(l => l.sourceDeviceId === pendingConnection.sourceId || l.targetDeviceId === pendingConnection.sourceId)
        .flatMap(l => [l.sourceInterfaceId, l.targetInterfaceId])
    : [];
  const usedTgtIfaceIds = pendingConnection
    ? links.filter(l => l.sourceDeviceId === pendingConnection.targetId || l.targetDeviceId === pendingConnection.targetId)
        .flatMap(l => [l.sourceInterfaceId, l.targetInterfaceId])
    : [];

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

      {/* Connection interface picker dialog */}
      {pendingSrcDevice && pendingTgtDevice && (
        <ConnectionDialog
          open={!!pendingConnection}
          onClose={() => setPendingConnection(null)}
          sourceDevice={pendingSrcDevice}
          targetDevice={pendingTgtDevice}
          usedSourceIfaceIds={usedSrcIfaceIds}
          usedTargetIfaceIds={usedTgtIfaceIds}
          onConfirm={handleConnectionConfirm}
        />
      )}
    </div>
  );
};

export default TopologyCanvas;
