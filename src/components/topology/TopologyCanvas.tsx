import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  ConnectionMode,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  SelectionMode,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import DeviceNode from './DeviceNode';
import TextBoxNode from './TextBoxNode';
import ShapeNode from './ShapeNode';
import ConnectionDialog from './ConnectionDialog';
import { useTopology } from '@/contexts/TopologyContext';
import { NetworkLink, NetworkDevice } from '@/types/network';
import { toast } from 'sonner';

const nodeTypes = { device: DeviceNode, textBox: TextBoxNode, shape: ShapeNode };

type PendingConnection = {
  sourceId: string;
  targetId: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

interface ClipboardData {
  devices: NetworkDevice[];
  positions: Record<string, { x: number; y: number }>;
  links: NetworkLink[];
}

const TopologyCanvasInner: React.FC = () => {
  const {
    devices, links, positions, showAnimations, showLabels,
    annotations, updateAnnotation, removeAnnotation,
    shapes, updateShape, removeShape,
    setSelectedDeviceId, setSelectedLinkId,
    updatePosition, addLink, removeLink, removeDevice, addDevice,
  } = useTopology();

  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const pendingDragRef = useRef(false);
  const clipboardRef = useRef<ClipboardData | null>(null);
  const selectedNodesRef = useRef<Set<string>>(new Set());

  const deviceNodes: Node[] = useMemo(() =>
    devices.map(device => ({
      id: device.id,
      type: 'device',
      position: positions[device.id] || { x: 0, y: 0 },
      data: { device },
    })),
    [devices, positions]
  );

  const textBoxNodes: Node[] = useMemo(() =>
    annotations.map(ann => ({
      id: ann.id,
      type: 'textBox',
      position: positions[ann.id] || { x: 200, y: 200 },
      data: {
        text: ann.text,
        onTextChange: updateAnnotation,
        onRemove: removeAnnotation,
      },
    })),
    [annotations, positions, updateAnnotation, removeAnnotation]
  );

  const shapeNodes: Node[] = useMemo(() =>
    shapes.map(shape => ({
      id: shape.id,
      type: 'shape',
      position: positions[shape.id] || { x: 200, y: 200 },
      zIndex: shape.zIndex,
      data: {
        shape,
        onUpdate: updateShape,
        onRemove: removeShape,
      },
    })),
    [shapes, positions, updateShape, removeShape]
  );

  const nodes: Node[] = useMemo(() => [...shapeNodes, ...deviceNodes, ...textBoxNodes], [shapeNodes, deviceNodes, textBoxNodes]);

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
        sourceHandle: link.sourceHandle,
        targetHandle: link.targetHandle,
        animated: showAnimations && link.status === 'up',
        label: showLabels ? `${srcIf?.name || '?'} ↔ ${tgtIf?.name || '?'}` : undefined,
        labelStyle: { fill: 'hsl(215, 15%, 50%)', fontSize: 10, fontFamily: 'JetBrains Mono' },
        labelBgStyle: { fill: 'hsl(220, 18%, 10%)', fillOpacity: 0.9 },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
        style: {
          stroke: link.status === 'up' ? 'hsl(185, 80%, 50%)' : 'hsl(0, 70%, 55%)',
          strokeWidth: link.speed === '10G' ? 3 : link.speed === '1G' ? 2 : 1.5,
          opacity: link.status === 'up' ? 0.7 : 0.85,
          strokeDasharray: link.status === 'down' ? '6 4' : undefined,
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

  const annotationIds = useMemo(() => new Set(annotations.map(a => a.id)), [annotations]);
  const shapeIds = useMemo(() => new Set(shapes.map(s => s.id)), [shapes]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setLocalNodes(nds => applyNodeChanges(changes, nds));
    changes.forEach(change => {
      if (change.type === 'position' && change.position && change.dragging === false && change.id) {
        updatePosition(change.id, change.position.x, change.position.y);
      }
      if (change.type === 'remove') {
        if (annotationIds.has(change.id)) {
          removeAnnotation(change.id);
        } else if (shapeIds.has(change.id)) {
          removeShape(change.id);
        } else {
          removeDevice(change.id);
          toast.success('Device removed');
        }
      }
    });
  }, [updatePosition, removeDevice, removeAnnotation, removeShape, annotationIds, shapeIds]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    setLocalEdges(eds => applyEdgeChanges(changes, eds));
    changes.forEach(change => {
      if (change.type === 'remove') {
        removeLink(change.id);
        toast.success('Connection removed');
      }
    });
  }, [removeLink]);

  // Track selection changes
  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    selectedNodesRef.current = new Set(selectedNodes.map(n => n.id));
  }, []);

  // Copy handler
  const handleCopy = useCallback(() => {
    const selected = selectedNodesRef.current;
    if (selected.size === 0) return;

    const selectedDevices = devices.filter(d => selected.has(d.id));
    const selectedPositions: Record<string, { x: number; y: number }> = {};
    for (const d of selectedDevices) {
      selectedPositions[d.id] = positions[d.id] || { x: 0, y: 0 };
    }
    // Copy links between selected devices
    const selectedLinks = links.filter(
      l => selected.has(l.sourceDeviceId) && selected.has(l.targetDeviceId)
    );

    clipboardRef.current = {
      devices: selectedDevices,
      positions: selectedPositions,
      links: selectedLinks,
    };
    toast.success(`Copied ${selectedDevices.length} device${selectedDevices.length > 1 ? 's' : ''}`);
  }, [devices, positions, links]);

  // Paste handler
  const handlePaste = useCallback(() => {
    const clip = clipboardRef.current;
    if (!clip || clip.devices.length === 0) return;

    const idMap: Record<string, string> = {};
    const ifaceIdMap: Record<string, string> = {};
    const ts = Date.now();

    // Calculate offset for pasted devices
    const OFFSET = 50;

    for (const dev of clip.devices) {
      const newId = `${dev.type}-${ts}-${Math.random().toString(36).slice(2, 7)}`;
      idMap[dev.id] = newId;

      const newInterfaces = dev.interfaces.map(iface => {
        const newIfaceId = `${newId}-${iface.name}`;
        ifaceIdMap[iface.id] = newIfaceId;
        return { ...iface, id: newIfaceId };
      });

      const newDevice: NetworkDevice = {
        ...dev,
        id: newId,
        hostname: `${dev.hostname}-copy`,
        interfaces: newInterfaces,
      };

      const pos = clip.positions[dev.id] || { x: 300, y: 300 };
      addDevice(newDevice, { x: pos.x + OFFSET, y: pos.y + OFFSET });
    }

    // Recreate links between pasted devices
    for (const link of clip.links) {
      const newSrcId = idMap[link.sourceDeviceId];
      const newTgtId = idMap[link.targetDeviceId];
      if (!newSrcId || !newTgtId) continue;

      const newLink: NetworkLink = {
        ...link,
        id: `link-${ts}-${Math.random().toString(36).slice(2, 7)}`,
        sourceDeviceId: newSrcId,
        targetDeviceId: newTgtId,
        sourceInterfaceId: ifaceIdMap[link.sourceInterfaceId] || link.sourceInterfaceId,
        targetInterfaceId: ifaceIdMap[link.targetInterfaceId] || link.targetInterfaceId,
      };
      addLink(newLink);
    }

    toast.success(`Pasted ${clip.devices.length} device${clip.devices.length > 1 ? 's' : ''}`);
  }, [addDevice, addLink]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectedNodesRef.current.size > 0) {
          e.preventDefault();
          handleCopy();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (clipboardRef.current) {
          e.preventDefault();
          handlePaste();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCopy, handlePaste]);

  const onConnectStart = useCallback(() => {
    pendingDragRef.current = true;
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    if (connection.source === connection.target) {
      pendingDragRef.current = false;
      toast.error('Choose a different target device.');
      return;
    }
    const srcDevice = devices.find(d => d.id === connection.source);
    const tgtDevice = devices.find(d => d.id === connection.target);
    if (!srcDevice || !tgtDevice) return;
    pendingDragRef.current = false;
    setPendingConnection({
      sourceId: connection.source,
      targetId: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    });
  }, [devices]);

  const onConnectEnd = useCallback(() => {
    if (pendingDragRef.current) {
      toast.info('Drop on any device side handle to connect.');
      pendingDragRef.current = false;
    }
  }, []);

  const handleConnectionConfirm = useCallback((srcIfaceId: string, tgtIfaceId: string) => {
    if (!pendingConnection) return;
    const newLink: NetworkLink = {
      id: `link-${Date.now()}`,
      sourceDeviceId: pendingConnection.sourceId,
      sourceInterfaceId: srcIfaceId,
      targetDeviceId: pendingConnection.targetId,
      targetInterfaceId: tgtIfaceId,
      sourceHandle: pendingConnection.sourceHandle ?? undefined,
      targetHandle: pendingConnection.targetHandle ?? undefined,
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
    <div className="relative w-full h-full">
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-border bg-background/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
        Drag to select • Ctrl+C / Ctrl+V to copy-paste • Shift+click to multi-select
      </div>

      <ReactFlow
        nodes={localNodes}
        edges={localEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnectStart={onConnectStart}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag
        panOnDrag={[1, 2]}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        snapToGrid
        snapGrid={[12, 12]}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
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

const TopologyCanvas: React.FC = () => <TopologyCanvasInner />;

export default TopologyCanvas;
