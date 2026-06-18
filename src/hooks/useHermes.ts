import { useState, useEffect, useCallback, useRef } from 'react';
import type { HermesSession, ChatMessage, AgentChatContext } from '../types/hermes';
import { checkHealth, getSessions, createSession, getSessionMessages, deleteSession, sendChat } from '../api/hermes';

export function useHermesHealth() {
  const [online, setOnline] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      const result = await checkHealth();
      if (mounted) {
        setOnline(!!result);
        setChecking(false);
      }
    };
    poll();
    const interval = setInterval(poll, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return { online, checking };
}

export function useSessions() {
  const [sessions, setSessions] = useState<HermesSession[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getSessions();
      setSessions(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { sessions, loading, refresh, remove };
}

export function useChat(ctx: AgentChatContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(ctx.sessionId || null);
  const [loading, setLoading] = useState(false);
  const streamingRef = useRef(false);
  const sessionIdRef = useRef<string | null>(ctx.sessionId || null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMessages([]);
    if (ctx.sessionId) {
      setSessionId(ctx.sessionId);
      sessionIdRef.current = ctx.sessionId;
      loadHistory(ctx.sessionId);
    } else {
      setSessionId(null);
      sessionIdRef.current = null;
    }
  }, [ctx.sessionId, ctx.agentId]);

  const loadHistory = async (sid: string) => {
    try {
      const msgs = await getSessionMessages(sid);
      if (sessionIdRef.current !== sid) return;
      setMessages(msgs.map((m) => ({
        id: `msg-${m.id}`,
        role: m.role === 'user' ? 'user' : 'agent',
        text: m.content,
        timestamp: new Date(m.timestamp * 1000).toISOString(),
      })));
    } catch {
      // ignore
    }
  };

  const send = useCallback(async (text: string, attachments?: { name: string; dataUrl: string }[]) => {
    const hasText = text.trim().length > 0;
    const hasAttachments = !!(attachments && attachments.length > 0);
    if ((!hasText && !hasAttachments) || streamingRef.current) return;

    let sid = sessionIdRef.current;
    if (!sid) {
      const stamp = new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-');
      try {
        const session = await createSession(`${ctx.agentName} · ${stamp}`);
        sid = session.id;
        sessionIdRef.current = sid;
        setSessionId(sid);
      } catch (err) {
        console.error('[useChat] createSession failed:', err);
        const msg = err instanceof Error ? err.message : '未知错误';
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'agent',
            text: `创建会话失败: ${msg}`,
            timestamp: new Date().toISOString(),
          },
        ]);
        setLoading(false);
        streamingRef.current = false;
        return;
      }
    }

    const imageUrls = attachments
      ? attachments.filter((a) => a.dataUrl.startsWith('data:image')).map((a) => a.dataUrl)
      : [];

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    streamingRef.current = true;

    const agentMsgId = `a-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: agentMsgId,
      role: 'agent',
      text: '',
      timestamp: new Date().toISOString(),
      streaming: true,
    }]);

    abortRef.current = new AbortController();

    try {
      await sendChat(
        sid,
        text,
        (fullText) => {
          setMessages((prev) =>
            prev.map((m) => m.id === agentMsgId ? { ...m, text: fullText } : m),
          );
        },
        () => {
          streamingRef.current = false;
          setMessages((prev) =>
            prev.map((m) => m.id === agentMsgId ? { ...m, streaming: false } : m),
          );
          setLoading(false);
          abortRef.current = null;
        },
        attachments,
        abortRef.current.signal,
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        streamingRef.current = false;
        setMessages((prev) =>
          prev.map((m) => m.id === agentMsgId ? { ...m, streaming: false } : m),
        );
        setLoading(false);
        abortRef.current = null;
        return;
      }
      console.error('[useChat] sendChat failed:', err);
      streamingRef.current = false;
      setMessages((prev) =>
        prev.map((m) => m.id === agentMsgId
          ? { ...m, text: `发送失败: ${err instanceof Error ? err.message : '未知错误'}`, streaming: false }
          : m),
      );
      setLoading(false);
      abortRef.current = null;
    }
  }, [ctx.agentName, ctx.agentId]);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    streamingRef.current = false;
    setLoading(false);
    setMessages((prev) =>
      prev.map((m) =>
        m.streaming ? { ...m, streaming: false } : m
      ),
    );
  }, []);

  return { messages, send, stop, loading, sessionId, setSessionId };
}
