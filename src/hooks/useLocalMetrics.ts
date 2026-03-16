import { useState, useEffect, useCallback, useRef } from 'react';
import { getLocalMetrics, LocalMetrics } from '@/services/pingAgent';

export interface TrafficPoint {
  time: string;
  rxMbps: number;
  txMbps: number;
}

export interface ResourcePoint {
  time: string;
  cpu: number;
  memory: number;
}

export const useLocalMetrics = (intervalMs = 5000) => {
  const [metrics, setMetrics] = useState<LocalMetrics | null>(null);
  const [trafficHistory, setTrafficHistory] = useState<TrafficPoint[]>([]);
  const [resourceHistory, setResourceHistory] = useState<ResourcePoint[]>([]);
  const [connected, setConnected] = useState(false);
  const MAX_RESOURCE_POINTS = 60;

  const poll = useCallback(async () => {
    const data = await getLocalMetrics();
    if (data) {
      setMetrics(data);
      setConnected(true);

      // Convert agent's traffic history to chart-friendly format
      if (data.trafficHistory && data.trafficHistory.length > 0) {
        const points = data.trafficHistory.map(t => {
          const d = new Date(t.timestamp);
          return {
            time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`,
            rxMbps: t.rxMbps,
            txMbps: t.txMbps,
          };
        });
        setTrafficHistory(points);
      }

      // Accumulate CPU/RAM history
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setResourceHistory(prev => {
        const next = [...prev, { time: timeStr, cpu: data.cpu, memory: data.memory }];
        return next.length > MAX_RESOURCE_POINTS ? next.slice(-MAX_RESOURCE_POINTS) : next;
      });
    } else {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [poll, intervalMs]);

  return { metrics, trafficHistory, connected };
};
