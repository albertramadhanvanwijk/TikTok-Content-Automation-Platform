'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAIStore } from '@/store/aiStore';
import { useContentStore } from '@/store/contentStore';
import EnhanceModal from '@/components/ai/EnhanceModal';
import DesignCard from '@/components/ai/DesignCard';
import { toast } from '@/store/toastStore';
import { Sparkles, Wand2, Hash, Palette } from 'lucide-react';

export default function AIToolbar({
  carouselId,
  title,
  onHashtagsApplied,
}: {
  carouselId: string | null;
  title: string;
  onHashtagsApplied?: (tags: string[]) => void;
}) {
  const router = useRouter();
  const { generateCarousel, suggestDesign, generateHashtags, isGenerating, mock, lastDesign, lastHashtags } = useAIStore();
  const { fetchSlides, updateSlide, slides } = useContentStore();
  const isNew = !carouselId;
  const [topic, setTopic] = useState('');
  const [showEnhance, setShowEnhance] = useState(false);
  const [showDesign, setShowDesign] = useState(false);
  const [localDesign, setLocalDesign] = useState<any>(null);
  const [localHashtags, setLocalHashtags] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!topic.trim() || topic.trim().length < 3) {
      toast.error('Topic required', 'Min 3 characters');
      return;
    }
    try {
      const result = await generateCarousel(topic.trim(), { style: 'professional', slides_count: 3 });
      toast.success('Generated', result.mock ? 'Mock mode' : result.carousel.title);
      if (isNew) {
        router.push(`/content/${result.carousel.id}`);
      } else if (carouselId) {
        await fetchSlides(carouselId);
      }
    } catch (e: any) {
      toast.error('Generate failed', e.response?.data?.error?.message || e.message);
    }
  };

  const handleHashtags = async () => {
    const t = title || topic;
    if (!t) {
      toast.error('Missing title/topic', 'Enter a title or topic first');
      return;
    }
    try {
      const tags = await generateHashtags(title || t, topic || t);
      setLocalHashtags(tags);
      onHashtagsApplied?.(tags);
      toast.success('Hashtags generated', tags.join(' '));
    } catch (e: any) {
      toast.error('Hashtags failed', e.message);
    }
  };

  const handleDesign = async () => {
    const t = title || topic || 'Trading';
    try {
      const d = await suggestDesign(t, 'professional');
      setLocalDesign(d);
      setShowDesign(true);
      toast.success('Design suggested');
    } catch (e: any) {
      toast.error('Design failed', e.message);
    }
  };

  const handleApplyDesign = async () => {
    if (!carouselId || !localDesign) return;
    try {
      const currentSlides = slides.length > 0 ? slides : [];
      // If slides not loaded, fetch first
      if (currentSlides.length === 0) await fetchSlides(carouselId);
      const toApply = useContentStore.getState().slides;
      for (const s of toApply) {
        await updateSlide(s.id, { style_data: localDesign });
      }
      toast.success('Design applied', 'Updated all slides');
    } catch (e: any) {
      toast.error('Apply failed', e.message);
    }
  };

  const displayDesign = localDesign || lastDesign;
  const displayHashtags = localHashtags.length > 0 ? localHashtags : lastHashtags;

  return (
    <div className="rounded-xl border border-border bg-white p-4 space-y-3" data-testid="ai-toolbar">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-primary" />
        <h3 className="font-semibold text-text-primary">AI Toolbar</h3>
        {mock && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Mock mode</span>}
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex flex-1 min-w-[200px] gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic to generate from"
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Wand2 size={16} /> Generate from Topic
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowEnhance(true)}
          disabled={isNew}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium disabled:opacity-50 hover:bg-secondary"
          title={isNew ? 'Save carousel first' : 'Enhance slides'}
        >
          <Sparkles size={16} /> Enhance
        </button>
        <button
          onClick={handleHashtags}
          disabled={isNew && !title && !topic}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium disabled:opacity-50 hover:bg-secondary"
        >
          <Hash size={16} /> Hashtags
        </button>
        <button
          onClick={handleDesign}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
        >
          <Palette size={16} /> Design
        </button>
      </div>

      {displayHashtags && displayHashtags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {displayHashtags.map((tag) => (
            <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{tag}</span>
          ))}
        </div>
      )}

      {showDesign && displayDesign && (
        <div className="space-y-2">
          <DesignCard design={displayDesign} />
          {carouselId && (
            <button onClick={handleApplyDesign} className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white">
              Apply to slides
            </button>
          )}
        </div>
      )}

      <EnhanceModal open={showEnhance} onClose={() => setShowEnhance(false)} defaultCarouselId={carouselId} onEnhanced={() => carouselId && fetchSlides(carouselId)} />
    </div>
  );
}
