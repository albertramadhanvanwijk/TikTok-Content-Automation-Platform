'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAIStore } from '@/store/aiStore';
import { toast } from '@/store/toastStore';

export default function NotionPanel() {
  const { setupNotion, syncNotion, isSyncing } = useAIStore();
  const [dbId, setDbId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [setupResult, setSetupResult] = useState<any>(null);
  const [synced, setSynced] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleSetup = async () => {
    setError('');
    if (!dbId.trim()) {
      setError('notion_database_id is required');
      return;
    }
    try {
      const res = await setupNotion(dbId.trim());
      setSetupResult(res);
      toast.success('Notion connected', (res as any).mock ? 'Mock mode' : res.databaseTitle);
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || e.message;
      setError(msg);
      toast.error('Notion setup failed', msg);
    }
  };

  const handleSync = async () => {
    setError('');
    if (!dbId.trim()) {
      setError('notion_database_id is required');
      return;
    }
    try {
      const carousels = await syncNotion(dbId.trim(), templateId || undefined);
      setSynced(carousels as any[]);
      toast.success('Sync complete', `${(carousels as any[]).length} carousel(s) generated`);
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || e.message;
      setError(msg);
      toast.error('Sync failed', msg);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-white p-6" data-testid="notion-panel">
      <h3 className="font-semibold text-text-primary">Notion Integration</h3>
      <p className="text-sm text-text-secondary">Connect a Notion database, then sync to generate carousels. In mock mode any database ID works.</p>
      <div className="space-y-3">
        <input
          type="text"
          value={dbId}
          onChange={(e) => setDbId(e.target.value)}
          placeholder="Notion database ID (e.g. abc123...)"
          className="w-full rounded-lg border border-border px-4 py-2"
        />
        <input
          type="text"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          placeholder="template_id (optional)"
          className="w-full rounded-lg border border-border px-4 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSetup}
            disabled={isSyncing}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {isSyncing ? 'Working…' : 'Setup / Verify'}
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSyncing ? 'Syncing…' : 'Sync & Generate'}
          </button>
        </div>
      </div>

      {setupResult && (
        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
          <p className="font-medium">{setupResult.databaseTitle}</p>
          <p className="text-text-secondary text-xs">Properties: {setupResult.properties?.join(', ')}</p>
          {setupResult.mock && <p className="text-amber-600 text-xs mt-1">Mock — set NOTION_API_KEY for real Notion</p>}
        </div>
      )}

      {synced.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Generated ({synced.length})</p>
          {synced.map((c: any) => (
            <Link key={c.id} href={`/content/${c.id}`} className="block rounded-lg border border-border p-3 hover:bg-secondary/50">
              <p className="font-medium text-sm">{c.title}</p>
              <p className="text-xs text-text-secondary line-clamp-1">{c.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
