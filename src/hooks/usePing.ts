import { useState, useCallback } from 'react';
import { pingDevice, PingResult } from '@/services/pingAgent';

export const usePing = () => {
  const [results, setResults] = useState<Record<string, PingResult>>({});
  const [pinging, setPinging] = useState<Record<string, boolean>>({});

  const ping = useCallback(async (ip: string) => {
    setPinging(prev => ({ ...prev, [ip]: true }));
    const result = await pingDevice(ip);
    setResults(prev => ({ ...prev, [ip]: result }));
    setPinging(prev => ({ ...prev, [ip]: false }));
    return result;
  }, []);

  const pingAll = useCallback(async (ips: string[]) => {
    const promises = ips.map(ip => ping(ip));
    return Promise.all(promises);
  }, [ping]);

  return { results, pinging, ping, pingAll };
};
