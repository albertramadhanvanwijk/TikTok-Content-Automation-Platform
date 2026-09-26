'use client';

import { useState } from 'react';
import { useAIStore } from '@/store/aiStore';
import { GenerateResult } from '@/types';
import { toast } from '@/store/toastStore';
import { useContentStore } from '@/store/contentStore';

export default function GenerateForm({ onGenerated }: { onGenerated: (r: GenerateResult) => void }) {
  const { generateCarousel, isGenerating, error } = useAIStore();
  const { templates, fetchTemplates } = useContentStore();
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('professional');
  const [slidesCount, setSlidesCount] = useState(3);
  const [templateId, setTemplateId] = useState('');
  const [inlineError, setInlineError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError('');
    if (!topic || topic.trim().length < 3) {
      setInlineError('topic is required (min 3 characters)');
      return;
    }
    if (slidesCount < 1 || slidesCount > 10) {
      setInlineError('slides_count must be between 1 and 10');
      return;
    }
    try {
      const result = await generateCarousel(topic.trim(), {
        style,
        slides_count: slidesCount,
        templateId: templateId || undefined,
      });
      toast.success('Carousel generated', result.mock ? 'Mock mode — set OPENAI_API_KEY for real AI' : result.carousel.title);
      onGenerated(result);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err.message || 'Failed to generate';
      setInlineError(msg);
      toast.error('Generate failed', msg);
    }
  };

  // lazy load templates once
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _maybeFetch = templates.length === 0 ? null : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-white p-6" data-testid="generate-form">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Topic *</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Trading Psychology"
          className="w-full rounded-lg border border-border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full rounded-lg border border-border px-4 py-2"
          >
            <option value="professional">professional</option>
            <option value="casual">casual</option>
            <option value="educational">educational</option>
            <option value="promotional">promotional</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Slides</label>
          <input
            type="number"
            min={1}
            max={10}
            value={slidesCount}
            onChange={(e) => setSlidesCount(parseInt(e.target.value) || 3)}
            className="w-full rounded-lg border border-border px-4 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Template (optional)</label>
        <input
          type="text"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          placeholder="template_id or leave empty"
          className="w-full rounded-lg border border-border px-4 py-2"
        />
      </div>
      {(inlineError || error) && (
        <p className="text-sm text-red-600" role="alert">
          {inlineError || error}
        </p>
      )}
      <button
        type="submit"
        disabled={isGenerating}
        className="w-full rounded-lg bg-primary px-6 py-2 font-semibold text-white hover:bg-opacity-90 disabled:opacity-50"
      >
        {isGenerating ? 'Generating…' : 'Generate Carousel'}
      </button>
    </form>
  );
}
