'use client';

import { toast } from '@/store/toastStore';

export default function HashtagList({ hashtags }: { hashtags: string[] }) {
  if (!hashtags || hashtags.length === 0) return null;
  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(hashtags.join(' '));
      toast.success('Copied', hashtags.join(' '));
    } catch {
      toast.error('Copy failed', 'Could not copy hashtags');
    }
  };
  return (
    <div className="rounded-xl border border-border bg-white p-4 space-y-3" data-testid="hashtag-list">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text-primary">Hashtags</h3>
        <button
          onClick={copyAll}
          className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-opacity-90"
        >
          Copy All
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {hashtags.map((tag) => (
          <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-text-primary">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
