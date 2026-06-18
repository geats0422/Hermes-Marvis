import { useState, useEffect, useCallback, useRef } from 'react';
import type { Agent } from '../data';
import { checkHealth, getSessions } from '../api/hermes';

const AGENT_TITLE_MAP: Record<string, string> = {
  '首辅': 'shoufu',
  '吏部尚书': 'libu',
  '户部尚书': 'hubu',
  '礼部尚书': 'libu2',
  '兵部尚书': 'bingbu',
  '刑部尚书': 'xingbu',
  '工部尚书': 'gongbu',
  '仓部尚书': 'cangbu',
  '驿部尚书': 'yibu',
};

const SESSION_SOURCE_MAP: Record<string, string> = {
  slack: 'yibu',
  feishu: 'yibu',
  discord: 'yibu',
  telegram: 'yibu',
  cron: 'shoufu',
  cli: 'shoufu',
};

const BUSY_THRESHOLD_S = 300;
const ONLINE_THRESHOLD_S = 1800;

export interface AgentStatus {
  id: string;
  status: 'online' | 'busy' | 'slacking' | 'offline';
  lastActive?: number;
  messageCount?: number;
}

function matchAgent(title: string | null, source: string): string | null {
  if (title) {
    for (const [keyword, agentId] of Object.entries(AGENT_TITLE_MAP)) {
      if (title.includes(keyword)) return agentId;
    }
    const lower = title.toLowerCase();
    if (lower.includes('hermes')) return 'shoufu';
  }
  return SESSION_SOURCE_MAP[source] || null;
}

export function useAgentStatus(agents: Agent[]) {
  const [statuses, setStatuses] = useState<AgentStatus[]>(
    agents.map((a) => ({ id: a.id, status: a.status }))
  );
  const pollingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;

    try {
      const health = await checkHealth();
      if (!health) {
        setStatuses(agents.map((a) => ({ id: a.id, status: 'offline' as const })));
        return;
      }

      const sessions = await getSessions().catch(() => []);
      const now = Date.now() / 1000;

      const agentMap = new Map<string, { lastActive: number; msgCount: number; isActive: boolean }>();

      for (const session of sessions) {
        const agentId = matchAgent(session.title, session.source);
        if (!agentId) continue;

        const prev = agentMap.get(agentId);
        const isActive = session.ended_at === null;

        if (!prev || session.last_active > prev.lastActive) {
          agentMap.set(agentId, {
            lastActive: session.last_active,
            msgCount: session.message_count,
            isActive: isActive || (prev?.isActive ?? false),
          });
        } else if (isActive) {
          prev.isActive = true;
        }
      }

      const newStatuses = agents.map((agent): AgentStatus => {
        const data = agentMap.get(agent.id);

        if (!data) {
          return { id: agent.id, status: 'slacking' };
        }

        const elapsed = now - data.lastActive;
        let status: AgentStatus['status'];

        if (data.isActive && elapsed < BUSY_THRESHOLD_S) {
          status = 'busy';
        } else if (elapsed < BUSY_THRESHOLD_S) {
          status = 'busy';
        } else if (elapsed < ONLINE_THRESHOLD_S) {
          status = 'online';
        } else {
          status = 'slacking';
        }

        return {
          id: agent.id,
          status,
          lastActive: data.lastActive,
          messageCount: data.msgCount,
        };
      });

      setStatuses(newStatuses);
    } finally {
      pollingRef.current = false;
    }
  }, [agents]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { statuses, refresh };
}
