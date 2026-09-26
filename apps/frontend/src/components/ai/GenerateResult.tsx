'use client';

import Link from 'next/link';
import { GenerateResult } from '@/types';
import DesignCard from './DesignCard';
import HashtagList from './HashtagList';
import { toast } from '@/store/toastStore';
import { useContentStore } from '@/store/contentStore';

export default function GenerateResultView({ result }: { result: GenerateResult }) {
  const { fetchCarousels } = useContentStore();
  const handleSave = async () => {
    try {
      await fetchCarousels();
      toast.success('Saved', 'Carousel available in Content');
    } catch (e: any) {
      toast.error('Refresh failed', e.message);
    }
  };

  return (
    <div className="space-y-4" data-testid="generate-result">
      {result.mock && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
          Mock mode — set OPENAI_API_KEY / NOTION_API_KEY for real AI. Demo carousel was still created in DB.
        </div>
      )}
      <div className="rounded-xl border border-border bg-white p-6 space-y-2">
        <h3 className="text-lg font-bold text-text-primary">{result.carousel.title}</h3>
        <p className="text-sm text-text-secondary">{result.carousel.description}</p>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSave} className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold hover:opacity-80">
            Refresh Content List
          </button>
          <Link
            href={`/content/${result.carousel.id}`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-90"
          >
            Edit in Editor
          </Link>
        </div>
      </div>

      {result.slides && result.slides.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {result.slides.map((s: any, idx: number) => (
            <div key={s.id || idx} className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-semibold text-primary">Slide {s.slide_number ?? idx + 1}</p>
              <p className="font-medium text-text-primary">{s.title}</p>
              <p className="text-sm text-text-secondary mt-1 line-clamp-3">{s.content}</p>
            </div>
          ))}
        </div>
      )}

      {result.design && <DesignCard design={result.design} />}
      {result.hashtags && result.hashtags.length > 0 && <HashtagList hashtags={result.hashtags} />}
    </div>
  );
}
