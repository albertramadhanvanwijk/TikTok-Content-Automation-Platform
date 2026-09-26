'use client';

import { useState } from 'react';
import GenerateForm from '@/components/ai/GenerateForm';
import GenerateResultView from '@/components/ai/GenerateResult';
import NotionPanel from '@/components/ai/NotionPanel';
import ToolsPanel from '@/components/ai/ToolsPanel';
import { useAIStore } from '@/store/aiStore';
import { GenerateResult } from '@/types';

export default function AIStudioPage() {
  const { lastResult, isGenerating, error, clearError } = useAIStore();
  const [tab, setTab] = useState<'generate' | 'notion' | 'tools'>('generate');
  const [localResult, setLocalResult] = useState<GenerateResult | null>(null);

  const activeResult = (localResult || lastResult) as GenerateResult | null;

  const tabs: Array<{ id: typeof tab; label: string }> = [
    { id: 'generate', label: 'Generate' },
    { id: 'notion', label: 'Notion' },
    { id: 'tools', label: 'Tools' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">AI Studio</h1>
        <p className="text-text-secondary mt-1">Generate carousels with AI, sync Notion, or use standalone tools.</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3" role="alert">
          <span>{error}</span>
          <button onClick={() => clearError()} className="shrink-0 rounded border border-red-200 bg-white px-3 py-1 text-xs font-medium hover:bg-red-50">
            Dismiss
          </button>
        </div>
      )}

      {tab === 'generate' && (
        <div className="space-y-6">
          <GenerateForm
            onGenerated={(r) => {
              setLocalResult(r);
            }}
          />
          {isGenerating && !activeResult && (
            <div className="grid gap-3 md:grid-cols-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-gray-100" />
              ))}
            </div>
          )}
          {activeResult ? (
            <GenerateResultView result={activeResult} />
          ) : (
            !isGenerating && (
              <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
                <p className="text-sm text-text-secondary">No carousel generated yet</p>
                <p className="text-xs text-text-tertiary mt-1">Fill the topic above and click Generate — in mock mode a dummy carousel will be created so you can continue to Content → TikTok.</p>
              </div>
            )
          )}
        </div>
      )}

      {tab === 'notion' && <NotionPanel />}

      {tab === 'tools' && <ToolsPanel />}
    </div>
  );
}
