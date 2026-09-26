'use client';

import { useState } from 'react';
import { useAIStore } from '@/store/aiStore';
import DesignCard from './DesignCard';
import HashtagList from './HashtagList';
import { toast } from '@/store/toastStore';

export default function ToolsPanel() {
  const { suggestDesign, generateHashtags } = useAIStore();
  const [designTopic, setDesignTopic] = useState('');
  const [designStyle, setDesignStyle] = useState('professional');
  const [design, setDesign] = useState<any>(null);
  const [hashTitle, setHashTitle] = useState('');
  const [hashTopic, setHashTopic] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const handleDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!designTopic.trim()) {
      setErr('topic is required');
      return;
    }
    try {
      const d = await suggestDesign(designTopic.trim(), designStyle);
      setDesign(d);
      toast.success('Design suggested');
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || e.message;
      setErr(msg);
      toast.error('Design failed', msg);
    }
  };

  const handleHashtags = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!hashTitle.trim() || !hashTopic.trim()) {
      setErr('title and topic are required');
      return;
    }
    try {
      const tags = await generateHashtags(hashTitle.trim(), hashTopic.trim());
      setHashtags(tags);
      toast.success('Hashtags generated');
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || e.message;
      setErr(msg);
      toast.error('Hashtags failed', msg);
    }
  };

  return (
    <div className="space-y-6" data-testid="tools-panel">
      <form onSubmit={handleDesign} className="rounded-xl border border-border bg-white p-6 space-y-3">
        <h3 className="font-semibold">Design Suggestion</h3>
        <input
          type="text"
          value={designTopic}
          onChange={(e) => setDesignTopic(e.target.value)}
          placeholder="Topic, e.g. Trading Psychology"
          className="w-full rounded-lg border border-border px-4 py-2"
        />
        <select value={designStyle} onChange={(e) => setDesignStyle(e.target.value)} className="w-full rounded-lg border border-border px-4 py-2">
          <option value="professional">professional</option>
          <option value="casual">casual</option>
          <option value="educational">educational</option>
          <option value="promotional">promotional</option>
        </select>
        <button type="submit" className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-white">
          Suggest Design
        </button>
      </form>
      {design && <DesignCard design={design} />}

      <form onSubmit={handleHashtags} className="rounded-xl border border-border bg-white p-6 space-y-3">
        <h3 className="font-semibold">Generate Hashtags</h3>
        <input
          type="text"
          value={hashTitle}
          onChange={(e) => setHashTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-lg border border-border px-4 py-2"
        />
        <input
          type="text"
          value={hashTopic}
          onChange={(e) => setHashTopic(e.target.value)}
          placeholder="Topic"
          className="w-full rounded-lg border border-border px-4 py-2"
        />
        <button type="submit" className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-white">
          Generate Hashtags
        </button>
      </form>
      {hashtags.length > 0 && <HashtagList hashtags={hashtags} />}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}
