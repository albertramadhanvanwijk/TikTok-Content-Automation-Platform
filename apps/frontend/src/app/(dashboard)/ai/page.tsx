'use client';

import { useState } from 'react';
import GenerateForm from '@/components/ai/GenerateForm';
import GenerateResultView from '@/components/ai/GenerateResult';
import NotionPanel from '@/components/ai/NotionPanel';
import ToolsPanel from '@/components/ai/ToolsPanel';
import { useAIStore } from '@/store/aiStore';
import { GenerateResult } from '@/types';

export default function AIStudioPage() {
  const { lastResult } = useAIStore();
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

      {tab === 'generate' && (
        <div className="space-y-6">
          <GenerateForm
            onGenerated={(r) => {
              setLocalResult(r);
            }}
          />
          {activeResult && <GenerateResultView result={activeResult} />}
        </div>
      )}

      {tab === 'notion' && <NotionPanel />}

      {tab === 'tools' && <ToolsPanel />}
    </div>
  );
}
