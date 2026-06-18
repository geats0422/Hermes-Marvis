import { useState, useEffect, useCallback } from 'react';
import type { Memory } from '../data';
import { getSessions, getSessionMessages } from '../api/hermes';

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

const SOURCE_MAP: Record<string, string> = {
  slack: 'yibu',
  feishu: 'yibu',
  discord: 'yibu',
  telegram: 'yibu',
  cron: 'shoufu',
  cli: 'shoufu',
};

function matchAgent(title: string | null, source: string): string | null {
  if (title) {
    for (const [kw, id] of Object.entries(AGENT_TITLE_MAP)) {
      if (title.includes(kw)) return id;
    }
    if (title.toLowerCase().includes('hermes')) return 'shoufu';
  }
  return SOURCE_MAP[source] || null;
}

function formatTs(unix: number): string {
  const d = new Date(unix * 1000);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${mi}`;
}

export interface AgentMemoryMap {
  [agentId: string]: Memory[];
}

export function useAgentMemory() {
  const [memories, setMemories] = useState<AgentMemoryMap>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const sessions = await getSessions();
      const map: AgentMemoryMap = {};

      const matched = sessions.filter((s) => {
        const aid = matchAgent(s.title, s.source);
        if (!aid) return false;
        if (s.message_count === 0) return false;
        return true;
      });

      const fetchPromises = matched.map(async (session) => {
        const aid = matchAgent(session.title, session.source);
        if (!aid) return;

        let msgs: { id: number; role: string; content: string; timestamp: number }[] = [];
        try {
          msgs = await getSessionMessages(session.id);
        } catch {
          return;
        }

        const items: Memory[] = [];
        const source = session.source;

        if (source === 'cron') {
          const lastAssistant = [...msgs].reverse().find((m) => m.role === 'assistant');
          if (lastAssistant) {
            const content = lastAssistant.content
              ? lastAssistant.content.replace(/\n+/g, ' ').slice(0, 120)
              : '执行定时任务';
            items.push({
              timestamp: formatTs(session.last_active),
              content: `[定时任务] ${content}`,
              type: 'task',
            });
          }
        } else if (source === 'slack' || source === 'feishu') {
          const userMsgs = msgs.filter((m) => m.role === 'user');
          const assistantMsgs = msgs.filter((m) => m.role === 'assistant');
          if (userMsgs.length > 0) {
            const first = userMsgs[0];
            const preview = first.content
              ? first.content.replace(/\[n8n-huanyu\]\s*/g, '').replace(/\n+/g, ' ').slice(0, 80)
              : '用户消息';
            items.push({
              timestamp: formatTs(first.timestamp),
              content: `[${source === 'feishu' ? '飞书' : 'Slack'}] 收到: ${preview}`,
              type: 'chat',
            });
          }
          if (assistantMsgs.length > 0 && (session.tool_call_count ?? 0) > 0) {
            items.push({
              timestamp: formatTs(session.last_active),
              content: `[${source === 'feishu' ? '飞书' : 'Slack'}] 完成 ${session.tool_call_count} 次工具调用，共 ${session.message_count} 条消息`,
              type: 'task',
            });
          }
        } else {
          const userMsgs = msgs.filter((m) => m.role === 'user');
          const assistantMsgs = msgs.filter((m) => m.role === 'assistant');
          if (userMsgs.length > 0) {
            const preview = userMsgs[0].content
              ? userMsgs[0].content.replace(/\n+/g, ' ').slice(0, 80)
              : '用户消息';
            items.push({
              timestamp: formatTs(userMsgs[0].timestamp),
              content: preview,
              type: 'chat',
            });
          }
          if (assistantMsgs.length > 0) {
            const last = assistantMsgs[assistantMsgs.length - 1];
            const preview = last.content
              ? last.content.replace(/\n+/g, ' ').slice(0, 80)
              : '完成回复';
            const hasTools = (session.tool_call_count ?? 0) > 0;
            items.push({
              timestamp: formatTs(last.timestamp),
              content: hasTools ? `执行任务 (${session.tool_call_count} 次工具调用): ${preview}` : preview,
              type: hasTools ? 'task' : 'chat',
            });
          }
        }

        if (!map[aid]) map[aid] = [];
        map[aid].push(...items);
      });

      await Promise.all(fetchPromises);

      for (const aid of Object.keys(map)) {
        const seen = new Set<string>();
        map[aid] = map[aid]
          .filter((m) => {
            const key = `${m.timestamp}:${m.content}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .sort((a, b) => {
            const pa = a.timestamp.split(' ');
            const pb = b.timestamp.split(' ');
            return `${pa[0]} ${pa[1]}` > `${pb[0]} ${pb[1]}` ? -1 : 1;
          })
          .slice(0, 10);
      }

      setMemories(map);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { memories, loading, refresh };
}
