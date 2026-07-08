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
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const now = Date.now() / 1000;
    const todayStart = now - 24 * 3600;

    const activeSessions = sessions.filter((s) => s.last_active > todayStart);
    const totalMessages = sessions.reduce((sum, s) => sum + s.message_count, 0);
    const todayMessages = activeSessions.reduce((sum, s) => sum + s.message_count, 0);
    const totalInputTokens = sessions.reduce((sum, s) => sum + (s.input_tokens || 0), 0);
    const totalOutputTokens = sessions.reduce((sum, s) => sum + (s.output_tokens || 0), 0);
    const totalCost = sessions.reduce((sum, s) => sum + (s.estimated_cost_usd || s.actual_cost_usd || 0), 0);
    const totalToolCalls = sessions.reduce((sum, s) => sum + (s.tool_call_count || 0), 0);
    const totalApiCalls = sessions.reduce((sum, s) => sum + (s.api_call_count || 0), 0);

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      totalMessages,
      todayMessages,
      totalInputTokens,
      totalOutputTokens,
      totalCost,
      totalToolCalls,
      totalApiCalls,
      sessions,
    };
  }, [sessions]);

  return { stats, loading };
}
