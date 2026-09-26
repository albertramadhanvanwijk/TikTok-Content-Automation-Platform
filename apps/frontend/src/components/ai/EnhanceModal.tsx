'use client';

import { useEffect, useState } from 'react';
import { useAIStore } from '@/store/aiStore';
import { useContentStore } from '@/store/contentStore';
import { toast } from '@/store/toastStore';

export default function EnhanceModal({
  open,
  onClose,
  defaultCarouselId,
  onEnhanced,
}: {
  open: boolean;
  onClose: () => void;
  defaultCarouselId?: string | null;
  onEnhanced?: () => void;
}) {
  const { enhance, isGenerating } = useAIStore();
  const { carousels, fetchCarousels } = useContentStore();
  const [carouselId, setCarouselId] = useState(defaultCarouselId || '');
  const [instruction, setInstruction] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setCarouselId(defaultCarouselId || '');
  }, [defaultCarouselId]);

  useEffect(() => {
    if (open && carousels.length === 0) fetchCarousels().catch(() => {});
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!carouselId) {
      setError('Please select a carousel');
      return;
    }
    if (!instruction.trim()) {
      setError('instruction is required');
      return;
    }
    try {
      await enhance(carouselId, instruction.trim());
      toast.success('Slides enhanced', 'Changes applied');
      onEnhanced?.();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Enhance failed';
      setError(msg);
      toast.error('Enhance failed', msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-testid="enhance-modal">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Enhance Slides with AI</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Carousel</label>
            <select
              value={carouselId}
              onChange={(e) => setCarouselId(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-2"
            >
              <option value="">Select a carousel</option>
              {carousels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Instruction *</label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Make it more concise and add a strong hook"
              rows={4}
              className="w-full rounded-lg border border-border px-4 py-2"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {isGenerating ? 'Enhancing…' : 'Enhance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
