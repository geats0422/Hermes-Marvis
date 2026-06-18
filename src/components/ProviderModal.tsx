import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Globe, ExternalLink, Check, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import type { ProviderEntry } from '../types/settings';
import { connectProvider, testProvider, disconnectProvider } from '../api/settings';

interface ProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: ProviderEntry[];
  onRefresh: () => void;
}

export default function ProviderModal({ isOpen, onClose, providers, onRefresh }: ProviderModalProps) {
  const [selected, setSelected] = useState<ProviderEntry | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSelect = (p: ProviderEntry) => {
    setSelected(p);
    setApiKey('');
    setBaseUrl(p.base_url || '');
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!selected || !apiKey) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testProvider(selected.id, apiKey, baseUrl || undefined);
      setTestResult(result);
    } catch (e) {
      setTestResult({ ok: false, message: e instanceof Error ? e.message : 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!selected || !apiKey) return;
    setSaving(true);
    try {
      await connectProvider(selected.id, apiKey, baseUrl || undefined);
      onRefresh();
      setSelected(null);
      setApiKey('');
      setBaseUrl('');
      setTestResult(null);
    } catch {
      setTestResult({ ok: false, message: 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (p: ProviderEntry) => {
    try {
      await disconnectProvider(p.id);
      onRefresh();
      if (selected?.id === p.id) {
        setSelected(null);
        setApiKey('');
        setTestResult(null);
      }
    } catch (_) {
      void _;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="flex rounded-2xl overflow-hidden"
            style={{
              width: 'min(680px, 90vw)',
              height: 'min(520px, 80vh)',
              background: 'rgba(10, 10, 15, 0.96)',
              border: '1px solid rgba(0,240,255,0.2)',
              boxShadow: '0 0 60px rgba(0,240,255,0.1)',
            }}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
                <h3 className="text-sm font-bold" style={{ color: '#e0e0e0' }}>Provider 管理</h3>
                <motion.button
                  className="flex items-center justify-center w-7 h-7 rounded"
                  style={{ background: 'rgba(0,240,255,0.05)' }}
                  whileHover={{ background: 'rgba(0,240,255,0.15)', rotate: 90 }}
                  onClick={onClose}
                >
                  <X size={14} color="#9ca3af" />
                </motion.button>
              </div>

              <div className="flex-1 flex min-h-0">
                <div className="w-52 flex-shrink-0 border-r overflow-y-auto py-2" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
                  {providers.map((p) => (
                    <button
                      key={p.id}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left text-[11px] transition-colors"
                      style={{
                        background: selected?.id === p.id ? 'rgba(0,240,255,0.08)' : 'transparent',
                        color: selected?.id === p.id ? '#00f0ff' : '#9ca3af',
                      }}
                      onClick={() => handleSelect(p)}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background: p.configured ? '#39ff14' : '#444',
                          boxShadow: p.configured ? '0 0 4px #39ff14' : 'none',
                        }}
                      />
                      <span className="truncate">{p.name}</span>
                      {p.configured && (
                        <span className="ml-auto text-[9px] px-1 py-0.5 rounded" style={{ background: 'rgba(57,255,20,0.1)', color: '#39ff14' }}>
                          ON
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {selected ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-bold" style={{ color: '#e0e0e0' }}>{selected.name}</h4>
                        {selected.docs_url && (
                          <a
                            href={selected.docs_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] flex items-center gap-1 mt-1"
                            style={{ color: '#00f0ff' }}
                          >
                            <ExternalLink size={10} />
                            获取 API Key
                          </a>
                        )}
                      </div>

                      {selected.configured && !apiKey && (
                        <div
                          className="rounded-lg px-3 py-2 flex items-center justify-between"
                          style={{ background: 'rgba(57,255,20,0.05)', border: '1px solid rgba(57,255,20,0.15)' }}
                        >
                          <span className="text-[10px]" style={{ color: '#39ff14' }}>
                            已连接 ({selected.redacted_key})
                          </span>
                          <button
                            className="text-[10px] px-2 py-1 rounded flex items-center gap-1"
                            style={{ background: 'rgba(255,42,109,0.1)', color: '#ff2a6d', border: '1px solid rgba(255,42,109,0.2)' }}
                            onClick={() => handleDisconnect(selected)}
                          >
                            <Trash2 size={10} />
                            断开
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] block mb-1" style={{ color: '#9ca3af' }}>API Key</label>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
                            placeholder={selected.configured ? '输入新 key 以替换' : 'sk-...'}
                            className="flex-1 px-3 py-2 rounded-lg text-[11px] outline-none"
                            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.2)', color: '#e0e0e0' }}
                          />
                          <button
                            className="px-3 py-2 rounded-lg text-[10px] flex items-center gap-1"
                            style={{
                              background: testing ? 'rgba(0,240,255,0.05)' : 'rgba(0,240,255,0.1)',
                              border: '1px solid rgba(0,240,255,0.2)',
                              color: '#00f0ff',
                            }}
                            disabled={!apiKey || testing}
                            onClick={handleTest}
                          >
                            {testing ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
                            测试
                          </button>
                        </div>
                      </div>

                      {selected.base_url_env && (
                        <div>
                          <label className="text-[10px] block mb-1" style={{ color: '#9ca3af' }}>Base URL (可选)</label>
                          <div className="flex items-center gap-2">
                            <Globe size={12} color="#666" />
                            <input
                              type="text"
                              value={baseUrl}
                              onChange={(e) => setBaseUrl(e.target.value)}
                              placeholder="https://api.example.com/v1"
                              className="flex-1 px-3 py-2 rounded-lg text-[11px] outline-none"
                              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.2)', color: '#e0e0e0' }}
                            />
                          </div>
                        </div>
                      )}

                      {testResult && (
                        <div
                          className="rounded-lg px-3 py-2 flex items-center gap-2"
                          style={{
                            background: testResult.ok ? 'rgba(57,255,20,0.05)' : 'rgba(255,42,109,0.05)',
                            border: `1px solid ${testResult.ok ? 'rgba(57,255,20,0.2)' : 'rgba(255,42,109,0.2)'}`,
                          }}
                        >
                          {testResult.ok ? <Check size={12} color="#39ff14" /> : <AlertTriangle size={12} color="#ff2a6d" />}
                          <span className="text-[10px]" style={{ color: testResult.ok ? '#39ff14' : '#ff2a6d' }}>
                            {testResult.ok ? '连接成功' : testResult.message}
                          </span>
                        </div>
                      )}

                      <button
                        className="w-full py-2.5 rounded-lg text-[11px] font-bold"
                        style={{
                          background: apiKey ? 'rgba(0,240,255,0.15)' : 'rgba(0,240,255,0.05)',
                          border: `1px solid ${apiKey ? 'rgba(0,240,255,0.3)' : 'rgba(0,240,255,0.1)'}`,
                          color: apiKey ? '#00f0ff' : '#666',
                        }}
                        disabled={!apiKey || saving}
                        onClick={handleSave}
                      >
                        {saving ? '保存中...' : selected.configured ? '更新 Key' : '连接'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="text-[11px]" style={{ color: '#666' }}>选择左侧 Provider 以配置</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
