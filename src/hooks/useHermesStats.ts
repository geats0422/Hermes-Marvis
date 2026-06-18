import { useState, useEffect, useMemo } from 'react';
import { getSessions } from '../api/hermes';
import type { HermesSession } from '../types/hermes';

export function useHermesStats() {
  const [sessions, setSessions] = useState<HermesSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await getSessions();
        setSessions(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 15000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const now = Date.now() / 1000;
    const todayStart = now - 24 * 3600;

    const activeSessions = sessions.filter((s) => s.last_active > todayStart);
    const totalMessages = sessions.reduce((sum, s) => sum + s.message_count, 0);
    const todayMessages = activeSessions.reduce((sum, s) => sum + s.message_count, 0);

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      totalMessages,
      todayMessages,
      sessions,
    };
  }, [sessions]);

  return { stats, loading };
}
